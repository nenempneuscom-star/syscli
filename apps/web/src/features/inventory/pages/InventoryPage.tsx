import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  Package,
  AlertTriangle,
  Clock,
  Filter,
  Download,
  BarChart3,
  Pill,
  Stethoscope,
  Box,
  MoreHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { api } from '@/lib/api';

interface Product {
  id: string;
  name: string;
  description?: string;
  sku: string;
  barcode?: string;
  category: string;
  unit: string;
  minStock: number;
  maxStock?: number;
  currentStock: number;
  costPrice?: number;
  salePrice?: number;
  manufacturer?: string;
  location?: string;
  requiresPrescription?: boolean;
  controlledSubstance?: boolean;
}

interface ProductsResponse {
  success: boolean;
  data: Product[];
  meta: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

interface InventorySummary {
  totalProducts: number;
  totalItems: number;
  lowStockCount: number;
  expiringSoonCount: number;
  byCategory: Array<{
    category: string;
    count: number;
    totalStock: number;
  }>;
}

const categoryConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  MEDICATION: { label: 'Medicamentos', icon: Pill, color: 'text-blue-600' },
  MEDICAL_SUPPLY: { label: 'Material Medico', icon: Stethoscope, color: 'text-green-600' },
  EQUIPMENT: { label: 'Equipamentos', icon: Box, color: 'text-purple-600' },
  CONSUMABLE: { label: 'Consumiveis', icon: Package, color: 'text-orange-600' },
  OTHER: { label: 'Outros', icon: MoreHorizontal, color: 'text-gray-600' },
};

export function InventoryPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [activeTab, setActiveTab] = useState('all');

  const { data: productsData, isLoading } = useQuery<ProductsResponse>({
    queryKey: ['products', page, categoryFilter, activeTab],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        perPage: '20',
        ...(categoryFilter && { category: categoryFilter }),
        ...(activeTab === 'low-stock' && { lowStock: 'true' }),
        ...(activeTab === 'expiring' && { expiringSoon: 'true' }),
      });
      const response = await api.get(`/inventory/products?${params}`);
      return response.data;
    },
  });

  const { data: summaryData } = useQuery<{ success: boolean; data: InventorySummary }>({
    queryKey: ['inventory-summary'],
    queryFn: async () => {
      const response = await api.get('/inventory/summary');
      return response.data;
    },
  });

  const summary = summaryData?.data;
  const products = productsData?.data || [];
  const meta = productsData?.meta;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getStockStatus = (product: Product) => {
    const stockPercentage = product.maxStock
      ? (product.currentStock / product.maxStock) * 100
      : (product.currentStock / (product.minStock * 3)) * 100;

    if (product.currentStock <= 0) {
      return { label: 'Sem estoque', variant: 'destructive' as const, percentage: 0 };
    }
    if (product.currentStock <= product.minStock) {
      return { label: 'Estoque baixo', variant: 'destructive' as const, percentage: Math.min(stockPercentage, 100) };
    }
    if (product.currentStock <= product.minStock * 1.5) {
      return { label: 'Atenção', variant: 'secondary' as const, percentage: Math.min(stockPercentage, 100) };
    }
    return { label: 'Normal', variant: 'default' as const, percentage: Math.min(stockPercentage, 100) };
  };

  const filteredProducts = products.filter((product) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      product.name.toLowerCase().includes(searchLower) ||
      product.sku.toLowerCase().includes(searchLower) ||
      (product.barcode && product.barcode.includes(search))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Estoque</h1>
          <p className="text-muted-foreground">Gerencie produtos e movimentacoes</p>
        </div>
        <div className="flex gap-2">
          <Link to="/inventory/movements">
            <Button variant="outline">
              <BarChart3 className="h-4 w-4 mr-2" />
              Movimentacoes
            </Button>
          </Link>
          <Link to="/inventory/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Produto
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalProducts}</div>
              <p className="text-xs text-muted-foreground">
                {summary.totalItems} itens em estoque
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Estoque Baixo</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {summary.lowStockCount}
              </div>
              <p className="text-xs text-muted-foreground">
                produtos precisam de reposicao
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vencendo</CardTitle>
              <Clock className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {summary.expiringSoonCount}
              </div>
              <p className="text-xs text-muted-foreground">
                produtos nos proximos 30 dias
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Categorias</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.byCategory.length}</div>
              <p className="text-xs text-muted-foreground">
                categorias ativas
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="low-stock">
            Estoque Baixo
            {summary && summary.lowStockCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {summary.lowStockCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="expiring">
            Vencendo
            {summary && summary.expiringSoonCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {summary.expiringSoonCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome, SKU ou codigo de barras..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="flex gap-2">
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-[180px]">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todas</SelectItem>
                      {Object.entries(categoryConfig).map(([value, config]) => (
                        <SelectItem key={value} value={value}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button variant="outline" size="icon">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Products Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Estoque</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Preco</TableHead>
                    <TableHead>Local</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        Carregando...
                      </TableCell>
                    </TableRow>
                  ) : filteredProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <Package className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">Nenhum produto encontrado</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProducts.map((product) => {
                      const category = categoryConfig[product.category] || categoryConfig.OTHER;
                      const CategoryIcon = category.icon;
                      const stockStatus = getStockStatus(product);

                      return (
                        <TableRow key={product.id}>
                          <TableCell>
                            <Link
                              to={`/inventory/${product.id}`}
                              className="font-medium text-primary hover:underline"
                            >
                              {product.name}
                            </Link>
                            <div className="flex gap-1 mt-1">
                              {product.requiresPrescription && (
                                <Badge variant="outline" className="text-xs">
                                  Receita
                                </Badge>
                              )}
                              {product.controlledSubstance && (
                                <Badge variant="destructive" className="text-xs">
                                  Controlado
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <code className="text-sm">{product.sku}</code>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <CategoryIcon className={`h-4 w-4 ${category.color}`} />
                              <span>{category.label}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-sm">
                                <span className="font-medium">
                                  {product.currentStock} {product.unit}
                                </span>
                                <span className="text-muted-foreground">
                                  Min: {product.minStock}
                                </span>
                              </div>
                              <Progress
                                value={stockStatus.percentage}
                                className="h-2"
                              />
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={stockStatus.variant}>
                              {stockStatus.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {product.salePrice ? (
                              <div>
                                <p className="font-medium">
                                  {formatCurrency(product.salePrice)}
                                </p>
                                {product.costPrice && (
                                  <p className="text-xs text-muted-foreground">
                                    Custo: {formatCurrency(product.costPrice)}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {product.location || (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              {meta && meta.totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <p className="text-sm text-muted-foreground">
                    Mostrando {(meta.page - 1) * meta.perPage + 1} a{' '}
                    {Math.min(meta.page * meta.perPage, meta.total)} de {meta.total} produtos
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page === meta.totalPages}
                    >
                      Proximo
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Category Summary */}
      {summary && summary.byCategory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-5">
              {summary.byCategory.map((cat) => {
                const config = categoryConfig[cat.category] || categoryConfig.OTHER;
                const Icon = config.icon;

                return (
                  <div
                    key={cat.category}
                    className="flex items-center gap-3 p-3 rounded-lg border"
                  >
                    <Icon className={`h-8 w-8 ${config.color}`} />
                    <div>
                      <p className="font-medium">{config.label}</p>
                      <p className="text-sm text-muted-foreground">
                        {cat.count} produtos
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {cat.totalStock} itens
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
