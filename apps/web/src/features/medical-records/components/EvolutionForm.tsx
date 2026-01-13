import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface EvolutionFormProps {
  data: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
  icdCodes: string[];
  onIcdCodesChange: (codes: string[]) => void;
}

interface VitalSigns {
  bloodPressure?: string;
  heartRate?: number | null;
  temperature?: number | null;
  respiratoryRate?: number | null;
  oxygenSaturation?: number | null;
  weight?: number | null;
  height?: number | null;
}

export function EvolutionForm({ data, onChange, icdCodes, onIcdCodesChange }: EvolutionFormProps) {
  const updateField = (field: string, value: string) => {
    onChange({ ...data, [field]: value });
  };

  const vitalSigns = (data.vitalSigns as VitalSigns) || {};

  const updateVitalSign = (field: string, value: string) => {
    const numValue = value ? parseFloat(value) : null;
    onChange({
      ...data,
      vitalSigns: {
        ...vitalSigns,
        [field]: field === 'bloodPressure' ? value : numValue,
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Sinais Vitais */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sinais Vitais</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label>Pressao Arterial (mmHg)</Label>
              <Input
                placeholder="120/80"
                value={vitalSigns.bloodPressure || ''}
                onChange={(e) => updateVitalSign('bloodPressure', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>FC (bpm)</Label>
              <Input
                type="number"
                placeholder="72"
                value={vitalSigns.heartRate || ''}
                onChange={(e) => updateVitalSign('heartRate', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Temperatura (C)</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="36.5"
                value={vitalSigns.temperature || ''}
                onChange={(e) => updateVitalSign('temperature', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>FR (irpm)</Label>
              <Input
                type="number"
                placeholder="16"
                value={vitalSigns.respiratoryRate || ''}
                onChange={(e) => updateVitalSign('respiratoryRate', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>SpO2 (%)</Label>
              <Input
                type="number"
                placeholder="98"
                value={vitalSigns.oxygenSaturation || ''}
                onChange={(e) => updateVitalSign('oxygenSaturation', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Peso (kg)</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="70"
                value={vitalSigns.weight || ''}
                onChange={(e) => updateVitalSign('weight', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Altura (cm)</Label>
              <Input
                type="number"
                placeholder="170"
                value={vitalSigns.height || ''}
                onChange={(e) => updateVitalSign('height', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SOAP */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Subjetivo (S)</CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            className="w-full min-h-[100px] p-3 border rounded-md text-sm"
            placeholder="O que o paciente relata: sintomas, queixas, evolucao desde ultima consulta..."
            value={(data.subjective as string) || ''}
            onChange={(e) => updateField('subjective', e.target.value)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Objetivo (O)</CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            className="w-full min-h-[100px] p-3 border rounded-md text-sm"
            placeholder="Achados do exame fisico, resultados de exames..."
            value={(data.objective as string) || ''}
            onChange={(e) => updateField('objective', e.target.value)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Exame Fisico</CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            className="w-full min-h-[150px] p-3 border rounded-md text-sm"
            placeholder="Estado geral, aparelhos/sistemas examinados, achados relevantes..."
            value={(data.physicalExamination as string) || ''}
            onChange={(e) => updateField('physicalExamination', e.target.value)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Avaliacao (A)</CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            className="w-full min-h-[100px] p-3 border rounded-md text-sm"
            placeholder="Hipoteses diagnosticas, conclusao clinica..."
            value={(data.assessment as string) || ''}
            onChange={(e) => updateField('assessment', e.target.value)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Plano (P)</CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            className="w-full min-h-[100px] p-3 border rounded-md text-sm"
            placeholder="Conduta terapeutica, exames solicitados, orientacoes, retorno..."
            value={(data.plan as string) || ''}
            onChange={(e) => updateField('plan', e.target.value)}
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
