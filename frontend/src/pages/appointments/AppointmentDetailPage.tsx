// frontend/src/pages/appointments/AppointmentDetailPage.tsx
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPatch, APPOINTMENT_STATUS_COLORS } from '../../utils/api';
import { Appointment } from '../../types';
import { ArrowLeft, Calendar, Clock, User } from 'lucide-react';
import { calculateAge } from '../../utils/api';

const STATUSES = ['SCHEDULED','CONFIRMED','IN_PROGRESS','COMPLETED','CANCELLED','NO_SHOW'];

export function AppointmentDetailPage() {
  const { id } = useParams<{id:string}>();
  const qc = useQueryClient();

  const { data: appt, isLoading } = useQuery({
    queryKey: ['appointment', id],
    queryFn: () => apiGet<Appointment>(`/appointments/${id}`),
  });

  const { mutate: updateStatus, isPending } = useMutation({
    mutationFn: (status: string) => apiPatch(`/appointments/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointment', id] }),
  });

  if (isLoading) return <div className="p-6 flex justify-center"><div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"/></div>;
  if (!appt) return <div className="p-6 text-gray-500">Appointment not found.</div>;

  const pt = appt.patient;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link to="/appointments" className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"><ArrowLeft size={18}/></Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Appointment {appt.appointmentNo}</h1>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${APPOINTMENT_STATUS_COLORS[appt.status]}`}>{appt.status.replace('_',' ')}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Patient card */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3 flex items-center gap-2"><User size={13}/>Patient</h3>
          {pt && <>
            <Link to={`/patients/${pt.id}`} className="font-semibold text-teal-700 hover:underline text-base">
              {pt.firstName} {pt.lastName}
            </Link>
            <p className="text-sm text-gray-500 mt-0.5">{pt.patientNumber} · {calculateAge(pt.dateOfBirth)} yrs · {pt.gender}</p>
            <p className="text-sm text-gray-600 mt-1">{pt.phone}</p>
          </>}
        </div>
        {/* Appointment details */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-2">
          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3 flex items-center gap-2"><Calendar size={13}/>Details</h3>
          <div className="flex items-center gap-2 text-sm text-gray-700"><Calendar size={14} className="text-gray-400"/>{new Date(appt.scheduledAt).toLocaleString('en-KE')}</div>
          <div className="flex items-center gap-2 text-sm text-gray-700"><Clock size={14} className="text-gray-400"/>{appt.duration} minutes · {appt.type.replace('_',' ')}</div>
          {appt.department && <p className="text-sm text-gray-600">{appt.department.name}</p>}
          {appt.doctor && <p className="text-sm text-gray-600">{appt.doctor.title} {appt.doctor.firstName} {appt.doctor.lastName}</p>}
          {appt.reason && <p className="text-sm text-gray-500 border-t pt-2 mt-2 italic">"{appt.reason}"</p>}
        </div>
      </div>

      {/* Status update */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">Update Status</h3>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map(s=>(
            <button key={s} disabled={isPending || appt.status===s}
              onClick={()=>updateStatus(s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${appt.status===s?'bg-teal-700 text-white border-teal-700':'border-gray-300 hover:bg-gray-50'}`}>
              {s.replace('_',' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Medical record link */}
      {appt.medicalRecord && (
        <Link to={`/patients/${pt?.id}/records/${appt.medicalRecord.id}`}
          className="block bg-teal-50 border border-teal-200 rounded-xl p-4 hover:bg-teal-100 transition-colors">
          <p className="font-medium text-teal-800">View Medical Record →</p>
          <p className="text-sm text-teal-600 mt-0.5">{appt.medicalRecord.chiefComplaint}</p>
        </Link>
      )}
    </div>
  );
}
