// backend/src/pharmacy/pharmacy.routes.js
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../common/prisma.js';
import { authenticate, authorize } from '../common/guards/jwt.guard.js';
import { validate } from '../common/pipes/validate.js';

export const pharmacyRouter = Router();
pharmacyRouter.use(authenticate);

pharmacyRouter.get('/drugs', async (req, res, next) => {
  try {
    const { page=1, limit=20, search='', category } = req.query;
    const skip = (Number(page)-1)*Number(limit);
    const where = {
      ...(category && { category }),
      ...(search && { OR: [
        { name: { contains: search, mode:'insensitive' } },
        { genericName: { contains: search, mode:'insensitive' } },
      ]}),
    };
    const [drugs, total] = await Promise.all([
      prisma.drug.findMany({ where, skip, take: Number(limit), orderBy: { name:'asc' } }),
      prisma.drug.count({ where }),
    ]);
    return res.json({ data: drugs, pagination: { page:+page, limit:+limit, total, pages: Math.ceil(total/Number(limit)) } });
  } catch (err) { next(err); }
});

pharmacyRouter.post('/drugs', authorize('ADMIN','PHARMACIST'), async (req, res, next) => {
  try {
    const drug = await prisma.drug.create({ data: req.body });
    return res.status(201).json(drug);
  } catch (err) { next(err); }
});

pharmacyRouter.patch('/drugs/:id/stock', authorize('ADMIN','PHARMACIST'), async (req, res, next) => {
  try {
    const { quantity, operation='ADD' } = req.body;
    const drug = await prisma.drug.findUnique({ where: { id: req.params.id } });
    if (!drug) return res.status(404).json({ error: 'Drug not found' });
    const newQty = operation==='ADD' ? drug.stockQuantity + quantity : Math.max(0, drug.stockQuantity - quantity);
    const updated = await prisma.drug.update({ where: { id: req.params.id }, data: { stockQuantity: newQty } });
    return res.json(updated);
  } catch (err) { next(err); }
});

pharmacyRouter.get('/prescriptions', async (req, res, next) => {
  try {
    const { page=1, limit=20, status } = req.query;
    const skip = (Number(page)-1)*Number(limit);
    const where = { ...(status && { status }) };
    const [prescriptions, total] = await Promise.all([
      prisma.prescription.findMany({
        where, skip, take: Number(limit), orderBy: { issuedAt:'desc' },
        include: {
          doctor:  { select: { firstName:true, lastName:true, title:true } },
          patient: { select: { firstName:true, lastName:true, patientNumber:true } },
          items: { include: { drug: { select: { name:true, form:true, strength:true } } } },
        },
      }),
      prisma.prescription.count({ where }),
    ]);
    return res.json({ data: prescriptions, pagination: { page:+page, limit:+limit, total, pages: Math.ceil(total/Number(limit)) } });
  } catch (err) { next(err); }
});
