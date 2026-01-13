import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft,
  Package,
  DollarSign,
  MapPin,
  Building,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { api } from '@/lib/api';

const productSchema = z.object({
  name: z.string().min(1, 'Nome e obrigatorio'),
  description: z.string().optional(),
  sku: z.string().min(1, 'SKU e obrigatorio'),
  barcode: z.string().optional(),
  category: z.enum(['MEDICATION', 'MEDICAL_SUPPLY', 'EQUIPMENT', 'CONSUMABLE', 'OTHER']),
  unit: z.string().min(1, 'Unidade e obrigatoria'),
  minStock: z.number().min(0, 'Estoque minimo deve ser >= 0'),
  maxStock: z.number().min(0).optional(),
  currentStock: z.number().min(0).optional(),
  costPrice: z.number().min(0).optional(),
  salePrice: z.number().min(0).optional(),
  manufacturer: z.string().optional(),
  supplier: z.string().optional(),
  location: z.string().optional(),
  requiresPrescription: z.boolean().default(false),
  controlledSubstance: z.boolean().default(false),
  anvisaRegistry: z.string().optional(),
  expirationAlertDays: z.number().min(1).optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

const categories = [
  { value: 'MEDICATION', label: 'Medicamentos' },
  { value: 'MEDICAL_SUPPLY', label: 'Material Medico' },
  { value: 'EQUIPMENT', label: 'Equipamentos' },
  { value: 'CONSUMABLE', label: 'Consumiveis' },
  { value: 'OTHER', label: 'Outros' },
];

const units = [
  { value: 'un', label: 'Unidade (un)' },
  { value: 'cx', label: 'Caixa (cx)' },
  { value: 'pct', label: 'Pacote (pct)' },
  { value: 'fr', label: 'Frasco (fr)' },
  { value: 'amp', label: 'Ampola (amp)' },
  { value: 'cp', label: 'Comprimido (cp)' },
  { value: 'ml', label: 'Mililitro (ml)' },
  { value: 'g', label: 'Grama (g)' },
  { value: 'kg', label: 'Quilograma (kg)' },
  { value: 'L', label: 'Litro (L)' },
  { value: 'par', label: 'Par (par)' },
  { value: 'rolo', label: 'Rolo (rolo)' },
];

export function NewProductPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      category: 'MEDICATION',
      unit: 'un',
      minStock: 10,
      currentStock: 0,
      requiresPrescription: false,
      controlledSubstance: false,
      expirationAlertDays: 30,
    },
  });

  const category = watch('category');
  const requiresPrescription = watch('requiresPrescription');
  const controlledSubstance = watch('controlledSubstance');

  const createMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      const response = await api.post('/inventory/products', data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-summary'] });
      toast({
        title: 'Produto criado',
        description: `${data.data.name} foi cadastrado com sucesso.`,
      });
      navigate(`/inventory/${data.data.id}`);
    },
    onError: (error: Error & { response?: { data?: { error?: { message?: string } } } }) => {
      toast({
        title: 'Erro',
        description: error.response?.data?.error?.message || 'Nao foi possivel criar o produto.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: ProductFormData) => {
    createMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/inventory')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Novo Produto</h1>
          <p className="text-muted-foreground">Cadastre um novo item no estoque</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Informacoes Basicas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Produto *</Label>
                  <Input
                    id="name"
                    {...register('name')}
                    placeholder="Ex: Dipirona 500mg"
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descricao</Label>
                  <Textarea
                    id="description"
                    {...register('description')}
                    placeholder="Descricao do produto..."
                    rows={3}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="sku">SKU *</Label>
                    <Input
                      id="sku"
                      {...register('sku')}
                      placeholder="Ex: MED-DIP-500"
                    />
                    {errors.sku && (
                      <p className="text-sm text-destructive">{errors.sku.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="barcode">Codigo de Barras</Label>
                    <Input
                      id="barcode"
                      {...register('barcode')}
                      placeholder="Ex: 7891234567890"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Categoria *</Label>
                    <Select
                      value={category}
                      onValueChange={(value) => setValue('category', value as ProductFormData['category'])}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Unidade de Medida *</Label>
                    <Select
                      value={watch('unit')}
                      onValueChange={(value) => setValue('unit', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {units.map((unit) => (
                          <SelectItem key={unit.value} value={unit.value}>
                            {unit.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stock Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Controle de Estoque
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="currentStock">Estoque Inicial</Label>
                    <Input
                      id="currentStock"
                      type="number"
                      min="0"
                      {...register('currentStock', { valueAsNumber: true })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="minStock">Estoque Minimo *</Label>
                    <Input
                      id="minStock"
                      type="number"
                      min="0"
                      {...register('minStock', { valueAsNumber: true })}
                    />
                    {errors.minStock && (
                      <p className="text-sm text-destructive">{errors.minStock.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxStock">Estoque Maximo</Label>
                    <Input
                      id="maxStock"
                      type="number"
                      min="0"
                      {...register('maxStock', { valueAsNumber: true })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expirationAlertDays">Alerta de Validade (dias)</Label>
                  <Input
                    id="expirationAlertDays"
                    type="number"
                    min="1"
                    {...register('expirationAlertDays', { valueAsNumber: true })}
                    className="w-32"
                  />
                  <p className="text-xs text-muted-foreground">
                    Alerta sera exibido quando o produto estiver proximo de vencer
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Supplier Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Fornecedor e Fabricante
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="manufacturer">Fabricante</Label>
                    <Input
                      id="manufacturer"
                      {...register('manufacturer')}
                      placeholder="Ex: EMS, Medley"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="supplier">Fornecedor</Label>
                    <Input
                      id="supplier"
                      {...register('supplier')}
                      placeholder="Ex: Distribuidora ABC"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="location">Localizacao no Estoque</Label>
                    <Input
                      id="location"
                      {...register('location')}
                      placeholder="Ex: Prateleira A3, Gaveta 2"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="anvisaRegistry">Registro ANVISA</Label>
                    <Input
                      id="anvisaRegistry"
                      {...register('anvisaRegistry')}
                      placeholder="Numero do registro"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pricing */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Precos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="costPrice">Preco de Custo</Label>
                  <Input
                    id="costPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    {...register('costPrice', { valueAsNumber: true })}
                    placeholder="0,00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="salePrice">Preco de Venda</Label>
                  <Input
                    id="salePrice"
                    type="number"
                    step="0.01"
                    min="0"
                    {...register('salePrice', { valueAsNumber: true })}
                    placeholder="0,00"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Medication Settings */}
            {(category === 'MEDICATION' || category === 'MEDICAL_SUPPLY') && (
              <Card>
                <CardHeader>
                  <CardTitle>Controles Especiais</CardTitle>
                  <CardDescription>
                    Configuracoes para medicamentos e materiais controlados
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Requer Receita</Label>
                      <p className="text-xs text-muted-foreground">
                        Produto requer prescricao medica
                      </p>
                    </div>
                    <Switch
                      checked={requiresPrescription}
                      onCheckedChange={(checked) => setValue('requiresPrescription', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Substancia Controlada</Label>
                      <p className="text-xs text-muted-foreground">
                        Sujeito a controle especial (Portaria 344)
                      </p>
                    </div>
                    <Switch
                      checked={controlledSubstance}
                      onCheckedChange={(checked) => setValue('controlledSubstance', checked)}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <Card>
              <CardContent className="pt-6">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? 'Criando...' : 'Criar Produto'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
