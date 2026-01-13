import { forwardRef } from 'react';
import { formatDate } from '@healthflow/utils';

interface PrintableCertificateProps {
  patient: {
    fullName: string;
  };
  professional: {
    name: string;
    professionalId: string;
    specialties?: string[];
  };
  content: {
    certificateType?: string;
    startDate?: string;
    endDate?: string;
    daysOff?: number;
    arrivalTime?: string;
    departureTime?: string;
    cid?: string;
    description?: string;
  };
  date: string;
  tenantName?: string;
  tenantAddress?: string;
}

const certificateTypeLabels: Record<string, string> = {
  medical_leave: 'ATESTADO MEDICO',
  fitness: 'ATESTADO DE APTIDAO',
  presence: 'DECLARACAO DE COMPARECIMENTO',
  accompaniment: 'DECLARACAO DE ACOMPANHAMENTO',
  other: 'ATESTADO',
};

export const PrintableCertificate = forwardRef<HTMLDivElement, PrintableCertificateProps>(
  ({ patient, professional, content, date, tenantName, tenantAddress }, ref) => {
    const certificateTitle = certificateTypeLabels[content.certificateType || 'other'] || 'ATESTADO';

    return (
      <div
        ref={ref}
        className="p-8 bg-white text-black min-h-[297mm] w-[210mm] mx-auto"
        style={{ fontFamily: 'serif' }}
      >
        {/* Header */}
        <div className="text-center border-b-2 border-black pb-4 mb-8">
          {tenantName && <h1 className="text-xl font-bold">{tenantName}</h1>}
          {tenantAddress && <p className="text-sm">{tenantAddress}</p>}
          <h2 className="text-2xl font-bold mt-4">{certificateTitle}</h2>
        </div>

        {/* Body */}
        <div className="text-justify leading-relaxed space-y-4 mb-8">
          {/* Medical Leave Certificate */}
          {content.certificateType === 'medical_leave' && (
            <>
              <p>
                Atesto, para os devidos fins, que o(a) paciente{' '}
                <strong>{patient.fullName}</strong>, esteve sob meus cuidados
                profissionais e necessita de afastamento de suas atividades
                {content.daysOff && (
                  <> por um periodo de <strong>{content.daysOff} ({content.daysOff === 1 ? 'um' : content.daysOff}) dia(s)</strong></>
                )}
                {content.startDate && content.endDate && (
                  <>
                    , no periodo de <strong>{formatDate(content.startDate)}</strong> a{' '}
                    <strong>{formatDate(content.endDate)}</strong>
                  </>
                )}
                .
              </p>
              {content.cid && (
                <p>
                  CID-10: <strong>{content.cid}</strong>
                </p>
              )}
            </>
          )}

          {/* Presence Declaration */}
          {content.certificateType === 'presence' && (
            <p>
              Declaro, para os devidos fins, que o(a) paciente{' '}
              <strong>{patient.fullName}</strong> compareceu a este estabelecimento
              de saude no dia <strong>{content.startDate ? formatDate(content.startDate) : formatDate(date)}</strong>
              {content.arrivalTime && content.departureTime && (
                <>
                  , no horario das <strong>{content.arrivalTime}</strong> as{' '}
                  <strong>{content.departureTime}</strong>
                </>
              )}
              , para atendimento medico.
            </p>
          )}

          {/* Accompaniment Declaration */}
          {content.certificateType === 'accompaniment' && (
            <p>
              Declaro, para os devidos fins, que{' '}
              <strong>{patient.fullName}</strong> esteve presente neste
              estabelecimento de saude no dia{' '}
              <strong>{content.startDate ? formatDate(content.startDate) : formatDate(date)}</strong>
              {content.arrivalTime && content.departureTime && (
                <>
                  , no horario das <strong>{content.arrivalTime}</strong> as{' '}
                  <strong>{content.departureTime}</strong>
                </>
              )}
              , acompanhando paciente em atendimento medico.
            </p>
          )}

          {/* Fitness Certificate */}
          {content.certificateType === 'fitness' && (
            <p>
              Atesto, para os devidos fins, que o(a) paciente{' '}
              <strong>{patient.fullName}</strong>, apos avaliacao medica realizada
              nesta data, encontra-se <strong>APTO(A)</strong> para exercer suas
              atividades.
            </p>
          )}

          {/* Custom description */}
          {content.description && (
            <div className="mt-4 p-4 border rounded">
              <p className="whitespace-pre-wrap">{content.description}</p>
            </div>
          )}
        </div>

        {/* Date and Location */}
        <div className="text-right mb-16">
          <p>{formatDate(date)}</p>
        </div>

        {/* Signature Area */}
        <div className="mt-16 text-center">
          <div className="border-t border-black w-64 mx-auto pt-2">
            <p className="font-semibold">Dr(a). {professional.name}</p>
            <p className="text-sm">{professional.professionalId}</p>
            {professional.specialties && professional.specialties.length > 0 && (
              <p className="text-sm">{professional.specialties.join(' | ')}</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-8 left-8 right-8 text-xs text-center text-gray-500">
          <p>Este documento foi gerado eletronicamente pelo Guilherme Machado Systems</p>
        </div>
      </div>
    );
  }
);

PrintableCertificate.displayName = 'PrintableCertificate';
