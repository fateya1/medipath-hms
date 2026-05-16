// frontend/src/pages/dashboard/DoctorDashboard.tsx
import { useAuth } from '../../contexts/AuthContext';
import { Calendar, Users, FlaskConical, Pill, Clock, CheckCircle, Receipt } from "lucide-react";
import { formatKES } from '../../utils/api';

const TODAY_APPOINTMENTS = [
  { time: '08:30', patient: 'James Mwangi', type: 'OPD', status: 'COMPLETED' },
  { time: '09:00', patient: 'Fatuma Hassan', type: 'Follow-up', status: 'IN_PROGRESS' },
  { time: '09:30', patient: 'Peter Ochieng', type: 'OPD', status: 'SCHEDULED' },
  { time: '10:00', patient: 'Grace Wanjiru', type: 'Procedure', status: 'SCHEDULED' },
  { time: '10:30', patient: 'Ali Mohammed', type: 'OPD', status: 'SCHEDULED' },
];

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: 'bg-green-100 text-green-700',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-700',
  SCHEDULED: 'bg-blue-100 text-blue-700',
};

export function DoctorDashboard() {
  const { user } = useAuth();
  const profile = user?.staffProfile;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Good {new Date().getHours() < 12 ? 'morning' : 'afternoon'},{' '}
          {profile?.title} {profile?.firstName}
        </h1>
        <p className="text-gray-500 text-sm mt-1">{profile?.specialisation} · {profile?.staffNumber}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Today\'s Appointments', value: '12', icon: <Calendar size={18} className="text-white" />, bg: 'bg-teal-600' },
          { label: 'Patients Seen', value: '7', icon: <CheckCircle size={18} className="text-white" />, bg: 'bg-green-600' },
          { label: 'Pending Lab Results', value: '4', icon: <FlaskConical size={18} className="text-white" />, bg: 'bg-amber-500' },
          { label: 'Prescriptions Issued', value: '9', icon: <Pill size={18} className="text-white" />, bg: 'bg-violet-500' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-gray-500">{s.label}</p>
              <div className={`w-8 h-8 ${s.bg} rounded-lg flex items-center justify-center`}>{s.icon}</div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Clock size={16} className="text-teal-600" /> Today's Schedule
        </h3>
        <div className="space-y-2">
          {TODAY_APPOINTMENTS.map((appt, i) => (
            <div key={i} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <span className="text-sm font-mono text-gray-500 w-12">{appt.time}</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{appt.patient}</p>
                <p className="text-xs text-gray-400">{appt.type}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[appt.status]}`}>
                {appt.status.replace('_', ' ')}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Nurse Dashboard ───────────────────────────────────────────────────────
export function NurseDashboard() {
  const { user } = useAuth();
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Nursing Station</h1>
        <p className="text-gray-500 text-sm mt-1">{user?.staffProfile?.firstName} {user?.staffProfile?.lastName} · {user?.staffProfile?.staffNumber}</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: 'Triage Queue', value: '8', bg: 'bg-red-500' },
          { label: 'Vitals Pending', value: '14', bg: 'bg-amber-500' },
          { label: 'Ward Patients', value: '32', bg: 'bg-teal-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm text-gray-500 mb-2">{s.label}</p>
            <div className="flex items-center gap-3">
              <div className={`w-3 h-10 ${s.bg} rounded-full`} />
              <p className="text-3xl font-bold text-gray-900">{s.value}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-teal-50 border border-teal-200 rounded-xl p-5">
        <p className="font-semibold text-teal-800 mb-1">Shift Handover Reminder</p>
        <p className="text-sm text-teal-700">Next shift starts at 14:00. Please complete all pending vitals and update ward notes before handover.</p>
      </div>
    </div>
  );
}

// ─── Receptionist Dashboard ────────────────────────────────────────────────
export function ReceptionistDashboard() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Reception Dashboard</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Check-ins Today', value: '47', bg: 'bg-teal-600' },
          { label: 'Appointments Booked', value: '23', bg: 'bg-sky-500' },
          { label: 'Pending Payments', value: '12', bg: 'bg-amber-500' },
          { label: 'Walk-ins', value: '18', bg: 'bg-violet-500' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
            <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center`}>
              <span className="text-white font-bold text-sm">{s.value}</span>
            </div>
            <p className="text-sm font-medium text-gray-700">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <a href="/patients/new" className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl p-6 flex items-center gap-4 transition-colors">
          <Users size={24} />
          <div>
            <p className="font-bold">Register New Patient</p>
            <p className="text-sm text-teal-200">Walk-in registration</p>
          </div>
        </a>
        <a href="/appointments/new" className="bg-sky-600 hover:bg-sky-700 text-white rounded-xl p-6 flex items-center gap-4 transition-colors">
          <Calendar size={24} />
          <div>
            <p className="font-bold">Book Appointment</p>
            <p className="text-sm text-sky-200">Schedule OPD or specialist</p>
          </div>
        </a>
      </div>
    </div>
  );
}

// ─── Patient Dashboard ─────────────────────────────────────────────────────
export function PatientDashboard() {
  const { user } = useAuth();
  const profile = user?.patient;
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome, {profile?.firstName}
        </h1>
        <p className="text-gray-500 text-sm mt-1">Patient No. {profile?.patientNumber}</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <a href="/appointments" className="bg-white rounded-xl border border-gray-200 p-5 hover:border-teal-400 transition-colors">
          <Calendar size={24} className="text-teal-600 mb-3" />
          <p className="font-semibold text-gray-900">My Appointments</p>
          <p className="text-sm text-gray-500 mt-1">View upcoming & past appointments</p>
        </a>
        <a href={`/patients/${profile?.id}`} className="bg-white rounded-xl border border-gray-200 p-5 hover:border-teal-400 transition-colors">
          <Users size={24} className="text-sky-600 mb-3" />
          <p className="font-semibold text-gray-900">My Medical Records</p>
          <p className="text-sm text-gray-500 mt-1">EMR, diagnoses, prescriptions</p>
        </a>
        <a href="/billing" className="bg-white rounded-xl border border-gray-200 p-5 hover:border-teal-400 transition-colors">
          <Receipt size={24} className="text-emerald-600 mb-3" />
          <p className="font-semibold text-gray-900">Bills & Payments</p>
          <p className="text-sm text-gray-500 mt-1">View invoices, pay via M-Pesa</p>
        </a>
      </div>
    </div>
  );
}

// ─── Pharmacist Dashboard ──────────────────────────────────────────────────
export function PharmacistDashboard() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Pharmacy Dashboard</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Pending Prescriptions', value: '18', bg: 'bg-amber-500' },
          { label: 'Dispensed Today', value: '43', bg: 'bg-green-600' },
          { label: 'Low Stock Alerts', value: '7', bg: 'bg-red-500' },
          { label: 'Drug Expiry Alerts', value: '3', bg: 'bg-orange-500' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-2">{s.label}</p>
            <div className={`text-2xl font-bold text-gray-900`}>{s.value}</div>
            <div className={`mt-2 h-1 rounded-full ${s.bg} opacity-60`} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Lab Technician Dashboard ──────────────────────────────────────────────
export function LabDashboard() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Laboratory Dashboard</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Pending Requests', value: '14', bg: 'bg-amber-500' },
          { label: 'Samples Collected', value: '9', bg: 'bg-sky-500' },
          { label: 'Results Pending', value: '6', bg: 'bg-violet-500' },
          { label: 'Completed Today', value: '28', bg: 'bg-green-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-2">{s.label}</p>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-3">STAT / Urgent Requests</h3>
        <div className="space-y-2">
          {[
            { patient: 'Mary Akinyi', test: 'Full Blood Count', urgency: 'STAT', time: '08:15' },
            { patient: 'John Kamau', test: 'Malaria RDT + Thick Film', urgency: 'URGENT', time: '09:00' },
            { patient: 'Amina Abdi', test: 'Renal Function Test', urgency: 'STAT', time: '09:45' },
          ].map((r, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">{r.patient}</p>
                <p className="text-xs text-gray-500">{r.test}</p>
              </div>
              <div className="text-right">
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${r.urgency === 'STAT' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                  {r.urgency}
                </span>
                <p className="text-xs text-gray-400 mt-1">{r.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Import missing icons used in patient dashboard
