import { useAuth } from '../../contexts/AuthContext';
import { Calendar, Users, Receipt } from 'lucide-react';
export function PatientDashboard() {
  const { user } = useAuth(); const p = user?.patient;
  return (
    <div className="p-6 space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900">Welcome, {p?.firstName}</h1><p className="text-gray-500 text-sm">Patient No. {p?.patientNumber}</p></div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <a href="/appointments" className="bg-white rounded-xl border border-gray-200 p-5 hover:border-teal-400 transition-colors"><Calendar size={24} className="text-teal-600 mb-3"/><p className="font-semibold text-gray-900">My Appointments</p><p className="text-sm text-gray-500 mt-1">View upcoming & past</p></a>
        <a href={`/patients/${p?.id}`} className="bg-white rounded-xl border border-gray-200 p-5 hover:border-teal-400 transition-colors"><Users size={24} className="text-sky-600 mb-3"/><p className="font-semibold text-gray-900">Medical Records</p><p className="text-sm text-gray-500 mt-1">EMR, diagnoses, prescriptions</p></a>
        <a href="/billing" className="bg-white rounded-xl border border-gray-200 p-5 hover:border-teal-400 transition-colors"><Receipt size={24} className="text-emerald-600 mb-3"/><p className="font-semibold text-gray-900">Bills & Payments</p><p className="text-sm text-gray-500 mt-1">Invoices, pay via M-Pesa</p></a>
      </div>
    </div>
  );
}
