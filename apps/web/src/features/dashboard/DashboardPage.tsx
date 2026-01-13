import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Calendar, FileText, DollarSign, TrendingUp, Clock } from 'lucide-react';
import api from '@/services/api';
import { useAuthStore } from '@/features/auth/store/auth-store';

interface DashboardStats {
  totalPatients: number;
  todayAppointments: number;
  pendingInvoices: number;
  monthlyRevenue: number;
}

export function DashboardPage() {
  const { user } = useAuthStore();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      // In a real app, this would be a single API call
      const [patients, appointments] = await Promise.all([
        api.get('/patients', { params: { perPage: 1 } }),
        api.get('/appointments/today'),
      ]);

      return {
        totalPatients: patients.data.meta?.total || 0,
        todayAppointments: appointments.data.data?.length || 0,
        pendingInvoices: 0,
        monthlyRevenue: 0,
      } as DashboardStats;
    },
  });

  const statCards = [
    {
      title: 'Total de Pacientes',
      value: stats?.totalPatients || 0,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Consultas Hoje',
      value: stats?.todayAppointments || 0,
      icon: Calendar,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Faturas Pendentes',
      value: stats?.pendingInvoices || 0,
      icon: FileText,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      title: 'Receita do Mes',
      value: `R$ ${(stats?.monthlyRevenue || 0).toLocaleString('pt-BR')}`,
      icon: DollarSign,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Bem-vindo de volta, {user?.name}!
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? '...' : stat.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Acoes Rapidas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <a
              href="/patients"
              className="block p-3 rounded-lg border hover:bg-muted transition-colors"
            >
              <div className="font-medium">Novo Paciente</div>
              <div className="text-sm text-muted-foreground">
                Cadastrar um novo paciente no sistema
              </div>
            </a>
            <a
              href="/appointments"
              className="block p-3 rounded-lg border hover:bg-muted transition-colors"
            >
              <div className="font-medium">Agendar Consulta</div>
              <div className="text-sm text-muted-foreground">
                Criar um novo agendamento
              </div>
            </a>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Atividade Recente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma atividade recente
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
