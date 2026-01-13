import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  User,
  Calendar,
  FileText,
  Stethoscope,
  Pill,
  AlertCircle,
  CheckCircle,
  Printer,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import api from '@/services/api';
import { formatDateTime, formatDate, calculateAge } from '@healthflow/utils';

interface MedicalRecordContent {
  chiefComplaint?: string;
  historyOfPresentIllness?: string;
  pastMedicalHistory?: string;
  familyHistory?: string;
  socialHistory?: string;
  allergies?: string[];
  medications?: string[];
  physicalExamination?: string;
  assessment?: string;
  plan?: string;
  prescriptions?: Array<{
    medication: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
  }>;
  vitalSigns?: {
    bloodPressure?: string;
    heartRate?: number;
    temperature?: number;
    respiratoryRate?: number;
    oxygenSaturation?: number;
    weight?: number;
    height?: number;
  };
  subjective?: string;
  objective?: string;
}

const recordTypeLabels: Record<string, string> = {
  ANAMNESIS: 'Anamnese',
  EVOLUTION: 'Evolucao Clinica',
  PRESCRIPTION: 'Prescricao Medica',
  EXAM_REQUEST: 'Solicitacao de Exames',
  CERTIFICATE: 'Atestado Medico',
  REFERRAL: 'Encaminhamento',
};

const genderLabels: Record<string, string> = {
  MALE: 'Masculino',
  FEMALE: 'Feminino',
  OTHER: 'Outro',
};

export function MedicalRecordDetailPage() {
  const { id } = useParams();

  const { data: record, isLoading } = useQuery({
    queryKey: ['medical-record', id],
    queryFn: async () => {
      const response = await api.get(`/medical-records/${id}`);
      return response.data.data;
    },
  });

  if (isLoading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Carregando...
      </div>
    );
  }

  if (!record) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground mb-4">Prontuario nao encontrado</p>
        <Link to="/medical-records">
          <Button variant="outline">Voltar</Button>
        </Link>
      </div>
    );
  }

  const content = record.content as MedicalRecordContent;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/medical-records">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">
                {recordTypeLabels[record.type] || record.type}
              </h1>
              {record.signature ? (
                <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                  <CheckCircle className="h-3 w-3" />
                  Assinado
                </span>
              ) : (
                <span className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs">
                  <AlertCircle className="h-3 w-3" />
                  Pendente assinatura
                </span>
              )}
            </div>
            <p className="text-muted-foreground">
              {formatDateTime(record.createdAt)} - Versao {record.version}
            </p>
          </div>
        </div>
        <Button variant="outline">
          <Printer className="h-4 w-4 mr-2" />
          Imprimir
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Patient Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4" />
              Paciente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="font-medium">{record.patient.fullName}</p>
              <p className="text-sm text-muted-foreground">
                {calculateAge(record.patient.birthDate)} anos - {genderLabels[record.patient.gender]}
              </p>
            </div>
            {record.patient.allergies?.length > 0 && (
              <div className="p-2 bg-red-50 border border-red-200 rounded">
                <p className="text-xs font-medium text-red-700">Alergias:</p>
                <p className="text-sm text-red-600">{record.patient.allergies.join(', ')}</p>
              </div>
            )}
            {record.patient.bloodType && (
              <p className="text-sm">
                <span className="text-muted-foreground">Tipo Sanguineo:</span>{' '}
                {record.patient.bloodType}
              </p>
            )}
            <Link to={`/patients/${record.patient.id}`}>
              <Button variant="link" size="sm" className="p-0">
                Ver ficha completa
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Professional Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Stethoscope className="h-4 w-4" />
              Profissional
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">Dr(a). {record.professional.name}</p>
            <p className="text-sm text-muted-foreground">{record.professional.professionalId}</p>
            {record.professional.specialties?.length > 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                {record.professional.specialties.join(', ')}
              </p>
            )}
          </CardContent>
        </Card>

        {/* CID Codes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4" />
              CID-10
            </CardTitle>
          </CardHeader>
          <CardContent>
            {record.icdCodes?.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {record.icdCodes.map((code: string) => (
                  <span
                    key={code}
                    className="px-2 py-1 bg-muted rounded text-sm font-mono"
                  >
                    {code}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum CID registrado</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Record Content */}
      <Card>
        <CardHeader>
          <CardTitle>Conteudo do Prontuario</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Vital Signs */}
          {content.vitalSigns && (
            <div>
              <h3 className="font-semibold mb-3">Sinais Vitais</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {content.vitalSigns.bloodPressure && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground">Pressao Arterial</p>
                    <p className="font-semibold">{content.vitalSigns.bloodPressure} mmHg</p>
                  </div>
                )}
                {content.vitalSigns.heartRate && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground">Frequencia Cardiaca</p>
                    <p className="font-semibold">{content.vitalSigns.heartRate} bpm</p>
                  </div>
                )}
                {content.vitalSigns.temperature && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground">Temperatura</p>
                    <p className="font-semibold">{content.vitalSigns.temperature} C</p>
                  </div>
                )}
                {content.vitalSigns.oxygenSaturation && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground">Saturacao O2</p>
                    <p className="font-semibold">{content.vitalSigns.oxygenSaturation}%</p>
                  </div>
                )}
                {content.vitalSigns.weight && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground">Peso</p>
                    <p className="font-semibold">{content.vitalSigns.weight} kg</p>
                  </div>
                )}
                {content.vitalSigns.height && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground">Altura</p>
                    <p className="font-semibold">{content.vitalSigns.height} cm</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Anamnesis Fields */}
          {content.chiefComplaint && (
            <div>
              <h3 className="font-semibold mb-2">Queixa Principal</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">{content.chiefComplaint}</p>
            </div>
          )}

          {content.historyOfPresentIllness && (
            <div>
              <h3 className="font-semibold mb-2">Historia da Doenca Atual</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {content.historyOfPresentIllness}
              </p>
            </div>
          )}

          {content.pastMedicalHistory && (
            <div>
              <h3 className="font-semibold mb-2">Historia Patologica Pregressa</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {content.pastMedicalHistory}
              </p>
            </div>
          )}

          {content.familyHistory && (
            <div>
              <h3 className="font-semibold mb-2">Historia Familiar</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">{content.familyHistory}</p>
            </div>
          )}

          {/* SOAP Format */}
          {content.subjective && (
            <div>
              <h3 className="font-semibold mb-2">Subjetivo (S)</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">{content.subjective}</p>
            </div>
          )}

          {content.objective && (
            <div>
              <h3 className="font-semibold mb-2">Objetivo (O)</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">{content.objective}</p>
            </div>
          )}

          {content.physicalExamination && (
            <div>
              <h3 className="font-semibold mb-2">Exame Fisico</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {content.physicalExamination}
              </p>
            </div>
          )}

          {content.assessment && (
            <div>
              <h3 className="font-semibold mb-2">Avaliacao (A)</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">{content.assessment}</p>
            </div>
          )}

          {content.plan && (
            <div>
              <h3 className="font-semibold mb-2">Plano (P)</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">{content.plan}</p>
            </div>
          )}

          {/* Prescriptions */}
          {content.prescriptions && content.prescriptions.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Pill className="h-4 w-4" />
                Prescricoes
              </h3>
              <div className="space-y-3">
                {content.prescriptions.map((rx, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{rx.medication}</p>
                        <p className="text-sm text-muted-foreground">
                          {rx.dosage} - {rx.frequency}
                        </p>
                        <p className="text-sm text-muted-foreground">Duracao: {rx.duration}</p>
                      </div>
                      <span className="text-2xl font-bold text-muted-foreground">
                        {index + 1}
                      </span>
                    </div>
                    {rx.instructions && (
                      <p className="mt-2 text-sm p-2 bg-muted rounded">
                        <span className="font-medium">Instrucoes:</span> {rx.instructions}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Allergies & Medications */}
          {content.allergies && content.allergies.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Alergias Informadas</h3>
              <div className="flex flex-wrap gap-2">
                {content.allergies.map((allergy) => (
                  <span
                    key={allergy}
                    className="px-2 py-1 bg-red-100 text-red-700 rounded text-sm"
                  >
                    {allergy}
                  </span>
                ))}
              </div>
            </div>
          )}

          {content.medications && content.medications.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Medicamentos em Uso</h3>
              <div className="flex flex-wrap gap-2">
                {content.medications.map((med) => (
                  <span key={med} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                    {med}
                  </span>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Appointment Info */}
      {record.appointment && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-4 w-4" />
              Consulta Relacionada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              <span className="text-muted-foreground">Data:</span>{' '}
              {formatDateTime(record.appointment.startTime)}
            </p>
            <p>
              <span className="text-muted-foreground">Tipo:</span> {record.appointment.type}
            </p>
            <p>
              <span className="text-muted-foreground">Status:</span> {record.appointment.status}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
