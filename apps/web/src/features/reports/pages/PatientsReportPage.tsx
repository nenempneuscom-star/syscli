import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ArrowLeft,
  Calendar,
  Users,
  UserPlus,
  Heart,
  TrendingUp,
  Building,
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

interface PatientStats {
  byGender: Array<{ gender: string; count: number }>;
  byAgeGroup: Array<{ ageGroup: string; count: number }>;
  byHealthPlan: Array<{ healthPlan: string | null; count: number }>;
  newPatientsOverTime: Array<{ date: string; count: number }>;
  retentionRate: number;
}

const genderLabels: Record<string, string> = {
  MALE: 'Masculino',
  FEMALE: 'Feminino',
  OTHER: 'Outro',
};

const genderColors: Record<string, string> = {
  MALE: 'bg-blue-500',
  FEMALE: 'bg-pink-500',
  OTHER: 'bg-purple-500',
};

export function PatientsReportPage() {
  const [dateRange, setDateRange] = useState({
    startDate: format(startOfMonth(subMonths(new Date(), 11)), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
  });

  const { data: statsData, isLoading } = useQuery<{ success: boolean; data: PatientStats }>({
    queryKey: ['patient-stats', dateRange],
    queryFn: async () => {
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });
      const response = await api.get(`/reports/patients?${params}`);
      return response.data;
    },
  });

  const stats = statsData?.data;

  const totalPatients = stats?.byGender.reduce((sum, g) => sum + g.count, 0) || 0;
  const totalNewPatients = stats?.newPatientsOverTime.reduce((sum, p) => sum + p.count, 0) || 0;

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
            <h1 className="text-3xl font-bold">Relatorio de Pacientes</h1>
            <p className="text-muted-foreground">Demografia e analise de cadastros</p>
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
              <Button variant="outline" size="sm" onClick={() => setQuickDateRange(6)}>
                6 meses
              </Button>
              <Button variant="outline" size="sm" onClick={() => setQuickDateRange(12)}>
                12 meses
              </Button>
              <Button variant="outline" size="sm" onClick={() => setQuickDateRange(24)}>
                24 meses
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
                <CardTitle className="text-sm font-medium">Total de Pacientes</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalPatients}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Novos no Periodo</CardTitle>
                <UserPlus className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{totalNewPatients}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taxa de Retencao</CardTitle>
                <Heart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.retentionRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">pacientes que retornaram</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Com Convenio</CardTitle>
                <Building className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.byHealthPlan.filter((h) => h.healthPlan).reduce((sum, h) => sum + h.count, 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {((stats.byHealthPlan.filter((h) => h.healthPlan).reduce((sum, h) => sum + h.count, 0) / totalPatients) * 100).toFixed(1)}% do total
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* By Gender */}
            <Card>
              <CardHeader>
                <CardTitle>Por Genero</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.byGender.map((item) => {
                    const percentage = totalPatients > 0 ? (item.count / totalPatients) * 100 : 0;

                    return (
                      <div key={item.gender} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${genderColors[item.gender] || 'bg-gray-500'}`} />
                            <span>{genderLabels[item.gender] || item.gender}</span>
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

                {/* Gender Pie Chart Visual */}
                <div className="flex justify-center mt-6">
                  <div className="relative w-32 h-32">
                    <svg viewBox="0 0 100 100" className="transform -rotate-90">
                      {(() => {
                        let cumulativePercentage = 0;
                        return stats.byGender.map((item, index) => {
                          const percentage = totalPatients > 0 ? (item.count / totalPatients) * 100 : 0;
                          const strokeDasharray = `${percentage} ${100 - percentage}`;
                          const strokeDashoffset = -cumulativePercentage;
                          cumulativePercentage += percentage;

                          const colors = ['#3b82f6', '#ec4899', '#8b5cf6'];
                          return (
                            <circle
                              key={item.gender}
                              cx="50"
                              cy="50"
                              r="40"
                              fill="transparent"
                              stroke={colors[index % colors.length]}
                              strokeWidth="20"
                              strokeDasharray={strokeDasharray}
                              strokeDashoffset={strokeDashoffset}
                              pathLength="100"
                            />
                          );
                        });
                      })()}
                    </svg>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* By Age Group */}
            <Card>
              <CardHeader>
                <CardTitle>Por Faixa Etaria</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.byAgeGroup.map((item) => {
                    const percentage = totalPatients > 0 ? (item.count / totalPatients) * 100 : 0;

                    return (
                      <div key={item.ageGroup} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span>{item.ageGroup} anos</span>
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

          {/* New Patients Over Time */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Novos Cadastros ao Longo do Tempo
              </CardTitle>
              <CardDescription>Evolucao mensal de novos pacientes</CardDescription>
            </CardHeader>
            <CardContent>
              {stats.newPatientsOverTime.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum dado disponivel para o periodo
                </p>
              ) : (
                <div className="flex items-end justify-between h-48 gap-2 overflow-x-auto">
                  {stats.newPatientsOverTime.map((item) => {
                    const maxCount = Math.max(...stats.newPatientsOverTime.map((p) => p.count), 1);
                    const height = (item.count / maxCount) * 100;
                    const [year, month] = item.date.split('-');
                    const monthName = format(new Date(parseInt(year), parseInt(month) - 1), 'MMM', { locale: ptBR });

                    return (
                      <div key={item.date} className="flex flex-col items-center flex-1 min-w-[40px]">
                        <span className="text-sm font-medium mb-1">{item.count}</span>
                        <div
                          className="w-full bg-primary rounded-t transition-all"
                          style={{ height: `${Math.max(height, 5)}%` }}
                        />
                        <div className="text-xs text-muted-foreground mt-2 text-center">
                          <div>{monthName}</div>
                          <div className="text-[10px]">{year}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* By Health Plan */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Por Convenio
              </CardTitle>
              <CardDescription>Distribuicao de pacientes por plano de saude</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Convenio</TableHead>
                    <TableHead className="text-center">Pacientes</TableHead>
                    <TableHead className="text-center">% do Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.byHealthPlan.map((item, index) => {
                    const percentage = totalPatients > 0 ? (item.count / totalPatients) * 100 : 0;

                    return (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {item.healthPlan || (
                            <span className="text-muted-foreground">Particular</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">{item.count}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary">{percentage.toFixed(1)}%</Badge>
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
