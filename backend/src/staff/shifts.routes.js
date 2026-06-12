import { Router } from 'express';
import { prisma } from '../common/prisma.js';
import { authenticate, authorize } from '../common/guards/jwt.guard.js';
import { createId } from '@paralleldrive/cuid2';

export const shiftsRouter = Router();
shiftsRouter.use(authenticate);

// ─── Flexible staff number lookup ─────────────────────────────────────────
function parseShortNumber(shortNumber) {
  const parts = shortNumber.trim().split('-');
  const prefix = parts[0];
  const num = parts[parts.length - 1];
  const paddedNum = num.padStart(4, '0');
  return { prefix, paddedNum };
}

// ─── POST /api/staff/shifts/import ────────────────────────────────────────
shiftsRouter.post(['/', '/import'], authorize('ADMIN'), async (req, res, next) => {
  try {
    const { shifts } = req.body;
    if (!Array.isArray(shifts) || shifts.length === 0) {
      return res.status(400).json({ error: 'No shift data provided' });
    }

    // ── Step 1: Get unique staff numbers from CSV ──────────────────────
    const uniqueNumbers = [...new Set(shifts.map(r => r.staffNumber?.trim()).filter(Boolean))];

    // ── Step 2: ONE bulk query to find all matching staff ──────────────
    const allStaff = await prisma.staffProfile.findMany({
      select: { id: true, staffNumber: true },
    });

    // ── Step 3: Build lookup map (short → id) ─────────────────────────
    const staffMap = new Map();
    for (const s of allStaff) {
      staffMap.set(s.staffNumber, s.id); // exact match
    }

    // Flexible match for short numbers
    for (const shortNum of uniqueNumbers) {
      if (staffMap.has(shortNum)) continue;
      const { prefix, paddedNum } = parseShortNumber(shortNum);
      const match = allStaff.find(s =>
        s.staffNumber.startsWith(prefix + '-') &&
        s.staffNumber.endsWith('-' + paddedNum)
      );
      if (match) staffMap.set(shortNum, match.id);
    }

    // ── Step 4: Build valid rows and collect errors ────────────────────
    const errors = [];
    const validRows = [];

    for (let i = 0; i < shifts.length; i++) {
      const row = shifts[i];
      const rowNum = i + 1;
      const staffNumber = row.staffNumber?.trim();

      if (!staffNumber || !row.shiftDate || !row.shiftType) {
        errors.push({ row: rowNum, error: 'Missing required fields' });
        continue;
      }

      const staffId = staffMap.get(staffNumber);
      if (!staffId) {
        errors.push({ row: rowNum, error: `Not Found: staff "${staffNumber}"` });
        continue;
      }

      validRows.push({
        id: createId(),
        staffId,
        shiftDate: new Date(row.shiftDate),
        shiftType: row.shiftType.toUpperCase(),
        startTime: row.startTime || '00:00',
        endTime: row.endTime || '00:00',
        onCall: row.onCall === 'YES' || row.onCall === true,
        ward: row.ward || null,
        updatedAt: new Date(),
      });
    }

    // ── Step 5: Bulk insert in batches of 100 ─────────────────────────
    const BATCH = 100;
    let imported = 0;

    for (let i = 0; i < validRows.length; i += BATCH) {
      const batch = validRows.slice(i, i + BATCH);
      const result = await prisma.shift.createMany({
        data: batch,
        skipDuplicates: true,
      });
      imported += result.count;
    }

    const skipped = validRows.length - imported;

    return res.json({
      total: shifts.length,
      imported,
      skipped,
      failed: errors.length,
      errors: errors.slice(0, 50),
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

// Alias: POST /api/shifts also triggers import
shiftsRouter.post('/', authorize('ADMIN'), async (req, res, next) => {
  req.url = '/import';
  shiftsRouter.handle(req, res, next);
});
