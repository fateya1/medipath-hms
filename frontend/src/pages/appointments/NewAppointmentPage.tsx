// frontend/src/pages/appointments/NewAppointmentPage.tsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { apiGet, apiPost } from '../../utils/api';
import { ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';

const schema = z.object({
  patientId:    z.string().min(1, 'Select a patient'),
  doctorId:     z.string().min(1, 'Select a doctor'),
  departmentId: z.string().min(1, 'Select a department'),
  type:         z.enum(['OPD','INPATIENT','FOLLOW_UP','EMERGENCY','TELEMEDICINE','PROCEDURE']),
  scheduledAt:  z.string().min(1, 'Date & time required'),
  duration:     z.coerce.number().min(10).max(240),
  reason:       z.string().optional(),
});
type Form = z.infer<typeof schema>;

const IC = "w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500";

export function NewAppointmentPage() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const [done, setDone] = useState(false);

  const { data: patients } = useQuery({ queryKey:['patients-select'], queryFn: ()=>apiGet<any>('/patients?limit=200') });
  const { data: depts }    = useQuery({ queryKey:['departments'],      queryFn: ()=>apiGet<any>('/departments') });
  const { data: doctors }  = useQuery({ queryKey:['doctors-select'],   queryFn: ()=>apiGet<any>('/doctors?limit=100') });

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { type:'OPD', duration:30 },
  });

  const onSubmit = async (data: Form) => {
    try {
      setServerError('');
      await apiPost('/appointments', { ...data, scheduledAt: new Date(data.scheduledAt).toISOString() });
      setDone(true);
    } catch (e:any) {
      setServerError(e.response?.data?.error || 'Failed to book appointment.');
    }
  };

  if (done) return (
    <div className="p-6 flex justify-center">
      <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center max-w-sm">
        <CheckCircle size={48} className="text-green-500 mx-auto mb-4"/>
        <h2 className="text-xl font-bold text-gray-900">Appointment Booked!</h2>
        <div className="flex gap-3 mt-6">
          <button onClick={()=>navigate('/appointments')} className="flex-1 px-4 py-2 bg-teal-700 text-white rounded-lg text-sm hover:bg-teal-800">View Appointments</button>
          <button onClick={()=>setDone(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Book Another</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/appointments" className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"><ArrowLeft size={18}/></Link>
        <div><h1 className="text-2xl font-bold text-gray-900">Book Appointment</h1><p className="text-gray-500 text-sm">Schedule OPD, follow-up or specialist visit</p></div>
      </div>
      {serverError && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertCircle size={16}/>{serverError}
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Patient *</label>
            <select {...register('patientId')} className={IC}>
              <option value="">Select patient…</option>
              {patients?.data?.map((p:any)=><option key={p.id} value={p.id}>{p.firstName} {p.lastName} — {p.patientNumber}</option>)}
            </select>
            {errors.patientId && <p className="mt-1 text-xs text-red-600">{errors.patientId.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
            <select {...register('departmentId')} className={IC}>
              <option value="">Select department…</option>
              {depts?.map((d:any)=><option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            {errors.departmentId && <p className="mt-1 text-xs text-red-600">{errors.departmentId.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Doctor *</label>
            <select {...register('doctorId')} className={IC}>
              <option value="">Select doctor…</option>
              {doctors?.data?.map((d:any)=><option key={d.id} value={d.id}>{d.title} {d.firstName} {d.lastName}</option>)}
            </select>
            {errors.doctorId && <p className="mt-1 text-xs text-red-600">{errors.doctorId.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
            <select {...register('type')} className={IC}>
              {['OPD','FOLLOW_UP','PROCEDURE','TELEMEDICINE','EMERGENCY'].map(t=><option key={t} value={t}>{t.replace('_',' ')}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
            <input {...register('duration')} type="number" className={IC} min={10} max={240} step={15}/>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time *</label>
            <input {...register('scheduledAt')} type="datetime-local" className={IC}/>
            {errors.scheduledAt && <p className="mt-1 text-xs text-red-600">{errors.scheduledAt.message}</p>}
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason / Chief Complaint</label>
            <textarea {...register('reason')} rows={3} className={IC} placeholder="Briefly describe the reason for the appointment…"/>
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Link to="/appointments" className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Cancel</Link>
          <button type="submit" disabled={isSubmitting}
            className="px-6 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-semibold rounded-lg text-sm disabled:opacity-60">
            {isSubmitting ? 'Booking…' : 'Book Appointment'}
          </button>
        </div>
      </form>
    </div>
  );
}
