import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ExamRequestFormProps {
  data: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
  icdCodes: string[];
  onIcdCodesChange: (codes: string[]) => void;
}

const commonExams = [
  // Laboratoriais
  { category: 'Hemograma', name: 'Hemograma Completo' },
  { category: 'Hemograma', name: 'Hemoglobina Glicada (HbA1c)' },
  { category: 'Bioquimica', name: 'Glicemia de Jejum' },
  { category: 'Bioquimica', name: 'Colesterol Total e Fracoes' },
  { category: 'Bioquimica', name: 'Triglicerides' },
  { category: 'Bioquimica', name: 'Ureia' },
  { category: 'Bioquimica', name: 'Creatinina' },
  { category: 'Bioquimica', name: 'TGO (AST)' },
  { category: 'Bioquimica', name: 'TGP (ALT)' },
  { category: 'Bioquimica', name: 'Acido Urico' },
  { category: 'Tireoide', name: 'TSH' },
  { category: 'Tireoide', name: 'T4 Livre' },
  { category: 'Urina', name: 'EAS (Urina tipo I)' },
  { category: 'Urina', name: 'Urocultura' },
  // Imagem
  { category: 'Imagem', name: 'Raio-X de Torax' },
  { category: 'Imagem', name: 'Ultrassonografia Abdominal' },
  { category: 'Imagem', name: 'Tomografia' },
  { category: 'Imagem', name: 'Ressonancia Magnetica' },
  { category: 'Cardiologia', name: 'Eletrocardiograma (ECG)' },
  { category: 'Cardiologia', name: 'Ecocardiograma' },
  { category: 'Cardiologia', name: 'Teste Ergometrico' },
];

export function ExamRequestForm({ data, onChange, icdCodes, onIcdCodesChange }: ExamRequestFormProps) {
  const [examInput, setExamInput] = useState('');
  const exams = (data.exams as string[]) || [];

  const addExam = (exam: string) => {
    if (exam && !exams.includes(exam)) {
      onChange({ ...data, exams: [...exams, exam] });
    }
    setExamInput('');
  };

  const removeExam = (exam: string) => {
    onChange({ ...data, exams: exams.filter((e) => e !== exam) });
  };

  const updateField = (field: string, value: string) => {
    onChange({ ...data, [field]: value });
  };

  // Group common exams by category
  const examsByCategory = commonExams.reduce((acc, exam) => {
    if (!acc[exam.category]) acc[exam.category] = [];
    acc[exam.category].push(exam.name);
    return acc;
  }, {} as Record<string, string[]>);

  return (
    <div className="space-y-6">
      {/* Quick Add */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Adicionar Exames</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Custom exam input */}
          <div className="flex gap-2">
            <Input
              placeholder="Digite o nome do exame..."
              value={examInput}
              onChange={(e) => setExamInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addExam(examInput);
                }
              }}
            />
            <Button onClick={() => addExam(examInput)} disabled={!examInput}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Common exams by category */}
          <div className="space-y-3">
            {Object.entries(examsByCategory).map(([category, categoryExams]) => (
              <div key={category}>
                <p className="text-sm font-medium text-muted-foreground mb-2">{category}</p>
                <div className="flex flex-wrap gap-2">
                  {categoryExams.map((exam) => (
                    <button
                      key={exam}
                      className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                        exams.includes(exam)
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'hover:bg-muted'
                      }`}
                      onClick={() => {
                        if (exams.includes(exam)) {
                          removeExam(exam);
                        } else {
                          addExam(exam);
                        }
                      }}
                    >
                      {exam}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Selected Exams */}
      {exams.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Exames Selecionados ({exams.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {exams.map((exam, index) => (
                <div
                  key={exam}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                      {index + 1}
                    </span>
                    <span>{exam}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => removeExam(exam)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Clinical Indication */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Indicacao Clinica *</CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            className="w-full min-h-[100px] p-3 border rounded-md text-sm"
            placeholder="Descreva a indicacao clinica para os exames solicitados..."
            value={(data.clinicalIndication as string) || ''}
            onChange={(e) => updateField('clinicalIndication', e.target.value)}
          />
        </CardContent>
      </Card>

      {/* Urgency */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Urgencia</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            {[
              { value: 'routine', label: 'Rotina' },
              { value: 'urgent', label: 'Urgente' },
              { value: 'emergency', label: 'Emergencia' },
            ].map((option) => (
              <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="urgency"
                  value={option.value}
                  checked={(data.urgency as string) === option.value || (!data.urgency && option.value === 'routine')}
                  onChange={(e) => updateField('urgency', e.target.value)}
                  className="w-4 h-4"
                />
                <span className="text-sm">{option.label}</span>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Observations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Observacoes</CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            className="w-full min-h-[80px] p-3 border rounded-md text-sm"
            placeholder="Observacoes adicionais para o laboratorio/clinica..."
            value={(data.observations as string) || ''}
            onChange={(e) => updateField('observations', e.target.value)}
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
