// frontend/src/pages/doctors/DoctorDetailPage.tsx
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../../utils/api';
import { ArrowLeft, Phone, Mail, Building2, Award } from 'lucide-react';

export function DoctorDetailPage() {
  const { id } = useParams<{id:string}>();
  const { data: doctor, isLoading } = useQuery({
    queryKey: ['doctor', id],
    queryFn:  () => apiGet<any>(`/doctors/${id}`),
  });

  if (isLoading) return <div className="p-6 flex justify-center"><div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"/></div>;
  if (!doctor)   return <div className="p-6 text-gray-500">Doctor not found.</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link to="/doctors" className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"><ArrowLeft size={18}/></Link>
        <h1 className="text-xl font-bold text-gray-900">{doctor.title} {doctor.firstName} {doctor.lastName}</h1>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start gap-6">
          <div className="w-20 h-20 bg-teal-100 rounded-2xl flex items-center justify-center text-teal-700 font-bold text-3xl flex-shrink-0">
            {doctor.firstName[0]}
          </div>
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><p className="text-xs text-gray-400 uppercase font-semibold mb-1">Staff Number</p><p className="text-sm font-mono text-teal-700">{doctor.staffNumber}</p></div>
            <div><p className="text-xs text-gray-400 uppercase font-semibold mb-1">Specialisation</p><p className="text-sm text-gray-800">{doctor.specialisation || 'General Practice'}</p></div>
            <div><p className="text-xs text-gray-400 uppercase font-semibold mb-1 flex items-center gap-1"><Building2 size={11}/>Department</p><p className="text-sm text-gray-800">{doctor.department?.name || '—'}</p></div>
            <div><p className="text-xs text-gray-400 uppercase font-semibold mb-1 flex items-center gap-1"><Phone size={11}/>Phone</p><p className="text-sm text-gray-800">{doctor.phone}</p></div>
            <div><p className="text-xs text-gray-400 uppercase font-semibold mb-1 flex items-center gap-1"><Mail size={11}/>Email</p><p className="text-sm text-gray-800">{doctor.user?.email}</p></div>
            <div><p className="text-xs text-gray-400 uppercase font-semibold mb-1 flex items-center gap-1"><Award size={11}/>License No.</p><p className="text-sm text-gray-800">{doctor.licenseNumber || '—'}</p></div>
          </div>
        </div>
        {doctor.qualifications?.length > 0 && (
          <div className="mt-5 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400 uppercase font-semibold mb-2">Qualifications</p>
            <div className="flex flex-wrap gap-2">
              {doctor.qualifications.map((q:string,i:number)=><span key={i} className="px-3 py-1 bg-teal-50 text-teal-700 rounded-full text-xs font-medium">{q}</span>)}
            </div>
          </div>
        )}
      </div>
      <div className="flex gap-3">
        <Link to={`/appointments/new?doctorId=${id}`} className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-sm font-medium rounded-lg transition-colors">Book Appointment</Link>
      </div>
    </div>
  );
}
