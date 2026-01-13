import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Plug,
  MessageCircle,
  Mail,
  CreditCard,
  Calendar,
  FileText,
  Loader2,
  ExternalLink,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';

interface Integration {
  id: string;
  name: string;
  description: string;
  status: string;
  icon: string;
}

const iconMap: Record<string, React.ElementType> = {
  'message-circle': MessageCircle,
  mail: Mail,
  'credit-card': CreditCard,
  calendar: Calendar,
  'file-text': FileText,
};

export function IntegrationsSettingsPage() {
  const { data, isLoading } = useQuery<{ success: boolean; data: Integration[] }>({
    queryKey: ['integrations'],
    queryFn: async () => {
      const response = await api.get('/settings/integrations');
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

  const integrations = data?.data || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'configured':
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle className="h-3 w-3 mr-1" />
            Configurado
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Erro
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            Nao configurado
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/settings">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Integracoes</h1>
          <p className="text-muted-foreground">Conecte servicos externos a sua clinica</p>
        </div>
      </div>

      {/* Integrations Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {integrations.map((integration) => {
          const Icon = iconMap[integration.icon] || Plug;
          return (
            <Card key={integration.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{integration.name}</CardTitle>
                      <CardDescription>{integration.description}</CardDescription>
                    </div>
                  </div>
                  {getStatusBadge(integration.status)}
                </div>
              </CardHeader>
              <CardContent>
                <Button
                  variant={integration.status === 'configured' ? 'outline' : 'default'}
                  className="w-full"
                >
                  {integration.status === 'configured' ? 'Gerenciar' : 'Configurar'}
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Coming Soon */}
      <Card>
        <CardHeader>
          <CardTitle>Em Breve</CardTitle>
          <CardDescription>Novas integracoes em desenvolvimento</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <MessageCircle className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">Telegram</p>
                  <p className="text-sm text-muted-foreground">Notificacoes via Telegram</p>
                </div>
              </div>
              <Badge variant="outline">Em breve</Badge>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">HL7 FHIR</p>
                  <p className="text-sm text-muted-foreground">Integracao com laboratorios</p>
                </div>
              </div>
              <Badge variant="outline">Em breve</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Help */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <Plug className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium">Precisa de uma integracao especifica?</p>
              <p className="text-sm text-muted-foreground">
                Entre em contato com nosso suporte para solicitar novas integracoes
                ou integracao personalizada via API.
              </p>
              <Button variant="link" className="p-0 h-auto mt-2">
                Ver documentacao da API
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
