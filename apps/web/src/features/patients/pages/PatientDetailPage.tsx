import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Phone, Mail, MapPin, Calendar, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import api from '@/services/api';
import { formatDate, calculateAge } from '@healthflow/utils';

export function PatientDetailPage() {
  const { id } = useParams();

  const { data: patient, isLoading } = useQuery({
    queryKey: ['patient', id],
    queryFn: async () => {
      const response = await api.get(`/patients/${id}`);
      return response.data.data;
    },
  });

  const { data: history } = useQuery({
    queryKey: ['patient-history', id],
    queryFn: async () => {
      const response = await api.get(`/patients/${id}/history`);
      return response.data.data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Carregando...
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground mb-4">Paciente nao encontrado</p>
        <Link to="/patients">
          <Button variant="outline">Voltar</Button>
        </Link>
      </div>
    );
  }

  const genderLabels: Record<string, string> = {
    MALE: 'Masculino',
    FEMALE: 'Feminino',
    OTHER: 'Outro',
    PREFER_NOT_TO_SAY: 'Prefere nao informar',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/patients">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{patient.fullName}</h1>
          <p className="text-muted-foreground">
            {calculateAge(patient.birthDate)} anos - {genderLabels[patient.gender]}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Patient Info */}
        <Card>
          <CardHeader>
            <CardTitle>Informacoes do Paciente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Data de Nascimento</p>
                <p>{formatDate(patient.birthDate)}</p>
              </div>
            </div>

            {patient.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Telefone</p>
                  <p>{patient.phone}</p>
                </div>
              </div>
            )}

            {patient.email && (
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p>{patient.email}</p>
                </div>
              </div>
            )}

            {patient.address && (
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Endereco</p>
                  <p>
                    {patient.address.street}, {patient.address.number}
                    {patient.address.complement && ` - ${patient.address.complement}`}
                  </p>
                  <p>
                    {patient.address.neighborhood}, {patient.address.city} - {patient.address.state}
                  </p>
                </div>
              </div>
            )}

            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground">Convenio</p>
              <p className="font-medium">{patient.healthPlan || 'Particular'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Resumo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-muted rounded-lg text-center">
                <p className="text-2xl font-bold">{patient._count?.appointments || 0}</p>
                <p className="text-sm text-muted-foreground">Consultas</p>
              </div>
              <div className="p-4 bg-muted rounded-lg text-center">
                <p className="text-2xl font-bold">{patient._count?.medicalRecords || 0}</p>
                <p className="text-sm text-muted-foreground">Prontuarios</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Appointments */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Consultas Recentes
          </CardTitle>
          <Button variant="outline" size="sm">
            Nova Consulta
          </Button>
        </CardHeader>
        <CardContent>
          {history?.appointments?.length > 0 ? (
            <div className="space-y-2">
              {history.appointments.slice(0, 5).map((apt: { id: string; startTime: string; type: string; status: string; professional: { name: string } }) => (
                <div key={apt.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{formatDate(apt.startTime, 'dd/MM/yyyy HH:mm')}</p>
                    <p className="text-sm text-muted-foreground">
                      Dr(a). {apt.professional.name}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    apt.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                    apt.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-700' :
                    apt.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {apt.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-4 text-muted-foreground">
              Nenhuma consulta registrada
            </p>
          )}
        </CardContent>
      </Card>

      {/* Recent Medical Records */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Prontuarios Recentes
          </CardTitle>
          <Button variant="outline" size="sm">
            Novo Registro
          </Button>
        </CardHeader>
        <CardContent>
          {history?.medicalRecords?.length > 0 ? (
            <div className="space-y-2">
              {history.medicalRecords.slice(0, 5).map((record: { id: string; createdAt: string; type: string; professional: { name: string } }) => (
                <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{formatDate(record.createdAt, 'dd/MM/yyyy HH:mm')}</p>
                    <p className="text-sm text-muted-foreground">
                      Dr(a). {record.professional.name}
                    </p>
                  </div>
                  <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                    {record.type}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-4 text-muted-foreground">
              Nenhum prontuario registrado
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
