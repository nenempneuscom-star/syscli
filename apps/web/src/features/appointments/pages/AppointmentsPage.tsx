import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import api from '@/services/api';
import { format, addDays, startOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Appointment {
  id: string;
  startTime: string;
  endTime: string;
  type: string;
  status: string;
  patient: {
    id: string;
    fullName: string;
    phone?: string;
  };
  professional: {
    id: string;
    name: string;
  };
  room?: {
    id: string;
    name: string;
  };
}

export function AppointmentsPage() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const { data: appointments, isLoading } = useQuery({
    queryKey: ['appointments', format(currentDate, 'yyyy-MM-dd')],
    queryFn: async () => {
      const response = await api.get('/appointments', {
        params: {
          startDate: format(currentDate, 'yyyy-MM-dd'),
          endDate: format(currentDate, 'yyyy-MM-dd'),
          perPage: 100,
        },
      });
      return response.data.data || [];
    },
  });

  const statusLabels: Record<string, { label: string; color: string }> = {
    SCHEDULED: { label: 'Agendado', color: 'bg-blue-100 text-blue-700' },
    CONFIRMED: { label: 'Confirmado', color: 'bg-green-100 text-green-700' },
    WAITING: { label: 'Aguardando', color: 'bg-yellow-100 text-yellow-700' },
    IN_PROGRESS: { label: 'Em Atendimento', color: 'bg-purple-100 text-purple-700' },
    COMPLETED: { label: 'Concluido', color: 'bg-gray-100 text-gray-700' },
    CANCELLED: { label: 'Cancelado', color: 'bg-red-100 text-red-700' },
    NO_SHOW: { label: 'Faltou', color: 'bg-orange-100 text-orange-700' },
  };

  const typeLabels: Record<string, string> = {
    CONSULTATION: 'Consulta',
    RETURN: 'Retorno',
    PROCEDURE: 'Procedimento',
    EXAM: 'Exame',
    TELEMEDICINE: 'Telemedicina',
  };

  const goToPrevDay = () => setCurrentDate(addDays(currentDate, -1));
  const goToNextDay = () => setCurrentDate(addDays(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Agenda</h1>
          <p className="text-muted-foreground">
            Gerencie os agendamentos
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Novo Agendamento
        </Button>
      </div>

      {/* Date Navigation */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <Button variant="outline" size="icon" onClick={goToPrevDay}>
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="text-center">
              <p className="text-lg font-semibold">
                {format(currentDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
              <Button variant="link" size="sm" onClick={goToToday}>
                Ir para hoje
              </Button>
            </div>

            <Button variant="outline" size="icon" onClick={goToNextDay}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Appointments List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Agendamentos do Dia ({appointments?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando...
            </div>
          ) : appointments?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum agendamento para este dia
            </div>
          ) : (
            <div className="space-y-3">
              {appointments?.map((apt: Appointment) => (
                <div
                  key={apt.id}
                  className="flex flex-col md:flex-row md:items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  {/* Time */}
                  <div className="md:w-24 text-center md:text-left">
                    <p className="font-semibold text-lg">
                      {format(new Date(apt.startTime), 'HH:mm')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(apt.endTime), 'HH:mm')}
                    </p>
                  </div>

                  {/* Patient Info */}
                  <div className="flex-1">
                    <p className="font-medium">{apt.patient.fullName}</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <span className="text-sm text-muted-foreground">
                        {typeLabels[apt.type] || apt.type}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        • Dr(a). {apt.professional.name}
                      </span>
                      {apt.room && (
                        <span className="text-sm text-muted-foreground">
                          • Sala {apt.room.name}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status */}
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 text-xs font-medium rounded-full ${
                        statusLabels[apt.status]?.color || 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {statusLabels[apt.status]?.label || apt.status}
                    </span>
                    <Button variant="outline" size="sm">
                      Detalhes
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
