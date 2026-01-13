import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Building,
  Save,
  Loader2,
  Clock,
  Calendar,
  DollarSign,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

interface TenantSettings {
  id: string;
  name: string;
  document: string;
  subdomain: string;
  phone: string | null;
  email: string | null;
  address: any | null;
  logo: string | null;
  status: string;
  settings: {
    timezone: string;
    currency: string;
    language: string;
    workingHours: { start: string; end: string };
    workingDays?: number[];
    appointmentDuration: number;
    appointmentBuffer?: number;
    features: {
      telemedicine: boolean;
      billing: boolean;
      inventory: boolean;
      multiLocation: boolean;
      onlineBooking?: boolean;
    };
    notifications?: {
      appointmentReminder: number;
      confirmationRequired: boolean;
      autoConfirmation: boolean;
    };
    billing?: {
      defaultPaymentTerms: number;
      lateFeePercentage: number;
      invoicePrefix: string;
      invoiceNotes: string;
    };
  };
  plan: {
    id: string;
    name: string;
  };
}

const timezones = [
  { value: 'America/Sao_Paulo', label: 'Brasilia (GMT-3)' },
  { value: 'America/Manaus', label: 'Manaus (GMT-4)' },
  { value: 'America/Belem', label: 'Belem (GMT-3)' },
  { value: 'America/Fortaleza', label: 'Fortaleza (GMT-3)' },
  { value: 'America/Recife', label: 'Recife (GMT-3)' },
];

const weekDays = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda' },
  { value: 2, label: 'Terca' },
  { value: 3, label: 'Quarta' },
  { value: 4, label: 'Quinta' },
  { value: 5, label: 'Sexta' },
  { value: 6, label: 'Sabado' },
];

export function ClinicSettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<Partial<TenantSettings>>({});
  const [hasChanges, setHasChanges] = useState(false);

  const { data, isLoading } = useQuery<{ success: boolean; data: TenantSettings }>({
    queryKey: ['tenant-settings'],
    queryFn: async () => {
      const response = await api.get('/settings/tenant');
      return response.data;
    },
  });

  useEffect(() => {
    if (data?.data) {
      setFormData(data.data);
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async (updateData: any) => {
      const response = await api.patch('/settings/tenant', updateData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-settings'] });
      setHasChanges(false);
      toast({
        title: 'Configuracoes salvas',
        description: 'As configuracoes da clinica foram atualizadas.',
      });
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Nao foi possivel salvar as configuracoes.',
        variant: 'destructive',
      });
    },
  });

  const updateField = (path: string, value: any) => {
    setFormData((prev) => {
      const newData = { ...prev };
      const keys = path.split('.');
      let current: any = newData;

      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }

      current[keys[keys.length - 1]] = value;
      return newData;
    });
    setHasChanges(true);
  };

  const handleSave = () => {
    const { id, document, subdomain, status, plan, ...updateData } = formData as TenantSettings;
    saveMutation.mutate(updateData);
  };

  const toggleWorkingDay = (day: number) => {
    const currentDays = formData.settings?.workingDays || [1, 2, 3, 4, 5];
    const newDays = currentDays.includes(day)
      ? currentDays.filter((d) => d !== day)
      : [...currentDays, day].sort();
    updateField('settings.workingDays', newDays);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const tenant = data?.data;
  const settings = formData.settings || tenant?.settings;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/settings">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Dados da Clinica</h1>
            <p className="text-muted-foreground">Configure as informacoes da sua clinica</p>
          </div>
        </div>
        {hasChanges && (
          <Button onClick={handleSave} disabled={saveMutation.isLoading}>
            {saveMutation.isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Salvar Alteracoes
          </Button>
        )}
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">Geral</TabsTrigger>
          <TabsTrigger value="schedule">Agenda</TabsTrigger>
          <TabsTrigger value="billing">Faturamento</TabsTrigger>
          <TabsTrigger value="features">Recursos</TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informacoes Basicas</CardTitle>
              <CardDescription>Dados principais da clinica</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Clinica</Label>
                  <Input
                    id="name"
                    value={formData.name || ''}
                    onChange={(e) => updateField('name', e.target.value)}
                    placeholder="Nome da clinica"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="document">CNPJ</Label>
                  <Input
                    id="document"
                    value={tenant?.document || ''}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={formData.phone || ''}
                    onChange={(e) => updateField('phone', e.target.value)}
                    placeholder="(00) 0000-0000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => updateField('email', e.target.value)}
                    placeholder="contato@clinica.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subdomain">Subdominio</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="subdomain"
                    value={tenant?.subdomain || ''}
                    disabled
                    className="bg-muted"
                  />
                  <span className="text-muted-foreground">.gmsystems.com.br</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Endereco</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="md:col-span-2 space-y-2">
                  <Label>Rua</Label>
                  <Input
                    value={formData.address?.street || ''}
                    onChange={(e) => updateField('address.street', e.target.value)}
                    placeholder="Nome da rua"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Numero</Label>
                  <Input
                    value={formData.address?.number || ''}
                    onChange={(e) => updateField('address.number', e.target.value)}
                    placeholder="123"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Complemento</Label>
                  <Input
                    value={formData.address?.complement || ''}
                    onChange={(e) => updateField('address.complement', e.target.value)}
                    placeholder="Sala 101"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bairro</Label>
                  <Input
                    value={formData.address?.neighborhood || ''}
                    onChange={(e) => updateField('address.neighborhood', e.target.value)}
                    placeholder="Centro"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Cidade</Label>
                  <Input
                    value={formData.address?.city || ''}
                    onChange={(e) => updateField('address.city', e.target.value)}
                    placeholder="Sao Paulo"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Estado</Label>
                  <Input
                    value={formData.address?.state || ''}
                    onChange={(e) => updateField('address.state', e.target.value)}
                    placeholder="SP"
                  />
                </div>
                <div className="space-y-2">
                  <Label>CEP</Label>
                  <Input
                    value={formData.address?.zipCode || ''}
                    onChange={(e) => updateField('address.zipCode', e.target.value)}
                    placeholder="00000-000"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Configuracoes Regionais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Fuso Horario</Label>
                <Select
                  value={settings?.timezone || 'America/Sao_Paulo'}
                  onValueChange={(value) => updateField('settings.timezone', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timezones.map((tz) => (
                      <SelectItem key={tz.value} value={tz.value}>
                        {tz.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Schedule Tab */}
        <TabsContent value="schedule" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                <CardTitle>Horario de Funcionamento</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Abertura</Label>
                  <Input
                    type="time"
                    value={settings?.workingHours?.start || '08:00'}
                    onChange={(e) => updateField('settings.workingHours.start', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fechamento</Label>
                  <Input
                    type="time"
                    value={settings?.workingHours?.end || '18:00'}
                    onChange={(e) => updateField('settings.workingHours.end', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                <CardTitle>Dias de Funcionamento</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {weekDays.map((day) => {
                  const isActive = (settings?.workingDays || [1, 2, 3, 4, 5]).includes(day.value);
                  return (
                    <Badge
                      key={day.value}
                      variant={isActive ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleWorkingDay(day.value)}
                    >
                      {day.label}
                    </Badge>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Configuracoes de Agendamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Duracao Padrao (minutos)</Label>
                  <Input
                    type="number"
                    min={5}
                    max={480}
                    value={settings?.appointmentDuration || 30}
                    onChange={(e) => updateField('settings.appointmentDuration', parseInt(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Duracao padrao das consultas
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Intervalo Entre Consultas (minutos)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={60}
                    value={settings?.appointmentBuffer || 0}
                    onChange={(e) => updateField('settings.appointmentBuffer', parseInt(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Tempo entre consultas
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Lembrete (horas antes)</Label>
                <Input
                  type="number"
                  min={1}
                  max={72}
                  value={settings?.notifications?.appointmentReminder || 24}
                  onChange={(e) => updateField('settings.notifications.appointmentReminder', parseInt(e.target.value))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Confirmacao Obrigatoria</Label>
                  <p className="text-sm text-muted-foreground">
                    Paciente deve confirmar agendamento
                  </p>
                </div>
                <Switch
                  checked={settings?.notifications?.confirmationRequired || false}
                  onCheckedChange={(checked) => updateField('settings.notifications.confirmationRequired', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                <CardTitle>Configuracoes de Faturamento</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Prazo de Pagamento (dias)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={90}
                    value={settings?.billing?.defaultPaymentTerms || 30}
                    onChange={(e) => updateField('settings.billing.defaultPaymentTerms', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Multa por Atraso (%)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={10}
                    step={0.1}
                    value={settings?.billing?.lateFeePercentage || 2}
                    onChange={(e) => updateField('settings.billing.lateFeePercentage', parseFloat(e.target.value))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Prefixo da Fatura</Label>
                <Input
                  value={settings?.billing?.invoicePrefix || 'FAT'}
                  onChange={(e) => updateField('settings.billing.invoicePrefix', e.target.value)}
                  placeholder="FAT"
                  maxLength={10}
                />
                <p className="text-xs text-muted-foreground">
                  Ex: FAT-2024-0001
                </p>
              </div>

              <div className="space-y-2">
                <Label>Observacoes Padrao da Fatura</Label>
                <Textarea
                  value={settings?.billing?.invoiceNotes || ''}
                  onChange={(e) => updateField('settings.billing.invoiceNotes', e.target.value)}
                  placeholder="Observacoes que aparecerao em todas as faturas"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Features Tab */}
        <TabsContent value="features" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recursos Disponiveis</CardTitle>
              <CardDescription>
                Ative ou desative funcionalidades da sua clinica
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Telemedicina</Label>
                  <p className="text-sm text-muted-foreground">
                    Consultas por video chamada
                  </p>
                </div>
                <Switch
                  checked={settings?.features?.telemedicine || false}
                  onCheckedChange={(checked) => updateField('settings.features.telemedicine', checked)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Faturamento</Label>
                  <p className="text-sm text-muted-foreground">
                    Modulo de faturamento e financeiro
                  </p>
                </div>
                <Switch
                  checked={settings?.features?.billing !== false}
                  onCheckedChange={(checked) => updateField('settings.features.billing', checked)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Estoque</Label>
                  <p className="text-sm text-muted-foreground">
                    Controle de estoque e medicamentos
                  </p>
                </div>
                <Switch
                  checked={settings?.features?.inventory !== false}
                  onCheckedChange={(checked) => updateField('settings.features.inventory', checked)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Agendamento Online</Label>
                  <p className="text-sm text-muted-foreground">
                    Pacientes podem agendar pelo portal
                  </p>
                </div>
                <Switch
                  checked={settings?.features?.onlineBooking || false}
                  onCheckedChange={(checked) => updateField('settings.features.onlineBooking', checked)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Multi-unidades</Label>
                  <p className="text-sm text-muted-foreground">
                    Gerenciar multiplas unidades
                  </p>
                </div>
                <Switch
                  checked={settings?.features?.multiLocation || false}
                  onCheckedChange={(checked) => updateField('settings.features.multiLocation', checked)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Plano Atual</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{tenant?.plan.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Para alterar o plano, entre em contato com o suporte
                  </p>
                </div>
                <Badge variant="secondary">{tenant?.status}</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
