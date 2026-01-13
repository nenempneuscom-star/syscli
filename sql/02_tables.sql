-- ==========================================
-- Guilherme Machado Systems
-- SQL Script 2: Tables
-- Execute este script DEPOIS do 01_enums.sql
-- ==========================================

-- ==========================================
-- TABELA: Plan (Planos de Assinatura)
-- ==========================================
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

-- ==========================================
-- TABELA: Tenant (Clínicas/Hospitais)
-- ==========================================
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

-- ==========================================
-- TABELA: User (Usuários)
-- ==========================================
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

-- ==========================================
-- TABELA: Patient (Pacientes)
-- ==========================================
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

-- ==========================================
-- TABELA: Room (Salas)
-- ==========================================
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

-- ==========================================
-- TABELA: Appointment (Agendamentos)
-- ==========================================
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

-- ==========================================
-- TABELA: MedicalRecord (Prontuários)
-- ==========================================
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

-- ==========================================
-- TABELA: Invoice (Faturas)
-- ==========================================
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

-- ==========================================
-- TABELA: InventoryItem (Estoque)
-- ==========================================
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

-- ==========================================
-- TABELA: AuditLog (Log de Auditoria)
-- ==========================================
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
-- FIM do Script 2
-- Agora execute o Script 3 (03_foreign_keys.sql)
-- ==========================================
