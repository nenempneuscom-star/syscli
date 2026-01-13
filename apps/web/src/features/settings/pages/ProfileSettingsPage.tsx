import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowLeft, User, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { useAuthStore } from '@/features/auth/store/auth-store';

interface Profile {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  avatar: string | null;
  role: string;
  professionalId: string | null;
  specialties: string[];
  mfaEnabled: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  tenant: {
    id: string;
    name: string;
    subdomain: string;
  };
}

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  TENANT_ADMIN: 'Administrador',
  DOCTOR: 'Medico',
  NURSE: 'Enfermeiro(a)',
  RECEPTIONIST: 'Recepcionista',
  BILLING_ADMIN: 'Financeiro',
};

export function ProfileSettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { setUser } = useAuthStore();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    professionalId: '',
    specialties: '',
  });

  const { data: profileData, isLoading } = useQuery<{ success: boolean; data: Profile }>({
    queryKey: ['settings-profile'],
    queryFn: async () => {
      const response = await api.get('/settings/profile');
      return response.data;
    },
    onSuccess: (data) => {
      if (data.data) {
        setFormData({
          name: data.data.name || '',
          phone: data.data.phone || '',
          professionalId: data.data.professionalId || '',
          specialties: data.data.specialties?.join(', ') || '',
        });
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.patch('/settings/profile', data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['settings-profile'] });
      // Update auth store with new user data
      if (data.data) {
        setUser(data.data);
      }
      toast({
        title: 'Perfil atualizado',
        description: 'Suas informacoes foram salvas com sucesso.',
      });
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Nao foi possivel atualizar o perfil.',
        variant: 'destructive',
      });
    },
  });

  const profile = profileData?.data;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const specialtiesArray = formData.specialties
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    updateMutation.mutate({
      name: formData.name,
      phone: formData.phone || null,
      professionalId: formData.professionalId || null,
      specialties: specialtiesArray.length > 0 ? specialtiesArray : undefined,
    });
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
      <div className="flex items-center gap-4">
        <Link to="/settings">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Meu Perfil</h1>
          <p className="text-muted-foreground">Gerencie suas informacoes pessoais</p>
        </div>
      </div>

      {/* Profile Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              {profile?.avatar ? (
                <img
                  src={profile.avatar}
                  alt={profile.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <User className="h-8 w-8 text-primary" />
              )}
            </div>
            <div>
              <CardTitle>{profile?.name}</CardTitle>
              <CardDescription>{profile?.email}</CardDescription>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary">{roleLabels[profile?.role || ''] || profile?.role}</Badge>
                {profile?.mfaEnabled && <Badge variant="outline">MFA Ativo</Badge>}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Edit Form */}
      <Card>
        <CardHeader>
          <CardTitle>Informacoes Pessoais</CardTitle>
          <CardDescription>Atualize seus dados de contato e profissionais</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={profile?.email || ''}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                O email nao pode ser alterado. Entre em contato com o administrador.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Seu nome completo"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(00) 00000-0000"
              />
            </div>

            {(profile?.role === 'DOCTOR' || profile?.role === 'NURSE') && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="professionalId">Registro Profissional (CRM/COREN)</Label>
                  <Input
                    id="professionalId"
                    value={formData.professionalId}
                    onChange={(e) => setFormData({ ...formData, professionalId: e.target.value })}
                    placeholder="CRM/COREN"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="specialties">Especialidades</Label>
                  <Input
                    id="specialties"
                    value={formData.specialties}
                    onChange={(e) => setFormData({ ...formData, specialties: e.target.value })}
                    placeholder="Cardiologia, Clinica Geral (separado por virgula)"
                  />
                  <p className="text-xs text-muted-foreground">
                    Separe multiplas especialidades por virgula
                  </p>
                </div>
              </>
            )}

            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar Alteracoes
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle>Informacoes da Conta</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Clinica</span>
              <span className="font-medium">{profile?.tenant.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cargo</span>
              <span className="font-medium">{roleLabels[profile?.role || ''] || profile?.role}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ultimo acesso</span>
              <span className="font-medium">
                {profile?.lastLoginAt
                  ? new Date(profile.lastLoginAt).toLocaleString('pt-BR')
                  : 'Nunca'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Conta criada em</span>
              <span className="font-medium">
                {profile?.createdAt
                  ? new Date(profile.createdAt).toLocaleDateString('pt-BR')
                  : '-'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
