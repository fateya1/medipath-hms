// backend/src/staff/shifts.routes.js
import { Router } from 'express';
import { prisma } from '../common/prisma.js';
import { authenticate, authorize } from '../common/guards/jwt.guard.js';

export const shiftsRouter = Router();
shiftsRouter.use(authenticate);

// ─── Flexible staff number lookup ─────────────────────────────────────────
// Matches CSV format "DR-001" against DB format "DR-2024-0001"
async function findStaffByShortNumber(shortNumber) {
  // Try exact match first
  const exact = await prisma.staffProfile.findFirst({
    where: { staffNumber: shortNumber },
  });
  if (exact) return exact;

  // Parse short format: "DR-001" → prefix="DR", padded="0001"
  const parts = shortNumber.split('-');
  if (parts.length < 2) return null;
  const prefix = parts[0];
  const num = parts[parts.length - 1];
  const paddedNum = num.padStart(4, '0');

  // Match "DR-2024-0001" style
  return prisma.staffProfile.findFirst({
    where: {
      AND: [
        { staffNumber: { startsWith: prefix + '-' } },
        { staffNumber: { endsWith: '-' + paddedNum } },
      ],
    },
  });
}

// ─── POST /api/staff/shifts/import ────────────────────────────────────────
shiftsRouter.post('/import', authorize('ADMIN'), async (req, res, next) => {
  try {
    const { shifts } = req.body;

    if (!Array.isArray(shifts) || shifts.length === 0) {
      return res.status(400).json({ error: 'No shift data provided' });
    }

    let imported = 0;
    let skipped = 0;
    let failed = 0;
    const errors = [];

    for (let i = 0; i < shifts.length; i++) {
      const row = shifts[i];
      const rowNum = i + 1;

      try {
        const { staffNumber, shiftDate, shiftType, startTime, endTime, onCall, ward } = row;

        // Validate required fields
        if (!staffNumber || !shiftDate || !shiftType) {
          errors.push({ row: rowNum, error: 'Missing required fields: staffNumber, shiftDate, shiftType' });
          failed++;
          continue;
        }

        // Flexible staff lookup
        const staff = await findStaffByShortNumber(staffNumber.trim());
        if (!staff) {
          errors.push({ row: rowNum, error: `Not Found: staff "${staffNumber}"` });
          failed++;
          continue;
        }

        // Upsert to avoid duplicates on re-import
        await prisma.shift.upsert({
          where: {
            staffId_shiftDate_shiftType: {
              staffId: staff.id,
              shiftDate: new Date(shiftDate),
              shiftType: shiftType.toUpperCase(),
            },
          },
          update: { startTime, endTime, onCall: onCall === 'YES' || onCall === true, ward: ward || null },
          create: {
            staffId: staff.id,
            shiftDate: new Date(shiftDate),
            shiftType: shiftType.toUpperCase(),
            startTime,
            endTime,
            onCall: onCall === 'YES' || onCall === true,
            ward: ward || null,
          },
        });

        imported++;
      } catch (err) {
        errors.push({ row: rowNum, error: err.message });
        failed++;
      }
    }

    return res.json({
      total: shifts.length,
      imported,
      skipped,
      failed,
      errors: errors.slice(0, 50), // cap at 50 errors shown
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/staff/shifts ─────────────────────────────────────────────────
shiftsRouter.get('/', async (req, res, next) => {
  try {
    const { staffId, from, to, shiftType } = req.query;
    const where = {
      ...(staffId && { staffId }),
      ...(shiftType && { shiftType }),
      ...(from || to ? {
        shiftDate: {
          ...(from && { gte: new Date(from) }),
          ...(to && { lte: new Date(to) }),
        },
      } : {}),
    };

    const shifts = await prisma.shift.findMany({
      where,
      include: {
        staff: {
          select: {
            firstName: true, lastName: true, staffNumber: true,
            role: true, title: true,
            department: { select: { name: true } },
          },
        },
      },
      orderBy: [{ shiftDate: 'asc' }, { shiftType: 'asc' }],
    });

    return res.json(shifts);
  } catch (err) {
    next(err);
  }
});
