import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeft, Save, Loader2, Search, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import api from '@/services/api';
import { calculateAge, formatDate } from '@healthflow/utils';

// Form Components
import { AnamnesisForm } from '../components/AnamnesisForm';
import { EvolutionForm } from '../components/EvolutionForm';
import { PrescriptionForm } from '../components/PrescriptionForm';
import { ExamRequestForm } from '../components/ExamRequestForm';
import { CertificateForm } from '../components/CertificateForm';

interface Patient {
  id: string;
  fullName: string;
  birthDate: string;
  gender: string;
  allergies?: string[];
  bloodType?: string;
}

const recordTypes = [
  { value: 'ANAMNESIS', label: 'Anamnese', description: 'Avaliacao completa do historico do paciente' },
  { value: 'EVOLUTION', label: 'Evolucao', description: 'Registro de evolucao clinica (SOAP)' },
  { value: 'PRESCRIPTION', label: 'Prescricao', description: 'Prescricao de medicamentos' },
  { value: 'EXAM_REQUEST', label: 'Solicitacao de Exames', description: 'Solicitacao de exames laboratoriais ou imagem' },
  { value: 'CERTIFICATE', label: 'Atestado', description: 'Atestado medico ou declaracao' },
  { value: 'REFERRAL', label: 'Encaminhamento', description: 'Encaminhamento para especialista' },
];

const genderLabels: Record<string, string> = {
  MALE: 'Masculino',
  FEMALE: 'Feminino',
  OTHER: 'Outro',
};

export function NewMedicalRecordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedPatientId = searchParams.get('patientId');
  const preselectedAppointmentId = searchParams.get('appointmentId');

  const [step, setStep] = useState<'patient' | 'type' | 'form'>(preselectedPatientId ? 'type' : 'patient');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedType, setSelectedType] = useState<string>('');
  const [patientSearch, setPatientSearch] = useState('');
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [icdCodes, setIcdCodes] = useState<string[]>([]);

  // Fetch patient if preselected
  const { data: preselectedPatient } = useQuery({
    queryKey: ['patient', preselectedPatientId],
    queryFn: async () => {
      const response = await api.get(`/patients/${preselectedPatientId}`);
      return response.data.data;
    },
    enabled: !!preselectedPatientId,
    onSuccess: (data) => {
      setSelectedPatient(data);
    },
  });

  // Search patients
  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ['patients-search', patientSearch],
    queryFn: async () => {
      const response = await api.get('/patients', {
        params: { search: patientSearch, perPage: 10 },
      });
      return response.data.data;
    },
    enabled: patientSearch.length >= 2,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const response = await api.post('/medical-records', data);
      return response.data.data;
    },
    onSuccess: (data) => {
      toast({
        title: 'Prontuario criado',
        description: 'O prontuario foi registrado com sucesso.',
      });
      navigate(`/medical-records/${data.id}`);
    },
    onError: (error: { response?: { data?: { error?: { message?: string } } } }) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao criar prontuario',
        description: error.response?.data?.error?.message || 'Tente novamente.',
      });
    },
  });

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setStep('type');
  };

  const handleSelectType = (type: string) => {
    setSelectedType(type);
    setStep('form');
  };

  const handleSubmit = () => {
    if (!selectedPatient || !selectedType) return;

    createMutation.mutate({
      patientId: selectedPatient.id,
      appointmentId: preselectedAppointmentId || undefined,
      type: selectedType,
      content: formData,
      icdCodes,
    });
  };

  const renderFormByType = () => {
    const props = {
      data: formData,
      onChange: setFormData,
      icdCodes,
      onIcdCodesChange: setIcdCodes,
    };

    switch (selectedType) {
      case 'ANAMNESIS':
        return <AnamnesisForm {...props} />;
      case 'EVOLUTION':
        return <EvolutionForm {...props} />;
      case 'PRESCRIPTION':
        return <PrescriptionForm {...props} />;
      case 'EXAM_REQUEST':
        return <ExamRequestForm {...props} />;
      case 'CERTIFICATE':
        return <CertificateForm {...props} />;
      case 'REFERRAL':
        return <EvolutionForm {...props} />; // Reuse evolution form for referral
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/medical-records">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Novo Prontuario</h1>
          <p className="text-muted-foreground">
            {step === 'patient' && 'Selecione o paciente'}
            {step === 'type' && 'Selecione o tipo de registro'}
            {step === 'form' && `Preencha os dados - ${recordTypes.find(t => t.value === selectedType)?.label}`}
          </p>
        </div>
      </div>

      {/* Patient Selection Step */}
      {step === 'patient' && (
        <Card>
          <CardHeader>
            <CardTitle>Selecionar Paciente</CardTitle>
            <CardDescription>Busque e selecione o paciente para o prontuario</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome..."
                className="pl-10"
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
              />
            </div>

            {isSearching && (
              <div className="text-center py-4 text-muted-foreground">Buscando...</div>
            )}

            {searchResults && searchResults.length > 0 && (
              <div className="space-y-2">
                {searchResults.map((patient: Patient) => (
                  <button
                    key={patient.id}
                    className="w-full p-4 border rounded-lg hover:bg-muted/50 transition-colors text-left"
                    onClick={() => handleSelectPatient(patient)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{patient.fullName}</p>
                        <p className="text-sm text-muted-foreground">
                          {calculateAge(patient.birthDate)} anos - {genderLabels[patient.gender]}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {patientSearch.length >= 2 && searchResults?.length === 0 && (
              <div className="text-center py-4 text-muted-foreground">
                Nenhum paciente encontrado
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Type Selection Step */}
      {step === 'type' && selectedPatient && (
        <>
          {/* Selected Patient Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{selectedPatient.fullName}</p>
                    <p className="text-sm text-muted-foreground">
                      {calculateAge(selectedPatient.birthDate)} anos - {genderLabels[selectedPatient.gender]}
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => setStep('patient')}>
                  Alterar
                </Button>
              </div>
              {selectedPatient.allergies && selectedPatient.allergies.length > 0 && (
                <div className="mt-4 p-2 bg-red-50 border border-red-200 rounded">
                  <p className="text-xs font-medium text-red-700">Alergias:</p>
                  <p className="text-sm text-red-600">{selectedPatient.allergies.join(', ')}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Record Type Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Tipo de Registro</CardTitle>
              <CardDescription>Selecione o tipo de prontuario a ser criado</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2">
                {recordTypes.map((type) => (
                  <button
                    key={type.value}
                    className="p-4 border rounded-lg hover:bg-muted/50 hover:border-primary transition-colors text-left"
                    onClick={() => handleSelectType(type.value)}
                  >
                    <p className="font-medium">{type.label}</p>
                    <p className="text-sm text-muted-foreground">{type.description}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Form Step */}
      {step === 'form' && selectedPatient && selectedType && (
        <>
          {/* Selected Patient Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{selectedPatient.fullName}</p>
                    <p className="text-sm text-muted-foreground">
                      {calculateAge(selectedPatient.birthDate)} anos
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setStep('type')}>
                    Alterar tipo
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dynamic Form */}
          {renderFormByType()}

          {/* Submit Button */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setStep('type')}>
              Voltar
            </Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              Salvar Prontuario
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
