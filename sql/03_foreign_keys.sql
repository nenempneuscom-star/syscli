-- ==========================================
-- Guilherme Machado Systems
-- SQL Script 3: Foreign Keys
-- Execute este script DEPOIS do 02_tables.sql
-- ==========================================

-- ==========================================
-- FOREIGN KEYS: Tenant
-- ==========================================
ALTER TABLE "Tenant"
    ADD CONSTRAINT "Tenant_planId_fkey"
    FOREIGN KEY ("planId")
    REFERENCES "Plan"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- ==========================================
-- FOREIGN KEYS: User
-- ==========================================
ALTER TABLE "User"
    ADD CONSTRAINT "User_tenantId_fkey"
    FOREIGN KEY ("tenantId")
    REFERENCES "Tenant"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- ==========================================
-- FOREIGN KEYS: Patient
-- ==========================================
ALTER TABLE "Patient"
    ADD CONSTRAINT "Patient_tenantId_fkey"
    FOREIGN KEY ("tenantId")
    REFERENCES "Tenant"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Patient"
    ADD CONSTRAINT "Patient_createdById_fkey"
    FOREIGN KEY ("createdById")
    REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- ==========================================
-- FOREIGN KEYS: Room
-- ==========================================
ALTER TABLE "Room"
    ADD CONSTRAINT "Room_tenantId_fkey"
    FOREIGN KEY ("tenantId")
    REFERENCES "Tenant"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- ==========================================
-- FOREIGN KEYS: Appointment
-- ==========================================
ALTER TABLE "Appointment"
    ADD CONSTRAINT "Appointment_tenantId_fkey"
    FOREIGN KEY ("tenantId")
    REFERENCES "Tenant"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Appointment"
    ADD CONSTRAINT "Appointment_patientId_fkey"
    FOREIGN KEY ("patientId")
    REFERENCES "Patient"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Appointment"
    ADD CONSTRAINT "Appointment_professionalId_fkey"
    FOREIGN KEY ("professionalId")
    REFERENCES "User"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Appointment"
    ADD CONSTRAINT "Appointment_roomId_fkey"
    FOREIGN KEY ("roomId")
    REFERENCES "Room"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- ==========================================
-- FOREIGN KEYS: MedicalRecord
-- ==========================================
ALTER TABLE "MedicalRecord"
    ADD CONSTRAINT "MedicalRecord_tenantId_fkey"
    FOREIGN KEY ("tenantId")
    REFERENCES "Tenant"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MedicalRecord"
    ADD CONSTRAINT "MedicalRecord_patientId_fkey"
    FOREIGN KEY ("patientId")
    REFERENCES "Patient"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MedicalRecord"
    ADD CONSTRAINT "MedicalRecord_professionalId_fkey"
    FOREIGN KEY ("professionalId")
    REFERENCES "User"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "MedicalRecord"
    ADD CONSTRAINT "MedicalRecord_appointmentId_fkey"
    FOREIGN KEY ("appointmentId")
    REFERENCES "Appointment"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- ==========================================
-- FOREIGN KEYS: Invoice
-- ==========================================
ALTER TABLE "Invoice"
    ADD CONSTRAINT "Invoice_tenantId_fkey"
    FOREIGN KEY ("tenantId")
    REFERENCES "Tenant"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Invoice"
    ADD CONSTRAINT "Invoice_patientId_fkey"
    FOREIGN KEY ("patientId")
    REFERENCES "Patient"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Invoice"
    ADD CONSTRAINT "Invoice_appointmentId_fkey"
    FOREIGN KEY ("appointmentId")
    REFERENCES "Appointment"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- ==========================================
-- FOREIGN KEYS: InventoryItem
-- ==========================================
ALTER TABLE "InventoryItem"
    ADD CONSTRAINT "InventoryItem_tenantId_fkey"
    FOREIGN KEY ("tenantId")
    REFERENCES "Tenant"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- ==========================================
-- FOREIGN KEYS: AuditLog
-- ==========================================
ALTER TABLE "AuditLog"
    ADD CONSTRAINT "AuditLog_tenantId_fkey"
    FOREIGN KEY ("tenantId")
    REFERENCES "Tenant"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- ==========================================
-- FIM do Script 3
-- Agora execute o Script 4 (04_seed_data.sql)
-- ==========================================
