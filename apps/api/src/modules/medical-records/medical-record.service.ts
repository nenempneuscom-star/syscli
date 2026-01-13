import { prisma } from '../../infrastructure/database/prisma.js';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '../../common/exceptions/http-exception.js';
import { createChildLogger } from '../../infrastructure/logging/logger.js';
import type { RecordType, MedicalRecordContent, PaginationQuery } from '@healthflow/shared-types';

const logger = createChildLogger('MedicalRecordService');

export interface CreateMedicalRecordInput {
  patientId: string;
  appointmentId?: string;
  type: RecordType;
  content: MedicalRecordContent;
  icdCodes?: string[];
  attachments?: string[];
}

export interface UpdateMedicalRecordInput {
  content?: MedicalRecordContent;
  icdCodes?: string[];
  attachments?: string[];
}

export interface MedicalRecordFilters extends PaginationQuery {
  patientId?: string;
  professionalId?: string;
  type?: RecordType;
  startDate?: string;
  endDate?: string;
}

export class MedicalRecordService {
  async findAll(tenantId: string, filters: MedicalRecordFilters) {
    const { page = 1, perPage = 20, patientId, professionalId, type, startDate, endDate } = filters;
    const skip = (page - 1) * perPage;

    const where = {
      tenantId,
      ...(patientId && { patientId }),
      ...(professionalId && { professionalId }),
      ...(type && { type }),
      ...(startDate && {
        createdAt: {
          gte: new Date(startDate),
          ...(endDate && { lte: new Date(endDate) }),
        },
      }),
    };

    const [records, total] = await Promise.all([
      prisma.medicalRecord.findMany({
        where,
        include: {
          patient: {
            select: { id: true, fullName: true, birthDate: true, gender: true },
          },
          professional: {
            select: { id: true, name: true, professionalId: true, specialties: true },
          },
          appointment: {
            select: { id: true, startTime: true, type: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: perPage,
      }),
      prisma.medicalRecord.count({ where }),
    ]);

    return {
      data: records,
      meta: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    };
  }

  async findById(tenantId: string, id: string) {
    const record = await prisma.medicalRecord.findFirst({
      where: { id, tenantId },
      include: {
        patient: {
          select: {
            id: true,
            fullName: true,
            birthDate: true,
            gender: true,
            allergies: true,
            bloodType: true,
          },
        },
        professional: {
          select: { id: true, name: true, professionalId: true, specialties: true },
        },
        appointment: {
          select: { id: true, startTime: true, endTime: true, type: true, status: true },
        },
      },
    });

    if (!record) {
      throw new NotFoundException('Medical record not found', 'RECORD_NOT_FOUND');
    }

    return record;
  }

  async findByPatient(tenantId: string, patientId: string, filters: MedicalRecordFilters) {
    const { page = 1, perPage = 20, type, startDate, endDate } = filters;
    const skip = (page - 1) * perPage;

    // Verify patient exists and belongs to tenant
    const patient = await prisma.patient.findFirst({
      where: { id: patientId, tenantId },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found', 'PATIENT_NOT_FOUND');
    }

    const where = {
      tenantId,
      patientId,
      ...(type && { type }),
      ...(startDate && {
        createdAt: {
          gte: new Date(startDate),
          ...(endDate && { lte: new Date(endDate) }),
        },
      }),
    };

    const [records, total] = await Promise.all([
      prisma.medicalRecord.findMany({
        where,
        include: {
          professional: {
            select: { id: true, name: true, professionalId: true },
          },
          appointment: {
            select: { id: true, startTime: true, type: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: perPage,
      }),
      prisma.medicalRecord.count({ where }),
    ]);

    return {
      data: records,
      meta: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    };
  }

  async create(tenantId: string, professionalId: string, input: CreateMedicalRecordInput) {
    const { patientId, appointmentId, type, content, icdCodes = [], attachments = [] } = input;

    // Verify patient exists
    const patient = await prisma.patient.findFirst({
      where: { id: patientId, tenantId },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found', 'PATIENT_NOT_FOUND');
    }

    // Verify appointment if provided
    if (appointmentId) {
      const appointment = await prisma.appointment.findFirst({
        where: { id: appointmentId, tenantId, patientId },
      });

      if (!appointment) {
        throw new NotFoundException('Appointment not found', 'APPOINTMENT_NOT_FOUND');
      }
    }

    // Validate content based on type
    this.validateContent(type, content);

    const record = await prisma.medicalRecord.create({
      data: {
        tenantId,
        patientId,
        professionalId,
        appointmentId,
        type,
        content,
        icdCodes,
        attachments,
      },
      include: {
        patient: {
          select: { id: true, fullName: true },
        },
        professional: {
          select: { id: true, name: true, professionalId: true },
        },
      },
    });

    logger.info(
      { recordId: record.id, patientId, professionalId, type },
      'Medical record created'
    );

    // Create audit log
    await prisma.auditLog.create({
      data: {
        tenantId,
        userId: professionalId,
        action: 'CREATE',
        resource: 'medical_record',
        resourceId: record.id,
        newValue: { type, patientId },
        ipAddress: '',
        userAgent: '',
      },
    });

    return record;
  }

  async update(
    tenantId: string,
    id: string,
    professionalId: string,
    input: UpdateMedicalRecordInput
  ) {
    const existingRecord = await prisma.medicalRecord.findFirst({
      where: { id, tenantId },
    });

    if (!existingRecord) {
      throw new NotFoundException('Medical record not found', 'RECORD_NOT_FOUND');
    }

    // Only the original author or admin can edit
    if (existingRecord.professionalId !== professionalId) {
      throw new ForbiddenException(
        'Only the original author can edit this record',
        'NOT_RECORD_AUTHOR'
      );
    }

    // Validate content if provided
    if (input.content) {
      this.validateContent(existingRecord.type as RecordType, input.content);
    }

    const record = await prisma.medicalRecord.update({
      where: { id },
      data: {
        ...input,
        version: { increment: 1 },
      },
      include: {
        patient: {
          select: { id: true, fullName: true },
        },
        professional: {
          select: { id: true, name: true, professionalId: true },
        },
      },
    });

    logger.info({ recordId: id, professionalId }, 'Medical record updated');

    // Create audit log
    await prisma.auditLog.create({
      data: {
        tenantId,
        userId: professionalId,
        action: 'UPDATE',
        resource: 'medical_record',
        resourceId: id,
        oldValue: { version: existingRecord.version },
        newValue: { version: record.version },
        ipAddress: '',
        userAgent: '',
      },
    });

    return record;
  }

  async addSignature(tenantId: string, id: string, professionalId: string, signature: string) {
    const record = await prisma.medicalRecord.findFirst({
      where: { id, tenantId },
    });

    if (!record) {
      throw new NotFoundException('Medical record not found', 'RECORD_NOT_FOUND');
    }

    if (record.professionalId !== professionalId) {
      throw new ForbiddenException(
        'Only the original author can sign this record',
        'NOT_RECORD_AUTHOR'
      );
    }

    if (record.signature) {
      throw new BadRequestException('Record already signed', 'ALREADY_SIGNED');
    }

    const updatedRecord = await prisma.medicalRecord.update({
      where: { id },
      data: { signature },
    });

    logger.info({ recordId: id, professionalId }, 'Medical record signed');

    return updatedRecord;
  }

  async getPatientTimeline(tenantId: string, patientId: string) {
    // Get all records, appointments, and invoices for a patient timeline
    const [records, appointments] = await Promise.all([
      prisma.medicalRecord.findMany({
        where: { tenantId, patientId },
        include: {
          professional: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      prisma.appointment.findMany({
        where: { tenantId, patientId },
        include: {
          professional: {
            select: { id: true, name: true },
          },
        },
        orderBy: { startTime: 'desc' },
        take: 50,
      }),
    ]);

    // Combine and sort by date
    const timeline = [
      ...records.map((r) => ({
        type: 'medical_record' as const,
        subtype: r.type,
        date: r.createdAt,
        data: r,
      })),
      ...appointments.map((a) => ({
        type: 'appointment' as const,
        subtype: a.type,
        date: a.startTime,
        data: a,
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return timeline;
  }

  async getTemplates(tenantId: string, type?: RecordType) {
    // Return predefined templates for different record types
    const templates = {
      ANAMNESIS: {
        name: 'Anamnese Completa',
        type: 'ANAMNESIS',
        content: {
          chiefComplaint: '',
          historyOfPresentIllness: '',
          pastMedicalHistory: '',
          familyHistory: '',
          socialHistory: '',
          allergies: [],
          medications: [],
          reviewOfSystems: {
            general: '',
            cardiovascular: '',
            respiratory: '',
            gastrointestinal: '',
            genitourinary: '',
            musculoskeletal: '',
            neurological: '',
            psychiatric: '',
          },
        },
      },
      EVOLUTION: {
        name: 'Evolucao Clinica',
        type: 'EVOLUTION',
        content: {
          subjective: '',
          objective: '',
          vitalSigns: {
            bloodPressure: '',
            heartRate: null,
            temperature: null,
            respiratoryRate: null,
            oxygenSaturation: null,
            weight: null,
            height: null,
          },
          physicalExamination: '',
          assessment: '',
          plan: '',
        },
      },
      PRESCRIPTION: {
        name: 'Prescricao Medica',
        type: 'PRESCRIPTION',
        content: {
          prescriptions: [
            {
              medication: '',
              dosage: '',
              frequency: '',
              duration: '',
              route: 'oral',
              instructions: '',
            },
          ],
          generalInstructions: '',
        },
      },
      EXAM_REQUEST: {
        name: 'Solicitacao de Exames',
        type: 'EXAM_REQUEST',
        content: {
          exams: [],
          clinicalIndication: '',
          urgency: 'routine',
          observations: '',
        },
      },
      CERTIFICATE: {
        name: 'Atestado Medico',
        type: 'CERTIFICATE',
        content: {
          certificateType: 'medical_leave',
          startDate: '',
          endDate: '',
          daysOff: null,
          cid: '',
          description: '',
        },
      },
      REFERRAL: {
        name: 'Encaminhamento',
        type: 'REFERRAL',
        content: {
          specialty: '',
          reason: '',
          clinicalSummary: '',
          urgency: 'routine',
          examsAttached: [],
        },
      },
    };

    if (type) {
      return templates[type] ? [templates[type]] : [];
    }

    return Object.values(templates);
  }

  private validateContent(type: RecordType, content: MedicalRecordContent): void {
    // Basic validation based on record type
    switch (type) {
      case 'ANAMNESIS':
        if (!content.chiefComplaint && !content.historyOfPresentIllness) {
          throw new BadRequestException(
            'Anamnesis requires chief complaint or history',
            'INVALID_ANAMNESIS'
          );
        }
        break;
      case 'EVOLUTION':
        if (!content.assessment && !content.plan) {
          throw new BadRequestException(
            'Evolution requires assessment or plan',
            'INVALID_EVOLUTION'
          );
        }
        break;
      case 'PRESCRIPTION':
        if (!content.prescriptions || content.prescriptions.length === 0) {
          throw new BadRequestException(
            'Prescription requires at least one medication',
            'INVALID_PRESCRIPTION'
          );
        }
        break;
    }
  }
}

export const medicalRecordService = new MedicalRecordService();
