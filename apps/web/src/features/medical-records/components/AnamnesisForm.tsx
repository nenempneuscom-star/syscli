import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AnamnesisFormProps {
  data: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
  icdCodes: string[];
  onIcdCodesChange: (codes: string[]) => void;
}

export function AnamnesisForm({ data, onChange, icdCodes, onIcdCodesChange }: AnamnesisFormProps) {
  const updateField = (field: string, value: string) => {
    onChange({ ...data, [field]: value });
  };

  const updateArrayField = (field: string, value: string) => {
    const items = value.split(',').map((s) => s.trim()).filter(Boolean);
    onChange({ ...data, [field]: items });
  };

  return (
    <div className="space-y-6">
      {/* Queixa Principal */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Queixa Principal (QP)</CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            className="w-full min-h-[100px] p-3 border rounded-md text-sm"
            placeholder="Descreva a queixa principal do paciente..."
            value={(data.chiefComplaint as string) || ''}
            onChange={(e) => updateField('chiefComplaint', e.target.value)}
          />
        </CardContent>
      </Card>

      {/* Historia da Doenca Atual */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Historia da Doenca Atual (HDA)</CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            className="w-full min-h-[150px] p-3 border rounded-md text-sm"
            placeholder="Descreva a historia da doenca atual com detalhes (inicio, caracteristicas, fatores de melhora/piora, tratamentos anteriores...)"
            value={(data.historyOfPresentIllness as string) || ''}
            onChange={(e) => updateField('historyOfPresentIllness', e.target.value)}
          />
        </CardContent>
      </Card>

      {/* Historia Patologica Pregressa */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Historia Patologica Pregressa (HPP)</CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            className="w-full min-h-[100px] p-3 border rounded-md text-sm"
            placeholder="Doencas previas, cirurgias, internacoes, traumatismos..."
            value={(data.pastMedicalHistory as string) || ''}
            onChange={(e) => updateField('pastMedicalHistory', e.target.value)}
          />
        </CardContent>
      </Card>

      {/* Historia Familiar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Historia Familiar (HF)</CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            className="w-full min-h-[100px] p-3 border rounded-md text-sm"
            placeholder="Doencas na familia (diabetes, hipertensao, cancer, cardiopatias...)"
            value={(data.familyHistory as string) || ''}
            onChange={(e) => updateField('familyHistory', e.target.value)}
          />
        </CardContent>
      </Card>

      {/* Historia Social */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Historia Social</CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            className="w-full min-h-[100px] p-3 border rounded-md text-sm"
            placeholder="Habitos (tabagismo, etilismo, drogas), profissao, atividade fisica, alimentacao..."
            value={(data.socialHistory as string) || ''}
            onChange={(e) => updateField('socialHistory', e.target.value)}
          />
        </CardContent>
      </Card>

      {/* Alergias e Medicamentos */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Alergias</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Separe por virgula (ex: Penicilina, Dipirona, Latex)"
              value={Array.isArray(data.allergies) ? (data.allergies as string[]).join(', ') : ''}
              onChange={(e) => updateArrayField('allergies', e.target.value)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Medicamentos em Uso</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Separe por virgula (ex: Losartana 50mg, AAS 100mg)"
              value={Array.isArray(data.medications) ? (data.medications as string[]).join(', ') : ''}
              onChange={(e) => updateArrayField('medications', e.target.value)}
            />
          </CardContent>
        </Card>
      </div>

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
          <p className="text-xs text-muted-foreground mt-1">
            Informe os codigos CID-10 relacionados ao diagnostico
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
