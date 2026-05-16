// frontend/src/pages/patients/PatientRegisterPage.tsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../../utils/api';
import { ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';

const schema = z.object({
  email:       z.string().email('Valid email required'),
  password:    z.string().min(8, 'Min 8 characters'),
  firstName:   z.string().min(1, 'Required'),
  middleName:  z.string().optional(),
  lastName:    z.string().min(1, 'Required'),
  dateOfBirth: z.string().min(1, 'Required'),
  gender:      z.enum(['MALE','FEMALE','OTHER','PREFER_NOT_TO_SAY']),
  phone:       z.string().min(10, 'Valid phone required'),
  nationalId:  z.string().optional(),
  nhifNumber:  z.string().optional(),
  shaNumber:   z.string().optional(),
  bloodGroup:  z.string().optional(),
  county:      z.string().optional(),
  subCounty:   z.string().optional(),
  allergies:   z.string().optional(),
  chronicConditions: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone:   z.string().optional(),
  emergencyRelation:z.string().optional(),
  insuranceProvider: z.string().optional(),
  insurancePolicyNo: z.string().optional(),
});
type Form = z.infer<typeof schema>;

const BLOOD_GROUPS = ['A_POSITIVE','A_NEGATIVE','B_POSITIVE','B_NEGATIVE','AB_POSITIVE','AB_NEGATIVE','O_POSITIVE','O_NEGATIVE','UNKNOWN'];
const COUNTIES = ['Nairobi','Mombasa','Kisumu','Nakuru','Uasin Gishu','Machakos','Nyeri','Kakamega','Kilifi','Meru','Kiambu'];

function Field({ label, error, required, children }: { label:string; error?:string; required?:boolean; children:React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

const IC = "w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent";

export function PatientRegisterPage() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const [created, setCreated] = useState<{patientNumber:string}|null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { bloodGroup: 'UNKNOWN' },
  });

  const onSubmit = async (data: Form) => {
    try {
      setServerError('');
      const payload = {
        ...data,
        dateOfBirth: new Date(data.dateOfBirth).toISOString(),
        allergies: data.allergies ? data.allergies.split(',').map(s=>s.trim()).filter(Boolean) : [],
        chronicConditions: data.chronicConditions ? data.chronicConditions.split(',').map(s=>s.trim()).filter(Boolean) : [],
        password: data.password || 'Medipath@2024',
      };
      const res = await api.post('/auth/register/patient', payload);
      setCreated({ patientNumber: res.data.user.profile.patientNumber });
    } catch (e: any) {
      setServerError(e.response?.data?.error || 'Registration failed.');
    }
  };

  if (created) return (
    <div className="p-6 flex items-center justify-center min-h-96">
      <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center max-w-sm">
        <CheckCircle size={48} className="text-green-500 mx-auto mb-4"/>
        <h2 className="text-xl font-bold text-gray-900">Patient Registered!</h2>
        <p className="text-gray-500 text-sm mt-2">Patient number: <strong className="text-teal-700">{created.patientNumber}</strong></p>
        <div className="flex gap-3 mt-6">
          <button onClick={() => navigate('/patients')} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">View Patients</button>
          <button onClick={() => { setCreated(null); }} className="flex-1 px-4 py-2 bg-teal-700 text-white rounded-lg text-sm hover:bg-teal-800">Register Another</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/patients" className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"><ArrowLeft size={18}/></Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Register New Patient</h1>
          <p className="text-gray-500 text-sm">Complete all required fields (*)</p>
        </div>
      </div>

      {serverError && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertCircle size={16}/>{serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Personal Information */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">Personal Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="First Name" required error={errors.firstName?.message}><input {...register('firstName')} className={IC} placeholder="John"/></Field>
            <Field label="Middle Name" error={errors.middleName?.message}><input {...register('middleName')} className={IC} placeholder="(Optional)"/></Field>
            <Field label="Last Name" required error={errors.lastName?.message}><input {...register('lastName')} className={IC} placeholder="Doe"/></Field>
            <Field label="Date of Birth" required error={errors.dateOfBirth?.message}><input {...register('dateOfBirth')} type="date" className={IC}/></Field>
            <Field label="Gender" required error={errors.gender?.message}>
              <select {...register('gender')} className={IC}>
                <option value="">Select…</option>
                <option value="MALE">Male</option><option value="FEMALE">Female</option><option value="OTHER">Other</option><option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
              </select>
            </Field>
            <Field label="Blood Group" error={errors.bloodGroup?.message}>
              <select {...register('bloodGroup')} className={IC}>
                {BLOOD_GROUPS.map(b=><option key={b} value={b}>{b.replace('_POSITIVE','+').replace('_NEGATIVE','-')}</option>)}
              </select>
            </Field>
            <Field label="National ID / Passport" error={errors.nationalId?.message}><input {...register('nationalId')} className={IC} placeholder="12345678"/></Field>
            <Field label="Phone Number" required error={errors.phone?.message}><input {...register('phone')} className={IC} placeholder="0712 345 678"/></Field>
            <Field label="Email" required error={errors.email?.message}><input {...register('email')} type="email" className={IC} placeholder="patient@email.com"/></Field>
          </div>
        </div>

        {/* Insurance */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">Insurance & Benefits</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="NHIF Number"><input {...register('nhifNumber')} className={IC} placeholder="NHIF No."/></Field>
            <Field label="SHA Number"><input {...register('shaNumber')} className={IC} placeholder="SHA No."/></Field>
            <Field label="Insurance Provider"><input {...register('insuranceProvider')} className={IC} placeholder="e.g. Jubilee, AAR"/></Field>
            <Field label="Policy Number"><input {...register('insurancePolicyNo')} className={IC}/></Field>
          </div>
        </div>

        {/* Location */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">Location</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="County">
              <select {...register('county')} className={IC}>
                <option value="">Select county</option>
                {COUNTIES.map(c=><option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Sub-County"><input {...register('subCounty')} className={IC}/></Field>
          </div>
        </div>

        {/* Medical Background */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">Medical Background</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Known Allergies (comma-separated)"><input {...register('allergies')} className={IC} placeholder="Penicillin, Sulfa, …"/></Field>
            <Field label="Chronic Conditions"><input {...register('chronicConditions')} className={IC} placeholder="Diabetes, Hypertension, …"/></Field>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">Emergency Contact</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Name"><input {...register('emergencyContact')} className={IC}/></Field>
            <Field label="Phone"><input {...register('emergencyPhone')} className={IC}/></Field>
            <Field label="Relationship"><input {...register('emergencyRelation')} className={IC} placeholder="Spouse, Parent, …"/></Field>
          </div>
        </div>

        {/* Account Password */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">Account Password</h2>
          <div className="max-w-sm">
            <Field label="Temporary Password" required error={errors.password?.message}>
              <input {...register('password')} className={IC} defaultValue="Medipath@2024" placeholder="Medipath@2024"/>
            </Field>
            <p className="text-xs text-gray-400 mt-1">Patient should change this on first login.</p>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Link to="/patients" className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Cancel</Link>
          <button type="submit" disabled={isSubmitting}
            className="px-6 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-semibold rounded-lg text-sm disabled:opacity-60 transition-colors">
            {isSubmitting ? 'Registering…' : 'Register Patient'}
          </button>
        </div>
      </form>
    </div>
  );
}
