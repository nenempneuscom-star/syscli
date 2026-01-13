import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, addDays } from 'date-fns';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Search,
  User,
  FileText,
  Building,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { api } from '@/lib/api';

interface Patient {
  id: string;
  fullName: string;
  document: string;
  phone?: string;
  healthPlan?: string;
  healthPlanNumber?: string;
}

interface Procedure {
  code: string;
  description: string;
  category: string;
  defaultPrice: number;
}

interface InvoiceItem {
  description: string;
  procedureCode?: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

const invoiceSchema = z.object({
  patientId: z.string().uuid('Selecione um paciente'),
  dueDate: z.string().min(1, 'Informe a data de vencimento'),
  notes: z.string().optional(),
  useHealthPlan: z.boolean().default(false),
  healthPlanInfo: z.object({
    planName: z.string().optional(),
    planCode: z.string().optional(),
    authorizationNumber: z.string().optional(),
    guideNumber: z.string().optional(),
  }).optional(),
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;

const paymentMethods = [
  { value: 'CASH', label: 'Dinheiro' },
  { value: 'CREDIT_CARD', label: 'Cartao de Credito' },
  { value: 'DEBIT_CARD', label: 'Cartao de Debito' },
  { value: 'PIX', label: 'PIX' },
  { value: 'BANK_TRANSFER', label: 'Transferencia' },
  { value: 'HEALTH_PLAN', label: 'Convenio' },
];

export function NewInvoicePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const [patientSearch, setPatientSearch] = useState('');
  const [procedureSearch, setProcedureSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [showProcedurePopover, setShowProcedurePopover] = useState(false);

  const preselectedPatientId = searchParams.get('patientId');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      dueDate: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
      useHealthPlan: false,
    },
  });

  const useHealthPlan = watch('useHealthPlan');

  // Fetch patients
  const { data: patientsData } = useQuery<{ success: boolean; data: Patient[] }>({
    queryKey: ['patients-search', patientSearch],
    queryFn: async () => {
      const response = await api.get(`/patients?search=${patientSearch}&perPage=10`);
      return response.data;
    },
    enabled: patientSearch.length >= 2,
  });

  // Fetch preselected patient
  useQuery<{ success: boolean; data: Patient }>({
    queryKey: ['patient', preselectedPatientId],
    queryFn: async () => {
      const response = await api.get(`/patients/${preselectedPatientId}`);
      return response.data;
    },
    enabled: !!preselectedPatientId,
    onSuccess: (data) => {
      if (data?.data) {
        setSelectedPatient(data.data);
        setValue('patientId', data.data.id);
      }
    },
  });

  // Fetch procedures
  const { data: proceduresData } = useQuery<{ success: boolean; data: Procedure[] }>({
    queryKey: ['procedures', procedureSearch],
    queryFn: async () => {
      const response = await api.get(`/procedures?search=${procedureSearch}`);
      return response.data;
    },
  });

  // Fetch grouped procedures for quick selection
  const { data: groupedProceduresData } = useQuery<{ success: boolean; data: Record<string, Procedure[]> }>({
    queryKey: ['procedures-grouped'],
    queryFn: async () => {
      const response = await api.get('/procedures/grouped');
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InvoiceFormData) => {
      const payload = {
        ...data,
        items,
        discount,
        paymentMethod: paymentMethod || undefined,
        healthPlanInfo: useHealthPlan ? data.healthPlanInfo : undefined,
      };
      const response = await api.post('/billing/invoices', payload);
      return response.data;
    },
    onSuccess: (data) => {
      toast({
        title: 'Fatura criada',
        description: `Fatura #${data.data.invoiceNumber} criada com sucesso.`,
      });
      navigate(`/billing/${data.data.id}`);
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Nao foi possivel criar a fatura.',
        variant: 'destructive',
      });
    },
  });

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setValue('patientId', patient.id);
    setPatientSearch('');

    // Auto-fill health plan info if patient has one
    if (patient.healthPlan) {
      setValue('healthPlanInfo.planName', patient.healthPlan);
      setValue('healthPlanInfo.planCode', patient.healthPlanNumber || '');
    }
  };

  const handleAddProcedure = (procedure: Procedure) => {
    const newItem: InvoiceItem = {
      description: procedure.description,
      procedureCode: procedure.code,
      quantity: 1,
      unitPrice: procedure.defaultPrice,
      total: procedure.defaultPrice,
    };
    setItems([...items, newItem]);
    setShowProcedurePopover(false);
  };

  const handleAddCustomItem = () => {
    const newItem: InvoiceItem = {
      description: '',
      quantity: 1,
      unitPrice: 0,
      total: 0,
    };
    setItems([...items, newItem]);
  };

  const handleUpdateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const updatedItems = [...items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value,
    };

    // Recalculate total if quantity or unit price changed
    if (field === 'quantity' || field === 'unitPrice') {
      updatedItems[index].total = updatedItems[index].quantity * updatedItems[index].unitPrice;
    }

    setItems(updatedItems);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const total = subtotal - discount;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const onSubmit = (data: InvoiceFormData) => {
    if (items.length === 0) {
      toast({
        title: 'Erro',
        description: 'Adicione pelo menos um item a fatura.',
        variant: 'destructive',
      });
      return;
    }

    createMutation.mutate(data);
  };

  const procedures = proceduresData?.data || [];
  const groupedProcedures = groupedProceduresData?.data || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/billing')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Nova Fatura</h1>
          <p className="text-muted-foreground">Crie uma nova fatura para o paciente</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Patient Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Paciente
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedPatient ? (
                  <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium">{selectedPatient.fullName}</p>
                      <p className="text-sm text-muted-foreground">{selectedPatient.document}</p>
                      {selectedPatient.healthPlan && (
                        <p className="text-sm text-muted-foreground">
                          Convenio: {selectedPatient.healthPlan}
                        </p>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedPatient(null);
                        setValue('patientId', '');
                      }}
                    >
                      Alterar
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Buscar paciente por nome ou CPF..."
                        value={patientSearch}
                        onChange={(e) => setPatientSearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    {patientsData?.data && patientsData.data.length > 0 && (
                      <div className="border rounded-lg divide-y max-h-48 overflow-auto">
                        {patientsData.data.map((patient) => (
                          <button
                            key={patient.id}
                            type="button"
                            className="w-full px-4 py-2 text-left hover:bg-muted transition-colors"
                            onClick={() => handleSelectPatient(patient)}
                          >
                            <p className="font-medium">{patient.fullName}</p>
                            <p className="text-sm text-muted-foreground">{patient.document}</p>
                          </button>
                        ))}
                      </div>
                    )}
                    {errors.patientId && (
                      <p className="text-sm text-destructive">{errors.patientId.message}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Items */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Itens da Fatura
                  </CardTitle>
                  <div className="flex gap-2">
                    <Popover open={showProcedurePopover} onOpenChange={setShowProcedurePopover}>
                      <PopoverTrigger asChild>
                        <Button type="button" variant="outline" size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          Procedimento
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0" align="end">
                        <Command>
                          <CommandInput
                            placeholder="Buscar procedimento..."
                            value={procedureSearch}
                            onValueChange={setProcedureSearch}
                          />
                          <CommandList>
                            <CommandEmpty>Nenhum procedimento encontrado</CommandEmpty>
                            {procedureSearch ? (
                              <CommandGroup heading="Resultados">
                                {procedures.map((procedure) => (
                                  <CommandItem
                                    key={procedure.code}
                                    onSelect={() => handleAddProcedure(procedure)}
                                  >
                                    <div className="flex-1">
                                      <p className="font-medium">{procedure.description}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {procedure.code} - {formatCurrency(procedure.defaultPrice)}
                                      </p>
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            ) : (
                              Object.entries(groupedProcedures).map(([category, procs]) => (
                                <CommandGroup key={category} heading={category}>
                                  {procs.slice(0, 5).map((procedure) => (
                                    <CommandItem
                                      key={procedure.code}
                                      onSelect={() => handleAddProcedure(procedure)}
                                    >
                                      <div className="flex-1">
                                        <p className="font-medium">{procedure.description}</p>
                                        <p className="text-xs text-muted-foreground">
                                          {formatCurrency(procedure.defaultPrice)}
                                        </p>
                                      </div>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              ))
                            )}
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <Button type="button" variant="outline" size="sm" onClick={handleAddCustomItem}>
                      <Plus className="h-4 w-4 mr-2" />
                      Item Livre
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {items.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Nenhum item adicionado</p>
                    <p className="text-sm">Adicione procedimentos ou itens livres</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-muted">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-medium">Descricao</th>
                            <th className="px-4 py-3 text-center text-sm font-medium w-20">Qtd</th>
                            <th className="px-4 py-3 text-right text-sm font-medium w-32">Valor Unit.</th>
                            <th className="px-4 py-3 text-right text-sm font-medium w-32">Total</th>
                            <th className="px-4 py-3 w-12"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {items.map((item, index) => (
                            <tr key={index}>
                              <td className="px-4 py-3">
                                <Input
                                  value={item.description}
                                  onChange={(e) => handleUpdateItem(index, 'description', e.target.value)}
                                  placeholder="Descricao do item"
                                  className="border-0 p-0 h-auto"
                                />
                                {item.procedureCode && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Codigo: {item.procedureCode}
                                  </p>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <Input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) => handleUpdateItem(index, 'quantity', Number(e.target.value))}
                                  className="text-center"
                                />
                              </td>
                              <td className="px-4 py-3">
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={item.unitPrice}
                                  onChange={(e) => handleUpdateItem(index, 'unitPrice', Number(e.target.value))}
                                  className="text-right"
                                />
                              </td>
                              <td className="px-4 py-3 text-right font-medium">
                                {formatCurrency(item.total)}
                              </td>
                              <td className="px-4 py-3">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleRemoveItem(index)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex justify-end">
                      <div className="w-64 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Subtotal</span>
                          <span>{formatCurrency(subtotal)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-muted-foreground">Desconto</span>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            max={subtotal}
                            value={discount}
                            onChange={(e) => setDiscount(Number(e.target.value))}
                            className="w-24 text-right"
                          />
                        </div>
                        <Separator />
                        <div className="flex justify-between text-lg font-bold">
                          <span>Total</span>
                          <span className="text-green-600">{formatCurrency(total)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Health Plan */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    Convenio
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="useHealthPlan">Usar convenio</Label>
                    <Switch
                      id="useHealthPlan"
                      checked={useHealthPlan}
                      onCheckedChange={(checked) => setValue('useHealthPlan', checked)}
                    />
                  </div>
                </div>
              </CardHeader>
              {useHealthPlan && (
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Nome do Convenio</Label>
                      <Input {...register('healthPlanInfo.planName')} placeholder="Ex: Unimed, Bradesco Saude" />
                    </div>
                    <div className="space-y-2">
                      <Label>Codigo do Plano</Label>
                      <Input {...register('healthPlanInfo.planCode')} placeholder="Codigo do plano" />
                    </div>
                    <div className="space-y-2">
                      <Label>Numero da Autorizacao</Label>
                      <Input {...register('healthPlanInfo.authorizationNumber')} placeholder="Opcional" />
                    </div>
                    <div className="space-y-2">
                      <Label>Numero da Guia</Label>
                      <Input {...register('healthPlanInfo.guideNumber')} placeholder="Opcional" />
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Payment Info */}
            <Card>
              <CardHeader>
                <CardTitle>Pagamento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Data de Vencimento *</Label>
                  <Input type="date" {...register('dueDate')} />
                  {errors.dueDate && (
                    <p className="text-sm text-destructive">{errors.dueDate.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Forma de Pagamento (opcional)</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map((method) => (
                        <SelectItem key={method.value} value={method.value}>
                          {method.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Observacoes</Label>
                  <Textarea
                    {...register('notes')}
                    placeholder="Observacoes adicionais..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Resumo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Itens</span>
                  <span>{items.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Desconto</span>
                    <span>- {formatCurrency(discount)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-green-600">{formatCurrency(total)}</span>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={createMutation.isPending || items.length === 0}
                >
                  {createMutation.isPending ? 'Criando...' : 'Criar Fatura'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
