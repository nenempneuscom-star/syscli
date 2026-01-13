import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import {
  ArrowLeft,
  Calendar,
  Users,
  Clock,
  DollarSign,
  TrendingUp,
  Activity,
  Award,
  Download,
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

interface ProductivityStats {
  professionals: Array<{
    id: string;
    name: string;
    appointments: number;
    completedAppointments: number;
    revenue: number;
    averageAppointmentDuration: number;
    occupancyRate: number;
  }>;
  overall: {
    totalAppointments: number;
    totalRevenue: number;
    averageOccupancy: number;
  };
}

export function ProductivityReportPage() {
  const [dateRange, setDateRange] = useState({
    startDate: format(startOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
  });

  const { data: statsData, isLoading } = useQuery<{ success: boolean; data: ProductivityStats }>({
    queryKey: ['productivity-stats', dateRange],
    queryFn: async () => {
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });
      const response = await api.get(`/reports/productivity?${params}`);
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

  const setQuickDateRange = (months: number) => {
    const end = new Date();
    const start = months === 0 ? startOfMonth(end) : subMonths(end, months);
    setDateRange({
      startDate: format(startOfMonth(start), 'yyyy-MM-dd'),
      endDate: format(endOfMonth(end), 'yyyy-MM-dd'),
    });
  };

  const getOccupancyColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600';
    if (rate >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getOccupancyBadge = (rate: number) => {
    if (rate >= 80) return 'default';
    if (rate >= 60) return 'secondary';
    return 'destructive';
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
            <h1 className="text-3xl font-bold">Relatorio de Produtividade</h1>
            <p className="text-muted-foreground">Desempenho e ocupacao dos profissionais</p>
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
          {/* Overall Summary Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Consultas</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.overall.totalAppointments}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(stats.overall.totalRevenue)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ocupacao Media</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getOccupancyColor(stats.overall.averageOccupancy)}`}>
                  {stats.overall.averageOccupancy.toFixed(1)}%
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Profissionais</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.professionals.length}</div>
              </CardContent>
            </Card>
          </div>

          {/* Top Performers */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Top by Revenue */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <DollarSign className="h-5 w-5" />
                  Maior Receita
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats.professionals.length > 0 ? (
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                      <Award className="h-8 w-8 text-green-600" />
                    </div>
                    <p className="font-bold text-lg">{stats.professionals[0].name}</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(stats.professionals[0].revenue)}
                    </p>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground">Sem dados</p>
                )}
              </CardContent>
            </Card>

            {/* Top by Appointments */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-600">
                  <Calendar className="h-5 w-5" />
                  Mais Consultas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats.professionals.length > 0 ? (
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
                      <Award className="h-8 w-8 text-blue-600" />
                    </div>
                    <p className="font-bold text-lg">
                      {[...stats.professionals].sort((a, b) => b.appointments - a.appointments)[0].name}
                    </p>
                    <p className="text-2xl font-bold text-blue-600">
                      {[...stats.professionals].sort((a, b) => b.appointments - a.appointments)[0].appointments} consultas
                    </p>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground">Sem dados</p>
                )}
              </CardContent>
            </Card>

            {/* Top by Occupancy */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-600">
                  <Activity className="h-5 w-5" />
                  Maior Ocupacao
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats.professionals.length > 0 ? (
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-3">
                      <Award className="h-8 w-8 text-purple-600" />
                    </div>
                    <p className="font-bold text-lg">
                      {[...stats.professionals].sort((a, b) => b.occupancyRate - a.occupancyRate)[0].name}
                    </p>
                    <p className="text-2xl font-bold text-purple-600">
                      {[...stats.professionals].sort((a, b) => b.occupancyRate - a.occupancyRate)[0].occupancyRate.toFixed(1)}%
                    </p>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground">Sem dados</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Detailed Table */}
          <Card>
            <CardHeader>
              <CardTitle>Desempenho Individual</CardTitle>
              <CardDescription>Metricas detalhadas por profissional</CardDescription>
            </CardHeader>
            <CardContent>
              {stats.professionals.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum dado disponivel para o periodo
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Profissional</TableHead>
                      <TableHead className="text-center">Consultas</TableHead>
                      <TableHead className="text-center">Realizadas</TableHead>
                      <TableHead className="text-center">Taxa de Conclusao</TableHead>
                      <TableHead className="text-center">Duracao Media</TableHead>
                      <TableHead className="text-center">Ocupacao</TableHead>
                      <TableHead className="text-right">Receita</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.professionals.map((prof) => {
                      const completionRate = prof.appointments > 0
                        ? (prof.completedAppointments / prof.appointments) * 100
                        : 0;

                      return (
                        <TableRow key={prof.id}>
                          <TableCell className="font-medium">{prof.name}</TableCell>
                          <TableCell className="text-center">{prof.appointments}</TableCell>
                          <TableCell className="text-center">{prof.completedAppointments}</TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Progress value={completionRate} className="w-16 h-2" />
                              <span className="text-sm">{completionRate.toFixed(0)}%</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              {prof.averageAppointmentDuration.toFixed(0)} min
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant={getOccupancyBadge(prof.occupancyRate) as 'default' | 'secondary' | 'destructive'}>
                              {prof.occupancyRate.toFixed(1)}%
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium text-green-600">
                            {formatCurrency(prof.revenue)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Occupancy Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Distribuicao de Ocupacao</CardTitle>
              <CardDescription>Comparativo visual entre profissionais</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.professionals.map((prof) => (
                  <div key={prof.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{prof.name}</span>
                      <span className={getOccupancyColor(prof.occupancyRate)}>
                        {prof.occupancyRate.toFixed(1)}%
                      </span>
                    </div>
                    <div className="relative h-4 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`absolute left-0 top-0 h-full rounded-full transition-all ${
                          prof.occupancyRate >= 80
                            ? 'bg-green-500'
                            : prof.occupancyRate >= 60
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(prof.occupancyRate, 100)}%` }}
                      />
                      {/* Target line at 80% */}
                      <div
                        className="absolute top-0 h-full w-0.5 bg-black/30"
                        style={{ left: '80%' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-6 mt-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-green-500" />
                  <span>Otimo (80%+)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-yellow-500" />
                  <span>Bom (60-80%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-red-500" />
                  <span>Baixo (&lt;60%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-0.5 h-3 bg-black/30" />
                  <span>Meta (80%)</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
