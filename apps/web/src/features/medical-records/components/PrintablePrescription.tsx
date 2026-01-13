import { forwardRef } from 'react';
import { formatDate } from '@healthflow/utils';

interface Prescription {
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  route: string;
  instructions?: string;
}

interface PrintablePrescriptionProps {
  patient: {
    fullName: string;
    birthDate: string;
  };
  professional: {
    name: string;
    professionalId: string;
    specialties?: string[];
  };
  prescriptions: Prescription[];
  generalInstructions?: string;
  date: string;
  tenantName?: string;
}

export const PrintablePrescription = forwardRef<HTMLDivElement, PrintablePrescriptionProps>(
  ({ patient, professional, prescriptions, generalInstructions, date, tenantName }, ref) => {
    return (
      <div
        ref={ref}
        className="p-8 bg-white text-black min-h-[297mm] w-[210mm] mx-auto"
        style={{ fontFamily: 'serif' }}
      >
        {/* Header */}
        <div className="text-center border-b-2 border-black pb-4 mb-6">
          {tenantName && <h1 className="text-xl font-bold">{tenantName}</h1>}
          <h2 className="text-lg font-semibold mt-2">RECEITUARIO MEDICO</h2>
        </div>

        {/* Patient Info */}
        <div className="mb-6">
          <p>
            <strong>Paciente:</strong> {patient.fullName}
          </p>
          <p>
            <strong>Data:</strong> {formatDate(date)}
          </p>
        </div>

        {/* Prescriptions */}
        <div className="mb-8">
          <h3 className="font-bold text-lg mb-4 border-b pb-2">Prescricao:</h3>
          <ol className="list-decimal list-inside space-y-4">
            {prescriptions.map((rx, index) => (
              <li key={index} className="ml-4">
                <span className="font-semibold">{rx.medication}</span>
                <br />
                <span className="ml-6">
                  {rx.dosage} - {rx.frequency} - {rx.duration}
                </span>
                {rx.instructions && (
                  <>
                    <br />
                    <span className="ml-6 text-sm italic">{rx.instructions}</span>
                  </>
                )}
              </li>
            ))}
          </ol>
        </div>

        {/* General Instructions */}
        {generalInstructions && (
          <div className="mb-8 p-4 border rounded">
            <h4 className="font-bold mb-2">Orientacoes:</h4>
            <p className="whitespace-pre-wrap">{generalInstructions}</p>
          </div>
        )}

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

PrintablePrescription.displayName = 'PrintablePrescription';
