import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Plus,
  Search,
  FileText,
  AlertCircle,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Filter,
  Download,
  Calendar,
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
import { api } from '@/lib/api';

interface Invoice {
  id: string;
  invoiceNumber: string;
  patientId: string;
  patient: {
    id: string;
    fullName: string;
    phone?: string;
    email?: string;
  };
  subtotal: number;
  discount: number;
  total: number;
  status: 'PENDING' | 'PAID' | 'PARTIAL' | 'CANCELLED' | 'OVERDUE';
  paymentMethod?: string;
  dueDate: string;
  paidAt?: string;
  createdAt: string;
}

interface InvoicesResponse {
  success: boolean;
  data: Invoice[];
  meta: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

interface FinancialSummary {
  invoices: {
    total: number;
    paid: number;
    pending: number;
    cancelled: number;
    overdue: number;
  };
  revenue: {
    total: number;
    pending: number;
  };
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ElementType }> = {
  PENDING: { label: 'Pendente', variant: 'secondary', icon: Clock },
  PAID: { label: 'Pago', variant: 'default', icon: CheckCircle },
  PARTIAL: { label: 'Parcial', variant: 'outline', icon: DollarSign },
  CANCELLED: { label: 'Cancelado', variant: 'destructive', icon: XCircle },
  OVERDUE: { label: 'Vencido', variant: 'destructive', icon: AlertCircle },
};

const paymentMethodLabels: Record<string, string> = {
  CASH: 'Dinheiro',
  CREDIT_CARD: 'Cartão de Crédito',
  DEBIT_CARD: 'Cartão de Débito',
  PIX: 'PIX',
  BANK_TRANSFER: 'Transferência',
  HEALTH_PLAN: 'Convênio',
  OTHER: 'Outro',
};

export function BillingPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [dateRange, setDateRange] = useState({
    startDate: format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
  });

  const { data: invoicesData, isLoading } = useQuery<InvoicesResponse>({
    queryKey: ['invoices', page, statusFilter, dateRange],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        perPage: '20',
        ...(statusFilter && { status: statusFilter }),
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });
      const response = await api.get(`/billing/invoices?${params}`);
      return response.data;
    },
  });

  const { data: summaryData } = useQuery<{ success: boolean; data: FinancialSummary }>({
    queryKey: ['billing-summary', dateRange],
    queryFn: async () => {
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });
      const response = await api.get(`/billing/summary?${params}`);
      return response.data;
    },
  });

  const summary = summaryData?.data;
  const invoices = invoicesData?.data || [];
  const meta = invoicesData?.meta;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const filteredInvoices = invoices.filter((invoice) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      invoice.invoiceNumber.toLowerCase().includes(searchLower) ||
      invoice.patient.fullName.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Faturamento</h1>
          <p className="text-muted-foreground">Gerencie faturas e pagamentos</p>
        </div>
        <Link to="/billing/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nova Fatura
          </Button>
        </Link>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(summary.revenue.total)}
              </div>
              <p className="text-xs text-muted-foreground">
                {summary.invoices.paid} faturas pagas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">A Receber</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {formatCurrency(summary.revenue.pending)}
              </div>
              <p className="text-xs text-muted-foreground">
                {summary.invoices.pending} faturas pendentes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vencidas</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {summary.invoices.overdue}
              </div>
              <p className="text-xs text-muted-foreground">
                faturas em atraso
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Faturas</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.invoices.total}</div>
              <p className="text-xs text-muted-foreground">
                no período selecionado
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por número ou paciente..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="PENDING">Pendente</SelectItem>
                  <SelectItem value="PAID">Pago</SelectItem>
                  <SelectItem value="PARTIAL">Parcial</SelectItem>
                  <SelectItem value="CANCELLED">Cancelado</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                  className="w-[140px]"
                />
                <span className="text-muted-foreground">a</span>
                <Input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                  className="w-[140px]"
                />
              </div>

              <Button variant="outline" size="icon">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fatura</TableHead>
                <TableHead>Paciente</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Criação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : filteredInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">Nenhuma fatura encontrada</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredInvoices.map((invoice) => {
                  const status = statusConfig[invoice.status];
                  const StatusIcon = status.icon;
                  const isOverdue = invoice.status === 'PENDING' && new Date(invoice.dueDate) < new Date();

                  return (
                    <TableRow key={invoice.id}>
                      <TableCell>
                        <Link
                          to={`/billing/${invoice.id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          #{invoice.invoiceNumber}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{invoice.patient.fullName}</p>
                          {invoice.patient.phone && (
                            <p className="text-sm text-muted-foreground">
                              {invoice.patient.phone}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{formatCurrency(invoice.total)}</p>
                          {invoice.discount > 0 && (
                            <p className="text-xs text-muted-foreground">
                              Desconto: {formatCurrency(invoice.discount)}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={isOverdue ? 'destructive' : status.variant}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {isOverdue ? 'Vencido' : status.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {invoice.paymentMethod ? (
                          paymentMethodLabels[invoice.paymentMethod] || invoice.paymentMethod
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                          {format(new Date(invoice.dueDate), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                      </TableCell>
                      <TableCell>
                        {format(new Date(invoice.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
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
                {Math.min(meta.page * meta.perPage, meta.total)} de {meta.total} resultados
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
                  Próximo
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
