import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Prescription {
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  route: string;
  instructions: string;
}

interface PrescriptionFormProps {
  data: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
  icdCodes: string[];
  onIcdCodesChange: (codes: string[]) => void;
}

const defaultPrescription: Prescription = {
  medication: '',
  dosage: '',
  frequency: '',
  duration: '',
  route: 'oral',
  instructions: '',
};

const routes = [
  { value: 'oral', label: 'Via Oral' },
  { value: 'sublingual', label: 'Sublingual' },
  { value: 'topical', label: 'Topico' },
  { value: 'intravenous', label: 'Intravenoso (IV)' },
  { value: 'intramuscular', label: 'Intramuscular (IM)' },
  { value: 'subcutaneous', label: 'Subcutaneo (SC)' },
  { value: 'inhalation', label: 'Inalatorio' },
  { value: 'rectal', label: 'Retal' },
  { value: 'ophthalmic', label: 'Oftalmico' },
  { value: 'nasal', label: 'Nasal' },
];

export function PrescriptionForm({ data, onChange, icdCodes, onIcdCodesChange }: PrescriptionFormProps) {
  const prescriptions = (data.prescriptions as Prescription[]) || [{ ...defaultPrescription }];

  const updatePrescriptions = (newPrescriptions: Prescription[]) => {
    onChange({ ...data, prescriptions: newPrescriptions });
  };

  const addPrescription = () => {
    updatePrescriptions([...prescriptions, { ...defaultPrescription }]);
  };

  const removePrescription = (index: number) => {
    if (prescriptions.length > 1) {
      updatePrescriptions(prescriptions.filter((_, i) => i !== index));
    }
  };

  const updatePrescription = (index: number, field: keyof Prescription, value: string) => {
    const updated = [...prescriptions];
    updated[index] = { ...updated[index], [field]: value };
    updatePrescriptions(updated);
  };

  return (
    <div className="space-y-6">
      {/* Prescriptions */}
      {prescriptions.map((rx, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                {index + 1}
              </span>
              Medicamento
            </CardTitle>
            {prescriptions.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => removePrescription(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Medicamento *</Label>
                <Input
                  placeholder="Nome do medicamento"
                  value={rx.medication}
                  onChange={(e) => updatePrescription(index, 'medication', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Dosagem *</Label>
                <Input
                  placeholder="Ex: 500mg, 10ml"
                  value={rx.dosage}
                  onChange={(e) => updatePrescription(index, 'dosage', e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Frequencia *</Label>
                <Input
                  placeholder="Ex: 8/8h, 12/12h, 1x ao dia"
                  value={rx.frequency}
                  onChange={(e) => updatePrescription(index, 'frequency', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Duracao *</Label>
                <Input
                  placeholder="Ex: 7 dias, 30 dias, uso continuo"
                  value={rx.duration}
                  onChange={(e) => updatePrescription(index, 'duration', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Via de Administracao</Label>
                <select
                  className="w-full h-10 px-3 border rounded-md text-sm"
                  value={rx.route}
                  onChange={(e) => updatePrescription(index, 'route', e.target.value)}
                >
                  {routes.map((route) => (
                    <option key={route.value} value={route.value}>
                      {route.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Instrucoes Especiais</Label>
              <textarea
                className="w-full min-h-[80px] p-3 border rounded-md text-sm"
                placeholder="Ex: Tomar em jejum, evitar exposicao ao sol, nao ingerir com leite..."
                value={rx.instructions}
                onChange={(e) => updatePrescription(index, 'instructions', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Add Button */}
      <Button variant="outline" onClick={addPrescription} className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        Adicionar Medicamento
      </Button>

      {/* General Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Orientacoes Gerais</CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            className="w-full min-h-[100px] p-3 border rounded-md text-sm"
            placeholder="Orientacoes gerais para o paciente (dieta, repouso, retorno...)"
            value={(data.generalInstructions as string) || ''}
            onChange={(e) => onChange({ ...data, generalInstructions: e.target.value })}
          />
        </CardContent>
      </Card>

      {/* CID-10 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Codigos CID-10</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Separe por virgula (ex: J06.9, R05, I10)"
            value={icdCodes.join(', ')}
            onChange={(e) => {
              const codes = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
              onIcdCodesChange(codes);
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
