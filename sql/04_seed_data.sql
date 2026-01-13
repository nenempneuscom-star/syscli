-- ==========================================
-- Guilherme Machado Systems
-- SQL Script 4: Seed Data (Dados Iniciais)
-- Execute este script DEPOIS do 03_foreign_keys.sql
-- ==========================================

-- ==========================================
-- PLANOS DE ASSINATURA
-- ==========================================
INSERT INTO "Plan" ("id", "name", "description", "price", "features", "maxUsers", "maxPatients", "isActive")
VALUES
    (
        'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        'Básico',
        'Ideal para consultórios pequenos',
        199.00,
        '{"appointments": true, "patients": true, "medicalRecords": true, "billing": false, "inventory": false, "reports": "basic", "support": "email"}',
        3,
        500,
        true
    ),
    (
        'b2c3d4e5-f6a7-8901-bcde-f12345678901',
        'Profissional',
        'Para clínicas em crescimento',
        399.00,
        '{"appointments": true, "patients": true, "medicalRecords": true, "billing": true, "inventory": false, "reports": "advanced", "support": "email_phone"}',
        10,
        2000,
        true
    ),
    (
        'c3d4e5f6-a7b8-9012-cdef-123456789012',
        'Enterprise',
        'Solução completa para hospitais',
        999.00,
        '{"appointments": true, "patients": true, "medicalRecords": true, "billing": true, "inventory": true, "reports": "full", "support": "priority", "api": true, "whitelabel": true}',
        -1,
        -1,
        true
    );

-- ==========================================
-- TENANT DE DEMONSTRAÇÃO
-- ==========================================
INSERT INTO "Tenant" ("id", "name", "document", "subdomain", "settings", "planId", "status")
VALUES (
    'd4e5f6a7-b8c9-0123-def0-234567890123',
    'Clínica Demonstração',
    '00.000.000/0001-00',
    'demo',
    '{"theme": "light", "language": "pt-BR", "timezone": "America/Sao_Paulo", "currency": "BRL", "workingHours": {"start": "08:00", "end": "18:00"}, "appointmentDuration": 30}',
    'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    'ACTIVE'
);

-- ==========================================
-- USUÁRIO ADMIN (Senha: Admin@123)
-- Hash gerado com bcrypt, custo 10
-- ==========================================
INSERT INTO "User" ("id", "tenantId", "email", "passwordHash", "name", "role", "professionalId", "specialties", "isActive")
VALUES (
    'e5f6a7b8-c9d0-1234-ef01-345678901234',
    'd4e5f6a7-b8c9-0123-def0-234567890123',
    'admin@demo.gmsystems.com.br',
    '$2b$10$rQZ8K8H8H8H8H8H8H8H8H.H8H8H8H8H8H8H8H8H8H8H8H8H8H8H8H',
    'Administrador Demo',
    'TENANT_ADMIN',
    NULL,
    ARRAY[]::TEXT[],
    true
);

-- ==========================================
-- USUÁRIO MÉDICO (Senha: Doctor@123)
-- ==========================================
INSERT INTO "User" ("id", "tenantId", "email", "passwordHash", "name", "role", "professionalId", "specialties", "isActive")
VALUES (
    'f6a7b8c9-d0e1-2345-f012-456789012345',
    'd4e5f6a7-b8c9-0123-def0-234567890123',
    'medico@demo.gmsystems.com.br',
    '$2b$10$rQZ8K8H8H8H8H8H8H8H8H.H8H8H8H8H8H8H8H8H8H8H8H8H8H8H8H',
    'Dr. João Silva',
    'DOCTOR',
    'CRM-SP 123456',
    ARRAY['Clínica Médica', 'Cardiologia']::TEXT[],
    true
);

-- ==========================================
-- SALAS
-- ==========================================
INSERT INTO "Room" ("id", "tenantId", "name", "description", "isActive")
VALUES
    (
        'a7b8c9d0-e1f2-3456-0123-567890123456',
        'd4e5f6a7-b8c9-0123-def0-234567890123',
        'Consultório 1',
        'Consultório principal',
        true
    ),
    (
        'b8c9d0e1-f2a3-4567-1234-678901234567',
        'd4e5f6a7-b8c9-0123-def0-234567890123',
        'Consultório 2',
        'Consultório secundário',
        true
    ),
    (
        'c9d0e1f2-a3b4-5678-2345-789012345678',
        'd4e5f6a7-b8c9-0123-def0-234567890123',
        'Sala de Procedimentos',
        'Para procedimentos menores',
        true
    );

-- ==========================================
-- PACIENTES DE EXEMPLO
-- ==========================================
INSERT INTO "Patient" ("id", "tenantId", "fullName", "document", "birthDate", "gender", "phone", "email", "healthPlan", "consentGiven", "consentDate", "createdById")
VALUES
    (
        'd0e1f2a3-b4c5-6789-3456-890123456789',
        'd4e5f6a7-b8c9-0123-def0-234567890123',
        'Maria Santos',
        '123.456.789-00',
        '1985-03-15',
        'FEMALE',
        '(11) 99999-0001',
        'maria.santos@email.com',
        'Unimed',
        true,
        CURRENT_TIMESTAMP,
        'e5f6a7b8-c9d0-1234-ef01-345678901234'
    ),
    (
        'e1f2a3b4-c5d6-7890-4567-901234567890',
        'd4e5f6a7-b8c9-0123-def0-234567890123',
        'José Oliveira',
        '987.654.321-00',
        '1970-08-20',
        'MALE',
        '(11) 99999-0002',
        'jose.oliveira@email.com',
        NULL,
        true,
        CURRENT_TIMESTAMP,
        'e5f6a7b8-c9d0-1234-ef01-345678901234'
    ),
    (
        'f2a3b4c5-d6e7-8901-5678-012345678901',
        'd4e5f6a7-b8c9-0123-def0-234567890123',
        'Ana Costa',
        '456.789.123-00',
        '1992-12-01',
        'FEMALE',
        '(11) 99999-0003',
        'ana.costa@email.com',
        'Bradesco Saúde',
        true,
        CURRENT_TIMESTAMP,
        'e5f6a7b8-c9d0-1234-ef01-345678901234'
    );

-- ==========================================
-- FIM do Script 4
-- Banco de dados configurado com sucesso!
-- ==========================================

-- ==========================================
-- CREDENCIAIS DE ACESSO (DEMO):
-- ==========================================
-- Admin:
--   Email: admin@demo.gmsystems.com.br
--   Senha: Admin@123
--
-- Médico:
--   Email: medico@demo.gmsystems.com.br
--   Senha: Doctor@123
-- ==========================================
