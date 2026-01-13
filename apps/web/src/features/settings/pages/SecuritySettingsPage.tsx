import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Shield,
  Key,
  Smartphone,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

interface Profile {
  mfaEnabled: boolean;
}

export function SecuritySettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showMFADialog, setShowMFADialog] = useState(false);
  const [showDisableMFADialog, setShowDisableMFADialog] = useState(false);
  const [mfaSecret, setMfaSecret] = useState('');
  const [disableMFAPassword, setDisableMFAPassword] = useState('');

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const { data: profileData, isLoading } = useQuery<{ success: boolean; data: Profile }>({
    queryKey: ['settings-profile'],
    queryFn: async () => {
      const response = await api.get('/settings/profile');
      return response.data;
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const response = await api.post('/settings/profile/change-password', data);
      return response.data;
    },
    onSuccess: () => {
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast({
        title: 'Senha alterada',
        description: 'Sua senha foi alterada com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.response?.data?.error?.message || 'Nao foi possivel alterar a senha.',
        variant: 'destructive',
      });
    },
  });

  const enableMFAMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/settings/security/mfa/enable');
      return response.data;
    },
    onSuccess: (data) => {
      setMfaSecret(data.secret);
      setShowMFADialog(true);
      queryClient.invalidateQueries({ queryKey: ['settings-profile'] });
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Nao foi possivel ativar o MFA.',
        variant: 'destructive',
      });
    },
  });

  const disableMFAMutation = useMutation({
    mutationFn: async (password: string) => {
      const response = await api.post('/settings/security/mfa/disable', { password });
      return response.data;
    },
    onSuccess: () => {
      setShowDisableMFADialog(false);
      setDisableMFAPassword('');
      queryClient.invalidateQueries({ queryKey: ['settings-profile'] });
      toast({
        title: 'MFA desativado',
        description: 'A autenticacao de dois fatores foi desativada.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.response?.data?.error?.message || 'Senha incorreta.',
        variant: 'destructive',
      });
    },
  });

  const profile = profileData?.data;

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: 'Erro',
        description: 'As senhas nao coincidem.',
        variant: 'destructive',
      });
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      toast({
        title: 'Erro',
        description: 'A nova senha deve ter pelo menos 8 caracteres.',
        variant: 'destructive',
      });
      return;
    }

    changePasswordMutation.mutate({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    });
  };

  const getPasswordStrength = (password: string) => {
    if (password.length === 0) return { label: '', color: '' };
    if (password.length < 8) return { label: 'Muito fraca', color: 'bg-red-500' };
    if (password.length < 10) return { label: 'Fraca', color: 'bg-orange-500' };

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const strength = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecial].filter(Boolean).length;

    if (strength < 2) return { label: 'Fraca', color: 'bg-orange-500' };
    if (strength < 3) return { label: 'Media', color: 'bg-yellow-500' };
    if (strength < 4) return { label: 'Forte', color: 'bg-green-500' };
    return { label: 'Muito forte', color: 'bg-emerald-500' };
  };

  const passwordStrength = getPasswordStrength(passwordForm.newPassword);

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
          <h1 className="text-3xl font-bold">Seguranca</h1>
          <p className="text-muted-foreground">Gerencie sua senha e autenticacao</p>
        </div>
      </div>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            <CardTitle>Alterar Senha</CardTitle>
          </div>
          <CardDescription>
            Escolha uma senha forte com pelo menos 8 caracteres
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Senha Atual</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">Nova Senha</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {passwordForm.newPassword && (
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1 bg-muted rounded overflow-hidden">
                    <div className={`h-full ${passwordStrength.color}`} style={{ width: `${Math.min(passwordForm.newPassword.length * 10, 100)}%` }} />
                  </div>
                  <span className="text-xs text-muted-foreground">{passwordStrength.label}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword && (
                <p className="text-xs text-red-500">As senhas nao coincidem</p>
              )}
            </div>

            <Button type="submit" disabled={changePasswordMutation.isPending}>
              {changePasswordMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Alterar Senha
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Two-Factor Authentication */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              <CardTitle>Autenticacao de Dois Fatores (MFA)</CardTitle>
            </div>
            <Badge variant={profile?.mfaEnabled ? 'default' : 'secondary'}>
              {profile?.mfaEnabled ? 'Ativo' : 'Inativo'}
            </Badge>
          </div>
          <CardDescription>
            Adicione uma camada extra de seguranca a sua conta
          </CardDescription>
        </CardHeader>
        <CardContent>
          {profile?.mfaEnabled ? (
            <div className="space-y-4">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>MFA Ativo</AlertTitle>
                <AlertDescription>
                  Sua conta esta protegida com autenticacao de dois fatores.
                </AlertDescription>
              </Alert>
              <Button
                variant="destructive"
                onClick={() => setShowDisableMFADialog(true)}
              >
                Desativar MFA
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>MFA Inativo</AlertTitle>
                <AlertDescription>
                  Recomendamos ativar o MFA para maior seguranca da sua conta.
                </AlertDescription>
              </Alert>
              <Button onClick={() => enableMFAMutation.mutate()}>
                {enableMFAMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <Shield className="h-4 w-4 mr-2" />
                Ativar MFA
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Dicas de Seguranca</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 mt-0.5 text-green-500" />
              Use senhas unicas para cada servico
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 mt-0.5 text-green-500" />
              Ative a autenticacao de dois fatores
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 mt-0.5 text-green-500" />
              Nunca compartilhe suas credenciais
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 mt-0.5 text-green-500" />
              Altere sua senha periodicamente
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 mt-0.5 text-green-500" />
              Desconfie de emails solicitando dados pessoais
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* MFA Setup Dialog */}
      <Dialog open={showMFADialog} onOpenChange={setShowMFADialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>MFA Ativado</DialogTitle>
            <DialogDescription>
              Configure seu aplicativo de autenticacao
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertTitle>Importante!</AlertTitle>
              <AlertDescription>
                Guarde este codigo em um local seguro. Voce precisara dele para acessar sua conta.
              </AlertDescription>
            </Alert>
            <div className="p-4 bg-muted rounded-lg text-center">
              <p className="text-xs text-muted-foreground mb-2">Seu codigo secreto:</p>
              <code className="text-lg font-mono">{mfaSecret}</code>
            </div>
            <p className="text-sm text-muted-foreground">
              Adicione este codigo no seu aplicativo de autenticacao (Google Authenticator, Authy, etc.)
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowMFADialog(false)}>
              Entendi, codigo salvo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disable MFA Dialog */}
      <Dialog open={showDisableMFADialog} onOpenChange={setShowDisableMFADialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Desativar MFA</DialogTitle>
            <DialogDescription>
              Digite sua senha para confirmar a desativacao
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Atencao!</AlertTitle>
              <AlertDescription>
                Desativar o MFA reduzira a seguranca da sua conta.
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <Label htmlFor="disablePassword">Senha</Label>
              <Input
                id="disablePassword"
                type="password"
                value={disableMFAPassword}
                onChange={(e) => setDisableMFAPassword(e.target.value)}
                placeholder="Digite sua senha"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDisableMFADialog(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => disableMFAMutation.mutate(disableMFAPassword)}
              disabled={!disableMFAPassword || disableMFAMutation.isPending}
            >
              {disableMFAMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Desativar MFA
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
