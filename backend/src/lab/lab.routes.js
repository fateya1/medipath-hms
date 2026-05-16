// backend/src/lab/lab.routes.js
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../common/prisma.js';
import { authenticate, authorize } from '../common/guards/jwt.guard.js';
import { validate } from '../common/pipes/validate.js';

export const labRouter = Router();
labRouter.use(authenticate);

labRouter.get('/tests', async (req, res, next) => {
  try {
    const tests = await prisma.labTest.findMany({ where: { isActive:true }, orderBy: { name:'asc' } });
    return res.json(tests);
  } catch (err) { next(err); }
});

labRouter.get('/requests', async (req, res, next) => {
  try {
    const { page=1, limit=20, status } = req.query;
    const skip = (Number(page)-1)*Number(limit);
    const where = { ...(status && { status }) };
    const [requests, total] = await Promise.all([
      prisma.labRequest.findMany({
        where, skip, take: Number(limit), orderBy: { requestedAt:'desc' },
        include: {
          patient: { select: { firstName:true, lastName:true, patientNumber:true } },
          requestedBy: { select: { firstName:true, lastName:true, title:true } },
          items: { include: { labTest: true, result: true } },
        },
      }),
      prisma.labRequest.count({ where }),
    ]);
    return res.json({ data: requests, pagination: { page:+page, limit:+limit, total, pages: Math.ceil(total/Number(limit)) } });
  } catch (err) { next(err); }
});

labRouter.patch('/requests/:id/status', authorize('LAB_TECHNICIAN','ADMIN'), async (req, res, next) => {
  try {
    const { status } = req.body;
    const req_ = await prisma.labRequest.update({ where: { id: req.params.id }, data: { status } });
    return res.json(req_);
  } catch (err) { next(err); }
});

labRouter.post('/results', authorize('LAB_TECHNICIAN','ADMIN'), async (req, res, next) => {
  try {
    const { labRequestItemId, value, unit, normalRange, isAbnormal=false, notes } = req.body;
    const result = await prisma.labResult.create({
      data: { labRequestItemId, value, unit, normalRange, isAbnormal, notes, technicianId: req.user.profileId },
    });
    return res.status(201).json(result);
  } catch (err) { next(err); }
});

labRouter.get('/results', async (req, res, next) => {
  try {
    const { page=1, limit=20 } = req.query;
    const skip = (Number(page)-1)*Number(limit);
    const [results, total] = await Promise.all([
      prisma.labResult.findMany({
        skip, take: Number(limit), orderBy: { resultedAt:'desc' },
        include: {
          technician: { select: { firstName:true, lastName:true } },
          labRequestItem: { include: { labTest: true, labRequest: { include: { patient: { select: { firstName:true, lastName:true } } } } } },
        },
      }),
      prisma.labResult.count(),
    ]);
    return res.json({ data: results, pagination: { page:+page, limit:+limit, total, pages: Math.ceil(total/Number(limit)) } });
  } catch (err) { next(err); }
});
