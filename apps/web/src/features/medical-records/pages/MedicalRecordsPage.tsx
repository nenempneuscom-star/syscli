import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Search, FileText, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import api from '@/services/api';
import { formatDateTime } from '@healthflow/utils';

interface MedicalRecord {
  id: string;
  type: string;
  createdAt: string;
  content: Record<string, unknown>;
  icdCodes: string[];
  signature?: string;
  patient: {
    id: string;
    fullName: string;
    birthDate: string;
    gender: string;
  };
  professional: {
    id: string;
    name: string;
    professionalId: string;
  };
}

const recordTypeLabels: Record<string, { label: string; color: string }> = {
  ANAMNESIS: { label: 'Anamnese', color: 'bg-blue-100 text-blue-700' },
  EVOLUTION: { label: 'Evolucao', color: 'bg-green-100 text-green-700' },
  PRESCRIPTION: { label: 'Prescricao', color: 'bg-purple-100 text-purple-700' },
  EXAM_REQUEST: { label: 'Solicitacao de Exame', color: 'bg-orange-100 text-orange-700' },
  CERTIFICATE: { label: 'Atestado', color: 'bg-yellow-100 text-yellow-700' },
  REFERRAL: { label: 'Encaminhamento', color: 'bg-pink-100 text-pink-700' },
};

export function MedicalRecordsPage() {
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<string>('');
  const perPage = 15;

  const { data, isLoading } = useQuery({
    queryKey: ['medical-records', page, typeFilter],
    queryFn: async () => {
      const params: Record<string, unknown> = { page, perPage };
      if (typeFilter) params.type = typeFilter;
      const response = await api.get('/medical-records', { params });
      return response.data;
    },
  });

  const records = data?.data || [];
  const meta = data?.meta || { total: 0, totalPages: 0 };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Prontuarios</h1>
          <p className="text-muted-foreground">
            Gerencie os prontuarios dos pacientes
          </p>
        </div>
        <Link to="/medical-records/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Novo Prontuario
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por paciente..."
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <select
                className="px-3 py-2 border rounded-md text-sm"
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">Todos os tipos</option>
                <option value="ANAMNESIS">Anamnese</option>
                <option value="EVOLUTION">Evolucao</option>
                <option value="PRESCRIPTION">Prescricao</option>
                <option value="EXAM_REQUEST">Solicitacao de Exame</option>
                <option value="CERTIFICATE">Atestado</option>
                <option value="REFERRAL">Encaminhamento</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Records List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Registros ({meta.total})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando...
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum prontuario encontrado
            </div>
          ) : (
            <div className="space-y-3">
              {records.map((record: MedicalRecord) => (
                <Link
                  key={record.id}
                  to={`/medical-records/${record.id}`}
                  className="block p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          recordTypeLabels[record.type]?.color || 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {recordTypeLabels[record.type]?.label || record.type}
                      </div>
                      <div>
                        <p className="font-medium">{record.patient.fullName}</p>
                        <p className="text-sm text-muted-foreground">
                          Dr(a). {record.professional.name} - {record.professional.professionalId}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{formatDateTime(record.createdAt)}</span>
                      {record.signature && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                          Assinado
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}

              {/* Pagination */}
              {meta.totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-muted-foreground">
                    Pagina {page} de {meta.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 1}
                      onClick={() => setPage(page - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === meta.totalPages}
                      onClick={() => setPage(page + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
