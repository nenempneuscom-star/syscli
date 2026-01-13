import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface CertificateFormProps {
  data: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
  icdCodes: string[];
  onIcdCodesChange: (codes: string[]) => void;
}

const certificateTypes = [
  { value: 'medical_leave', label: 'Atestado de Afastamento' },
  { value: 'fitness', label: 'Atestado de Aptidao' },
  { value: 'presence', label: 'Declaracao de Comparecimento' },
  { value: 'accompaniment', label: 'Declaracao de Acompanhamento' },
  { value: 'other', label: 'Outro' },
];

export function CertificateForm({ data, onChange, icdCodes, onIcdCodesChange }: CertificateFormProps) {
  const updateField = (field: string, value: string | number | null) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-6">
      {/* Certificate Type */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tipo de Atestado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            {certificateTypes.map((type) => (
              <label
                key={type.value}
                className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                  (data.certificateType as string) === type.value
                    ? 'border-primary bg-primary/5'
                    : 'hover:bg-muted'
                }`}
              >
                <input
                  type="radio"
                  name="certificateType"
                  value={type.value}
                  checked={(data.certificateType as string) === type.value}
                  onChange={(e) => updateField('certificateType', e.target.value)}
                  className="w-4 h-4"
                />
                <span>{type.label}</span>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Date Range (for medical leave) */}
      {((data.certificateType as string) === 'medical_leave' || !data.certificateType) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Periodo de Afastamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Data Inicio</Label>
                <Input
                  type="date"
                  value={(data.startDate as string) || ''}
                  onChange={(e) => updateField('startDate', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Data Fim</Label>
                <Input
                  type="date"
                  value={(data.endDate as string) || ''}
                  onChange={(e) => updateField('endDate', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Dias de Afastamento</Label>
                <Input
                  type="number"
                  placeholder="Ex: 3"
                  value={(data.daysOff as number) || ''}
                  onChange={(e) => updateField('daysOff', e.target.value ? parseInt(e.target.value) : null)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Date/Time (for presence) */}
      {(data.certificateType as string) === 'presence' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Data e Horario do Comparecimento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Data</Label>
                <Input
                  type="date"
                  value={(data.startDate as string) || ''}
                  onChange={(e) => updateField('startDate', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Horario Entrada</Label>
                <Input
                  type="time"
                  value={(data.arrivalTime as string) || ''}
                  onChange={(e) => updateField('arrivalTime', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Horario Saida</Label>
                <Input
                  type="time"
                  value={(data.departureTime as string) || ''}
                  onChange={(e) => updateField('departureTime', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* CID */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">CID-10 (Opcional)</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Codigo CID-10 (deixe em branco se nao desejar informar)"
            value={(data.cid as string) || ''}
            onChange={(e) => updateField('cid', e.target.value)}
          />
          <p className="text-xs text-muted-foreground mt-1">
            De acordo com a legislacao, o CID so pode ser incluido com autorizacao expressa do paciente.
          </p>
        </CardContent>
      </Card>

      {/* Description */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Descricao / Observacoes</CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            className="w-full min-h-[150px] p-3 border rounded-md text-sm"
            placeholder="Texto do atestado ou observacoes adicionais..."
            value={(data.description as string) || ''}
            onChange={(e) => updateField('description', e.target.value)}
          />
        </CardContent>
      </Card>

      {/* CID Codes for the record */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Codigos CID-10 do Registro</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Separe por virgula (ex: J06.9, R05)"
            value={icdCodes.join(', ')}
            onChange={(e) => {
              const codes = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
              onIcdCodesChange(codes);
            }}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Estes codigos ficam no prontuario, nao aparecem no atestado impresso.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
