import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  CreditCard,
  TrendingUp,
  Award,
  Download,
  Banknote,
  PiggyBank,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { api } from '@/lib/api';

interface RevenueStats {
  byPaymentMethod: Array<{ method: string; total: number; count: number }>;
  byProfessional: Array<{ professionalId: string; professionalName: string; total: number }>;
  overTime: Array<{ date: string; total: number; count: number }>;
  averageTicket: number;
  topProcedures: Array<{ procedure: string; count: number; total: number }>;
}

const paymentMethodLabels: Record<string, { label: string; icon: React.ElementType }> = {
  CASH: { label: 'Dinheiro', icon: Banknote },
  CREDIT_CARD: { label: 'Cartao de Credito', icon: CreditCard },
  DEBIT_CARD: { label: 'Cartao de Debito', icon: CreditCard },
  PIX: { label: 'PIX', icon: PiggyBank },
  BANK_TRANSFER: { label: 'Transferencia', icon: DollarSign },
  HEALTH_PLAN: { label: 'Convenio', icon: Award },
  OTHER: { label: 'Outro', icon: DollarSign },
};

export function RevenueReportPage() {
  const [dateRange, setDateRange] = useState({
    startDate: format(startOfMonth(subMonths(new Date(), 2)), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
  });

  const { data: statsData, isLoading } = useQuery<{ success: boolean; data: RevenueStats }>({
    queryKey: ['revenue-stats', dateRange],
    queryFn: async () => {
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });
      const response = await api.get(`/reports/revenue?${params}`);
      return response.data;
    },
  });

  const stats = statsData?.data;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const totalRevenue = stats?.byPaymentMethod.reduce((sum, m) => sum + m.total, 0) || 0;
  const totalTransactions = stats?.byPaymentMethod.reduce((sum, m) => sum + m.count, 0) || 0;

  const setQuickDateRange = (months: number) => {
    const end = new Date();
    const start = months === 0 ? startOfMonth(end) : subMonths(end, months);
    setDateRange({
      startDate: format(startOfMonth(start), 'yyyy-MM-dd'),
      endDate: format(endOfMonth(end), 'yyyy-MM-dd'),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/reports">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Relatorio Financeiro</h1>
            <p className="text-muted-foreground">Receita e analise de pagamentos</p>
          </div>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Exportar
        </Button>
      </div>

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
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      ) : stats ? (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(totalRevenue)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Transacoes</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalTransactions}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ticket Medio</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.averageTicket)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Formas de Pagamento</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.byPaymentMethod.length}</div>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Over Time */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Receita ao Longo do Tempo
              </CardTitle>
              <CardDescription>Evolucao diaria da receita</CardDescription>
            </CardHeader>
            <CardContent>
              {stats.overTime.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum dado disponivel para o periodo
                </p>
              ) : (
                <div className="flex items-end justify-between h-48 gap-1 overflow-x-auto">
                  {stats.overTime.slice(-30).map((item) => {
                    const maxTotal = Math.max(...stats.overTime.map((p) => p.total), 1);
                    const height = (item.total / maxTotal) * 100;
                    const date = new Date(item.date);

                    return (
                      <div key={item.date} className="flex flex-col items-center flex-1 min-w-[20px] group">
                        <div className="hidden group-hover:block absolute -mt-8 bg-black text-white text-xs px-2 py-1 rounded">
                          {formatCurrency(item.total)}
                        </div>
                        <div
                          className="w-full bg-green-500 rounded-t transition-all hover:bg-green-600"
                          style={{ height: `${Math.max(height, 2)}%` }}
                        />
                        {stats.overTime.length <= 15 && (
                          <span className="text-xs text-muted-foreground mt-2">
                            {format(date, 'dd/MM', { locale: ptBR })}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* By Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle>Por Forma de Pagamento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.byPaymentMethod.map((item) => {
                    const config = paymentMethodLabels[item.method] || paymentMethodLabels.OTHER;
                    const Icon = config.icon;
                    const percentage = totalRevenue > 0 ? (item.total / totalRevenue) * 100 : 0;

                    return (
                      <div key={item.method} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            <span>{config.label}</span>
                            <Badge variant="secondary">{item.count}</Badge>
                          </div>
                          <span className="font-bold">{formatCurrency(item.total)}</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                        <p className="text-xs text-muted-foreground text-right">
                          {percentage.toFixed(1)}% da receita
                        </p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* By Professional */}
            <Card>
              <CardHeader>
                <CardTitle>Por Profissional</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.byProfessional.slice(0, 5).map((prof, index) => {
                    const percentage = totalRevenue > 0 ? (prof.total / totalRevenue) * 100 : 0;

                    return (
                      <div key={prof.professionalId} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">
                              {index + 1}
                            </span>
                            <span>{prof.professionalName}</span>
                          </div>
                          <span className="font-bold text-green-600">
                            {formatCurrency(prof.total)}
                          </span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Procedures */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Procedimentos Mais Realizados
              </CardTitle>
              <CardDescription>Top 10 procedimentos por receita</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Procedimento</TableHead>
                    <TableHead className="text-center">Quantidade</TableHead>
                    <TableHead className="text-right">Receita Total</TableHead>
                    <TableHead className="text-right">Ticket Medio</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.topProcedures.map((proc, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{proc.procedure}</TableCell>
                      <TableCell className="text-center">{proc.count}</TableCell>
                      <TableCell className="text-right font-medium text-green-600">
                        {formatCurrency(proc.total)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(proc.count > 0 ? proc.total / proc.count : 0)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
