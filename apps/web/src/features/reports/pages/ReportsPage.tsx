import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  BarChart3,
  Users,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Package,
  AlertTriangle,
  FileText,
  Activity,
  UserCheck,
  Clock,
  Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { api } from '@/lib/api';

interface DashboardMetrics {
  patients: {
    total: number;
    newThisMonth: number;
    activeThisMonth: number;
  };
  appointments: {
    total: number;
    completed: number;
    cancelled: number;
    noShow: number;
    completionRate: number;
  };
  revenue: {
    total: number;
    received: number;
    pending: number;
  };
  inventory: {
    lowStockCount: number;
    expiringSoonCount: number;
  };
}

export function ReportsPage() {
  const [dateRange, setDateRange] = useState({
    startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
  });

  const { data: dashboardData, isLoading } = useQuery<{ success: boolean; data: DashboardMetrics }>({
    queryKey: ['dashboard-metrics', dateRange],
    queryFn: async () => {
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });
      const response = await api.get(`/reports/dashboard?${params}`);
      return response.data;
    },
  });

  const metrics = dashboardData?.data;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

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
        <div>
          <h1 className="text-3xl font-bold">Relatorios</h1>
          <p className="text-muted-foreground">Visao geral e indicadores de desempenho</p>
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
              <Button variant="outline" size="sm" onClick={() => setQuickDateRange(12)}>
                12 meses
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      ) : metrics ? (
        <>
          {/* Main KPIs */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pacientes Ativos</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.patients.activeThisMonth}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
                  {metrics.patients.newThisMonth} novos no periodo
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Total: {metrics.patients.total} pacientes
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Consultas</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.appointments.total}</div>
                <div className="space-y-1 mt-2">
                  <div className="flex justify-between text-xs">
                    <span>Taxa de conclusao</span>
                    <span className="font-medium">{metrics.appointments.completionRate.toFixed(1)}%</span>
                  </div>
                  <Progress value={metrics.appointments.completionRate} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Receita</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(metrics.revenue.received)}
                </div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <Clock className="h-3 w-3 mr-1" />
                  {formatCurrency(metrics.revenue.pending)} a receber
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Alertas</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Estoque baixo</span>
                    <span className="text-lg font-bold text-yellow-600">
                      {metrics.inventory.lowStockCount}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Produtos vencendo</span>
                    <span className="text-lg font-bold text-red-600">
                      {metrics.inventory.expiringSoonCount}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Appointment Status Breakdown */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Status das Consultas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <span>Realizadas</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{metrics.appointments.completed}</span>
                      <span className="text-sm text-muted-foreground">
                        ({metrics.appointments.total > 0
                          ? ((metrics.appointments.completed / metrics.appointments.total) * 100).toFixed(1)
                          : 0}%)
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <span>Canceladas</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{metrics.appointments.cancelled}</span>
                      <span className="text-sm text-muted-foreground">
                        ({metrics.appointments.total > 0
                          ? ((metrics.appointments.cancelled / metrics.appointments.total) * 100).toFixed(1)
                          : 0}%)
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-orange-500" />
                      <span>Nao compareceu</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{metrics.appointments.noShow}</span>
                      <span className="text-sm text-muted-foreground">
                        ({metrics.appointments.total > 0
                          ? ((metrics.appointments.noShow / metrics.appointments.total) * 100).toFixed(1)
                          : 0}%)
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Resumo Financeiro
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                    <div className="flex items-center justify-between">
                      <span className="text-green-700">Recebido</span>
                      <span className="text-xl font-bold text-green-700">
                        {formatCurrency(metrics.revenue.received)}
                      </span>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                    <div className="flex items-center justify-between">
                      <span className="text-yellow-700">A Receber</span>
                      <span className="text-xl font-bold text-yellow-700">
                        {formatCurrency(metrics.revenue.pending)}
                      </span>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                    <div className="flex items-center justify-between">
                      <span className="text-blue-700">Total</span>
                      <span className="text-xl font-bold text-blue-700">
                        {formatCurrency(metrics.revenue.total)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Links to Detailed Reports */}
          <Card>
            <CardHeader>
              <CardTitle>Relatorios Detalhados</CardTitle>
              <CardDescription>
                Acesse relatorios especificos para analises mais profundas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <a href="/reports/appointments" className="block">
                  <div className="p-4 rounded-lg border hover:bg-muted transition-colors">
                    <Calendar className="h-8 w-8 text-primary mb-2" />
                    <h3 className="font-medium">Consultas</h3>
                    <p className="text-sm text-muted-foreground">
                      Estatisticas por status, tipo e profissional
                    </p>
                  </div>
                </a>
                <a href="/reports/patients" className="block">
                  <div className="p-4 rounded-lg border hover:bg-muted transition-colors">
                    <Users className="h-8 w-8 text-primary mb-2" />
                    <h3 className="font-medium">Pacientes</h3>
                    <p className="text-sm text-muted-foreground">
                      Demografia, retencao e novos cadastros
                    </p>
                  </div>
                </a>
                <a href="/reports/revenue" className="block">
                  <div className="p-4 rounded-lg border hover:bg-muted transition-colors">
                    <DollarSign className="h-8 w-8 text-primary mb-2" />
                    <h3 className="font-medium">Financeiro</h3>
                    <p className="text-sm text-muted-foreground">
                      Receita, formas de pagamento e tendencias
                    </p>
                  </div>
                </a>
                <a href="/reports/productivity" className="block">
                  <div className="p-4 rounded-lg border hover:bg-muted transition-colors">
                    <BarChart3 className="h-8 w-8 text-primary mb-2" />
                    <h3 className="font-medium">Produtividade</h3>
                    <p className="text-sm text-muted-foreground">
                      Desempenho por profissional e ocupacao
                    </p>
                  </div>
                </a>
              </div>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
