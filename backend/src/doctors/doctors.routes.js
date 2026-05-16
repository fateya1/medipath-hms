// backend/src/doctors/doctors.routes.js
import { Router } from 'express';
import { prisma } from '../common/prisma.js';
import { authenticate } from '../common/guards/jwt.guard.js';

export const doctorsRouter = Router();
doctorsRouter.use(authenticate);

doctorsRouter.get('/', async (req, res, next) => {
  try {
    const { page=1, limit=20, search='', departmentId } = req.query;
    const skip = (Number(page)-1)*Number(limit);
    const where = {
      role: 'DOCTOR', status: 'ACTIVE',
      ...(departmentId && { departmentId }),
      ...(search && { OR: [
        { firstName: { contains: search, mode:'insensitive' } },
        { lastName:  { contains: search, mode:'insensitive' } },
        { specialisation: { contains: search, mode:'insensitive' } },
        { staffNumber: { contains: search } },
      ]}),
    };
    const [doctors, total] = await Promise.all([
      prisma.staffProfile.findMany({
        where, skip, take: Number(limit), orderBy: { lastName: 'asc' },
        include: { department: { select: { id:true, name:true, code:true } }, user: { select: { email:true } } },
      }),
      prisma.staffProfile.count({ where }),
    ]);
    return res.json({ data: doctors, pagination: { page:+page, limit:+limit, total, pages: Math.ceil(total/Number(limit)) } });
  } catch (err) { next(err); }
});

doctorsRouter.get('/:id', async (req, res, next) => {
  try {
    const doc = await prisma.staffProfile.findFirst({
      where: { id: req.params.id, role: 'DOCTOR' },
      include: { department: true, user: { select: { email:true } } },
    });
    if (!doc) return res.status(404).json({ error: 'Doctor not found' });
    return res.json(doc);
  } catch (err) { next(err); }
});
