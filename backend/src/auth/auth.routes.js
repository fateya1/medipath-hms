// backend/src/auth/auth.routes.js
// Authentication routes — mirrors edupath-sms auth module

import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../common/prisma.js';
import { authenticate, authorize } from '../common/guards/jwt.guard.js';
import { validate } from '../common/pipes/validate.js';

export const authRouter = Router();

// ─── Validation Schemas ────────────────────────────────────────────────────

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerPatientSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  middleName: z.string().optional(),
  dateOfBirth: z.string().datetime(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']),
  phone: z.string().min(10),
  nationalId: z.string().optional(),
  county: z.string().optional(),
});

const registerStaffSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  middleName: z.string().optional(),
  role: z.enum(['DOCTOR', 'NURSE', 'RECEPTIONIST', 'PHARMACIST', 'LAB_TECHNICIAN', 'ADMIN']),
  phone: z.string().min(10),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']),
  departmentId: z.string().optional(),
  specialisation: z.string().optional(),
  licenseNumber: z.string().optional(),
  title: z.string().optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(8),
});

// ─── Helpers ───────────────────────────────────────────────────────────────

function generateToken(payload, expiresIn = process.env.JWT_EXPIRES_IN || '7d') {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
}

function generateRefreshToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '30d' });
}

async function generatePatientNumber() {
  const year = new Date().getFullYear();
  const count = await prisma.patient.count();
  return `MED-${year}-${String(count + 1).padStart(5, '0')}`;
}

async function generateStaffNumber(role) {
  const prefix = {
    DOCTOR: 'DR',
    NURSE: 'NS',
    RECEPTIONIST: 'RC',
    PHARMACIST: 'PH',
    LAB_TECHNICIAN: 'LT',
    ADMIN: 'AD',
  }[role] || 'ST';
  const year = new Date().getFullYear();
  const count = await prisma.staffProfile.count();
  return `${prefix}-${year}-${String(count + 1).padStart(4, '0')}`;
}

// ─── POST /api/auth/login ──────────────────────────────────────────────────

authRouter.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        patient: {
          select: { id: true, firstName: true, lastName: true, patientNumber: true },
        },
        staffProfile: {
          select: { id: true, firstName: true, lastName: true, staffNumber: true, role: true, departmentId: true, title: true, specialisation: true },
        },
      },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const profile = user.patient || user.staffProfile;
    const tokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      profileId: profile?.id,
    };

    const accessToken = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken({ sub: user.id });

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date(), refreshToken },
    });

    return res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        profile,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/auth/register/patient ──────────────────────────────────────

authRouter.post('/register/patient', validate(registerPatientSchema), async (req, res, next) => {
  try {
    const { email, password, ...patientData } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const patientNumber = await generatePatientNumber();

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: 'PATIENT',
        patient: {
          create: {
            ...patientData,
            dateOfBirth: new Date(patientData.dateOfBirth),
            patientNumber,
          },
        },
      },
      include: { patient: true },
    });

    const tokenPayload = { sub: user.id, email: user.email, role: user.role, profileId: user.patient.id };
    const accessToken = generateToken(tokenPayload);

    return res.status(201).json({
      message: 'Patient registered successfully',
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        profile: user.patient,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/auth/register/staff (Admin only) ────────────────────────────

authRouter.post('/register/staff', authenticate, authorize('ADMIN'), validate(registerStaffSchema), async (req, res, next) => {
  try {
    const { email, password, role, ...staffData } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const staffNumber = await generateStaffNumber(role);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role,
        staffProfile: {
          create: {
            ...staffData,
            role,
            staffNumber,
            dateOfBirth: staffData.dateOfBirth ? new Date(staffData.dateOfBirth) : undefined,
          },
        },
      },
      include: { staffProfile: true },
    });

    return res.status(201).json({
      message: 'Staff member registered successfully',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        profile: user.staffProfile,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/auth/me ──────────────────────────────────────────────────────

authRouter.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.sub },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        isVerified: true,
        lastLoginAt: true,
        createdAt: true,
        patient: {
          select: {
            id: true, firstName: true, middleName: true, lastName: true,
            patientNumber: true, phone: true, gender: true, dateOfBirth: true,
            nhifNumber: true, shaNumber: true, county: true,
          },
        },
        staffProfile: {
          select: {
            id: true, firstName: true, middleName: true, lastName: true,
            staffNumber: true, role: true, title: true, specialisation: true,
            phone: true, departmentId: true, licenseNumber: true,
            department: { select: { id: true, name: true, code: true } },
          },
        },
      },
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    return res.json(user);
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/auth/refresh ────────────────────────────────────────────────

authRouter.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });

    const payload = jwt.verify(refreshToken, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const newAccessToken = generateToken({ sub: user.id, email: user.email, role: user.role });
    return res.json({ accessToken: newAccessToken });
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }
    next(err);
  }
});

// ─── POST /api/auth/logout ─────────────────────────────────────────────────

authRouter.post('/logout', authenticate, async (req, res, next) => {
  try {
    await prisma.user.update({
      where: { id: req.user.sub },
      data: { refreshToken: null },
    });
    return res.json({ message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
});

// ─── PATCH /api/auth/change-password ──────────────────────────────────────

authRouter.patch('/change-password', authenticate, validate(changePasswordSchema), async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user.sub } });

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) return res.status(400).json({ error: 'Current password is incorrect' });

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: req.user.sub }, data: { passwordHash } });

    return res.json({ message: 'Password updated successfully' });
  } catch (err) {
    next(err);
  }
});
