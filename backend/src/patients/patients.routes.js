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
// ─────────────────────────────────────────────────────────────────────────────
// ADD THIS BLOCK to the bottom of backend/src/patients/patients.routes.js
// (before the last line that might close the file, if any)
// ─────────────────────────────────────────────────────────────────────────────
//
// Also add this import at the TOP of patients.routes.js (with the other imports):
//   import bcrypt from 'bcryptjs';
//
// ─────────────────────────────────────────────────────────────────────────────

// ─── Helper: generate sequential patient number ───────────────────────────
async function generatePatientNumber() {
  const year = new Date().getFullYear();
  const count = await prisma.patient.count();
  return `MED-${year}-${String(count + 1).padStart(5, '0')}`;
}

// ─── POST /api/patients/import ────────────────────────────────────────────
//
// Accepts JSON body: { patients: [ ...rows ] }
// Each row (from CSV) should have:
//   firstName, lastName, dateOfBirth (YYYY-MM-DD), gender (MALE/FEMALE),
//   phone, shaNumber (optional), county (optional), bloodGroup (optional)
//
// The route creates a User + Patient per row inside a transaction.
// A temporary password is generated; patients can reset via forgot-password.
//
patientsRouter.post(
  '/import',
  authorize('ADMIN', 'RECEPTIONIST'),
  async (req, res, next) => {
    try {
      const rows = req.body?.patients;
      if (!Array.isArray(rows) || rows.length === 0) {
        return res.status(400).json({ error: 'No patient rows provided' });
      }

      // ── Resolve tenant_id from JWT ──────────────────────────────────────
      // The JWT guard sets req.user — check which field carries the tenant.
      // Common patterns: req.user.tenantId  OR  req.user.tenant_id
      // We try both; adjust if your guard uses a different field name.
      const tenantId = req.user?.tenantId ?? req.user?.tenant_id;
      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant context missing from token' });
      }

      const VALID_GENDERS   = ['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'];
      const VALID_BG        = [
        'O_POSITIVE','O_NEGATIVE','A_POSITIVE','A_NEGATIVE',
        'B_POSITIVE','B_NEGATIVE','AB_POSITIVE','AB_NEGATIVE','UNKNOWN',
      ];

      let imported = 0;
      let skipped  = 0;
      let failed   = 0;
      const errors = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNum = i + 1;

        try {
          // ── Basic validation ──────────────────────────────────────────
          if (!row.firstName?.trim() || !row.lastName?.trim()) {
            errors.push({ row: rowNum, error: 'Missing firstName or lastName' });
            failed++;
            continue;
          }
          if (!row.phone?.trim()) {
            errors.push({ row: rowNum, error: 'Missing phone number' });
            failed++;
            continue;
          }
          if (!row.dateOfBirth?.trim()) {
            errors.push({ row: rowNum, error: 'Missing dateOfBirth' });
            failed++;
            continue;
          }

          const dob = new Date(row.dateOfBirth);
          if (isNaN(dob.getTime())) {
            errors.push({ row: rowNum, error: `Invalid dateOfBirth: ${row.dateOfBirth}` });
            failed++;
            continue;
          }

          const gender = row.gender?.toUpperCase();
          if (!VALID_GENDERS.includes(gender)) {
            errors.push({ row: rowNum, error: `Invalid gender: ${row.gender}` });
            failed++;
            continue;
          }

          const bloodGroup = row.bloodGroup?.toUpperCase();
          const resolvedBloodGroup = VALID_BG.includes(bloodGroup) ? bloodGroup : 'UNKNOWN';

          // ── Check for duplicate phone or shaNumber ────────────────────
          const phoneExists = await prisma.patient.findFirst({
            where: { phone: row.phone.trim(), tenant_id: tenantId },
          });
          if (phoneExists) {
            errors.push({ row: rowNum, error: `Phone ${row.phone} already registered` });
            skipped++;
            continue;
          }

          if (row.shaNumber?.trim()) {
            const shaExists = await prisma.patient.findFirst({
              where: { shaNumber: row.shaNumber.trim() },
            });
            if (shaExists) {
              errors.push({ row: rowNum, error: `SHA number ${row.shaNumber} already exists` });
              skipped++;
              continue;
            }
          }

          // ── Generate unique identifiers ───────────────────────────────
          const patientNumber = await generatePatientNumber();

          // Use phone as basis for a deterministic but unique temp email
          // (avoids needing real emails in bulk imports)
          const tempEmail = `patient.${row.phone.trim().replace(/\D/g,'')}@import.medipath.local`;

          const emailExists = await prisma.user.findUnique({ where: { email: tempEmail } });
          if (emailExists) {
            // Already imported — skip silently
            skipped++;
            continue;
          }

          // Temporary password: patients must reset via forgot-password flow
          const tempPassword = `MED@${row.phone.trim().slice(-4)}${new Date(dob).getFullYear()}`;
          const passwordHash = await bcrypt.hash(tempPassword, 10);

          // ── Create User + Patient in a transaction ────────────────────
          await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
              data: {
                email:        tempEmail,
                passwordHash,
                role:         'PATIENT',
                isActive:     true,
                isVerified:   false,
                tenant_id:    tenantId,
              },
            });

            await tx.patient.create({
              data: {
                userId:        user.id,
                tenant_id:     tenantId,
                patientNumber,
                firstName:     row.firstName.trim(),
                lastName:      row.lastName.trim(),
                middleName:    row.middleName?.trim() || null,
                dateOfBirth:   dob,
                gender,
                phone:         row.phone.trim(),
                shaNumber:     row.shaNumber?.trim() || null,
                county:        row.county?.trim() || null,
                bloodGroup:    resolvedBloodGroup,
                isActive:      true,
              },
            });
          });

          imported++;

        } catch (err) {
          // Surface Prisma error codes to the caller
          const code    = err.code    || 'UNKNOWN';
          const meta    = err.meta    ? JSON.stringify(err.meta) : '';
          const message = err.message || 'Unexpected error';
          errors.push({
            row:   rowNum,
            error: `${code}${meta ? ` [${meta}]` : ''}: ${message}`,
          });
          failed++;
        }
      }

      return res.json({ total: rows.length, imported, skipped, failed, errors });

    } catch (err) {
      next(err);
    }
  }
);
