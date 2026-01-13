import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import api from '@/services/api';
import { formatDate, calculateAge } from '@healthflow/utils';

interface Patient {
  id: string;
  fullName: string;
  document: string;
  birthDate: string;
  gender: string;
  phone?: string;
  email?: string;
  healthPlan?: string;
  _count: {
    appointments: number;
    medicalRecords: number;
  };
}

export function PatientsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;

  const { data, isLoading } = useQuery({
    queryKey: ['patients', page, search],
    queryFn: async () => {
      const response = await api.get('/patients', {
        params: { page, perPage, search: search || undefined },
      });
      return response.data;
    },
  });

  const patients = data?.data || [];
  const meta = data?.meta || { total: 0, totalPages: 0 };

  const genderLabels: Record<string, string> = {
    MALE: 'Masculino',
    FEMALE: 'Feminino',
    OTHER: 'Outro',
    PREFER_NOT_TO_SAY: 'Prefere nao informar',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Pacientes</h1>
          <p className="text-muted-foreground">
            Gerencie os pacientes cadastrados
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Novo Paciente
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, email ou telefone..."
              className="pl-10"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Patients List */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Pacientes ({meta.total})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando...
            </div>
          ) : patients.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum paciente encontrado
            </div>
          ) : (
            <div className="space-y-4">
              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-3 font-medium">Nome</th>
                      <th className="pb-3 font-medium hidden md:table-cell">Idade/Sexo</th>
                      <th className="pb-3 font-medium hidden lg:table-cell">Contato</th>
                      <th className="pb-3 font-medium hidden xl:table-cell">Convenio</th>
                      <th className="pb-3 font-medium text-right">Acoes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patients.map((patient: Patient) => (
                      <tr key={patient.id} className="border-b last:border-0">
                        <td className="py-4">
                          <div className="font-medium">{patient.fullName}</div>
                          <div className="text-sm text-muted-foreground md:hidden">
                            {calculateAge(patient.birthDate)} anos - {genderLabels[patient.gender]}
                          </div>
                        </td>
                        <td className="py-4 hidden md:table-cell">
                          <div>{calculateAge(patient.birthDate)} anos</div>
                          <div className="text-sm text-muted-foreground">
                            {genderLabels[patient.gender]}
                          </div>
                        </td>
                        <td className="py-4 hidden lg:table-cell">
                          <div>{patient.phone || '-'}</div>
                          <div className="text-sm text-muted-foreground">
                            {patient.email || '-'}
                          </div>
                        </td>
                        <td className="py-4 hidden xl:table-cell">
                          {patient.healthPlan || 'Particular'}
                        </td>
                        <td className="py-4 text-right">
                          <Link to={`/patients/${patient.id}`}>
                            <Button variant="outline" size="sm">
                              Ver
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

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
