// frontend/src/pages/appointments/AppointmentsListPage.tsx

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { apiGet, APPOINTMENT_STATUS_COLORS } from '../../utils/api';
import { PaginatedResponse, Appointment } from '../../types';
import { Search, Plus, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export function AppointmentsListPage() {
  const { hasRole, user } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');

  const queryParams: Record<string, any> = { page, limit: 20, status: status || undefined, type: type || undefined };
  if (user?.role === 'DOCTOR') queryParams.doctorId = user.staffProfile?.id;
  if (user?.role === 'PATIENT') queryParams.patientId = user.patient?.id;

  const { data, isLoading } = useQuery({
    queryKey: ['appointments', page, status, type, user?.id],
    queryFn: () => apiGet<PaginatedResponse<Appointment>>('/appointments', queryParams),
    placeholderData: {
      data: [
        { id: '1', appointmentNo: 'APT-2024-00091', patient: { id: '1', patientNumber: 'MED-00001', firstName: 'Amina', lastName: 'Wanjiku', dateOfBirth: '1985-03-14', gender: 'FEMALE', phone: '0712345678', bloodGroup: 'O_POSITIVE', registeredAt: '', isActive: true }, doctor: { id: 'd1', staffNumber: 'DR-001', firstName: 'David', lastName: 'Mwangi', role: 'DOCTOR', title: 'Dr.', specialisation: 'Internal Medicine' }, department: { id: 'dep1', name: 'OPD', code: 'OPD', type: 'CLINICAL' }, type: 'OPD', status: 'SCHEDULED', scheduledAt: new Date().toISOString(), duration: 30, reason: 'Hypertension follow-up' },
        { id: '2', appointmentNo: 'APT-2024-00092', patient: { id: '2', patientNumber: 'MED-00002', firstName: 'John', lastName: 'Kamau', dateOfBirth: '1978-07-22', gender: 'MALE', phone: '0723456789', bloodGroup: 'A_POSITIVE', registeredAt: '', isActive: true }, doctor: { id: 'd1', staffNumber: 'DR-001', firstName: 'David', lastName: 'Mwangi', role: 'DOCTOR', title: 'Dr.', specialisation: 'Internal Medicine' }, department: { id: 'dep1', name: 'OPD', code: 'OPD', type: 'CLINICAL' }, type: 'OPD', status: 'COMPLETED', scheduledAt: new Date(Date.now() - 86400000).toISOString(), duration: 30, reason: 'Chest pain evaluation' },
      ] as Appointment[],
      pagination: { page: 1, limit: 20, total: 87, pages: 5 },
    },
  });

  const appointments = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
          <p className="text-gray-500 text-sm">{pagination?.total ?? '—'} total</p>
        </div>
        {hasRole('ADMIN', 'RECEPTIONIST', 'DOCTOR', 'PATIENT') && (
          <Link to="/appointments/new" className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-semibold">
            <Plus size={16} /> New Appointment
          </Link>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <select value={status} onChange={e => setStatus(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none">
          <option value="">All Statuses</option>
          {['SCHEDULED','CONFIRMED','IN_PROGRESS','COMPLETED','CANCELLED','NO_SHOW'].map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
        <select value={type} onChange={e => setType(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none">
          <option value="">All Types</option>
          {['OPD','INPATIENT','FOLLOW_UP','EMERGENCY','TELEMEDICINE','PROCEDURE'].map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Appointment No.</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Patient</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Doctor</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Department</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Type</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Date & Time</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {appointments.map(apt => (
                <tr key={apt.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{apt.appointmentNo}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{apt.patient?.firstName} {apt.patient?.lastName}</td>
                  <td className="px-4 py-3 text-gray-600">{apt.doctor?.title} {apt.doctor?.firstName} {apt.doctor?.lastName}</td>
                  <td className="px-4 py-3 text-gray-600">{apt.department?.name}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{apt.type.replace('_', ' ')}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">
                    {new Date(apt.scheduledAt).toLocaleDateString('en-KE')}<br/>
                    <span className="text-gray-400">{new Date(apt.scheduledAt).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${APPOINTMENT_STATUS_COLORS[apt.status]}`}>
                      {apt.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link to={`/appointments/${apt.id}`} className="text-teal-600 hover:underline text-xs font-medium">View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pagination && pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">Page {page} of {pagination.pages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded border border-gray-200 disabled:opacity-40"><ChevronLeft size={16} /></button>
              <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages} className="p-1.5 rounded border border-gray-200 disabled:opacity-40"><ChevronRight size={16} /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
