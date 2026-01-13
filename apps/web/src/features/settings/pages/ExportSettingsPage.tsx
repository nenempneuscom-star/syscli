import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  FileDown,
  Download,
  Users,
  Calendar,
  FileText,
  Loader2,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

type ExportType = 'full' | 'patients' | 'appointments' | 'medical-records';

interface ExportOption {
  id: ExportType;
  name: string;
  description: string;
  icon: React.ElementType;
}

const exportOptions: ExportOption[] = [
  {
    id: 'full',
    name: 'Exportacao Completa',
    description: 'Todos os dados da clinica (pacientes, consultas, prontuarios, faturas)',
    icon: Download,
  },
  {
    id: 'patients',
    name: 'Pacientes',
    description: 'Dados cadastrais de todos os pacientes',
    icon: Users,
  },
  {
    id: 'appointments',
    name: 'Agendamentos',
    description: 'Historico de consultas e agendamentos',
    icon: Calendar,
  },
  {
    id: 'medical-records',
    name: 'Prontuarios',
    description: 'Todos os registros medicos',
    icon: FileText,
  },
];

export function ExportSettingsPage() {
  const { toast } = useToast();
  const [selectedType, setSelectedType] = useState<ExportType>('full');
  const [exportRequested, setExportRequested] = useState(false);

  const exportMutation = useMutation({
    mutationFn: async (type: ExportType) => {
      const response = await api.post('/settings/export', { type });
      return response.data;
    },
    onSuccess: () => {
      setExportRequested(true);
      toast({
        title: 'Exportacao solicitada',
        description: 'Voce recebera um email quando a exportacao estiver pronta.',
      });
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Nao foi possivel solicitar a exportacao.',
        variant: 'destructive',
      });
    },
  });

  const handleExport = () => {
    exportMutation.mutate(selectedType);
  };

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
          <h1 className="text-3xl font-bold">Exportar Dados</h1>
          <p className="text-muted-foreground">Faca backup ou exporte seus dados</p>
        </div>
      </div>

      {/* LGPD Notice */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Conformidade LGPD</AlertTitle>
        <AlertDescription>
          A exportacao de dados esta de acordo com a Lei Geral de Protecao de Dados.
          Os dados exportados sao de sua responsabilidade.
        </AlertDescription>
      </Alert>

      {exportRequested ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium">Exportacao Solicitada</h3>
                <p className="text-muted-foreground">
                  Estamos processando sua solicitacao. Voce recebera um email
                  com o link para download quando a exportacao estiver pronta.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Tempo estimado: 15-30 minutos
                </p>
              </div>
              <Button variant="outline" onClick={() => setExportRequested(false)}>
                Solicitar Nova Exportacao
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Export Options */}
          <Card>
            <CardHeader>
              <CardTitle>Tipo de Exportacao</CardTitle>
              <CardDescription>
                Selecione quais dados deseja exportar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={selectedType}
                onValueChange={(value) => setSelectedType(value as ExportType)}
                className="space-y-4"
              >
                {exportOptions.map((option) => (
                  <div
                    key={option.id}
                    className={`flex items-start space-x-4 p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedType === option.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedType(option.id)}
                  >
                    <RadioGroupItem value={option.id} id={option.id} className="mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <option.icon className="h-5 w-5 text-primary" />
                        <Label htmlFor={option.id} className="font-medium cursor-pointer">
                          {option.name}
                        </Label>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {option.description}
                      </p>
                    </div>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Export Format */}
          <Card>
            <CardHeader>
              <CardTitle>Formato</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Os dados serao exportados nos seguintes formatos:
                </p>
                <ul className="text-sm space-y-1">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    CSV (planilha)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    JSON (dados estruturados)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    PDF (relatorios formatados)
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Export Button */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Pronto para exportar?</p>
                  <p className="text-sm text-muted-foreground">
                    O processo pode levar alguns minutos dependendo da quantidade de dados.
                  </p>
                </div>
                <Button onClick={handleExport} disabled={exportMutation.isLoading}>
                  {exportMutation.isLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <FileDown className="h-4 w-4 mr-2" />
                  )}
                  Iniciar Exportacao
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Data Retention Notice */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <FileDown className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm text-muted-foreground">
                O link de download ficara disponivel por 7 dias apos a geracao.
                Recomendamos armazenar os dados exportados em local seguro.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
