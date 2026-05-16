// backend/src/appointments/appointments.routes.js
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../common/prisma.js';
import { authenticate, authorize } from '../common/guards/jwt.guard.js';
import { validate } from '../common/pipes/validate.js';

export const appointmentsRouter = Router();
appointmentsRouter.use(authenticate);

async function genNo() {
  const y = new Date().getFullYear();
  const n = await prisma.appointment.count();
  return `APT-${y}-${String(n + 1).padStart(5, '0')}`;
}

const createSchema = z.object({
  patientId: z.string().min(1), doctorId: z.string().min(1), departmentId: z.string().min(1),
  type: z.enum(['OPD','INPATIENT','FOLLOW_UP','EMERGENCY','TELEMEDICINE','PROCEDURE']).default('OPD'),
  scheduledAt: z.string().datetime(), duration: z.number().min(10).max(240).default(30),
  reason: z.string().optional(), notes: z.string().optional(),
});

const updateSchema = z.object({
  status: z.enum(['SCHEDULED','CONFIRMED','IN_PROGRESS','COMPLETED','CANCELLED','NO_SHOW','RESCHEDULED']).optional(),
  scheduledAt: z.string().datetime().optional(), notes: z.string().optional(),
});

appointmentsRouter.get('/', async (req, res, next) => {
  try {
    const { page=1, limit=20, status, doctorId, patientId, type } = req.query;
    const skip = (Number(page)-1)*Number(limit);
    const where = {
      ...(status    && { status }),
      ...(type      && { type }),
      ...(doctorId  && { doctorId }),
      ...(patientId && { patientId }),
      ...(req.user.role==='PATIENT' && { patientId: req.user.profileId }),
      ...(req.user.role==='DOCTOR'  && { doctorId:  req.user.profileId }),
    };
    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where, skip, take: Number(limit), orderBy: { scheduledAt: 'asc' },
        include: {
          patient:    { select: { id:true, firstName:true, lastName:true, patientNumber:true, phone:true, gender:true, dateOfBirth:true } },
          doctor:     { select: { id:true, firstName:true, lastName:true, title:true, specialisation:true } },
          department: { select: { id:true, name:true, code:true } },
        },
      }),
      prisma.appointment.count({ where }),
    ]);
    return res.json({ data: appointments, pagination: { page:+page, limit:+limit, total, pages: Math.ceil(total/Number(limit)) } });
  } catch (err) { next(err); }
});

appointmentsRouter.get('/:id', async (req, res, next) => {
  try {
    const appt = await prisma.appointment.findUnique({
      where: { id: req.params.id },
      include: {
        patient:    { select: { id:true, firstName:true, lastName:true, patientNumber:true, phone:true, gender:true, dateOfBirth:true, bloodGroup:true } },
        doctor:     { select: { id:true, firstName:true, lastName:true, title:true, specialisation:true } },
        department: { select: { id:true, name:true, code:true } },
        medicalRecord: { include: { prescriptions: true, labRequests: true } },
      },
    });
    if (!appt) return res.status(404).json({ error: 'Appointment not found' });
    return res.json(appt);
  } catch (err) { next(err); }
});

appointmentsRouter.post('/', validate(createSchema), async (req, res, next) => {
  try {
    const appointmentNo = await genNo();
    const appt = await prisma.appointment.create({
      data: { ...req.body, appointmentNo, scheduledAt: new Date(req.body.scheduledAt) },
      include: { patient: { select: { firstName:true, lastName:true } }, doctor: { select: { firstName:true, lastName:true, title:true } }, department: { select: { name:true } } },
    });
    return res.status(201).json(appt);
  } catch (err) { next(err); }
});

appointmentsRouter.patch('/:id', validate(updateSchema), async (req, res, next) => {
  try {
    const data = { ...req.body };
    if (data.scheduledAt) data.scheduledAt = new Date(data.scheduledAt);
    const appt = await prisma.appointment.update({ where: { id: req.params.id }, data });
    return res.json(appt);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Not found' });
    next(err);
  }
});

appointmentsRouter.delete('/:id', authorize('ADMIN','RECEPTIONIST'), async (req, res, next) => {
  try {
    await prisma.appointment.update({ where: { id: req.params.id }, data: { status: 'CANCELLED' } });
    return res.json({ message: 'Appointment cancelled' });
  } catch (err) { next(err); }
});
