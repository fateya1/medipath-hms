// backend/src/departments/departments.routes.js
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../common/prisma.js';
import { authenticate, authorize } from '../common/guards/jwt.guard.js';
import { validate } from '../common/pipes/validate.js';

export const departmentsRouter = Router();
departmentsRouter.use(authenticate);

const createSchema = z.object({
  name: z.string().min(1), code: z.string().min(1).max(6),
  type: z.enum(['CLINICAL','DIAGNOSTIC','SUPPORT','ADMINISTRATIVE']),
  description: z.string().optional(), location: z.string().optional(), phone: z.string().optional(),
});

departmentsRouter.get('/', async (req, res, next) => {
  try {
    const departments = await prisma.department.findMany({
      where: { isActive: true }, orderBy: { name: 'asc' },
      include: { head: { select: { id:true, firstName:true, lastName:true, title:true } } },
    });
    return res.json(departments);
  } catch (err) { next(err); }
});

departmentsRouter.get('/:id', async (req, res, next) => {
  try {
    const dept = await prisma.department.findUnique({
      where: { id: req.params.id },
      include: {
        head:  { select: { id:true, firstName:true, lastName:true, title:true, specialisation:true } },
        staff: { select: { id:true, firstName:true, lastName:true, title:true, role:true }, take: 20 },
      },
    });
    if (!dept) return res.status(404).json({ error: 'Department not found' });
    return res.json(dept);
  } catch (err) { next(err); }
});

departmentsRouter.post('/', authorize('ADMIN'), validate(createSchema), async (req, res, next) => {
  try {
    const dept = await prisma.department.create({ data: req.body });
    return res.status(201).json(dept);
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Department name or code already exists' });
    next(err);
  }
});

departmentsRouter.patch('/:id', authorize('ADMIN'), async (req, res, next) => {
  try {
    const dept = await prisma.department.update({ where: { id: req.params.id }, data: req.body });
    return res.json(dept);
  } catch (err) { next(err); }
});
