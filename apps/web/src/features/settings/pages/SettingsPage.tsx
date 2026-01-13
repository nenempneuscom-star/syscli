import { Link, Outlet, useLocation } from 'react-router-dom';
import {
  User,
  Building,
  Bell,
  Shield,
  Users,
  Plug,
  FileDown,
  Activity,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/features/auth/store/auth-store';

const settingsNav = [
  {
    title: 'Conta',
    items: [
      {
        name: 'Meu Perfil',
        href: '/settings/profile',
        icon: User,
        description: 'Informacoes pessoais e preferencias',
      },
      {
        name: 'Seguranca',
        href: '/settings/security',
        icon: Shield,
        description: 'Senha e autenticacao de dois fatores',
      },
      {
        name: 'Notificacoes',
        href: '/settings/notifications',
        icon: Bell,
        description: 'Preferencias de email, SMS e push',
      },
    ],
  },
  {
    title: 'Clinica',
    adminOnly: true,
    items: [
      {
        name: 'Dados da Clinica',
        href: '/settings/clinic',
        icon: Building,
        description: 'Informacoes e configuracoes da clinica',
      },
      {
        name: 'Equipe',
        href: '/settings/team',
        icon: Users,
        description: 'Gerenciar usuarios e permissoes',
      },
      {
        name: 'Integracoes',
        href: '/settings/integrations',
        icon: Plug,
        description: 'Conectar servicos externos',
      },
    ],
  },
  {
    title: 'Sistema',
    adminOnly: true,
    items: [
      {
        name: 'Uso do Sistema',
        href: '/settings/system',
        icon: Activity,
        description: 'Estatisticas e limites do plano',
      },
      {
        name: 'Exportar Dados',
        href: '/settings/export',
        icon: FileDown,
        description: 'Backup e exportacao de dados',
      },
    ],
  },
];

export function SettingsPage() {
  const location = useLocation();
  const { user } = useAuthStore();

  const isAdmin = user?.role === 'TENANT_ADMIN' || user?.role === 'SUPER_ADMIN';
  const isSettingsRoot = location.pathname === '/settings';

  // Filter nav items based on user role
  const filteredNav = settingsNav
    .filter((section) => !section.adminOnly || isAdmin)
    .map((section) => ({
      ...section,
      items: section.items.filter(() => true),
    }));

  if (!isSettingsRoot) {
    return <Outlet />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configuracoes</h1>
        <p className="text-muted-foreground">Gerencie sua conta e preferencias</p>
      </div>

      <div className="space-y-8">
        {filteredNav.map((section) => (
          <div key={section.title}>
            <h2 className="text-lg font-semibold mb-4">{section.title}</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {section.items.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      'flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-accent transition-colors',
                      isActive && 'border-primary bg-primary/5'
                    )}
                  >
                    <div className="p-2 rounded-lg bg-primary/10">
                      <item.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">{item.name}</h3>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {item.description}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
