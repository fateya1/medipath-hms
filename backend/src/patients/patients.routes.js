// backend/src/patients/patients.routes.js

import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../common/prisma.js';
import { authenticate, authorize } from '../common/guards/jwt.guard.js';
import { validate, validateQuery } from '../common/pipes/validate.js';

export const patientsRouter = Router();

// All patient routes require authentication
patientsRouter.use(authenticate);

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  county: z.string().optional(),
  bloodGroup: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']).optional(),
});

const updatePatientSchema = z.object({
  firstName: z.string().optional(),
  middleName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  altPhone: z.string().optional(),
  county: z.string().optional(),
  subCounty: z.string().optional(),
  ward: z.string().optional(),
  village: z.string().optional(),
  allergies: z.array(z.string()).optional(),
  chronicConditions: z.array(z.string()).optional(),
  bloodGroup: z.string().optional(),
  nhifNumber: z.string().optional(),
  shaNumber: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
  emergencyRelation: z.string().optional(),
  insuranceProvider: z.string().optional(),
  insurancePolicyNo: z.string().optional(),
});

// ─── GET /api/patients ─────────────────────────────────────────────────────

patientsRouter.get('/', authorize('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST'), validateQuery(querySchema), async (req, res, next) => {
  try {
    const { page, limit, search, county, bloodGroup, gender } = req.query;
    const skip = (page - 1) * limit;

    const where = {
      isActive: true,
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { patientNumber: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search } },
          { nationalId: { contains: search } },
          { nhifNumber: { contains: search } },
        ],
      }),
      ...(county && { county }),
      ...(bloodGroup && { bloodGroup }),
      ...(gender && { gender }),
    };

    const [patients, total] = await Promise.all([
      prisma.patient.findMany({
        where,
        skip,
        take: limit,
        orderBy: { registeredAt: 'desc' },
        select: {
          id: true, patientNumber: true, firstName: true, middleName: true,
          lastName: true, dateOfBirth: true, gender: true, phone: true,
          county: true, bloodGroup: true, nhifNumber: true, shaNumber: true,
          registeredAt: true, isActive: true,
          user: { select: { email: true, isActive: true } },
        },
      }),
      prisma.patient.count({ where }),
    ]);

    return res.json({
      data: patients,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/patients/:id ─────────────────────────────────────────────────

patientsRouter.get('/:id', async (req, res, next) => {
  try {
    // Patients can only access their own record
    if (req.user.role === 'PATIENT' && req.user.profileId !== req.params.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const patient = await prisma.patient.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { email: true, isActive: true, isVerified: true, lastLoginAt: true } },
        nextOfKin: true,
        appointments: {
          orderBy: { scheduledAt: 'desc' },
          take: 5,
          select: {
            id: true, appointmentNo: true, type: true, status: true, scheduledAt: true,
            doctor: { select: { firstName: true, lastName: true, title: true } },
            department: { select: { name: true } },
          },
        },
        admissions: {
          orderBy: { admittedAt: 'desc' },
          take: 3,
          select: { id: true, admissionNo: true, status: true, admittedAt: true, ward: true, bedNumber: true },
        },
        vitalSigns: { orderBy: { recordedAt: 'desc' }, take: 1 },
      },
    });

    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    return res.json(patient);
  } catch (err) {
    next(err);
  }
});

// ─── PATCH /api/patients/:id ───────────────────────────────────────────────

patientsRouter.patch('/:id', validate(updatePatientSchema), async (req, res, next) => {
  try {
    if (req.user.role === 'PATIENT' && req.user.profileId !== req.params.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const patient = await prisma.patient.update({
      where: { id: req.params.id },
      data: req.body,
    });
    return res.json(patient);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Patient not found' });
    next(err);
  }
});

// ─── DELETE /api/patients/:id (soft delete) ────────────────────────────────

patientsRouter.delete('/:id', authorize('ADMIN'), async (req, res, next) => {
  try {
    await prisma.patient.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });
    return res.json({ message: 'Patient deactivated successfully' });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Patient not found' });
    next(err);
  }
});

// ─── GET /api/patients/:id/medical-records ─────────────────────────────────

patientsRouter.get('/:id/medical-records', async (req, res, next) => {
  try {
    if (req.user.role === 'PATIENT' && req.user.profileId !== req.params.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const records = await prisma.medicalRecord.findMany({
      where: { patientId: req.params.id },
      orderBy: { createdAt: 'desc' },
      include: {
        doctor: { select: { firstName: true, lastName: true, title: true, specialisation: true } },
        prescriptions: { include: { items: { include: { drug: { select: { name: true, form: true, strength: true } } } } } },
        labRequests: { include: { items: { include: { labTest: true, result: true } } } },
      },
    });

    return res.json(records);
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/patients/:id/vitals ─────────────────────────────────────────

patientsRouter.get('/:id/vitals', async (req, res, next) => {
  try {
    if (req.user.role === 'PATIENT' && req.user.profileId !== req.params.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const vitals = await prisma.vitalSign.findMany({
      where: { patientId: req.params.id },
      orderBy: { recordedAt: 'desc' },
      take: 10,
      include: { staff: { select: { firstName: true, lastName: true, role: true } } },
    });

    return res.json(vitals);
  } catch (err) {
    next(err);
  }
});
