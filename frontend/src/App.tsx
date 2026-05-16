// frontend/src/App.tsx
// Medipath HMS — Main Router
// Mirrors EduPath-SMS App.tsx structure with role-based protected routes

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Role } from './types';

// Layout
import { AppLayout } from './components/layout/AppLayout';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';

// Dashboard
import { AdminDashboard } from './pages/dashboard/AdminDashboard';
import { DoctorDashboard } from './pages/dashboard/DoctorDashboard';
import { NurseDashboard } from './pages/dashboard/NurseDashboard';
import { ReceptionistDashboard } from './pages/dashboard/ReceptionistDashboard';
import { PatientDashboard } from './pages/dashboard/PatientDashboard';
import { PharmacistDashboard } from './pages/dashboard/PharmacistDashboard';
import { LabDashboard } from './pages/dashboard/LabDashboard';

// Patient Pages
import { PatientsListPage } from './pages/patients/PatientsListPage';
import { PatientDetailPage } from './pages/patients/PatientDetailPage';
import { PatientRegisterPage } from './pages/patients/PatientRegisterPage';

// Doctor Pages
import { DoctorsListPage } from './pages/doctors/DoctorsListPage';
import { DoctorDetailPage } from './pages/doctors/DoctorDetailPage';

// Appointment Pages
import { AppointmentsListPage } from './pages/appointments/AppointmentsListPage';
import { AppointmentDetailPage } from './pages/appointments/AppointmentDetailPage';
import { NewAppointmentPage } from './pages/appointments/NewAppointmentPage';

// Department Pages
import { DepartmentsPage } from './pages/departments/DepartmentsPage';

// Medical Records
import { MedicalRecordPage } from './pages/patients/MedicalRecordPage';

// Billing Pages
import { InvoicesListPage } from './pages/billing/InvoicesListPage';
import { InvoiceDetailPage } from './pages/billing/InvoiceDetailPage';
import { CreateInvoicePage } from './pages/billing/CreateInvoicePage';

// Pharmacy Pages
import { PharmacyInventoryPage } from './pages/pharmacy/PharmacyInventoryPage';
import { PrescriptionsPage } from './pages/pharmacy/PrescriptionsPage';

// Lab Pages
import { LabRequestsPage } from './pages/lab/LabRequestsPage';
import { LabResultsPage } from './pages/lab/LabResultsPage';

// Reports
import { ReportsPage } from './pages/reports/ReportsPage';
import { MigrationPage } from './pages/migration/MigrationPage';

// ─── Guards ────────────────────────────────────────────────────────────────

function ProtectedRoute({ children, roles }: { children: JSX.Element; roles?: Role[] }) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Loading Medipath HMS…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function PublicRoute({ children }: { children: JSX.Element }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return children;
}

// ─── Role-based dashboard router ──────────────────────────────────────────

function DashboardRouter() {
  const { user } = useAuth();
  const dashboards: Record<Role, JSX.Element> = {
    ADMIN: <AdminDashboard />,
    DOCTOR: <DoctorDashboard />,
    NURSE: <NurseDashboard />,
    RECEPTIONIST: <ReceptionistDashboard />,
    PATIENT: <PatientDashboard />,
    PHARMACIST: <PharmacistDashboard />,
    LAB_TECHNICIAN: <LabDashboard />,
  };
  return user ? (dashboards[user.role] ?? <AdminDashboard />) : null;
}

// ─── Query Client ──────────────────────────────────────────────────────────

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

// ─── App ───────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
            <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />

            {/* Protected routes with layout */}
            <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route index element={<Navigate to="/dashboard" replace />} />

              {/* Dashboard */}
              <Route path="dashboard" element={<DashboardRouter />} />

              {/* Patients — clinical & admin */}
              <Route path="patients" element={
                <ProtectedRoute roles={['ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST']}>
                  <PatientsListPage />
                </ProtectedRoute>
              } />
              <Route path="patients/new" element={
                <ProtectedRoute roles={['ADMIN', 'RECEPTIONIST']}>
                  <PatientRegisterPage />
                </ProtectedRoute>
              } />
              <Route path="patients/:id" element={<PatientDetailPage />} />
              <Route path="patients/:id/records/:recordId" element={<MedicalRecordPage />} />

              {/* Doctors */}
              <Route path="doctors" element={
                <ProtectedRoute roles={['ADMIN', 'RECEPTIONIST']}>
                  <DoctorsListPage />
                </ProtectedRoute>
              } />
              <Route path="doctors/:id" element={<DoctorDetailPage />} />

              {/* Appointments */}
              <Route path="appointments" element={<AppointmentsListPage />} />
              <Route path="appointments/new" element={
                <ProtectedRoute roles={['ADMIN', 'DOCTOR', 'RECEPTIONIST', 'PATIENT']}>
                  <NewAppointmentPage />
                </ProtectedRoute>
              } />
              <Route path="appointments/:id" element={<AppointmentDetailPage />} />

              {/* Departments */}
              <Route path="departments" element={
                <ProtectedRoute roles={['ADMIN']}>
                  <DepartmentsPage />
                </ProtectedRoute>
              } />

              {/* Billing */}
              <Route path="billing" element={
                <ProtectedRoute roles={['ADMIN', 'RECEPTIONIST']}>
                  <InvoicesListPage />
                </ProtectedRoute>
              } />
              <Route path="billing/new" element={
                <ProtectedRoute roles={['ADMIN', 'RECEPTIONIST']}>
                  <CreateInvoicePage />
                </ProtectedRoute>
              } />
              <Route path="billing/:id" element={<InvoiceDetailPage />} />

              {/* Pharmacy */}
              <Route path="pharmacy" element={
                <ProtectedRoute roles={['ADMIN', 'PHARMACIST']}>
                  <PharmacyInventoryPage />
                </ProtectedRoute>
              } />
              <Route path="pharmacy/prescriptions" element={
                <ProtectedRoute roles={['ADMIN', 'PHARMACIST', 'DOCTOR']}>
                  <PrescriptionsPage />
                </ProtectedRoute>
              } />

              {/* Laboratory */}
              <Route path="lab" element={
                <ProtectedRoute roles={['ADMIN', 'LAB_TECHNICIAN', 'DOCTOR']}>
                  <LabRequestsPage />
                </ProtectedRoute>
              } />
              <Route path="lab/results" element={
                <ProtectedRoute roles={['ADMIN', 'LAB_TECHNICIAN', 'DOCTOR']}>
                  <LabResultsPage />
                </ProtectedRoute>
              } />

              {/* Reports */}
              <Route path="reports" element={
                <ProtectedRoute roles={['ADMIN', 'DOCTOR']}>
                  <ReportsPage />
                </ProtectedRoute>
              } />

              {/* Migration */}
              <Route path="migration" element={
                <ProtectedRoute roles={['ADMIN']}>
                  <MigrationPage />
                </ProtectedRoute>
              } />
                <ProtectedRoute roles={['ADMIN', 'DOCTOR']}>
                  <ReportsPage />
                </ProtectedRoute>
              } />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
