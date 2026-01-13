import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ArrowLeft,
  Plus,
  Search,
  ArrowUpCircle,
  ArrowDownCircle,
  RefreshCw,
  AlertTriangle,
  Package,
  Filter,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useToast } from '@/components/ui/use-toast';
import { api } from '@/lib/api';

interface Product {
  id: string;
  name: string;
  sku: string;
  unit: string;
  currentStock: number;
}

interface MovementsResponse {
  success: boolean;
  data: Product[];
  meta: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

const movementTypeConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  IN: { label: 'Entrada', icon: ArrowDownCircle, color: 'text-green-600 bg-green-50' },
  OUT: { label: 'Saida', icon: ArrowUpCircle, color: 'text-red-600 bg-red-50' },
  ADJUSTMENT: { label: 'Ajuste', icon: RefreshCw, color: 'text-blue-600 bg-blue-50' },
  EXPIRED: { label: 'Vencido', icon: AlertTriangle, color: 'text-orange-600 bg-orange-50' },
  TRANSFER: { label: 'Transferencia', icon: Package, color: 'text-purple-600 bg-purple-50' },
};

export function MovementsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [showNewMovementDialog, setShowNewMovementDialog] = useState(false);
  const [productSearchOpen, setProductSearchOpen] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [movementData, setMovementData] = useState({
    type: 'IN' as 'IN' | 'OUT' | 'ADJUSTMENT' | 'EXPIRED',
    quantity: 1,
    unitCost: 0,
    batchNumber: '',
    expirationDate: '',
    reason: '',
  });

  // Fetch products for selection
  const { data: productsData } = useQuery<MovementsResponse>({
    queryKey: ['products-search', productSearch],
    queryFn: async () => {
      const response = await api.get(`/inventory/products?search=${productSearch}&perPage=10`);
      return response.data;
    },
    enabled: productSearch.length >= 2,
  });

  // Fetch low stock products for quick actions
  const { data: lowStockData } = useQuery<{ success: boolean; data: Product[] }>({
    queryKey: ['low-stock-products'],
    queryFn: async () => {
      const response = await api.get('/inventory/products/low-stock');
      return response.data;
    },
  });

  // Fetch expiring products
  const { data: expiringData } = useQuery<{ success: boolean; data: Array<{ product: Product; batches: Array<{ batchNumber: string; expirationDate: Date; quantity: number }> }> }>({
    queryKey: ['expiring-products'],
    queryFn: async () => {
      const response = await api.get('/inventory/products/expiring?days=30');
      return response.data;
    },
  });

  const movementMutation = useMutation({
    mutationFn: async (data: { productId: string } & typeof movementData) => {
      const response = await api.post('/inventory/movements', {
        ...data,
        unitCost: data.unitCost || undefined,
        batchNumber: data.batchNumber || undefined,
        expirationDate: data.expirationDate || undefined,
        reason: data.reason || undefined,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-summary'] });
      queryClient.invalidateQueries({ queryKey: ['low-stock-products'] });
      queryClient.invalidateQueries({ queryKey: ['expiring-products'] });
      setShowNewMovementDialog(false);
      setSelectedProduct(null);
      setMovementData({
        type: 'IN',
        quantity: 1,
        unitCost: 0,
        batchNumber: '',
        expirationDate: '',
        reason: '',
      });
      toast({
        title: 'Movimentacao registrada',
        description: 'A movimentacao foi registrada com sucesso.',
      });
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Nao foi possivel registrar a movimentacao.',
        variant: 'destructive',
      });
    },
  });

  const lowStockProducts = lowStockData?.data || [];
  const expiringProducts = expiringData?.data || [];

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setProductSearchOpen(false);
    setProductSearch('');
  };

  const handleQuickEntry = (product: Product) => {
    setSelectedProduct(product);
    setMovementData({ ...movementData, type: 'IN' });
    setShowNewMovementDialog(true);
  };

  const handleQuickExpiry = (product: Product, batchNumber: string) => {
    setSelectedProduct(product);
    setMovementData({ ...movementData, type: 'EXPIRED', batchNumber });
    setShowNewMovementDialog(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/inventory">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Movimentacoes</h1>
            <p className="text-muted-foreground">Gerencie entradas, saidas e ajustes de estoque</p>
          </div>
        </div>
        <Button onClick={() => setShowNewMovementDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Movimentacao
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Low Stock Alert */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-600">
              <AlertTriangle className="h-5 w-5" />
              Estoque Baixo
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lowStockProducts.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                Nenhum produto com estoque baixo
              </p>
            ) : (
              <div className="space-y-3 max-h-64 overflow-auto">
                {lowStockProducts.slice(0, 5).map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-yellow-50 border-yellow-200"
                  >
                    <div>
                      <Link
                        to={`/inventory/${product.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {product.name}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        Estoque: {product.currentStock} {product.unit}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleQuickEntry(product)}
                    >
                      <ArrowDownCircle className="h-4 w-4 mr-1" />
                      Entrada
                    </Button>
                  </div>
                ))}
                {lowStockProducts.length > 5 && (
                  <p className="text-center text-sm text-muted-foreground">
                    +{lowStockProducts.length - 5} produtos
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Expiring Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <Calendar className="h-5 w-5" />
              Vencendo em 30 Dias
            </CardTitle>
          </CardHeader>
          <CardContent>
            {expiringProducts.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                Nenhum produto vencendo
              </p>
            ) : (
              <div className="space-y-3 max-h-64 overflow-auto">
                {expiringProducts.slice(0, 5).map((item) => (
                  <div
                    key={item.product.id}
                    className="p-3 rounded-lg border bg-red-50 border-red-200"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Link
                        to={`/inventory/${item.product.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {item.product.name}
                      </Link>
                    </div>
                    <div className="space-y-1">
                      {item.batches.slice(0, 2).map((batch, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <span>
                            Lote: {batch.batchNumber || 'N/A'} -{' '}
                            <span className="text-red-600 font-medium">
                              {format(new Date(batch.expirationDate), 'dd/MM/yyyy', { locale: ptBR })}
                            </span>
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2"
                            onClick={() => handleQuickExpiry(item.product, batch.batchNumber || '')}
                          >
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Baixar
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Acoes Rapidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <Button
              variant="outline"
              className="h-24 flex-col gap-2"
              onClick={() => {
                setMovementData({ ...movementData, type: 'IN' });
                setShowNewMovementDialog(true);
              }}
            >
              <ArrowDownCircle className="h-8 w-8 text-green-600" />
              <span>Entrada de Estoque</span>
            </Button>
            <Button
              variant="outline"
              className="h-24 flex-col gap-2"
              onClick={() => {
                setMovementData({ ...movementData, type: 'OUT' });
                setShowNewMovementDialog(true);
              }}
            >
              <ArrowUpCircle className="h-8 w-8 text-red-600" />
              <span>Saida de Estoque</span>
            </Button>
            <Button
              variant="outline"
              className="h-24 flex-col gap-2"
              onClick={() => {
                setMovementData({ ...movementData, type: 'ADJUSTMENT' });
                setShowNewMovementDialog(true);
              }}
            >
              <RefreshCw className="h-8 w-8 text-blue-600" />
              <span>Ajuste de Estoque</span>
            </Button>
            <Button
              variant="outline"
              className="h-24 flex-col gap-2"
              onClick={() => {
                setMovementData({ ...movementData, type: 'EXPIRED' });
                setShowNewMovementDialog(true);
              }}
            >
              <AlertTriangle className="h-8 w-8 text-orange-600" />
              <span>Baixa por Vencimento</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Movement Types Legend */}
      <Card>
        <CardHeader>
          <CardTitle>Tipos de Movimentacao</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {Object.entries(movementTypeConfig).map(([type, config]) => {
              const Icon = config.icon;
              return (
                <div key={type} className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${config.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium">{config.label}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* New Movement Dialog */}
      <Dialog open={showNewMovementDialog} onOpenChange={setShowNewMovementDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova Movimentacao</DialogTitle>
            <DialogDescription>
              Registre uma entrada, saida ou ajuste de estoque
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Product Selection */}
            <div className="space-y-2">
              <Label>Produto *</Label>
              {selectedProduct ? (
                <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium">{selectedProduct.name}</p>
                    <p className="text-sm text-muted-foreground">
                      SKU: {selectedProduct.sku} | Estoque: {selectedProduct.currentStock} {selectedProduct.unit}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedProduct(null)}
                  >
                    Alterar
                  </Button>
                </div>
              ) : (
                <Popover open={productSearchOpen} onOpenChange={setProductSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <Search className="h-4 w-4 mr-2" />
                      Buscar produto...
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0" align="start">
                    <Command>
                      <CommandInput
                        placeholder="Buscar por nome ou SKU..."
                        value={productSearch}
                        onValueChange={setProductSearch}
                      />
                      <CommandList>
                        <CommandEmpty>
                          {productSearch.length < 2
                            ? 'Digite pelo menos 2 caracteres'
                            : 'Nenhum produto encontrado'}
                        </CommandEmpty>
                        {productsData?.data && productsData.data.length > 0 && (
                          <CommandGroup heading="Produtos">
                            {productsData.data.map((product) => (
                              <CommandItem
                                key={product.id}
                                onSelect={() => handleSelectProduct(product)}
                              >
                                <div>
                                  <p className="font-medium">{product.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {product.sku} - Estoque: {product.currentStock}
                                  </p>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        )}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              )}
            </div>

            {/* Movement Type */}
            <div className="space-y-2">
              <Label>Tipo de Movimentacao *</Label>
              <Select
                value={movementData.type}
                onValueChange={(value) => setMovementData({ ...movementData, type: value as typeof movementData.type })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IN">
                    <div className="flex items-center gap-2">
                      <ArrowDownCircle className="h-4 w-4 text-green-600" />
                      Entrada
                    </div>
                  </SelectItem>
                  <SelectItem value="OUT">
                    <div className="flex items-center gap-2">
                      <ArrowUpCircle className="h-4 w-4 text-red-600" />
                      Saida
                    </div>
                  </SelectItem>
                  <SelectItem value="ADJUSTMENT">
                    <div className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 text-blue-600" />
                      Ajuste
                    </div>
                  </SelectItem>
                  <SelectItem value="EXPIRED">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                      Baixa (Vencido)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Quantity */}
            <div className="space-y-2">
              <Label>
                {movementData.type === 'ADJUSTMENT' ? 'Nova Quantidade *' : 'Quantidade *'}
              </Label>
              <Input
                type="number"
                min={movementData.type === 'ADJUSTMENT' ? 0 : 1}
                value={movementData.quantity}
                onChange={(e) => setMovementData({ ...movementData, quantity: Number(e.target.value) })}
              />
              {selectedProduct && movementData.type === 'ADJUSTMENT' && (
                <p className="text-xs text-muted-foreground">
                  Estoque atual: {selectedProduct.currentStock} {selectedProduct.unit}
                </p>
              )}
            </div>

            {/* IN-specific fields */}
            {movementData.type === 'IN' && (
              <>
                <div className="grid gap-4 grid-cols-2">
                  <div className="space-y-2">
                    <Label>Numero do Lote</Label>
                    <Input
                      value={movementData.batchNumber}
                      onChange={(e) => setMovementData({ ...movementData, batchNumber: e.target.value })}
                      placeholder="Ex: LOT2024001"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Data de Validade</Label>
                    <Input
                      type="date"
                      value={movementData.expirationDate}
                      onChange={(e) => setMovementData({ ...movementData, expirationDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Custo Unitario</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={movementData.unitCost}
                    onChange={(e) => setMovementData({ ...movementData, unitCost: Number(e.target.value) })}
                  />
                </div>
              </>
            )}

            {/* Batch for expired */}
            {movementData.type === 'EXPIRED' && (
              <div className="space-y-2">
                <Label>Numero do Lote</Label>
                <Input
                  value={movementData.batchNumber}
                  onChange={(e) => setMovementData({ ...movementData, batchNumber: e.target.value })}
                  placeholder="Lote a ser baixado"
                />
              </div>
            )}

            {/* Reason */}
            <div className="space-y-2">
              <Label>Motivo/Observacao</Label>
              <Textarea
                value={movementData.reason}
                onChange={(e) => setMovementData({ ...movementData, reason: e.target.value })}
                placeholder="Opcional..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowNewMovementDialog(false);
              setSelectedProduct(null);
            }}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (!selectedProduct) return;
                movementMutation.mutate({
                  productId: selectedProduct.id,
                  ...movementData,
                });
              }}
              disabled={movementMutation.isPending || !selectedProduct || movementData.quantity <= 0}
            >
              {movementMutation.isPending ? 'Registrando...' : 'Registrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
