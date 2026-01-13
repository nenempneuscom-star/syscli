import { Router, Request, Response, NextFunction } from 'express';
import { inventoryService } from './inventory.service.js';
import { validateBody, validateQuery } from '../../common/middleware/validate.js';
import { authGuard } from '../../common/guards/auth.guard.js';
import { tenantGuard } from '../../common/guards/tenant.guard.js';
import { paginationSchema } from '@healthflow/validators';
import { z } from 'zod';

const router: Router = Router();

// All routes require authentication and tenant context
router.use(authGuard, tenantGuard);

// Product category enum
const productCategorySchema = z.enum([
  'MEDICATION',
  'MEDICAL_SUPPLY',
  'EQUIPMENT',
  'CONSUMABLE',
  'OTHER',
]);

// Movement type enum
const movementTypeSchema = z.enum(['IN', 'OUT', 'ADJUSTMENT', 'EXPIRED', 'TRANSFER']);

// Create product schema
const createProductSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  sku: z.string().min(1),
  barcode: z.string().optional(),
  category: productCategorySchema,
  unit: z.string().min(1),
  minStock: z.number().min(0),
  maxStock: z.number().min(0).optional(),
  currentStock: z.number().min(0).optional(),
  costPrice: z.number().min(0).optional(),
  salePrice: z.number().min(0).optional(),
  manufacturer: z.string().optional(),
  supplier: z.string().optional(),
  location: z.string().optional(),
  requiresPrescription: z.boolean().optional(),
  controlledSubstance: z.boolean().optional(),
  anvisaRegistry: z.string().optional(),
  expirationAlertDays: z.number().min(1).optional(),
});

// Create movement schema
const createMovementSchema = z.object({
  productId: z.string().uuid(),
  type: movementTypeSchema,
  quantity: z.number().min(0.01),
  unitCost: z.number().min(0).optional(),
  batchNumber: z.string().optional(),
  expirationDate: z.string().optional(),
  reason: z.string().optional(),
  referenceId: z.string().optional(),
  referenceType: z.string().optional(),
});

// GET /inventory/products - List products
router.get(
  '/products',
  validateQuery(
    paginationSchema.extend({
      search: z.string().optional(),
      category: productCategorySchema.optional(),
      lowStock: z.enum(['true', 'false']).optional(),
      expiringSoon: z.enum(['true', 'false']).optional(),
    })
  ),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters = {
        ...req.query,
        lowStock: req.query.lowStock === 'true',
        expiringSoon: req.query.expiringSoon === 'true',
      };
      const result = await inventoryService.findAllProducts(req.tenantId!, filters as never);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }
);

// GET /inventory/products/low-stock - Get low stock products
router.get('/products/low-stock', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const products = await inventoryService.getLowStockProducts(req.tenantId!);
    res.json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
});

// GET /inventory/products/expiring - Get expiring products
router.get(
  '/products/expiring',
  validateQuery(z.object({ days: z.string().optional() })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const days = req.query.days ? parseInt(req.query.days as string, 10) : 30;
      const products = await inventoryService.getExpiringProducts(req.tenantId!, days);
      res.json({ success: true, data: products });
    } catch (error) {
      next(error);
    }
  }
);

// GET /inventory/summary - Get inventory summary
router.get('/summary', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const summary = await inventoryService.getInventorySummary(req.tenantId!);
    res.json({ success: true, data: summary });
  } catch (error) {
    next(error);
  }
});

// GET /inventory/categories - Get product categories
router.get('/categories', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await inventoryService.getCategories();
    res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
});

// GET /inventory/products/:id - Get product details
router.get('/products/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await inventoryService.findProductById(req.tenantId!, req.params.id);
    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
});

// GET /inventory/products/sku/:sku - Find product by SKU
router.get('/products/sku/:sku', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await inventoryService.findProductBySku(req.tenantId!, req.params.sku);
    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
});

// GET /inventory/products/barcode/:barcode - Find product by barcode
router.get('/products/barcode/:barcode', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await inventoryService.findProductByBarcode(req.tenantId!, req.params.barcode);
    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
});

// POST /inventory/products - Create product
router.post(
  '/products',
  validateBody(createProductSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const product = await inventoryService.createProduct(req.tenantId!, req.body);
      res.status(201).json({ success: true, data: product });
    } catch (error) {
      next(error);
    }
  }
);

// PATCH /inventory/products/:id - Update product
router.patch(
  '/products/:id',
  validateBody(createProductSchema.partial()),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const product = await inventoryService.updateProduct(
        req.tenantId!,
        req.params.id,
        req.body
      );
      res.json({ success: true, data: product });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /inventory/products/:id - Delete product
router.delete('/products/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await inventoryService.deleteProduct(req.tenantId!, req.params.id);
    res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    next(error);
  }
});

// GET /inventory/products/:id/movements - Get product movements
router.get(
  '/products/:id/movements',
  validateQuery(paginationSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await inventoryService.getMovements(
        req.tenantId!,
        req.params.id,
        req.query as never
      );
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }
);

// GET /inventory/products/:id/batches - Get product batches
router.get('/products/:id/batches', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const batches = await inventoryService.getProductBatches(req.tenantId!, req.params.id);
    res.json({ success: true, data: batches });
  } catch (error) {
    next(error);
  }
});

// POST /inventory/movements - Create movement
router.post(
  '/movements',
  validateBody(createMovementSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const movement = await inventoryService.createMovement(
        req.tenantId!,
        req.user!.id,
        req.body
      );
      res.status(201).json({ success: true, data: movement });
    } catch (error) {
      next(error);
    }
  }
);

export const inventoryRouter = router;
