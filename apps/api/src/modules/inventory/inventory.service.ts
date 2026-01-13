import { prisma } from '../../infrastructure/database/prisma.js';
import {
  NotFoundException,
  BadRequestException,
} from '../../common/exceptions/http-exception.js';
import { createChildLogger } from '../../infrastructure/logging/logger.js';
import type { PaginationQuery } from '@healthflow/shared-types';

const logger = createChildLogger('InventoryService');

export type ProductCategory =
  | 'MEDICATION'
  | 'MEDICAL_SUPPLY'
  | 'EQUIPMENT'
  | 'CONSUMABLE'
  | 'OTHER';

export type MovementType = 'IN' | 'OUT' | 'ADJUSTMENT' | 'EXPIRED' | 'TRANSFER';

export interface CreateProductInput {
  name: string;
  description?: string;
  sku: string;
  barcode?: string;
  category: ProductCategory;
  unit: string;
  minStock: number;
  maxStock?: number;
  currentStock?: number;
  costPrice?: number;
  salePrice?: number;
  manufacturer?: string;
  supplier?: string;
  location?: string;
  requiresPrescription?: boolean;
  controlledSubstance?: boolean;
  anvisaRegistry?: string;
  expirationAlertDays?: number;
}

export interface ProductFilters extends PaginationQuery {
  search?: string;
  category?: ProductCategory;
  lowStock?: boolean;
  expiringSoon?: boolean;
}

export interface CreateMovementInput {
  productId: string;
  type: MovementType;
  quantity: number;
  unitCost?: number;
  batchNumber?: string;
  expirationDate?: string;
  reason?: string;
  referenceId?: string;
  referenceType?: string;
}

export interface BatchInfo {
  batchNumber: string;
  quantity: number;
  expirationDate?: string;
  unitCost?: number;
}

export class InventoryService {
  async findAllProducts(tenantId: string, filters: ProductFilters) {
    const { page = 1, perPage = 20, search, category, lowStock, expiringSoon } = filters;
    const skip = (page - 1) * perPage;

    const where: Record<string, unknown> = { tenantId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.category = category;
    }

    if (lowStock) {
      where.currentStock = { lte: prisma.inventoryItem.fields.minStock };
    }

    const [products, total] = await Promise.all([
      prisma.inventoryItem.findMany({
        where,
        orderBy: { name: 'asc' },
        skip,
        take: perPage,
      }),
      prisma.inventoryItem.count({ where }),
    ]);

    // Filter for expiring soon products if needed
    let filteredProducts = products;
    if (expiringSoon) {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      // Get products with batches expiring soon
      const productsWithExpiringBatches = await prisma.inventoryMovement.findMany({
        where: {
          tenantId,
          type: 'IN',
          expirationDate: {
            lte: thirtyDaysFromNow,
            gte: new Date(),
          },
        },
        select: { productId: true },
        distinct: ['productId'],
      });

      const expiringProductIds = new Set(productsWithExpiringBatches.map((p) => p.productId));
      filteredProducts = products.filter((p) => expiringProductIds.has(p.id));
    }

    return {
      data: filteredProducts,
      meta: {
        page,
        perPage,
        total: expiringSoon ? filteredProducts.length : total,
        totalPages: Math.ceil((expiringSoon ? filteredProducts.length : total) / perPage),
      },
    };
  }

  async findProductById(tenantId: string, id: string) {
    const product = await prisma.inventoryItem.findFirst({
      where: { id, tenantId },
    });

    if (!product) {
      throw new NotFoundException('Product not found', 'PRODUCT_NOT_FOUND');
    }

    // Get recent movements
    const recentMovements = await prisma.inventoryMovement.findMany({
      where: { productId: id, tenantId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        user: {
          select: { name: true },
        },
      },
    });

    // Get batch information
    const batches = await this.getProductBatches(tenantId, id);

    return {
      ...product,
      recentMovements,
      batches,
    };
  }

  async findProductBySku(tenantId: string, sku: string) {
    const product = await prisma.inventoryItem.findFirst({
      where: { sku, tenantId },
    });

    if (!product) {
      throw new NotFoundException('Product not found', 'PRODUCT_NOT_FOUND');
    }

    return product;
  }

  async findProductByBarcode(tenantId: string, barcode: string) {
    const product = await prisma.inventoryItem.findFirst({
      where: { barcode, tenantId },
    });

    if (!product) {
      throw new NotFoundException('Product not found', 'PRODUCT_NOT_FOUND');
    }

    return product;
  }

  async createProduct(tenantId: string, input: CreateProductInput) {
    // Check if SKU already exists
    const existingSku = await prisma.inventoryItem.findFirst({
      where: { sku: input.sku, tenantId },
    });

    if (existingSku) {
      throw new BadRequestException('SKU already exists', 'SKU_EXISTS');
    }

    // Check if barcode already exists
    if (input.barcode) {
      const existingBarcode = await prisma.inventoryItem.findFirst({
        where: { barcode: input.barcode, tenantId },
      });

      if (existingBarcode) {
        throw new BadRequestException('Barcode already exists', 'BARCODE_EXISTS');
      }
    }

    const product = await prisma.inventoryItem.create({
      data: {
        tenantId,
        ...input,
        currentStock: input.currentStock || 0,
      },
    });

    logger.info(
      { productId: product.id, sku: product.sku },
      'Product created'
    );

    return product;
  }

  async updateProduct(tenantId: string, id: string, input: Partial<CreateProductInput>) {
    const existingProduct = await prisma.inventoryItem.findFirst({
      where: { id, tenantId },
    });

    if (!existingProduct) {
      throw new NotFoundException('Product not found', 'PRODUCT_NOT_FOUND');
    }

    // Check SKU uniqueness if changing
    if (input.sku && input.sku !== existingProduct.sku) {
      const existingSku = await prisma.inventoryItem.findFirst({
        where: { sku: input.sku, tenantId, NOT: { id } },
      });

      if (existingSku) {
        throw new BadRequestException('SKU already exists', 'SKU_EXISTS');
      }
    }

    // Check barcode uniqueness if changing
    if (input.barcode && input.barcode !== existingProduct.barcode) {
      const existingBarcode = await prisma.inventoryItem.findFirst({
        where: { barcode: input.barcode, tenantId, NOT: { id } },
      });

      if (existingBarcode) {
        throw new BadRequestException('Barcode already exists', 'BARCODE_EXISTS');
      }
    }

    const product = await prisma.inventoryItem.update({
      where: { id },
      data: input,
    });

    logger.info({ productId: id }, 'Product updated');

    return product;
  }

  async deleteProduct(tenantId: string, id: string) {
    const product = await prisma.inventoryItem.findFirst({
      where: { id, tenantId },
    });

    if (!product) {
      throw new NotFoundException('Product not found', 'PRODUCT_NOT_FOUND');
    }

    // Check if product has movements
    const movementCount = await prisma.inventoryMovement.count({
      where: { productId: id },
    });

    if (movementCount > 0) {
      throw new BadRequestException(
        'Cannot delete product with movements. Consider deactivating instead.',
        'PRODUCT_HAS_MOVEMENTS'
      );
    }

    await prisma.inventoryItem.delete({ where: { id } });

    logger.info({ productId: id }, 'Product deleted');
  }

  async createMovement(tenantId: string, userId: string, input: CreateMovementInput) {
    const product = await prisma.inventoryItem.findFirst({
      where: { id: input.productId, tenantId },
    });

    if (!product) {
      throw new NotFoundException('Product not found', 'PRODUCT_NOT_FOUND');
    }

    // Calculate new stock
    let stockChange = input.quantity;
    if (input.type === 'OUT' || input.type === 'EXPIRED') {
      stockChange = -input.quantity;

      // Validate sufficient stock
      if (product.currentStock + stockChange < 0) {
        throw new BadRequestException(
          'Insufficient stock for this operation',
          'INSUFFICIENT_STOCK'
        );
      }
    } else if (input.type === 'ADJUSTMENT') {
      // For adjustments, quantity is the absolute new value
      stockChange = input.quantity - product.currentStock;
    }

    // Create movement and update stock in a transaction
    const [movement] = await prisma.$transaction([
      prisma.inventoryMovement.create({
        data: {
          tenantId,
          productId: input.productId,
          userId,
          type: input.type,
          quantity: input.quantity,
          unitCost: input.unitCost,
          batchNumber: input.batchNumber,
          expirationDate: input.expirationDate ? new Date(input.expirationDate) : undefined,
          reason: input.reason,
          referenceId: input.referenceId,
          referenceType: input.referenceType,
          previousStock: product.currentStock,
          newStock: product.currentStock + stockChange,
        },
      }),
      prisma.inventoryItem.update({
        where: { id: input.productId },
        data: {
          currentStock: { increment: stockChange },
        },
      }),
    ]);

    logger.info(
      {
        movementId: movement.id,
        productId: input.productId,
        type: input.type,
        quantity: input.quantity,
      },
      'Inventory movement created'
    );

    return movement;
  }

  async getMovements(tenantId: string, productId: string, filters: PaginationQuery) {
    const { page = 1, perPage = 20 } = filters;
    const skip = (page - 1) * perPage;

    const where = { tenantId, productId };

    const [movements, total] = await Promise.all([
      prisma.inventoryMovement.findMany({
        where,
        include: {
          user: {
            select: { name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: perPage,
      }),
      prisma.inventoryMovement.count({ where }),
    ]);

    return {
      data: movements,
      meta: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    };
  }

  async getProductBatches(tenantId: string, productId: string): Promise<BatchInfo[]> {
    // Get all IN movements with batch numbers
    const inMovements = await prisma.inventoryMovement.findMany({
      where: {
        tenantId,
        productId,
        type: 'IN',
        batchNumber: { not: null },
      },
      orderBy: { expirationDate: 'asc' },
    });

    // Get all OUT movements
    const outMovements = await prisma.inventoryMovement.findMany({
      where: {
        tenantId,
        productId,
        type: { in: ['OUT', 'EXPIRED'] },
      },
    });

    // Calculate remaining quantity per batch (simplified FEFO logic)
    const batchMap = new Map<string, BatchInfo>();

    for (const movement of inMovements) {
      if (!movement.batchNumber) continue;

      const existing = batchMap.get(movement.batchNumber);
      if (existing) {
        existing.quantity += movement.quantity;
      } else {
        batchMap.set(movement.batchNumber, {
          batchNumber: movement.batchNumber,
          quantity: movement.quantity,
          expirationDate: movement.expirationDate?.toISOString(),
          unitCost: movement.unitCost ? Number(movement.unitCost) : undefined,
        });
      }
    }

    // Subtract OUT movements (simplified - in production would track by batch)
    let totalOut = outMovements.reduce((sum, m) => sum + m.quantity, 0);
    const batches = Array.from(batchMap.values()).sort((a, b) => {
      if (!a.expirationDate) return 1;
      if (!b.expirationDate) return -1;
      return new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime();
    });

    // Apply FEFO (First Expired, First Out)
    for (const batch of batches) {
      if (totalOut <= 0) break;
      const deduct = Math.min(batch.quantity, totalOut);
      batch.quantity -= deduct;
      totalOut -= deduct;
    }

    return batches.filter((b) => b.quantity > 0);
  }

  async getLowStockProducts(tenantId: string) {
    const products = await prisma.inventoryItem.findMany({
      where: {
        tenantId,
        currentStock: { lte: prisma.inventoryItem.fields.minStock },
      },
      orderBy: { currentStock: 'asc' },
    });

    // Manual filter since Prisma doesn't support comparing two fields directly
    return products.filter((p) => p.currentStock <= p.minStock);
  }

  async getExpiringProducts(tenantId: string, days: number = 30) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const expiringBatches = await prisma.inventoryMovement.findMany({
      where: {
        tenantId,
        type: 'IN',
        expirationDate: {
          lte: futureDate,
          gte: new Date(),
        },
      },
      include: {
        product: true,
      },
      orderBy: { expirationDate: 'asc' },
    });

    // Group by product
    const productMap = new Map<string, {
      product: typeof expiringBatches[0]['product'];
      batches: Array<{
        batchNumber: string | null;
        expirationDate: Date | null;
        quantity: number;
      }>;
    }>();

    for (const movement of expiringBatches) {
      const existing = productMap.get(movement.productId);
      if (existing) {
        existing.batches.push({
          batchNumber: movement.batchNumber,
          expirationDate: movement.expirationDate,
          quantity: movement.quantity,
        });
      } else {
        productMap.set(movement.productId, {
          product: movement.product,
          batches: [{
            batchNumber: movement.batchNumber,
            expirationDate: movement.expirationDate,
            quantity: movement.quantity,
          }],
        });
      }
    }

    return Array.from(productMap.values());
  }

  async getInventorySummary(tenantId: string) {
    const [
      totalProducts,
      lowStockCount,
      totalValue,
      categoryCounts,
    ] = await Promise.all([
      prisma.inventoryItem.count({ where: { tenantId } }),
      prisma.inventoryItem.count({
        where: {
          tenantId,
          currentStock: { lte: 0 }, // Will filter properly in code
        },
      }),
      prisma.inventoryItem.aggregate({
        where: { tenantId },
        _sum: {
          currentStock: true,
        },
      }),
      prisma.inventoryItem.groupBy({
        by: ['category'],
        where: { tenantId },
        _count: true,
        _sum: { currentStock: true },
      }),
    ]);

    // Get actual low stock count
    const lowStockProducts = await this.getLowStockProducts(tenantId);

    // Get expiring soon count
    const expiringProducts = await this.getExpiringProducts(tenantId, 30);

    return {
      totalProducts,
      totalItems: totalValue._sum.currentStock || 0,
      lowStockCount: lowStockProducts.length,
      expiringSoonCount: expiringProducts.length,
      byCategory: categoryCounts.map((c) => ({
        category: c.category,
        count: c._count,
        totalStock: c._sum.currentStock || 0,
      })),
    };
  }

  async getCategories() {
    return [
      { value: 'MEDICATION', label: 'Medicamentos' },
      { value: 'MEDICAL_SUPPLY', label: 'Material Médico' },
      { value: 'EQUIPMENT', label: 'Equipamentos' },
      { value: 'CONSUMABLE', label: 'Consumíveis' },
      { value: 'OTHER', label: 'Outros' },
    ];
  }
}

export const inventoryService = new InventoryService();
