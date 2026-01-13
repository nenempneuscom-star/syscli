import { z } from 'zod';

// ========================================
// HealthFlow - Validation Schemas
// ========================================

// Custom validators
const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/;
const cnpjRegex = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$|^\d{14}$/;
const phoneRegex = /^\+?[\d\s\-()]{10,15}$/;

export const cpfSchema = z.string().regex(cpfRegex, 'CPF inválido');
export const cnpjSchema = z.string().regex(cnpjRegex, 'CNPJ inválido');
export const phoneSchema = z.string().regex(phoneRegex, 'Telefone inválido').optional();

// Address Schema
export const addressSchema = z.object({
  street: z.string().min(1, 'Rua é obrigatória'),
  number: z.string().min(1, 'Número é obrigatório'),
  complement: z.string().optional(),
  neighborhood: z.string().min(1, 'Bairro é obrigatório'),
  city: z.string().min(1, 'Cidade é obrigatória'),
  state: z.string().length(2, 'Estado deve ter 2 caracteres'),
  zipCode: z.string().regex(/^\d{5}-?\d{3}$/, 'CEP inválido'),
  country: z.string().default('Brasil'),
});

// Emergency Contact Schema
export const emergencyContactSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  relationship: z.string().min(1, 'Parentesco é obrigatório'),
  phone: z.string().regex(phoneRegex, 'Telefone inválido'),
});

// Auth Schemas
export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
  tenantSubdomain: z.string().optional(),
});

export const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z
    .string()
    .min(8, 'Senha deve ter no mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Senha deve conter letra maiúscula')
    .regex(/[a-z]/, 'Senha deve conter letra minúscula')
    .regex(/[0-9]/, 'Senha deve conter número')
    .regex(/[^A-Za-z0-9]/, 'Senha deve conter caractere especial'),
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Senhas não conferem',
  path: ['confirmPassword'],
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token é obrigatório'),
});

// Tenant Schemas
export const tenantSettingsSchema = z.object({
  timezone: z.string().default('America/Sao_Paulo'),
  currency: z.string().default('BRL'),
  language: z.string().default('pt-BR'),
  workingHours: z.object({
    start: z.string().regex(/^\d{2}:\d{2}$/, 'Formato inválido (HH:MM)'),
    end: z.string().regex(/^\d{2}:\d{2}$/, 'Formato inválido (HH:MM)'),
  }),
  appointmentDuration: z.number().min(5).max(480).default(30),
  features: z.object({
    telemedicine: z.boolean().default(false),
    billing: z.boolean().default(true),
    inventory: z.boolean().default(true),
    multiLocation: z.boolean().default(false),
  }),
});

export const createTenantSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  document: cnpjSchema,
  subdomain: z
    .string()
    .min(3, 'Subdomínio deve ter no mínimo 3 caracteres')
    .max(30, 'Subdomínio deve ter no máximo 30 caracteres')
    .regex(/^[a-z0-9-]+$/, 'Subdomínio deve conter apenas letras minúsculas, números e hífens'),
  settings: tenantSettingsSchema.optional(),
});

// User Schemas
export const userRoleSchema = z.enum([
  'SUPER_ADMIN',
  'TENANT_ADMIN',
  'DOCTOR',
  'NURSE',
  'RECEPTIONIST',
  'BILLING_ADMIN',
]);

export const createUserSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  role: userRoleSchema,
  professionalId: z.string().optional(),
  specialties: z.array(z.string()).optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  role: userRoleSchema.optional(),
  professionalId: z.string().optional(),
  specialties: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

// Patient Schemas
export const genderSchema = z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']);

export const createPatientSchema = z.object({
  fullName: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  document: cpfSchema,
  birthDate: z.coerce.date(),
  gender: genderSchema,
  phone: phoneSchema,
  email: z.string().email('Email inválido').optional(),
  address: addressSchema.optional(),
  healthPlan: z.string().optional(),
  emergencyContact: emergencyContactSchema.optional(),
});

export const updatePatientSchema = createPatientSchema.partial();

// Appointment Schemas
export const appointmentTypeSchema = z.enum([
  'CONSULTATION',
  'RETURN',
  'PROCEDURE',
  'EXAM',
  'TELEMEDICINE',
]);

export const appointmentStatusSchema = z.enum([
  'SCHEDULED',
  'CONFIRMED',
  'WAITING',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW',
]);

export const createAppointmentSchema = z.object({
  patientId: z.string().uuid('ID do paciente inválido'),
  professionalId: z.string().uuid('ID do profissional inválido'),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  type: appointmentTypeSchema,
  notes: z.string().optional(),
  roomId: z.string().uuid().optional(),
}).refine((data) => data.endTime > data.startTime, {
  message: 'Data/hora de fim deve ser posterior ao início',
  path: ['endTime'],
});

export const updateAppointmentSchema = z.object({
  startTime: z.coerce.date().optional(),
  endTime: z.coerce.date().optional(),
  type: appointmentTypeSchema.optional(),
  status: appointmentStatusSchema.optional(),
  notes: z.string().optional(),
  roomId: z.string().uuid().optional(),
});

// Medical Record Schemas
export const recordTypeSchema = z.enum([
  'ANAMNESIS',
  'EVOLUTION',
  'PRESCRIPTION',
  'EXAM_REQUEST',
  'CERTIFICATE',
  'REFERRAL',
]);

export const vitalSignsSchema = z.object({
  bloodPressure: z.string().optional(),
  heartRate: z.number().min(0).max(300).optional(),
  temperature: z.number().min(30).max(45).optional(),
  respiratoryRate: z.number().min(0).max(100).optional(),
  oxygenSaturation: z.number().min(0).max(100).optional(),
  weight: z.number().min(0).max(500).optional(),
  height: z.number().min(0).max(300).optional(),
});

export const prescriptionSchema = z.object({
  medication: z.string().min(1, 'Medicamento é obrigatório'),
  dosage: z.string().min(1, 'Dosagem é obrigatória'),
  frequency: z.string().min(1, 'Frequência é obrigatória'),
  duration: z.string().min(1, 'Duração é obrigatória'),
  instructions: z.string().optional(),
});

export const medicalRecordContentSchema = z.object({
  chiefComplaint: z.string().optional(),
  historyOfPresentIllness: z.string().optional(),
  pastMedicalHistory: z.string().optional(),
  familyHistory: z.string().optional(),
  socialHistory: z.string().optional(),
  allergies: z.array(z.string()).optional(),
  medications: z.array(z.string()).optional(),
  physicalExamination: z.string().optional(),
  assessment: z.string().optional(),
  plan: z.string().optional(),
  prescriptions: z.array(prescriptionSchema).optional(),
  vitalSigns: vitalSignsSchema.optional(),
});

export const createMedicalRecordSchema = z.object({
  patientId: z.string().uuid('ID do paciente inválido'),
  type: recordTypeSchema,
  content: medicalRecordContentSchema,
  icdCodes: z.array(z.string()).optional(),
  attachments: z.array(z.string().url()).optional(),
});

// Invoice Schemas
export const paymentStatusSchema = z.enum(['PENDING', 'PAID', 'PARTIAL', 'CANCELLED', 'REFUNDED']);
export const paymentMethodSchema = z.enum([
  'CASH',
  'CREDIT_CARD',
  'DEBIT_CARD',
  'PIX',
  'BANK_TRANSFER',
  'HEALTH_PLAN',
]);

export const invoiceItemSchema = z.object({
  description: z.string().min(1, 'Descrição é obrigatória'),
  procedureCode: z.string().optional(),
  quantity: z.number().min(1, 'Quantidade deve ser maior que 0'),
  unitPrice: z.number().min(0, 'Preço unitário deve ser positivo'),
  total: z.number().min(0),
});

export const createInvoiceSchema = z.object({
  patientId: z.string().uuid('ID do paciente inválido'),
  appointmentId: z.string().uuid().optional(),
  items: z.array(invoiceItemSchema).min(1, 'Deve haver pelo menos um item'),
  discount: z.number().min(0).default(0),
  dueDate: z.coerce.date(),
  paymentMethod: paymentMethodSchema.optional(),
});

// Inventory Schemas
export const createInventoryItemSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  sku: z.string().min(1, 'SKU é obrigatório'),
  category: z.string().min(1, 'Categoria é obrigatória'),
  unit: z.string().min(1, 'Unidade é obrigatória'),
  quantity: z.number().min(0).default(0),
  minQuantity: z.number().min(0).default(0),
  costPrice: z.number().min(0, 'Preço de custo deve ser positivo'),
  salePrice: z.number().min(0).optional(),
  supplier: z.string().optional(),
  location: z.string().optional(),
  expirationDate: z.coerce.date().optional(),
  batchNumber: z.string().optional(),
});

// Pagination Schema
export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  perPage: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Search Schema
export const searchSchema = z.object({
  query: z.string().min(1, 'Termo de busca é obrigatório'),
  fields: z.array(z.string()).optional(),
});

// Export types inferred from schemas
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateTenantInput = z.infer<typeof createTenantSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type CreatePatientInput = z.infer<typeof createPatientSchema>;
export type UpdatePatientInput = z.infer<typeof updatePatientSchema>;
export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>;
export type CreateMedicalRecordInput = z.infer<typeof createMedicalRecordSchema>;
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type CreateInventoryItemInput = z.infer<typeof createInventoryItemSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
