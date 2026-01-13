import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Package,
  Plus,
  Minus,
  RefreshCw,
  AlertTriangle,
  Calendar,
  MapPin,
  DollarSign,
  Barcode,
  Building,
  FileText,
  ArrowUpCircle,
  ArrowDownCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import { api } from '@/lib/api';

interface Movement {
  id: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'EXPIRED' | 'TRANSFER';
  quantity: number;
  unitCost?: number;
  batchNumber?: string;
  expirationDate?: string;
  reason?: string;
  previousStock: number;
  newStock: number;
  createdAt: string;
  user: {
    name: string;
  };
}

interface BatchInfo {
  batchNumber: string;
  quantity: number;
  expirationDate?: string;
  unitCost?: number;
}

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
  supplier?: string;
  location?: string;
  requiresPrescription?: boolean;
  controlledSubstance?: boolean;
  anvisaRegistry?: string;
  expirationAlertDays?: number;
  createdAt: string;
  recentMovements: Movement[];
  batches: BatchInfo[];
}

const categoryLabels: Record<string, string> = {
  MEDICATION: 'Medicamentos',
  MEDICAL_SUPPLY: 'Material Medico',
  EQUIPMENT: 'Equipamentos',
  CONSUMABLE: 'Consumiveis',
  OTHER: 'Outros',
};

const movementTypeConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  IN: { label: 'Entrada', icon: ArrowDownCircle, color: 'text-green-600' },
  OUT: { label: 'Saida', icon: ArrowUpCircle, color: 'text-red-600' },
  ADJUSTMENT: { label: 'Ajuste', icon: RefreshCw, color: 'text-blue-600' },
  EXPIRED: { label: 'Vencido', icon: AlertTriangle, color: 'text-orange-600' },
  TRANSFER: { label: 'Transferencia', icon: Package, color: 'text-purple-600' },
};

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [showMovementDialog, setShowMovementDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [movementData, setMovementData] = useState({
    type: 'IN' as 'IN' | 'OUT' | 'ADJUSTMENT' | 'EXPIRED',
    quantity: 1,
    unitCost: 0,
    batchNumber: '',
    expirationDate: '',
    reason: '',
  });

  const { data: productData, isLoading } = useQuery<{ success: boolean; data: Product }>({
    queryKey: ['product', id],
    queryFn: async () => {
      const response = await api.get(`/inventory/products/${id}`);
      return response.data;
    },
    enabled: !!id,
  });

  const movementMutation = useMutation({
    mutationFn: async (data: typeof movementData) => {
      const response = await api.post('/inventory/movements', {
        productId: id,
        ...data,
        unitCost: data.unitCost || undefined,
        batchNumber: data.batchNumber || undefined,
        expirationDate: data.expirationDate || undefined,
        reason: data.reason || undefined,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product', id] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-summary'] });
      setShowMovementDialog(false);
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

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/inventory/products/${id}`);
    },
    onSuccess: () => {
      toast({
        title: 'Produto excluido',
        description: 'O produto foi excluido com sucesso.',
      });
      navigate('/inventory');
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Nao foi possivel excluir o produto. Verifique se nao ha movimentacoes.',
        variant: 'destructive',
      });
    },
  });

  const product = productData?.data;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getStockStatus = () => {
    if (!product) return { label: '', variant: 'default' as const, percentage: 0 };

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
      return { label: 'Atencao', variant: 'secondary' as const, percentage: Math.min(stockPercentage, 100) };
    }
    return { label: 'Normal', variant: 'default' as const, percentage: Math.min(stockPercentage, 100) };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Package className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Produto nao encontrado</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/inventory')}>
          Voltar
        </Button>
      </div>
    );
  }

  const stockStatus = getStockStatus();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/inventory')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{product.name}</h1>
              <Badge variant={stockStatus.variant}>{stockStatus.label}</Badge>
            </div>
            <p className="text-muted-foreground">
              SKU: {product.sku} | {categoryLabels[product.category] || product.category}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowDeleteDialog(true)}>
            <Trash2 className="h-4 w-4 mr-2" />
            Excluir
          </Button>
          <Link to={`/inventory/${id}/edit`}>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </Link>
          <Button onClick={() => setShowMovementDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Movimentacao
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stock Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Estoque
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-3">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Atual</p>
                  <p className="text-3xl font-bold">
                    {product.currentStock}
                    <span className="text-sm font-normal ml-1">{product.unit}</span>
                  </p>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-sm text-yellow-600">Minimo</p>
                  <p className="text-3xl font-bold text-yellow-700">
                    {product.minStock}
                    <span className="text-sm font-normal ml-1">{product.unit}</span>
                  </p>
                </div>
                {product.maxStock && (
                  <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm text-green-600">Maximo</p>
                    <p className="text-3xl font-bold text-green-700">
                      {product.maxStock}
                      <span className="text-sm font-normal ml-1">{product.unit}</span>
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-4">
                <div className="flex justify-between text-sm mb-2">
                  <span>Nivel de estoque</span>
                  <span>{stockStatus.percentage.toFixed(0)}%</span>
                </div>
                <Progress value={stockStatus.percentage} className="h-3" />
              </div>
            </CardContent>
          </Card>

          {/* Batches */}
          {product.batches && product.batches.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Lotes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Lote</TableHead>
                      <TableHead>Quantidade</TableHead>
                      <TableHead>Validade</TableHead>
                      <TableHead>Custo Unit.</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {product.batches.map((batch, index) => {
                      const isExpiringSoon = batch.expirationDate &&
                        new Date(batch.expirationDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

                      return (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{batch.batchNumber}</TableCell>
                          <TableCell>{batch.quantity} {product.unit}</TableCell>
                          <TableCell>
                            {batch.expirationDate ? (
                              <span className={isExpiringSoon ? 'text-red-600 font-medium' : ''}>
                                {format(new Date(batch.expirationDate), 'dd/MM/yyyy', { locale: ptBR })}
                                {isExpiringSoon && (
                                  <Badge variant="destructive" className="ml-2">
                                    Vencendo
                                  </Badge>
                                )}
                              </span>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell>
                            {batch.unitCost ? formatCurrency(batch.unitCost) : '-'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Recent Movements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Movimentacoes Recentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {product.recentMovements.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma movimentacao registrada
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Quantidade</TableHead>
                      <TableHead>Estoque</TableHead>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {product.recentMovements.map((movement) => {
                      const config = movementTypeConfig[movement.type] || movementTypeConfig.IN;
                      const Icon = config.icon;

                      return (
                        <TableRow key={movement.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Icon className={`h-4 w-4 ${config.color}`} />
                              <span>{config.label}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className={movement.type === 'OUT' || movement.type === 'EXPIRED' ? 'text-red-600' : 'text-green-600'}>
                              {movement.type === 'OUT' || movement.type === 'EXPIRED' ? '-' : '+'}
                              {movement.quantity} {product.unit}
                            </span>
                          </TableCell>
                          <TableCell>
                            {movement.previousStock} → {movement.newStock}
                          </TableCell>
                          <TableCell>{movement.user.name}</TableCell>
                          <TableCell>
                            {format(new Date(movement.createdAt), "dd/MM/yyyy 'as' HH:mm", { locale: ptBR })}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Product Details */}
          <Card>
            <CardHeader>
              <CardTitle>Detalhes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {product.barcode && (
                <div className="flex items-center gap-3">
                  <Barcode className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Codigo de Barras</p>
                    <code className="font-medium">{product.barcode}</code>
                  </div>
                </div>
              )}

              {product.location && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Localizacao</p>
                    <p className="font-medium">{product.location}</p>
                  </div>
                </div>
              )}

              {product.manufacturer && (
                <div className="flex items-center gap-3">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Fabricante</p>
                    <p className="font-medium">{product.manufacturer}</p>
                  </div>
                </div>
              )}

              {product.supplier && (
                <div className="flex items-center gap-3">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Fornecedor</p>
                    <p className="font-medium">{product.supplier}</p>
                  </div>
                </div>
              )}

              {product.anvisaRegistry && (
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Registro ANVISA</p>
                    <p className="font-medium">{product.anvisaRegistry}</p>
                  </div>
                </div>
              )}

              <Separator />

              <div className="space-y-2">
                {product.requiresPrescription && (
                  <Badge variant="outline">Requer Receita</Badge>
                )}
                {product.controlledSubstance && (
                  <Badge variant="destructive">Substancia Controlada</Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Precos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Preco de Custo</p>
                <p className="text-xl font-bold">
                  {product.costPrice ? formatCurrency(product.costPrice) : '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Preco de Venda</p>
                <p className="text-xl font-bold text-green-600">
                  {product.salePrice ? formatCurrency(product.salePrice) : '-'}
                </p>
              </div>
              {product.costPrice && product.salePrice && (
                <div>
                  <p className="text-sm text-muted-foreground">Margem</p>
                  <p className="text-lg font-medium">
                    {(((product.salePrice - product.costPrice) / product.costPrice) * 100).toFixed(1)}%
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Description */}
          {product.description && (
            <Card>
              <CardHeader>
                <CardTitle>Descricao</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{product.description}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Movement Dialog */}
      <Dialog open={showMovementDialog} onOpenChange={setShowMovementDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Movimentacao</DialogTitle>
            <DialogDescription>
              Registre uma entrada, saida ou ajuste de estoque
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tipo de Movimentacao</Label>
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
                      Descarte (Vencido)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>
                {movementData.type === 'ADJUSTMENT' ? 'Nova Quantidade' : 'Quantidade'}
              </Label>
              <Input
                type="number"
                min={movementData.type === 'ADJUSTMENT' ? 0 : 1}
                value={movementData.quantity}
                onChange={(e) => setMovementData({ ...movementData, quantity: Number(e.target.value) })}
              />
              {movementData.type === 'ADJUSTMENT' && (
                <p className="text-xs text-muted-foreground">
                  Estoque atual: {product.currentStock} {product.unit}
                </p>
              )}
            </div>

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
            <Button variant="outline" onClick={() => setShowMovementDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => movementMutation.mutate(movementData)}
              disabled={movementMutation.isPending || movementData.quantity <= 0}
            >
              {movementMutation.isPending ? 'Registrando...' : 'Registrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Produto</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{product.name}"? Esta acao nao pode ser desfeita.
              Produtos com movimentacoes registradas nao podem ser excluidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
