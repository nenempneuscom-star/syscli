import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Activity,
  Users,
  UserPlus,
  Calendar,
  FileText,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { api } from '@/lib/api';

interface SystemInfo {
  usage: {
    users: { current: number; limit: number; percentage: number };
    patients: { current: number; limit: number; percentage: number };
    appointments: { total: number };
    medicalRecords: { total: number };
  };
  plan: {
    id: string;
    name: string;
    features: any;
  };
  tenant: {
    id: string;
    name: string;
    status: string;
    createdAt: string;
  };
}

export function SystemSettingsPage() {
  const { data, isLoading } = useQuery<{ success: boolean; data: SystemInfo }>({
    queryKey: ['system-info'],
    queryFn: async () => {
      const response = await api.get('/settings/system');
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const info = data?.data;

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/settings">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Uso do Sistema</h1>
          <p className="text-muted-foreground">Estatisticas e limites do seu plano</p>
        </div>
      </div>

      {/* Warnings */}
      {info?.usage.users.percentage >= 80 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Limite de usuarios proximo</AlertTitle>
          <AlertDescription>
            Voce esta usando {info.usage.users.percentage.toFixed(0)}% do limite de usuarios.
            Considere fazer upgrade do plano.
          </AlertDescription>
        </Alert>
      )}

      {info?.usage.patients.percentage >= 80 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Limite de pacientes proximo</AlertTitle>
          <AlertDescription>
            Voce esta usando {info.usage.patients.percentage.toFixed(0)}% do limite de pacientes.
            Considere fazer upgrade do plano.
          </AlertDescription>
        </Alert>
      )}

      {/* Usage Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Usuarios
              </CardTitle>
              <span className="text-sm text-muted-foreground">
                {info?.usage.users.current} / {info?.usage.users.limit || 'Ilimitado'}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {info?.usage.users.limit ? (
              <div className="space-y-2">
                <Progress
                  value={info.usage.users.percentage}
                  className={`h-2 ${getUsageColor(info.usage.users.percentage)}`}
                />
                <p className="text-xs text-muted-foreground">
                  {info.usage.users.percentage.toFixed(0)}% utilizado
                </p>
              </div>
            ) : (
              <p className="text-2xl font-bold">{info?.usage.users.current}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Pacientes
              </CardTitle>
              <span className="text-sm text-muted-foreground">
                {info?.usage.patients.current} / {info?.usage.patients.limit || 'Ilimitado'}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {info?.usage.patients.limit ? (
              <div className="space-y-2">
                <Progress
                  value={info.usage.patients.percentage}
                  className={`h-2 ${getUsageColor(info.usage.patients.percentage)}`}
                />
                <p className="text-xs text-muted-foreground">
                  {info.usage.patients.percentage.toFixed(0)}% utilizado
                </p>
              </div>
            ) : (
              <p className="text-2xl font-bold">{info?.usage.patients.current}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Agendamentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{info?.usage.appointments.total}</p>
            <p className="text-xs text-muted-foreground">Total de agendamentos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Prontuarios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{info?.usage.medicalRecords.total}</p>
            <p className="text-xs text-muted-foreground">Total de registros</p>
          </CardContent>
        </Card>
      </div>

      {/* Plan Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Plano Atual
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-lg">{info?.plan.name}</p>
              <p className="text-sm text-muted-foreground">
                Clinica ativa desde {info?.tenant.createdAt
                  ? new Date(info.tenant.createdAt).toLocaleDateString('pt-BR')
                  : '-'}
              </p>
            </div>
            <Badge variant="secondary">{info?.tenant.status}</Badge>
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground mb-2">
              Para alterar seu plano ou aumentar limites, entre em contato com nosso suporte.
            </p>
            <Button variant="outline">
              Falar com Suporte
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle>Status do Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">API</span>
              <Badge variant="default" className="bg-green-500">Operacional</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Banco de Dados</span>
              <Badge variant="default" className="bg-green-500">Operacional</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Armazenamento</span>
              <Badge variant="default" className="bg-green-500">Operacional</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Notificacoes</span>
              <Badge variant="default" className="bg-green-500">Operacional</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
