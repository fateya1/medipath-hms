import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';

// ─── Static imports (required for Vercel serverless) ──────────────────────
import { authRouter }           from './src/auth/auth.routes.js';
import { patientsRouter }       from './src/patients/patients.routes.js';
import { staffRouter }          from './src/staff/staff.routes.js';
import { doctorsRouter }        from './src/doctors/doctors.routes.js';
import { nursesRouter }         from './src/nurses/nurses.routes.js';
import { appointmentsRouter }   from './src/appointments/appointments.routes.js';
import { departmentsRouter }    from './src/departments/departments.routes.js';
import { medicalRecordsRouter } from './src/medical-records/medical-records.routes.js';
import { pharmacyRouter }       from './src/pharmacy/pharmacy.routes.js';
import { labRouter }            from './src/lab/lab.routes.js';
import { billingRouter }        from './src/billing/billing.routes.js';
import { reportsRouter }        from './src/reports/reports.routes.js';

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Security Middleware ───────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "blob:"],
    },
  },
}));

app.use(cors({
  origin: [
    "https://medipath-hms-frontend.vercel.app",
    "http://localhost:3000"
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Tenant-ID"],
  credentials: true
}));

app.options("*", cors());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts, please try again later.' },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Health Check ──────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    system: 'Medipath HMS',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// ─── Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',            authRouter);
app.use('/api/patients',        patientsRouter);
app.use('/api/staff',           staffRouter);
app.use('/api/doctors',         doctorsRouter);
app.use('/api/nurses',          nursesRouter);
app.use('/api/appointments',    appointmentsRouter);
app.use('/api/departments',     departmentsRouter);
app.use('/api/medical-records', medicalRecordsRouter);
app.use('/api/pharmacy',        pharmacyRouter);
app.use('/api/lab',             labRouter);
app.use('/api/billing',         billingRouter);
app.use('/api/reports',         reportsRouter);

// ─── M-Pesa Callback ───────────────────────────────────────────────────────
app.post('/api/billing/mpesa/callback', express.json(), (req, res) => {
  console.log('[M-Pesa Callback]', JSON.stringify(req.body, null, 2));
  res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
});

// ─── 404 Handler ───────────────────────────────────────────────────────────
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
  });
});

// ─── Error Handler ─────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: err.name || 'Internal Server Error',
    message: process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred'
      : err.message,
  });
});

// ─── Start ─────────────────────────────────────────────────────────────────
const server = createServer(app);
server.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════╗
║          🏥 Medipath HMS Backend Server          ║
╠══════════════════════════════════════════════════╣
║  Port    : ${PORT.toString().padEnd(38)}║
║  Env     : ${(process.env.NODE_ENV || 'development').padEnd(38)}║
║  Health  : http://localhost:${PORT}/health         ║
║  API     : http://localhost:${PORT}/api            ║
╚══════════════════════════════════════════════════╝
  `);
});

export default app;
