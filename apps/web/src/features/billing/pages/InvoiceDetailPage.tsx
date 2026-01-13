import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ArrowLeft,
  Printer,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  Calendar,
  FileText,
  CreditCard,
  Building,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
import { useToast } from '@/components/ui/use-toast';
import { api } from '@/lib/api';

interface InvoiceItem {
  description: string;
  procedureCode?: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  patientId: string;
  patient: {
    id: string;
    fullName: string;
    document: string;
    phone?: string;
    email?: string;
    address?: Record<string, string>;
    healthPlan?: string;
    healthPlanNumber?: string;
  };
  appointment?: {
    id: string;
    startTime: string;
    endTime: string;
    type: string;
    professional: {
      id: string;
      name: string;
      professionalId: string;
    };
  };
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  total: number;
  status: 'PENDING' | 'PAID' | 'PARTIAL' | 'CANCELLED';
  paymentMethod?: string;
  healthPlanInfo?: {
    planName: string;
    planCode: string;
    authorizationNumber?: string;
    guideNumber?: string;
  };
  dueDate: string;
  paidAt?: string;
  notes?: string;
  createdAt: string;
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ElementType }> = {
  PENDING: { label: 'Pendente', variant: 'secondary', icon: Clock },
  PAID: { label: 'Pago', variant: 'default', icon: CheckCircle },
  PARTIAL: { label: 'Parcial', variant: 'outline', icon: DollarSign },
  CANCELLED: { label: 'Cancelado', variant: 'destructive', icon: XCircle },
};

const paymentMethods = [
  { value: 'CASH', label: 'Dinheiro' },
  { value: 'CREDIT_CARD', label: 'Cartao de Credito' },
  { value: 'DEBIT_CARD', label: 'Cartao de Debito' },
  { value: 'PIX', label: 'PIX' },
  { value: 'BANK_TRANSFER', label: 'Transferencia' },
  { value: 'HEALTH_PLAN', label: 'Convenio' },
  { value: 'OTHER', label: 'Outro' },
];

export function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: 0,
    paymentMethod: 'PIX',
    transactionId: '',
    notes: '',
  });
  const [cancelReason, setCancelReason] = useState('');

  const { data: invoiceData, isLoading } = useQuery<{ success: boolean; data: Invoice }>({
    queryKey: ['invoice', id],
    queryFn: async () => {
      const response = await api.get(`/billing/invoices/${id}`);
      return response.data;
    },
    enabled: !!id,
  });

  const paymentMutation = useMutation({
    mutationFn: async (data: typeof paymentData) => {
      const response = await api.post(`/billing/invoices/${id}/pay`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice', id] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setShowPaymentDialog(false);
      toast({
        title: 'Pagamento registrado',
        description: 'O pagamento foi registrado com sucesso.',
      });
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Nao foi possivel registrar o pagamento.',
        variant: 'destructive',
      });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (reason: string) => {
      const response = await api.post(`/billing/invoices/${id}/cancel`, { reason });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice', id] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setShowCancelDialog(false);
      toast({
        title: 'Fatura cancelada',
        description: 'A fatura foi cancelada com sucesso.',
      });
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Nao foi possivel cancelar a fatura.',
        variant: 'destructive',
      });
    },
  });

  const invoice = invoiceData?.data;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const handleOpenPaymentDialog = () => {
    if (invoice) {
      setPaymentData({
        ...paymentData,
        amount: invoice.total,
      });
    }
    setShowPaymentDialog(true);
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Fatura nao encontrada</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/billing')}>
          Voltar
        </Button>
      </div>
    );
  }

  const status = statusConfig[invoice.status];
  const StatusIcon = status.icon;
  const isOverdue = invoice.status === 'PENDING' && new Date(invoice.dueDate) < new Date();
  const canPay = invoice.status === 'PENDING' || invoice.status === 'PARTIAL';
  const canCancel = invoice.status !== 'PAID' && invoice.status !== 'CANCELLED';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/billing')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">Fatura #{invoice.invoiceNumber}</h1>
              <Badge variant={isOverdue ? 'destructive' : status.variant}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {isOverdue ? 'Vencido' : status.label}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Criada em {format(new Date(invoice.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
          {canCancel && (
            <Button variant="outline" onClick={() => setShowCancelDialog(true)}>
              <XCircle className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
          )}
          {canPay && (
            <Button onClick={handleOpenPaymentDialog}>
              <DollarSign className="h-4 w-4 mr-2" />
              Registrar Pagamento
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Patient Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Paciente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Nome</p>
                  <Link to={`/patients/${invoice.patient.id}`} className="font-medium text-primary hover:underline">
                    {invoice.patient.fullName}
                  </Link>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Documento</p>
                  <p className="font-medium">{invoice.patient.document}</p>
                </div>
                {invoice.patient.phone && (
                  <div>
                    <p className="text-sm text-muted-foreground">Telefone</p>
                    <p className="font-medium">{invoice.patient.phone}</p>
                  </div>
                )}
                {invoice.patient.email && (
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{invoice.patient.email}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Itens da Fatura
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium">Descricao</th>
                        <th className="px-4 py-3 text-center text-sm font-medium">Qtd</th>
                        <th className="px-4 py-3 text-right text-sm font-medium">Valor Unit.</th>
                        <th className="px-4 py-3 text-right text-sm font-medium">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {invoice.items.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-3">
                            <p className="font-medium">{item.description}</p>
                            {item.procedureCode && (
                              <p className="text-sm text-muted-foreground">
                                Codigo: {item.procedureCode}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">{item.quantity}</td>
                          <td className="px-4 py-3 text-right">{formatCurrency(item.unitPrice)}</td>
                          <td className="px-4 py-3 text-right font-medium">{formatCurrency(item.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end">
                  <div className="w-64 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{formatCurrency(invoice.subtotal)}</span>
                    </div>
                    {invoice.discount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Desconto</span>
                        <span>- {formatCurrency(invoice.discount)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span>{formatCurrency(invoice.total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Health Plan Info */}
          {invoice.healthPlanInfo && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Informacoes do Convenio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Convenio</p>
                    <p className="font-medium">{invoice.healthPlanInfo.planName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Codigo do Plano</p>
                    <p className="font-medium">{invoice.healthPlanInfo.planCode}</p>
                  </div>
                  {invoice.healthPlanInfo.authorizationNumber && (
                    <div>
                      <p className="text-sm text-muted-foreground">Numero da Autorizacao</p>
                      <p className="font-medium">{invoice.healthPlanInfo.authorizationNumber}</p>
                    </div>
                  )}
                  {invoice.healthPlanInfo.guideNumber && (
                    <div>
                      <p className="text-sm text-muted-foreground">Numero da Guia</p>
                      <p className="font-medium">{invoice.healthPlanInfo.guideNumber}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {invoice.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Observacoes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{invoice.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Resumo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge variant={isOverdue ? 'destructive' : status.variant}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {isOverdue ? 'Vencido' : status.label}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Vencimento</span>
                <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                  {format(new Date(invoice.dueDate), 'dd/MM/yyyy', { locale: ptBR })}
                </span>
              </div>

              {invoice.paymentMethod && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Forma de Pagamento</span>
                  <span>
                    {paymentMethods.find(m => m.value === invoice.paymentMethod)?.label || invoice.paymentMethod}
                  </span>
                </div>
              )}

              {invoice.paidAt && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Data do Pagamento</span>
                  <span>{format(new Date(invoice.paidAt), 'dd/MM/yyyy', { locale: ptBR })}</span>
                </div>
              )}

              <Separator />

              <div className="flex items-center justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-green-600">{formatCurrency(invoice.total)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Appointment */}
          {invoice.appointment && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Consulta Relacionada
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Data</p>
                  <p className="font-medium">
                    {format(new Date(invoice.appointment.startTime), "dd/MM/yyyy 'as' HH:mm", { locale: ptBR })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Profissional</p>
                  <p className="font-medium">{invoice.appointment.professional.name}</p>
                  <p className="text-sm text-muted-foreground">{invoice.appointment.professional.professionalId}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Registrar Pagamento
            </DialogTitle>
            <DialogDescription>
              Informe os dados do pagamento para a fatura #{invoice.invoiceNumber}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Valor</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={paymentData.amount}
                onChange={(e) => setPaymentData({ ...paymentData, amount: Number(e.target.value) })}
              />
              <p className="text-xs text-muted-foreground">
                Total da fatura: {formatCurrency(invoice.total)}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Forma de Pagamento</Label>
              <Select
                value={paymentData.paymentMethod}
                onValueChange={(value) => setPaymentData({ ...paymentData, paymentMethod: value })}
              >
                <SelectTrigger>
                  <SelectValue />
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
              <Label htmlFor="transactionId">ID da Transacao (opcional)</Label>
              <Input
                id="transactionId"
                value={paymentData.transactionId}
                onChange={(e) => setPaymentData({ ...paymentData, transactionId: e.target.value })}
                placeholder="Ex: NSU, codigo de autorizacao"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observacoes (opcional)</Label>
              <Textarea
                id="notes"
                value={paymentData.notes}
                onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => paymentMutation.mutate(paymentData)}
              disabled={paymentMutation.isPending || paymentData.amount <= 0}
            >
              {paymentMutation.isPending ? 'Registrando...' : 'Confirmar Pagamento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Cancelar Fatura
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja cancelar esta fatura? Esta acao nao pode ser desfeita.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Label htmlFor="cancelReason">Motivo do cancelamento (opcional)</Label>
            <Textarea
              id="cancelReason"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="mt-2"
              rows={3}
              placeholder="Informe o motivo do cancelamento..."
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Voltar
            </Button>
            <Button
              variant="destructive"
              onClick={() => cancelMutation.mutate(cancelReason)}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? 'Cancelando...' : 'Confirmar Cancelamento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
