import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  BarChart3,
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

interface AppointmentStats {
  byStatus: Array<{ status: string; count: number }>;
  byType: Array<{ type: string; count: number }>;
  byProfessional: Array<{ professionalId: string; professionalName: string; count: number; revenue: number }>;
  byDayOfWeek: Array<{ dayOfWeek: number; count: number }>;
  byHour: Array<{ hour: number; count: number }>;
  averageDuration: number;
  peakHours: number[];
}

const statusLabels: Record<string, { label: string; color: string }> = {
  SCHEDULED: { label: 'Agendada', color: 'bg-blue-500' },
  CONFIRMED: { label: 'Confirmada', color: 'bg-green-500' },
  COMPLETED: { label: 'Realizada', color: 'bg-emerald-500' },
  CANCELLED: { label: 'Cancelada', color: 'bg-red-500' },
  NO_SHOW: { label: 'Nao compareceu', color: 'bg-orange-500' },
  IN_PROGRESS: { label: 'Em andamento', color: 'bg-purple-500' },
};

const typeLabels: Record<string, string> = {
  CONSULTATION: 'Consulta',
  RETURN: 'Retorno',
  EXAM: 'Exame',
  PROCEDURE: 'Procedimento',
  TELEMEDICINE: 'Telemedicina',
  EMERGENCY: 'Urgencia',
};

const dayOfWeekLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

export function AppointmentsReportPage() {
  const [dateRange, setDateRange] = useState({
    startDate: format(startOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
  });

  const { data: statsData, isLoading } = useQuery<{ success: boolean; data: AppointmentStats }>({
    queryKey: ['appointment-stats', dateRange],
    queryFn: async () => {
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });
      const response = await api.get(`/reports/appointments?${params}`);
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

  const totalAppointments = stats?.byStatus.reduce((sum, s) => sum + s.count, 0) || 0;

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
            <h1 className="text-3xl font-bold">Relatorio de Consultas</h1>
            <p className="text-muted-foreground">Estatisticas e analise de agendamentos</p>
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
                <CardTitle className="text-sm font-medium">Total de Consultas</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalAppointments}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Duracao Media</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.averageDuration.toFixed(0)} min</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Horarios de Pico</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.peakHours.map((h) => `${h}h`).join(', ')}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Profissionais Ativos</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.byProfessional.length}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* By Status */}
            <Card>
              <CardHeader>
                <CardTitle>Por Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.byStatus.map((item) => {
                    const config = statusLabels[item.status] || { label: item.status, color: 'bg-gray-500' };
                    const percentage = totalAppointments > 0 ? (item.count / totalAppointments) * 100 : 0;

                    return (
                      <div key={item.status} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${config.color}`} />
                            <span>{config.label}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold">{item.count}</span>
                            <span className="text-sm text-muted-foreground">
                              ({percentage.toFixed(1)}%)
                            </span>
                          </div>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* By Type */}
            <Card>
              <CardHeader>
                <CardTitle>Por Tipo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.byType.map((item) => {
                    const percentage = totalAppointments > 0 ? (item.count / totalAppointments) * 100 : 0;

                    return (
                      <div key={item.type} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span>{typeLabels[item.type] || item.type}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-bold">{item.count}</span>
                            <span className="text-sm text-muted-foreground">
                              ({percentage.toFixed(1)}%)
                            </span>
                          </div>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* By Day of Week and Hour */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* By Day of Week */}
            <Card>
              <CardHeader>
                <CardTitle>Por Dia da Semana</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between h-48 gap-2">
                  {dayOfWeekLabels.map((day, index) => {
                    const dayStats = stats.byDayOfWeek.find((d) => d.dayOfWeek === index);
                    const count = dayStats?.count || 0;
                    const maxCount = Math.max(...stats.byDayOfWeek.map((d) => d.count), 1);
                    const height = (count / maxCount) * 100;

                    return (
                      <div key={day} className="flex flex-col items-center flex-1">
                        <span className="text-sm font-medium mb-1">{count}</span>
                        <div
                          className="w-full bg-primary rounded-t transition-all"
                          style={{ height: `${height}%` }}
                        />
                        <span className="text-xs text-muted-foreground mt-2">{day}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* By Hour */}
            <Card>
              <CardHeader>
                <CardTitle>Por Horario</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between h-48 gap-1 overflow-x-auto">
                  {Array.from({ length: 12 }, (_, i) => i + 7).map((hour) => {
                    const hourStats = stats.byHour.find((h) => h.hour === hour);
                    const count = hourStats?.count || 0;
                    const maxCount = Math.max(...stats.byHour.map((h) => h.count), 1);
                    const height = (count / maxCount) * 100;
                    const isPeak = stats.peakHours.includes(hour);

                    return (
                      <div key={hour} className="flex flex-col items-center flex-1 min-w-[30px]">
                        <span className="text-xs font-medium mb-1">{count}</span>
                        <div
                          className={`w-full rounded-t transition-all ${isPeak ? 'bg-orange-500' : 'bg-primary'}`}
                          style={{ height: `${height}%` }}
                        />
                        <span className="text-xs text-muted-foreground mt-2">{hour}h</span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center gap-4 mt-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-primary" />
                    <span>Normal</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-orange-500" />
                    <span>Horario de pico</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* By Professional */}
          <Card>
            <CardHeader>
              <CardTitle>Por Profissional</CardTitle>
              <CardDescription>Desempenho individual de atendimentos</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Profissional</TableHead>
                    <TableHead className="text-center">Consultas</TableHead>
                    <TableHead className="text-center">% do Total</TableHead>
                    <TableHead className="text-right">Receita Gerada</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.byProfessional.map((prof) => {
                    const percentage = totalAppointments > 0
                      ? (prof.count / totalAppointments) * 100
                      : 0;

                    return (
                      <TableRow key={prof.professionalId}>
                        <TableCell className="font-medium">{prof.professionalName}</TableCell>
                        <TableCell className="text-center">{prof.count}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary">{percentage.toFixed(1)}%</Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium text-green-600">
                          {formatCurrency(prof.revenue)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
