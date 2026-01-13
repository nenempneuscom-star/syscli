-- ==========================================
-- Guilherme Machado Systems
-- SQL Script 1: Enums
-- Execute este script PRIMEIRO no Supabase SQL Editor
-- ==========================================

-- Enum: Status do Tenant
CREATE TYPE "TenantStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'TRIAL');

-- Enum: Role do Usuário
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'TENANT_ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'BILLING_ADMIN');

-- Enum: Gênero
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY');

-- Enum: Tipo de Registro Médico
CREATE TYPE "RecordType" AS ENUM ('ANAMNESIS', 'EVOLUTION', 'PRESCRIPTION', 'EXAM_REQUEST', 'CERTIFICATE', 'REFERRAL');

-- Enum: Tipo de Agendamento
CREATE TYPE "AppointmentType" AS ENUM ('CONSULTATION', 'RETURN', 'PROCEDURE', 'EXAM', 'TELEMEDICINE');

-- Enum: Status do Agendamento
CREATE TYPE "AppointmentStatus" AS ENUM ('SCHEDULED', 'CONFIRMED', 'WAITING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- Enum: Status do Pagamento
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'PARTIAL', 'CANCELLED', 'REFUNDED');

-- Enum: Método de Pagamento
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'PIX', 'BANK_TRANSFER', 'HEALTH_PLAN');

-- Enum: Ação de Auditoria
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'READ', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT');

-- ==========================================
-- FIM do Script 1
-- Agora execute o Script 2 (02_tables.sql)
-- ==========================================
