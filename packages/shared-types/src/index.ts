// ========================================
// HealthFlow - Shared Types
// ========================================

// Tenant Types
export type TenantStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'TRIAL';

export interface Tenant {
  id: string;
  name: string;
  document: string; // CNPJ
  subdomain: string;
  settings: TenantSettings;
  planId: string;
  status: TenantStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface TenantSettings {
  timezone: string;
  currency: string;
  language: string;
  workingHours: {
    start: string;
    end: string;
  };
  appointmentDuration: number; // minutes
  features: {
    telemedicine: boolean;
    billing: boolean;
    inventory: boolean;
    multiLocation: boolean;
  };
}

// User Types
export type UserRole =
  | 'SUPER_ADMIN'
  | 'TENANT_ADMIN'
  | 'DOCTOR'
  | 'NURSE'
  | 'RECEPTIONIST'
  | 'BILLING_ADMIN';

export interface User {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  role: UserRole;
  professionalId?: string; // CRM, CRO, etc.
  specialties: string[];
  isActive: boolean;
  mfaEnabled: boolean;
  createdAt: Date;
}

export interface UserCreateInput {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  professionalId?: string;
  specialties?: string[];
}

// Patient Types
export type Gender = 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';

export interface Patient {
  id: string;
  tenantId: string;
  fullName: string;
  document: string; // CPF (encrypted)
  birthDate: Date;
  gender: Gender;
  phone?: string;
  email?: string;
  address?: Address;
  healthPlan?: string;
  emergencyContact?: EmergencyContact;
  consentGiven: boolean;
  consentDate?: Date;
  createdAt: Date;
}

export interface Address {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

export interface PatientCreateInput {
  fullName: string;
  document: string;
  birthDate: Date;
  gender: Gender;
  phone?: string;
  email?: string;
  address?: Address;
  healthPlan?: string;
  emergencyContact?: EmergencyContact;
}

// Medical Record Types
export type RecordType =
  | 'ANAMNESIS'
  | 'EVOLUTION'
  | 'PRESCRIPTION'
  | 'EXAM_REQUEST'
  | 'CERTIFICATE'
  | 'REFERRAL';

export interface MedicalRecord {
  id: string;
  tenantId: string;
  patientId: string;
  professionalId: string;
  type: RecordType;
  content: MedicalRecordContent;
  icdCodes: string[];
  attachments: string[];
  signature?: string;
  version: number;
  createdAt: Date;
}

export interface MedicalRecordContent {
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
  prescriptions?: Prescription[];
  vitalSigns?: VitalSigns;
}

export interface Prescription {
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export interface VitalSigns {
  bloodPressure?: string;
  heartRate?: number;
  temperature?: number;
  respiratoryRate?: number;
  oxygenSaturation?: number;
  weight?: number;
  height?: number;
}

// Appointment Types
export type AppointmentType =
  | 'CONSULTATION'
  | 'RETURN'
  | 'PROCEDURE'
  | 'EXAM'
  | 'TELEMEDICINE';

export type AppointmentStatus =
  | 'SCHEDULED'
  | 'CONFIRMED'
  | 'WAITING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

export interface Appointment {
  id: string;
  tenantId: string;
  patientId: string;
  professionalId: string;
  startTime: Date;
  endTime: Date;
  type: AppointmentType;
  status: AppointmentStatus;
  notes?: string;
  roomId?: string;
  createdAt: Date;
}

export interface AppointmentCreateInput {
  patientId: string;
  professionalId: string;
  startTime: Date;
  endTime: Date;
  type: AppointmentType;
  notes?: string;
  roomId?: string;
}

// Billing Types
export type PaymentStatus = 'PENDING' | 'PAID' | 'PARTIAL' | 'CANCELLED' | 'REFUNDED';
export type PaymentMethod = 'CASH' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'PIX' | 'BANK_TRANSFER' | 'HEALTH_PLAN';

export interface Invoice {
  id: string;
  tenantId: string;
  patientId: string;
  appointmentId?: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  total: number;
  status: PaymentStatus;
  paymentMethod?: PaymentMethod;
  healthPlanInfo?: HealthPlanInfo;
  dueDate: Date;
  paidAt?: Date;
  createdAt: Date;
}

export interface InvoiceItem {
  description: string;
  procedureCode?: string; // TUSS code
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface HealthPlanInfo {
  planName: string;
  planCode: string;
  authorizationNumber?: string;
  guideNumber?: string;
}

// Inventory Types
export interface InventoryItem {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  sku: string;
  category: string;
  unit: string;
  quantity: number;
  minQuantity: number;
  costPrice: number;
  salePrice?: number;
  supplier?: string;
  location?: string;
  expirationDate?: Date;
  batchNumber?: string;
  isActive: boolean;
  createdAt: Date;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: PaginationMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface PaginationMeta {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

export interface PaginationQuery {
  page?: number;
  perPage?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Auth Types
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthUser {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface LoginInput {
  email: string;
  password: string;
  tenantSubdomain?: string;
}

// Audit Log Types
export type AuditAction =
  | 'CREATE'
  | 'READ'
  | 'UPDATE'
  | 'DELETE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'EXPORT';

export interface AuditLog {
  id: string;
  tenantId: string;
  userId: string;
  action: AuditAction;
  resource: string;
  resourceId?: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
}
