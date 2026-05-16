// backend/src/reports/reports.routes.js
import { Router } from 'express';
import { prisma } from '../common/prisma.js';
import { authenticate, authorize } from '../common/guards/jwt.guard.js';

export const reportsRouter = Router();
reportsRouter.use(authenticate);

reportsRouter.get('/dashboard', async (req, res, next) => {
  try {
    const today     = new Date(); today.setHours(0,0,0,0);
    const tomorrow  = new Date(today); tomorrow.setDate(tomorrow.getDate()+1);
    const monthStart= new Date(today.getFullYear(), today.getMonth(), 1);

    const [totalPatients, newPatientsToday, appointmentsToday, admittedPatients, pendingLabRequests, pendingInvoices, revenueToday, revenueThisMonth] = await Promise.all([
      prisma.patient.count({ where: { isActive:true } }),
      prisma.patient.count({ where: { registeredAt: { gte:today, lt:tomorrow } } }),
      prisma.appointment.count({ where: { scheduledAt: { gte:today, lt:tomorrow } } }),
      prisma.admission.count({ where: { status:'ADMITTED' } }),
      prisma.labRequest.count({ where: { status: { in:['REQUESTED','SAMPLE_COLLECTED','PROCESSING'] } } }),
      prisma.invoice.count({ where: { status: { in:['PENDING','PARTIALLY_PAID'] } } }),
      prisma.payment.aggregate({ where: { status:'SUCCESS', paidAt: { gte:today, lt:tomorrow } }, _sum: { amount:true } }),
      prisma.payment.aggregate({ where: { status:'SUCCESS', paidAt: { gte:monthStart } }, _sum: { amount:true } }),
    ]);

    return res.json({
      totalPatients, newPatientsToday, appointmentsToday, admittedPatients,
      pendingLabRequests, pendingInvoices,
      revenueToday:    revenueToday._sum.amount    ?? 0,
      revenueThisMonth:revenueThisMonth._sum.amount ?? 0,
    });
  } catch (err) { next(err); }
});
