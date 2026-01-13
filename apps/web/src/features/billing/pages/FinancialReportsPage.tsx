import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  FileText,
  AlertCircle,
  Calendar,
  Download,
  CreditCard,
  Banknote,
  PiggyBank,
  BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';

interface FinancialSummary {
  period: {
    startDate: string;
    endDate: string;
  };
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
    byPaymentMethod: Array<{
      method: string;
      total: number;
      count: number;
    }>;
  };
}

interface DailySummary {
  date: string;
  totalRevenue: number;
  invoiceCount: number;
  byPaymentMethod: Array<{
    method: string;
    total: number;
    count: number;
  }>;
  invoices: Array<{
    id: string;
    invoiceNumber: string;
    total: number;
    paymentMethod: string;
    paidAt: string;
    patient: {
      fullName: string;
    };
  }>;
}

interface OverdueInvoice {
  id: string;
  invoiceNumber: string;
  total: number;
  dueDate: string;
  patient: {
    id: string;
    fullName: string;
    phone?: string;
    email?: string;
  };
}

const paymentMethodLabels: Record<string, string> = {
  CASH: 'Dinheiro',
  CREDIT_CARD: 'Cartao de Credito',
  DEBIT_CARD: 'Cartao de Debito',
  PIX: 'PIX',
  BANK_TRANSFER: 'Transferencia',
  HEALTH_PLAN: 'Convenio',
  OTHER: 'Outro',
};

const paymentMethodIcons: Record<string, React.ElementType> = {
  CASH: Banknote,
  CREDIT_CARD: CreditCard,
  DEBIT_CARD: CreditCard,
  PIX: PiggyBank,
  BANK_TRANSFER: DollarSign,
  HEALTH_PLAN: FileText,
  OTHER: DollarSign,
};

export function FinancialReportsPage() {
  const [dateRange, setDateRange] = useState({
    startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
  });
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  // Financial Summary
  const { data: summaryData, isLoading: summaryLoading } = useQuery<{ success: boolean; data: FinancialSummary }>({
    queryKey: ['financial-summary', dateRange],
    queryFn: async () => {
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });
      const response = await api.get(`/billing/summary?${params}`);
      return response.data;
    },
  });

  // Daily Summary
  const { data: dailyData, isLoading: dailyLoading } = useQuery<{ success: boolean; data: DailySummary }>({
    queryKey: ['daily-summary', selectedDate],
    queryFn: async () => {
      const response = await api.get(`/billing/daily?date=${selectedDate}`);
      return response.data;
    },
  });

  // Overdue Invoices
  const { data: overdueData } = useQuery<{ success: boolean; data: OverdueInvoice[] }>({
    queryKey: ['overdue-invoices'],
    queryFn: async () => {
      const response = await api.get('/billing/invoices/overdue');
      return response.data;
    },
  });

  const summary = summaryData?.data;
  const daily = dailyData?.data;
  const overdueInvoices = overdueData?.data || [];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const setQuickDateRange = (months: number) => {
    const end = new Date();
    const start = subMonths(end, months);
    setDateRange({
      startDate: format(startOfMonth(start), 'yyyy-MM-dd'),
      endDate: format(endOfMonth(end), 'yyyy-MM-dd'),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Relatorios Financeiros</h1>
          <p className="text-muted-foreground">Acompanhe o desempenho financeiro da clinica</p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Exportar
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Visao Geral</TabsTrigger>
          <TabsTrigger value="daily">Caixa Diario</TabsTrigger>
          <TabsTrigger value="overdue">Inadimplencia</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Date Range Filter */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <Input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                    className="w-[150px]"
                  />
                  <span className="text-muted-foreground">a</span>
                  <Input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                    className="w-[150px]"
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setQuickDateRange(0)}>
                    Este mes
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setQuickDateRange(3)}>
                    3 meses
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setQuickDateRange(6)}>
                    6 meses
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setQuickDateRange(12)}>
                    12 meses
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {summaryLoading ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-muted-foreground">Carregando...</p>
            </div>
          ) : summary ? (
            <>
              {/* Summary Cards */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
                    <TrendingUp className="h-4 w-4 text-green-600" />
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
                    <DollarSign className="h-4 w-4 text-yellow-600" />
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
                    <CardTitle className="text-sm font-medium">Faturas Vencidas</CardTitle>
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      {summary.invoices.overdue}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      requerem atencao
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
                      {summary.invoices.cancelled} canceladas
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Revenue by Payment Method */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Receita por Forma de Pagamento
                  </CardTitle>
                  <CardDescription>
                    Distribuicao da receita no periodo selecionado
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {summary.revenue.byPaymentMethod.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhum pagamento registrado no periodo
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {summary.revenue.byPaymentMethod.map((item) => {
                        const Icon = paymentMethodIcons[item.method] || DollarSign;
                        const percentage = summary.revenue.total > 0
                          ? (item.total / summary.revenue.total) * 100
                          : 0;

                        return (
                          <div key={item.method} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Icon className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">
                                  {paymentMethodLabels[item.method] || item.method}
                                </span>
                                <Badge variant="secondary">{item.count} faturas</Badge>
                              </div>
                              <span className="font-bold">{formatCurrency(item.total)}</span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full transition-all"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <p className="text-xs text-muted-foreground text-right">
                              {percentage.toFixed(1)}% do total
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Invoice Status Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Distribuicao de Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                      <p className="text-sm text-green-600 font-medium">Pagas</p>
                      <p className="text-2xl font-bold text-green-700">{summary.invoices.paid}</p>
                      <p className="text-xs text-green-600">
                        {summary.invoices.total > 0
                          ? ((summary.invoices.paid / summary.invoices.total) * 100).toFixed(1)
                          : 0}%
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                      <p className="text-sm text-yellow-600 font-medium">Pendentes</p>
                      <p className="text-2xl font-bold text-yellow-700">{summary.invoices.pending}</p>
                      <p className="text-xs text-yellow-600">
                        {summary.invoices.total > 0
                          ? ((summary.invoices.pending / summary.invoices.total) * 100).toFixed(1)
                          : 0}%
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                      <p className="text-sm text-red-600 font-medium">Vencidas</p>
                      <p className="text-2xl font-bold text-red-700">{summary.invoices.overdue}</p>
                      <p className="text-xs text-red-600">
                        {summary.invoices.total > 0
                          ? ((summary.invoices.overdue / summary.invoices.total) * 100).toFixed(1)
                          : 0}%
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                      <p className="text-sm text-gray-600 font-medium">Canceladas</p>
                      <p className="text-2xl font-bold text-gray-700">{summary.invoices.cancelled}</p>
                      <p className="text-xs text-gray-600">
                        {summary.invoices.total > 0
                          ? ((summary.invoices.cancelled / summary.invoices.total) * 100).toFixed(1)
                          : 0}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : null}
        </TabsContent>

        {/* Daily Tab */}
        <TabsContent value="daily" className="space-y-6">
          {/* Date Selector */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-[200px]"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDate(format(new Date(), 'yyyy-MM-dd'))}
                >
                  Hoje
                </Button>
              </div>
            </CardContent>
          </Card>

          {dailyLoading ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-muted-foreground">Carregando...</p>
            </div>
          ) : daily ? (
            <>
              {/* Daily Summary Cards */}
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Receita do Dia</CardTitle>
                    <DollarSign className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(daily.totalRevenue)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Faturas Pagas</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{daily.invoiceCount}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Ticket Medio</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {daily.invoiceCount > 0
                        ? formatCurrency(daily.totalRevenue / daily.invoiceCount)
                        : formatCurrency(0)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Payment Methods Breakdown */}
              {daily.byPaymentMethod.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Por Forma de Pagamento</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                      {daily.byPaymentMethod.map((item) => {
                        const Icon = paymentMethodIcons[item.method] || DollarSign;
                        return (
                          <div
                            key={item.method}
                            className="flex items-center gap-3 p-3 rounded-lg border"
                          >
                            <Icon className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="font-medium">
                                {paymentMethodLabels[item.method] || item.method}
                              </p>
                              <p className="text-sm text-muted-foreground">{item.count} pagamentos</p>
                            </div>
                            <p className="ml-auto font-bold">{formatCurrency(item.total)}</p>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Daily Transactions */}
              <Card>
                <CardHeader>
                  <CardTitle>Transacoes do Dia</CardTitle>
                </CardHeader>
                <CardContent>
                  {daily.invoices.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhum pagamento registrado nesta data
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fatura</TableHead>
                          <TableHead>Paciente</TableHead>
                          <TableHead>Hora</TableHead>
                          <TableHead>Pagamento</TableHead>
                          <TableHead className="text-right">Valor</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {daily.invoices.map((invoice) => (
                          <TableRow key={invoice.id}>
                            <TableCell className="font-medium">
                              #{invoice.invoiceNumber}
                            </TableCell>
                            <TableCell>{invoice.patient.fullName}</TableCell>
                            <TableCell>
                              {format(new Date(invoice.paidAt), 'HH:mm')}
                            </TableCell>
                            <TableCell>
                              {paymentMethodLabels[invoice.paymentMethod] || invoice.paymentMethod}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(invoice.total)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </>
          ) : null}
        </TabsContent>

        {/* Overdue Tab */}
        <TabsContent value="overdue" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    Faturas Vencidas
                  </CardTitle>
                  <CardDescription>
                    Faturas pendentes com data de vencimento ultrapassada
                  </CardDescription>
                </div>
                <Badge variant="destructive">{overdueInvoices.length} faturas</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {overdueInvoices.length === 0 ? (
                <div className="text-center py-8">
                  <TrendingDown className="h-12 w-12 mx-auto text-green-600 mb-2" />
                  <p className="font-medium text-green-600">Nenhuma fatura vencida!</p>
                  <p className="text-sm text-muted-foreground">
                    Todas as faturas estao em dia
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fatura</TableHead>
                      <TableHead>Paciente</TableHead>
                      <TableHead>Contato</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Dias em Atraso</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {overdueInvoices.map((invoice) => {
                      const daysOverdue = Math.floor(
                        (new Date().getTime() - new Date(invoice.dueDate).getTime()) /
                          (1000 * 60 * 60 * 24)
                      );

                      return (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-medium">
                            #{invoice.invoiceNumber}
                          </TableCell>
                          <TableCell>{invoice.patient.fullName}</TableCell>
                          <TableCell>
                            {invoice.patient.phone || invoice.patient.email || '-'}
                          </TableCell>
                          <TableCell>
                            {format(new Date(invoice.dueDate), 'dd/MM/yyyy', { locale: ptBR })}
                          </TableCell>
                          <TableCell>
                            <Badge variant="destructive">{daysOverdue} dias</Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium text-red-600">
                            {formatCurrency(invoice.total)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Total Overdue */}
          {overdueInvoices.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total em Atraso</p>
                    <p className="text-3xl font-bold text-red-600">
                      {formatCurrency(overdueInvoices.reduce((sum, inv) => sum + inv.total, 0))}
                    </p>
                  </div>
                  <Button>
                    <FileText className="h-4 w-4 mr-2" />
                    Gerar Relatorio de Cobranca
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
