// backend/src/nurses/nurses.routes.js
import { Router } from 'express';
import { prisma } from '../common/prisma.js';
import { authenticate } from '../common/guards/jwt.guard.js';

export const nursesRouter = Router();
nursesRouter.use(authenticate);

nursesRouter.get('/', async (req, res, next) => {
  try {
    const nurses = await prisma.staffProfile.findMany({
      where: { role:'NURSE', status:'ACTIVE' },
      include: { department: { select: { name:true, code:true } } },
      orderBy: { lastName:'asc' },
    });
    return res.json({ data: nurses, pagination: { total: nurses.length } });
  } catch (err) { next(err); }
});
