// frontend/src/pages/auth/RegisterPage.tsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../../utils/api';
import { Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';

const schema = z.object({
  firstName:   z.string().min(1, 'First name required'),
  lastName:    z.string().min(1, 'Last name required'),
  email:       z.string().email('Valid email required'),
  password:    z.string().min(8, 'Minimum 8 characters'),
  confirm:     z.string(),
  dateOfBirth: z.string().min(1, 'Date of birth required'),
  gender:      z.enum(['MALE','FEMALE','OTHER','PREFER_NOT_TO_SAY']),
  phone:       z.string().min(10, 'Valid phone required'),
  county:      z.string().optional(),
  nationalId:  z.string().optional(),
}).refine(d => d.password === d.confirm, { message: 'Passwords do not match', path: ['confirm'] });

type Form = z.infer<typeof schema>;

const COUNTIES = ['Nairobi','Mombasa','Kisumu','Nakuru','Uasin Gishu','Machakos','Nyeri','Kakamega','Kilifi','Meru','Embu','Laikipia','Nyandarua','Kirinyaga','Murang\'a','Kiambu','Kajiado','Makueni','Kitui','Isiolo'];

export function RegisterPage() {
  const navigate = useNavigate();
  const [showPw, setShowPw]   = useState(false);
  const [error,  setError]    = useState('');
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: Form) => {
    try {
      setError('');
      const { confirm, ...payload } = data;
      await api.post('/auth/register/patient', payload);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (e: any) {
      setError(e.response?.data?.error || 'Registration failed. Please try again.');
    }
  };

  if (success) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center max-w-sm">
        <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900">Registered Successfully!</h2>
        <p className="text-gray-500 text-sm mt-2">Redirecting to login…</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-teal-700 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <span className="text-white font-bold text-2xl">M</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Create Patient Account</h1>
          <p className="text-gray-500 text-sm mt-1">Register to access Medipath HMS services</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          {error && (
            <div className="mb-5 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <AlertCircle size={16} />{error}
            </div>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Name row */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
              <input {...register('firstName')} className="input-field" placeholder="John" />
              {errors.firstName && <p className="err">{errors.firstName.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
              <input {...register('lastName')} className="input-field" placeholder="Doe" />
              {errors.lastName && <p className="err">{errors.lastName.message}</p>}
            </div>
            {/* Email */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
              <input {...register('email')} type="email" className="input-field" placeholder="john@example.com" />
              {errors.email && <p className="err">{errors.email.message}</p>}
            </div>
            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
              <div className="relative">
                <input {...register('password')} type={showPw ? 'text' : 'password'} className="input-field pr-10" placeholder="••••••••" />
                <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
              {errors.password && <p className="err">{errors.password.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
              <input {...register('confirm')} type="password" className="input-field" placeholder="••••••••" />
              {errors.confirm && <p className="err">{errors.confirm.message}</p>}
            </div>
            {/* DOB & Gender */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth *</label>
              <input {...register('dateOfBirth')} type="date" className="input-field" />
              {errors.dateOfBirth && <p className="err">{errors.dateOfBirth.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
              <select {...register('gender')} className="input-field">
                <option value="">Select gender</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
                <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
              </select>
              {errors.gender && <p className="err">{errors.gender.message}</p>}
            </div>
            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
              <input {...register('phone')} className="input-field" placeholder="0712 345 678" />
              {errors.phone && <p className="err">{errors.phone.message}</p>}
            </div>
            {/* National ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">National ID / Passport</label>
              <input {...register('nationalId')} className="input-field" placeholder="12345678" />
            </div>
            {/* County */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">County</label>
              <select {...register('county')} className="input-field">
                <option value="">Select county</option>
                {COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="sm:col-span-2 mt-2">
              <button type="submit" disabled={isSubmitting}
                className="w-full py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-semibold rounded-lg text-sm transition-colors disabled:opacity-60">
                {isSubmitting ? 'Creating account…' : 'Create Account'}
              </button>
            </div>
          </form>

          <p className="mt-5 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="text-teal-600 font-medium hover:text-teal-700">Sign in</Link>
          </p>
        </div>

        {/* Inline Tailwind helper classes via a hidden div — works without purge */}
        <style>{`
          .input-field { width:100%; padding:0.625rem 1rem; border:1px solid #d1d5db; border-radius:0.5rem; font-size:0.875rem; outline:none; transition:box-shadow .15s; }
          .input-field:focus { box-shadow:0 0 0 2px #0d9488; border-color:transparent; }
          .err { margin-top:0.25rem; font-size:0.75rem; color:#dc2626; }
        `}</style>
      </div>
    </div>
  );
}
