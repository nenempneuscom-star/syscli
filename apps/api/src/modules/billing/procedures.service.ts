import { NotFoundException } from '../../common/exceptions/http-exception.js';

// Common medical procedures (TUSS - Terminologia Unificada da Saude Suplementar)
export const COMMON_PROCEDURES = [
  // Consultas
  { code: '10101012', description: 'Consulta em consultorio', category: 'Consultas', defaultPrice: 150.00 },
  { code: '10101020', description: 'Consulta em domicilio', category: 'Consultas', defaultPrice: 250.00 },
  { code: '10101039', description: 'Consulta em pronto socorro', category: 'Consultas', defaultPrice: 200.00 },
  { code: '10102019', description: 'Consulta de retorno', category: 'Consultas', defaultPrice: 100.00 },

  // Procedimentos clinicos
  { code: '20101015', description: 'Curativo pequeno', category: 'Procedimentos', defaultPrice: 50.00 },
  { code: '20101023', description: 'Curativo medio', category: 'Procedimentos', defaultPrice: 80.00 },
  { code: '20101031', description: 'Curativo grande', category: 'Procedimentos', defaultPrice: 120.00 },
  { code: '20102011', description: 'Retirada de pontos', category: 'Procedimentos', defaultPrice: 40.00 },
  { code: '20103018', description: 'Injecao intramuscular', category: 'Procedimentos', defaultPrice: 30.00 },
  { code: '20103026', description: 'Injecao endovenosa', category: 'Procedimentos', defaultPrice: 50.00 },
  { code: '20103034', description: 'Injecao subcutanea', category: 'Procedimentos', defaultPrice: 30.00 },
  { code: '20104014', description: 'Nebulizacao', category: 'Procedimentos', defaultPrice: 35.00 },
  { code: '20105010', description: 'Verificacao de pressao arterial', category: 'Procedimentos', defaultPrice: 15.00 },
  { code: '20105029', description: 'Glicemia capilar', category: 'Procedimentos', defaultPrice: 20.00 },

  // Pequenas cirurgias
  { code: '30101018', description: 'Sutura simples', category: 'Pequenas Cirurgias', defaultPrice: 150.00 },
  { code: '30101026', description: 'Excisao de lesao de pele', category: 'Pequenas Cirurgias', defaultPrice: 300.00 },
  { code: '30101034', description: 'Drenagem de abscesso', category: 'Pequenas Cirurgias', defaultPrice: 250.00 },
  { code: '30102014', description: 'Cauterizacao quimica', category: 'Pequenas Cirurgias', defaultPrice: 100.00 },
  { code: '30102022', description: 'Crioterapia', category: 'Pequenas Cirurgias', defaultPrice: 120.00 },

  // Exames laboratoriais
  { code: '40301010', description: 'Hemograma completo', category: 'Exames', defaultPrice: 25.00 },
  { code: '40301028', description: 'Glicemia de jejum', category: 'Exames', defaultPrice: 15.00 },
  { code: '40301036', description: 'Colesterol total', category: 'Exames', defaultPrice: 20.00 },
  { code: '40301044', description: 'Triglicerides', category: 'Exames', defaultPrice: 20.00 },
  { code: '40301052', description: 'Ureia', category: 'Exames', defaultPrice: 15.00 },
  { code: '40301060', description: 'Creatinina', category: 'Exames', defaultPrice: 15.00 },
  { code: '40301079', description: 'TGO (AST)', category: 'Exames', defaultPrice: 18.00 },
  { code: '40301087', description: 'TGP (ALT)', category: 'Exames', defaultPrice: 18.00 },
  { code: '40301095', description: 'TSH', category: 'Exames', defaultPrice: 35.00 },
  { code: '40301109', description: 'T4 livre', category: 'Exames', defaultPrice: 30.00 },
  { code: '40301117', description: 'Urina tipo I (EAS)', category: 'Exames', defaultPrice: 15.00 },
  { code: '40301125', description: 'PSA total', category: 'Exames', defaultPrice: 45.00 },
  { code: '40301133', description: 'Vitamina D', category: 'Exames', defaultPrice: 80.00 },
  { code: '40301141', description: 'Vitamina B12', category: 'Exames', defaultPrice: 50.00 },
  { code: '40301150', description: 'Ferritina', category: 'Exames', defaultPrice: 40.00 },

  // Exames de imagem
  { code: '40801012', description: 'Raio-X de torax (PA)', category: 'Imagem', defaultPrice: 60.00 },
  { code: '40801020', description: 'Raio-X de torax (PA e perfil)', category: 'Imagem', defaultPrice: 80.00 },
  { code: '40801039', description: 'Raio-X de coluna cervical', category: 'Imagem', defaultPrice: 70.00 },
  { code: '40801047', description: 'Raio-X de coluna lombar', category: 'Imagem', defaultPrice: 70.00 },
  { code: '40802018', description: 'Ultrassonografia abdominal', category: 'Imagem', defaultPrice: 150.00 },
  { code: '40802026', description: 'Ultrassonografia pelvica', category: 'Imagem', defaultPrice: 130.00 },
  { code: '40802034', description: 'Ultrassonografia de tireoide', category: 'Imagem', defaultPrice: 120.00 },
  { code: '40802042', description: 'Ultrassonografia de mama', category: 'Imagem', defaultPrice: 130.00 },
  { code: '40803014', description: 'Mamografia bilateral', category: 'Imagem', defaultPrice: 180.00 },

  // Eletrodiagnostico
  { code: '40901016', description: 'Eletrocardiograma (ECG)', category: 'Cardiologia', defaultPrice: 70.00 },
  { code: '40901024', description: 'Ecocardiograma', category: 'Cardiologia', defaultPrice: 350.00 },
  { code: '40901032', description: 'Teste ergometrico', category: 'Cardiologia', defaultPrice: 280.00 },
  { code: '40901040', description: 'Holter 24 horas', category: 'Cardiologia', defaultPrice: 300.00 },
  { code: '40901059', description: 'MAPA 24 horas', category: 'Cardiologia', defaultPrice: 280.00 },

  // Vacinas
  { code: '50101018', description: 'Vacina Influenza', category: 'Vacinas', defaultPrice: 120.00 },
  { code: '50101026', description: 'Vacina Hepatite B', category: 'Vacinas', defaultPrice: 90.00 },
  { code: '50101034', description: 'Vacina Tetano', category: 'Vacinas', defaultPrice: 80.00 },
  { code: '50101042', description: 'Vacina Febre Amarela', category: 'Vacinas', defaultPrice: 150.00 },
  { code: '50101050', description: 'Vacina HPV', category: 'Vacinas', defaultPrice: 450.00 },

  // Telemedicina
  { code: '10101055', description: 'Teleconsulta', category: 'Telemedicina', defaultPrice: 130.00 },
  { code: '10101063', description: 'Telemonitoramento', category: 'Telemedicina', defaultPrice: 80.00 },
];

export class ProceduresService {
  async findAll(search?: string, category?: string) {
    let procedures = [...COMMON_PROCEDURES];

    if (search) {
      const searchLower = search.toLowerCase();
      procedures = procedures.filter(
        (p) =>
          p.code.includes(search) ||
          p.description.toLowerCase().includes(searchLower)
      );
    }

    if (category) {
      procedures = procedures.filter((p) => p.category === category);
    }

    return procedures;
  }

  async findByCode(code: string) {
    const procedure = COMMON_PROCEDURES.find((p) => p.code === code);

    if (!procedure) {
      throw new NotFoundException('Procedure not found', 'PROCEDURE_NOT_FOUND');
    }

    return procedure;
  }

  async getCategories() {
    const categories = [...new Set(COMMON_PROCEDURES.map((p) => p.category))];
    return categories.sort();
  }

  async getByCategory() {
    const grouped: Record<string, typeof COMMON_PROCEDURES> = {};

    for (const procedure of COMMON_PROCEDURES) {
      if (!grouped[procedure.category]) {
        grouped[procedure.category] = [];
      }
      grouped[procedure.category].push(procedure);
    }

    return grouped;
  }
}

export const proceduresService = new ProceduresService();
