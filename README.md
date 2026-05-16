# Medipath-HMS

> **Comprehensive Hospital Management System** — Kenyan healthcare context with M-Pesa billing, multi-role clinical portals, and department-based pathways.

---

## ✨ Key Features

- ✅ **Role-based authentication** — Admin / Doctor / Nurse / Receptionist / Patient / Pharmacist / Lab Technician
- ✅ **Patient management** — Registration, triage, CRUD, medical history
- ✅ **Appointment scheduling** — OPD, specialist, follow-up bookings
- ✅ **Electronic Medical Records (EMR)** — Notes, diagnoses, prescriptions, lab results
- ✅ **Department management** — Medicine, Surgery, Paediatrics, Obs & Gynae, Casualty, ICU, etc.
- ✅ **Pharmacy module** — Drug inventory, dispensing, restocking alerts
- ✅ **Laboratory module** — Test requests, results upload, reporting
- ✅ **Billing & Payments** — M-Pesa STK Push, NHIF/SHA integration, invoice management
- ✅ **Staff management** — Doctors, nurses, support staff records & scheduling
- ✅ **Reports & Analytics** — Daily census, revenue, department utilisation
- ✅ **Protected routes** (frontend) + Auth context
- ✅ **REST API backend** (NestJS) + Prisma migrations
- ✅ **Vite + React + TypeScript** frontend
- ✅ **Vercel-ready SPA** deployment (React Router rewrites)

---

## 🧱 Tech Stack

### Frontend
- React + TypeScript
- Vite
- React Router v6
- Context API (Auth + Patient)
- Tailwind CSS

### Backend
- NestJS (modular architecture)
- Prisma ORM
- PostgreSQL
- JWT Authentication
- Zod validation

### Integrations
- **M-Pesa Daraja API** — STK Push, B2C, C2B
- **NHIF / SHA** — Claims & verification
- **Nodemailer** — Appointment & lab result notifications
- **SMS (Africa's Talking)** — Patient reminders

---

## 📁 Monorepo Structure

```
medipath-hms/
├── backend/                    # NestJS API
│   ├── src/
│   │   ├── auth/               # JWT auth, guards, strategies
│   │   ├── patients/           # Patient CRUD, triage, history
│   │   ├── doctors/            # Doctor profiles, specialisations
│   │   ├── nurses/             # Nursing staff management
│   │   ├── staff/              # All staff (HR records)
│   │   ├── appointments/       # OPD & inpatient scheduling
│   │   ├── departments/        # Clinical departments
│   │   ├── medical-records/    # EMR, diagnoses, notes
│   │   ├── pharmacy/           # Drug inventory & dispensing
│   │   ├── lab/                # Lab tests & results
│   │   ├── billing/            # Invoices, M-Pesa, NHIF
│   │   ├── reports/            # Analytics & reporting
│   │   └── common/             # Guards, decorators, filters
│   ├── prisma/
│   │   └── schema.prisma
│   ├── server.js               # Express entry point
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                   # React (Vite) client
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── layout/         # Sidebar, Navbar, Layout
│   │   │   ├── ui/             # Reusable UI components
│   │   │   └── forms/          # Form components
│   │   ├── contexts/           # AuthContext, PatientContext
│   │   ├── hooks/              # Custom React hooks
│   │   ├── pages/
│   │   │   ├── auth/           # Login, Register, ForgotPassword
│   │   │   ├── dashboard/      # Role-specific dashboards
│   │   │   ├── patients/       # Patient portal pages
│   │   │   ├── doctors/        # Doctor management pages
│   │   │   ├── appointments/   # Scheduling pages
│   │   │   ├── departments/    # Department management
│   │   │   ├── billing/        # Billing & payments
│   │   │   ├── pharmacy/       # Pharmacy pages
│   │   │   ├── lab/            # Laboratory pages
│   │   │   └── reports/        # Reports & analytics
│   │   ├── types/              # TypeScript interfaces
│   │   ├── utils/              # Helpers, API client, formatters
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── vercel.json             # SPA rewrites for React Router
│   ├── package.json
│   └── vite.config.ts
│
├── mobile/                     # React Native (future)
├── prisma/                     # Root-level prisma config
├── scripts/                    # Seed & utility scripts
│   ├── seed.js
│   └── migrate.sh
├── lib/                        # Shared utilities
├── .env.example
├── .gitignore
├── render.yaml
├── vercel.json
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20.x
- PostgreSQL 15+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/medipath-hms.git
cd medipath-hms

# Install root dependencies
npm install

# Install backend dependencies
cd backend && npm install && cd ..

# Install frontend dependencies
cd frontend && npm install && cd ..

# Configure environment variables
cp .env.example .env
# Edit .env with your database URL, JWT secret, M-Pesa credentials, etc.

# Run database migrations
npm run db:migrate

# Seed initial data (admin user, departments, roles)
npm run db:seed

# Start development servers (both frontend & backend)
npm run dev:all
```

### Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/medipath_hms"

# JWT
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"

# M-Pesa (Daraja API)
MPESA_CONSUMER_KEY="your-consumer-key"
MPESA_CONSUMER_SECRET="your-consumer-secret"
MPESA_SHORTCODE="174379"
MPESA_PASSKEY="your-passkey"
MPESA_CALLBACK_URL="https://your-domain.com/api/billing/mpesa/callback"
MPESA_ENV="sandbox"  # or "production"

# Email (SMTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="noreply@medipath.co.ke"
SMTP_PASS="your-app-password"

# Africa's Talking (SMS)
AT_API_KEY="your-at-api-key"
AT_USERNAME="sandbox"

# NHIF/SHA
NHIF_API_URL="https://api.nhif.or.ke"
NHIF_API_KEY="your-nhif-key"

# Frontend URL (for CORS)
FRONTEND_URL="http://localhost:5173"
PORT=3000
```

---

## 👥 User Roles

| Role | Description |
|------|-------------|
| **Admin** | Full system access, staff management, system config |
| **Doctor** | Patient records, prescriptions, lab requests, appointments |
| **Nurse** | Triage, vitals, nursing notes, ward management |
| **Receptionist** | Patient registration, appointment booking, billing |
| **Pharmacist** | Drug dispensing, inventory management |
| **Lab Technician** | Test processing, result entry, reporting |
| **Patient** | View own records, appointment history, lab results |

---

## 🏥 Clinical Departments

- Outpatient Department (OPD)
- Accident & Emergency (A&E / Casualty)
- General Medicine (Ward)
- Surgery
- Paediatrics
- Obstetrics & Gynaecology
- Intensive Care Unit (ICU)
- Orthopaedics
- Ophthalmology
- ENT
- Dermatology
- Dental
- Radiology / Imaging
- Laboratory
- Pharmacy
- Physiotherapy
- Mental Health / Psychiatry

---

## 💳 Billing & Payments

- **M-Pesa STK Push** — Patient initiates payment via phone
- **NHIF / SHA** — Claim submission & capitation management
- **Cash payments** — Manual receipting
- **Insurance** — Corporate & private health insurance
- **Invoicing** — Itemised bills by service, drug, or procedure
- **Waiver management** — Compassionate & indigent waivers

---

## 📊 Reports

- Daily patient census
- Outpatient statistics
- Department utilisation
- Revenue by payment method
- Drug consumption report
- Lab TAT (Turnaround Time)
- Diagnosis frequency
- Staff attendance

---

## 🔒 Security

- JWT-based stateless authentication
- bcrypt password hashing
- Role-based access control (RBAC)
- Helmet.js HTTP security headers
- Rate limiting
- Input validation with Zod
- Audit trail logging

---

## 📱 Mobile (Coming Soon)

React Native app for:
- Patient self-registration & appointment booking
- Doctor on-call quick-access
- Lab result push notifications
- M-Pesa payment receipts

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/pharmacy-module`)
3. Commit your changes (`git commit -m 'feat: add drug dispensing workflow'`)
4. Push to the branch (`git push origin feature/pharmacy-module`)
5. Open a Pull Request

---

## 📄 License

MIT © Medipath Team
