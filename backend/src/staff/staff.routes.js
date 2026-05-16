// backend/src/staff/staff.routes.js
import { Router } from 'express';
import { prisma } from '../common/prisma.js';
import { authenticate, authorize } from '../common/guards/jwt.guard.js';

export const staffRouter = Router();
staffRouter.use(authenticate);

staffRouter.get('/', authorize('ADMIN'), async (req, res, next) => {
  try {
    const { page=1, limit=20, role, departmentId, search='' } = req.query;
    const skip = (Number(page)-1)*Number(limit);
    const where = {
      ...(role && { role }),
      ...(departmentId && { departmentId }),
      ...(search && { OR: [
        { firstName: { contains: search, mode:'insensitive' } },
        { lastName:  { contains: search, mode:'insensitive' } },
        { staffNumber:{ contains: search } },
      ]}),
    };
    const [staff, total] = await Promise.all([
      prisma.staffProfile.findMany({
        where, skip, take: Number(limit), orderBy: { lastName:'asc' },
        include: { department: { select: { name:true, code:true } }, user: { select: { email:true } } },
      }),
      prisma.staffProfile.count({ where }),
    ]);
    return res.json({ data: staff, pagination: { page:+page, limit:+limit, total, pages: Math.ceil(total/Number(limit)) } });
  } catch (err) { next(err); }
});

staffRouter.get('/:id', async (req, res, next) => {
  try {
    const staff = await prisma.staffProfile.findUnique({
      where: { id: req.params.id },
      include: { department: true, user: { select: { email:true, isActive:true, lastLoginAt:true } } },
    });
    if (!staff) return res.status(404).json({ error: 'Staff member not found' });
    return res.json(staff);
  } catch (err) { next(err); }
});

staffRouter.patch('/:id', authorize('ADMIN'), async (req, res, next) => {
  try {
    const staff = await prisma.staffProfile.update({ where: { id: req.params.id }, data: req.body });
    return res.json(staff);
  } catch (err) { next(err); }
});
