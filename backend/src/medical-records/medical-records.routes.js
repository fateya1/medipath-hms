// backend/src/medical-records/medical-records.routes.js
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../common/prisma.js';
import { authenticate, authorize } from '../common/guards/jwt.guard.js';
import { validate } from '../common/pipes/validate.js';

export const medicalRecordsRouter = Router();
medicalRecordsRouter.use(authenticate);

const createSchema = z.object({
  patientId: z.string().min(1), appointmentId: z.string().optional(), admissionId: z.string().optional(),
  chiefComplaint: z.string().min(1), history: z.string().optional(), examination: z.string().optional(),
  diagnosis: z.array(z.string()).default([]), icdCodes: z.array(z.string()).default([]),
  plan: z.string().optional(), notes: z.string().optional(), followUpAdvice: z.string().optional(),
});

medicalRecordsRouter.get('/:id', async (req, res, next) => {
  try {
    const record = await prisma.medicalRecord.findUnique({
      where: { id: req.params.id },
      include: {
        doctor: { select: { id:true, firstName:true, lastName:true, title:true, specialisation:true } },
        prescriptions: { include: { items: { include: { drug: { select: { id:true, name:true, form:true, strength:true } } } } } },
        labRequests: { include: { items: { include: { labTest: true, result: true } } } },
        attachments: true,
      },
    });
    if (!record) return res.status(404).json({ error: 'Record not found' });
    return res.json(record);
  } catch (err) { next(err); }
});

medicalRecordsRouter.post('/', authorize('DOCTOR','NURSE'), validate(createSchema), async (req, res, next) => {
  try {
    const record = await prisma.medicalRecord.create({
      data: { ...req.body, doctorId: req.user.profileId },
    });
    return res.status(201).json(record);
  } catch (err) { next(err); }
});
