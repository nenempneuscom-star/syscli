-- ==========================================
-- Guilherme Machado Systems
-- Script Completo - Execute tudo de uma vez
-- ==========================================

-- ==========================================
-- PARTE 1: ENUMS
-- ==========================================

CREATE TYPE "TenantStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'TRIAL');
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'TENANT_ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'BILLING_ADMIN');
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY');
CREATE TYPE "RecordType" AS ENUM ('ANAMNESIS', 'EVOLUTION', 'PRESCRIPTION', 'EXAM_REQUEST', 'CERTIFICATE', 'REFERRAL');
CREATE TYPE "AppointmentType" AS ENUM ('CONSULTATION', 'RETURN', 'PROCEDURE', 'EXAM', 'TELEMEDICINE');
CREATE TYPE "AppointmentStatus" AS ENUM ('SCHEDULED', 'CONFIRMED', 'WAITING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW');
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'PARTIAL', 'CANCELLED', 'REFUNDED');
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'PIX', 'BANK_TRANSFER', 'HEALTH_PLAN');
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'READ', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT');

-- ==========================================
-- PARTE 2: TABELAS
-- ==========================================

-- Plan
CREATE TABLE "Plan" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10, 2) NOT NULL,
    "features" JSONB NOT NULL,
    "maxUsers" INTEGER NOT NULL DEFAULT 5,
    "maxPatients" INTEGER NOT NULL DEFAULT 1000,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Plan_name_key" ON "Plan"("name");

-- Tenant
CREATE TABLE "Tenant" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "document" TEXT NOT NULL,
    "subdomain" TEXT NOT NULL,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "planId" UUID NOT NULL,
    "status" "TenantStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Tenant_document_key" ON "Tenant"("document");
CREATE UNIQUE INDEX "Tenant_subdomain_key" ON "Tenant"("subdomain");
CREATE INDEX "Tenant_subdomain_idx" ON "Tenant"("subdomain");
CREATE INDEX "Tenant_status_idx" ON "Tenant"("status");

-- User
CREATE TABLE "User" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenantId" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "professionalId" TEXT,
    "specialties" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "phone" TEXT,
    "avatar" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
    "mfaSecret" TEXT,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "User_tenantId_email_key" ON "User"("tenantId", "email");
CREATE INDEX "User_tenantId_idx" ON "User"("tenantId");
CREATE INDEX "User_role_idx" ON "User"("role");

-- Patient
CREATE TABLE "Patient" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenantId" UUID NOT NULL,
    "fullName" TEXT NOT NULL,
    "document" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3) NOT NULL,
    "gender" "Gender" NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "address" JSONB,
    "healthPlan" TEXT,
    "healthPlanNumber" TEXT,
    "emergencyContact" JSONB,
    "allergies" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "bloodType" TEXT,
    "observations" TEXT,
    "consentGiven" BOOLEAN NOT NULL DEFAULT false,
    "consentDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Patient_tenantId_document_key" ON "Patient"("tenantId", "document");
CREATE INDEX "Patient_tenantId_idx" ON "Patient"("tenantId");
CREATE INDEX "Patient_tenantId_fullName_idx" ON "Patient"("tenantId", "fullName");

-- Room
CREATE TABLE "Room" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenantId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Room_tenantId_name_key" ON "Room"("tenantId", "name");
CREATE INDEX "Room_tenantId_idx" ON "Room"("tenantId");

-- Appointment
CREATE TABLE "Appointment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenantId" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "professionalId" UUID NOT NULL,
    "roomId" UUID,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "type" "AppointmentType" NOT NULL,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'SCHEDULED',
    "notes" TEXT,
    "cancellationReason" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "checkedInAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Appointment_tenantId_professionalId_startTime_idx" ON "Appointment"("tenantId", "professionalId", "startTime");
CREATE INDEX "Appointment_tenantId_patientId_idx" ON "Appointment"("tenantId", "patientId");
CREATE INDEX "Appointment_tenantId_status_idx" ON "Appointment"("tenantId", "status");
CREATE INDEX "Appointment_startTime_idx" ON "Appointment"("startTime");

-- MedicalRecord
CREATE TABLE "MedicalRecord" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenantId" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "professionalId" UUID NOT NULL,
    "appointmentId" UUID,
    "type" "RecordType" NOT NULL,
    "content" JSONB NOT NULL,
    "icdCodes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "attachments" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "signature" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MedicalRecord_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "MedicalRecord_tenantId_patientId_idx" ON "MedicalRecord"("tenantId", "patientId");
CREATE INDEX "MedicalRecord_tenantId_professionalId_idx" ON "MedicalRecord"("tenantId", "professionalId");
CREATE INDEX "MedicalRecord_createdAt_idx" ON "MedicalRecord"("createdAt");

-- Invoice
CREATE TABLE "Invoice" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenantId" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "appointmentId" UUID,
    "invoiceNumber" TEXT NOT NULL,
    "items" JSONB NOT NULL,
    "subtotal" DECIMAL(10, 2) NOT NULL,
    "discount" DECIMAL(10, 2) NOT NULL DEFAULT 0,
    "total" DECIMAL(10, 2) NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentMethod" "PaymentMethod",
    "healthPlanInfo" JSONB,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Invoice_tenantId_invoiceNumber_key" ON "Invoice"("tenantId", "invoiceNumber");
CREATE INDEX "Invoice_tenantId_patientId_idx" ON "Invoice"("tenantId", "patientId");
CREATE INDEX "Invoice_tenantId_status_idx" ON "Invoice"("tenantId", "status");
CREATE INDEX "Invoice_dueDate_idx" ON "Invoice"("dueDate");

-- InventoryItem
CREATE TABLE "InventoryItem" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenantId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sku" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "minQuantity" INTEGER NOT NULL DEFAULT 0,
    "costPrice" DECIMAL(10, 2) NOT NULL,
    "salePrice" DECIMAL(10, 2),
    "supplier" TEXT,
    "location" TEXT,
    "expirationDate" TIMESTAMP(3),
    "batchNumber" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InventoryItem_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "InventoryItem_tenantId_sku_key" ON "InventoryItem"("tenantId", "sku");
CREATE INDEX "InventoryItem_tenantId_idx" ON "InventoryItem"("tenantId");
CREATE INDEX "InventoryItem_tenantId_category_idx" ON "InventoryItem"("tenantId", "category");
CREATE INDEX "InventoryItem_expirationDate_idx" ON "InventoryItem"("expirationDate");

-- AuditLog
CREATE TABLE "AuditLog" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenantId" UUID NOT NULL,
    "userId" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "oldValue" JSONB,
    "newValue" JSONB,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "AuditLog_tenantId_userId_idx" ON "AuditLog"("tenantId", "userId");
CREATE INDEX "AuditLog_tenantId_resource_idx" ON "AuditLog"("tenantId", "resource");
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- ==========================================
-- PARTE 3: FOREIGN KEYS
-- ==========================================

ALTER TABLE "Tenant" ADD CONSTRAINT "Tenant_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Room" ADD CONSTRAINT "Room_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MedicalRecord" ADD CONSTRAINT "MedicalRecord_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MedicalRecord" ADD CONSTRAINT "MedicalRecord_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MedicalRecord" ADD CONSTRAINT "MedicalRecord_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MedicalRecord" ADD CONSTRAINT "MedicalRecord_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ==========================================
-- PARTE 4: DADOS INICIAIS
-- ==========================================

-- Planos
INSERT INTO "Plan" ("id", "name", "description", "price", "features", "maxUsers", "maxPatients", "isActive")
VALUES
    ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Básico', 'Ideal para consultórios pequenos', 199.00, '{"appointments": true, "patients": true, "medicalRecords": true, "billing": false, "inventory": false, "reports": "basic", "support": "email"}', 3, 500, true),
    ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Profissional', 'Para clínicas em crescimento', 399.00, '{"appointments": true, "patients": true, "medicalRecords": true, "billing": true, "inventory": false, "reports": "advanced", "support": "email_phone"}', 10, 2000, true),
    ('c3d4e5f6-a7b8-9012-cdef-123456789012', 'Enterprise', 'Solução completa para hospitais', 999.00, '{"appointments": true, "patients": true, "medicalRecords": true, "billing": true, "inventory": true, "reports": "full", "support": "priority", "api": true, "whitelabel": true}', -1, -1, true);

-- Tenant Demo
INSERT INTO "Tenant" ("id", "name", "document", "subdomain", "settings", "planId", "status")
VALUES ('d4e5f6a7-b8c9-0123-def0-234567890123', 'Clínica Demonstração', '00.000.000/0001-00', 'demo', '{"theme": "light", "language": "pt-BR", "timezone": "America/Sao_Paulo", "currency": "BRL", "workingHours": {"start": "08:00", "end": "18:00"}, "appointmentDuration": 30}', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'ACTIVE');

-- Usuários (Senha placeholder - precisa trocar pelo hash real)
INSERT INTO "User" ("id", "tenantId", "email", "passwordHash", "name", "role", "professionalId", "specialties", "isActive")
VALUES
    ('e5f6a7b8-c9d0-1234-ef01-345678901234', 'd4e5f6a7-b8c9-0123-def0-234567890123', 'admin@demo.gmsystems.com.br', '$2b$10$rQZ8K8H8H8H8H8H8H8H8H.H8H8H8H8H8H8H8H8H8H8H8H8H8H8H8H', 'Administrador Demo', 'TENANT_ADMIN', NULL, ARRAY[]::TEXT[], true),
    ('f6a7b8c9-d0e1-2345-f012-456789012345', 'd4e5f6a7-b8c9-0123-def0-234567890123', 'medico@demo.gmsystems.com.br', '$2b$10$rQZ8K8H8H8H8H8H8H8H8H.H8H8H8H8H8H8H8H8H8H8H8H8H8H8H8H', 'Dr. João Silva', 'DOCTOR', 'CRM-SP 123456', ARRAY['Clínica Médica', 'Cardiologia']::TEXT[], true);

-- Salas
INSERT INTO "Room" ("id", "tenantId", "name", "description", "isActive")
VALUES
    ('a7b8c9d0-e1f2-3456-0123-567890123456', 'd4e5f6a7-b8c9-0123-def0-234567890123', 'Consultório 1', 'Consultório principal', true),
    ('b8c9d0e1-f2a3-4567-1234-678901234567', 'd4e5f6a7-b8c9-0123-def0-234567890123', 'Consultório 2', 'Consultório secundário', true),
    ('c9d0e1f2-a3b4-5678-2345-789012345678', 'd4e5f6a7-b8c9-0123-def0-234567890123', 'Sala de Procedimentos', 'Para procedimentos menores', true);

-- Pacientes
INSERT INTO "Patient" ("id", "tenantId", "fullName", "document", "birthDate", "gender", "phone", "email", "healthPlan", "consentGiven", "consentDate", "createdById")
VALUES
    ('d0e1f2a3-b4c5-6789-3456-890123456789', 'd4e5f6a7-b8c9-0123-def0-234567890123', 'Maria Santos', '123.456.789-00', '1985-03-15', 'FEMALE', '(11) 99999-0001', 'maria.santos@email.com', 'Unimed', true, CURRENT_TIMESTAMP, 'e5f6a7b8-c9d0-1234-ef01-345678901234'),
    ('e1f2a3b4-c5d6-7890-4567-901234567890', 'd4e5f6a7-b8c9-0123-def0-234567890123', 'José Oliveira', '987.654.321-00', '1970-08-20', 'MALE', '(11) 99999-0002', 'jose.oliveira@email.com', NULL, true, CURRENT_TIMESTAMP, 'e5f6a7b8-c9d0-1234-ef01-345678901234'),
    ('f2a3b4c5-d6e7-8901-5678-012345678901', 'd4e5f6a7-b8c9-0123-def0-234567890123', 'Ana Costa', '456.789.123-00', '1992-12-01', 'FEMALE', '(11) 99999-0003', 'ana.costa@email.com', 'Bradesco Saúde', true, CURRENT_TIMESTAMP, 'e5f6a7b8-c9d0-1234-ef01-345678901234');

-- ==========================================
-- SETUP COMPLETO!
-- ==========================================
