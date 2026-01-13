import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create default plan
  const plan = await prisma.plan.upsert({
    where: { name: 'Professional' },
    update: {},
    create: {
      name: 'Professional',
      description: 'Plano profissional para clinicas de medio porte',
      price: 299.90,
      maxUsers: 10,
      maxPatients: 5000,
      features: {
        telemedicine: true,
        billing: true,
        inventory: true,
        multiLocation: false,
        customReports: true,
        apiAccess: false,
      },
    },
  });

  console.log('Created plan:', plan.name);

  // Create demo tenant
  const tenant = await prisma.tenant.upsert({
    where: { subdomain: 'demo' },
    update: {},
    create: {
      name: 'Clinica Demo',
      document: '12345678000190',
      subdomain: 'demo',
      planId: plan.id,
      status: 'ACTIVE',
      settings: {
        timezone: 'America/Sao_Paulo',
        currency: 'BRL',
        language: 'pt-BR',
        workingHours: { start: '08:00', end: '18:00' },
        appointmentDuration: 30,
        features: {
          telemedicine: false,
          billing: true,
          inventory: true,
          multiLocation: false,
        },
      },
    },
  });

  console.log('Created tenant:', tenant.name);

  // Create admin user
  const adminPassword = await bcrypt.hash('Admin@123', 12);
  const admin = await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: tenant.id,
        email: 'admin@demo.healthflow.com',
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'admin@demo.healthflow.com',
      passwordHash: adminPassword,
      name: 'Administrador',
      role: 'TENANT_ADMIN',
      isActive: true,
    },
  });

  console.log('Created admin user:', admin.email);

  // Create doctor user
  const doctorPassword = await bcrypt.hash('Doctor@123', 12);
  const doctor = await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: tenant.id,
        email: 'medico@demo.healthflow.com',
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'medico@demo.healthflow.com',
      passwordHash: doctorPassword,
      name: 'Dr. Carlos Silva',
      role: 'DOCTOR',
      professionalId: 'CRM-SP 123456',
      specialties: ['Clinica Geral', 'Cardiologia'],
      isActive: true,
    },
  });

  console.log('Created doctor user:', doctor.email);

  // Create receptionist user
  const receptionistPassword = await bcrypt.hash('Recep@123', 12);
  const receptionist = await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: tenant.id,
        email: 'recepcao@demo.healthflow.com',
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'recepcao@demo.healthflow.com',
      passwordHash: receptionistPassword,
      name: 'Maria Santos',
      role: 'RECEPTIONIST',
      isActive: true,
    },
  });

  console.log('Created receptionist user:', receptionist.email);

  // Create sample room
  const room = await prisma.room.upsert({
    where: {
      tenantId_name: {
        tenantId: tenant.id,
        name: 'Consultorio 1',
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'Consultorio 1',
      description: 'Consultorio principal',
      isActive: true,
    },
  });

  console.log('Created room:', room.name);

  // Create sample patients
  const patients = [
    {
      fullName: 'Joao Pedro Oliveira',
      document: '12345678901',
      birthDate: new Date('1985-03-15'),
      gender: 'MALE' as const,
      phone: '11999998888',
      email: 'joao@email.com',
      healthPlan: 'Unimed',
    },
    {
      fullName: 'Ana Maria Costa',
      document: '98765432109',
      birthDate: new Date('1990-07-22'),
      gender: 'FEMALE' as const,
      phone: '11988887777',
      email: 'ana@email.com',
    },
    {
      fullName: 'Roberto Carlos Souza',
      document: '45678912345',
      birthDate: new Date('1978-11-30'),
      gender: 'MALE' as const,
      phone: '11977776666',
      healthPlan: 'Bradesco Saude',
    },
  ];

  for (const patientData of patients) {
    const patient = await prisma.patient.upsert({
      where: {
        tenantId_document: {
          tenantId: tenant.id,
          document: patientData.document,
        },
      },
      update: {},
      create: {
        tenantId: tenant.id,
        ...patientData,
        consentGiven: true,
        consentDate: new Date(),
        createdById: admin.id,
      },
    });

    console.log('Created patient:', patient.fullName);
  }

  console.log('');
  console.log('========================================');
  console.log('Seed completed successfully!');
  console.log('========================================');
  console.log('');
  console.log('Demo credentials:');
  console.log('  Admin: admin@demo.healthflow.com / Admin@123');
  console.log('  Doctor: medico@demo.healthflow.com / Doctor@123');
  console.log('  Receptionist: recepcao@demo.healthflow.com / Recep@123');
  console.log('');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
