import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Bell,
  Mail,
  MessageSquare,
  Smartphone,
  Loader2,
  Save,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

interface NotificationPreferences {
  email: {
    appointments: boolean;
    reminders: boolean;
    marketing: boolean;
    reports: boolean;
  };
  sms: {
    appointments: boolean;
    reminders: boolean;
  };
  push: {
    appointments: boolean;
    reminders: boolean;
    alerts: boolean;
  };
}

const defaultPreferences: NotificationPreferences = {
  email: {
    appointments: true,
    reminders: true,
    marketing: false,
    reports: true,
  },
  sms: {
    appointments: true,
    reminders: true,
  },
  push: {
    appointments: true,
    reminders: true,
    alerts: true,
  },
};

export function NotificationSettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [hasChanges, setHasChanges] = useState(false);

  const { data, isLoading } = useQuery<{ success: boolean; data: NotificationPreferences }>({
    queryKey: ['notification-preferences'],
    queryFn: async () => {
      const response = await api.get('/settings/notifications');
      return response.data;
    },
  });

  useEffect(() => {
    if (data?.data) {
      setPreferences(data.data);
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async (prefs: NotificationPreferences) => {
      const response = await api.put('/settings/notifications', prefs);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
      setHasChanges(false);
      toast({
        title: 'Preferencias salvas',
        description: 'Suas preferencias de notificacao foram atualizadas.',
      });
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Nao foi possivel salvar as preferencias.',
        variant: 'destructive',
      });
    },
  });

  const updatePreference = (
    channel: 'email' | 'sms' | 'push',
    key: string,
    value: boolean
  ) => {
    setPreferences((prev) => ({
      ...prev,
      [channel]: {
        ...prev[channel],
        [key]: value,
      },
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    saveMutation.mutate(preferences);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/settings">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Notificacoes</h1>
            <p className="text-muted-foreground">Gerencie como voce recebe alertas</p>
          </div>
        </div>
        {hasChanges && (
          <Button onClick={handleSave} disabled={saveMutation.isLoading}>
            {saveMutation.isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Salvar
          </Button>
        )}
      </div>

      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            <CardTitle>Email</CardTitle>
          </div>
          <CardDescription>Notificacoes enviadas para seu email</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Agendamentos</Label>
              <p className="text-sm text-muted-foreground">
                Novos agendamentos e alteracoes
              </p>
            </div>
            <Switch
              checked={preferences.email.appointments}
              onCheckedChange={(checked) => updatePreference('email', 'appointments', checked)}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Lembretes</Label>
              <p className="text-sm text-muted-foreground">
                Lembretes de consultas proximas
              </p>
            </div>
            <Switch
              checked={preferences.email.reminders}
              onCheckedChange={(checked) => updatePreference('email', 'reminders', checked)}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Relatorios</Label>
              <p className="text-sm text-muted-foreground">
                Relatorios semanais e mensais
              </p>
            </div>
            <Switch
              checked={preferences.email.reports}
              onCheckedChange={(checked) => updatePreference('email', 'reports', checked)}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Marketing</Label>
              <p className="text-sm text-muted-foreground">
                Novidades, dicas e promocoes
              </p>
            </div>
            <Switch
              checked={preferences.email.marketing}
              onCheckedChange={(checked) => updatePreference('email', 'marketing', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* SMS Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            <CardTitle>SMS</CardTitle>
          </div>
          <CardDescription>Mensagens de texto para seu celular</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Agendamentos</Label>
              <p className="text-sm text-muted-foreground">
                Confirmacoes de agendamento por SMS
              </p>
            </div>
            <Switch
              checked={preferences.sms.appointments}
              onCheckedChange={(checked) => updatePreference('sms', 'appointments', checked)}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Lembretes</Label>
              <p className="text-sm text-muted-foreground">
                Lembrete de consulta por SMS
              </p>
            </div>
            <Switch
              checked={preferences.sms.reminders}
              onCheckedChange={(checked) => updatePreference('sms', 'reminders', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Push Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            <CardTitle>Push (Navegador)</CardTitle>
          </div>
          <CardDescription>Notificacoes no navegador</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Agendamentos</Label>
              <p className="text-sm text-muted-foreground">
                Alertas de novos agendamentos
              </p>
            </div>
            <Switch
              checked={preferences.push.appointments}
              onCheckedChange={(checked) => updatePreference('push', 'appointments', checked)}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Lembretes</Label>
              <p className="text-sm text-muted-foreground">
                Lembretes de proximas consultas
              </p>
            </div>
            <Switch
              checked={preferences.push.reminders}
              onCheckedChange={(checked) => updatePreference('push', 'reminders', checked)}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Alertas do Sistema</Label>
              <p className="text-sm text-muted-foreground">
                Alertas importantes e urgentes
              </p>
            </div>
            <Switch
              checked={preferences.push.alerts}
              onCheckedChange={(checked) => updatePreference('push', 'alerts', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <Bell className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm text-muted-foreground">
                Algumas notificacoes criticas, como alertas de seguranca e atualizacoes
                importantes do sistema, serao sempre enviadas independentemente das suas
                preferencias.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
