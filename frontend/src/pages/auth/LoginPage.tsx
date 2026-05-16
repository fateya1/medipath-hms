// frontend/src/pages/auth/LoginPage.tsx

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../contexts/AuthContext';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      setServerError('');
      await login(data as any);
      navigate('/dashboard');
    } catch (err: any) {
      setServerError(err.response?.data?.error || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex w-1/2 bg-teal-800 flex-col items-center justify-center p-12">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6">
            <span className="text-teal-700 font-bold text-4xl">M</span>
          </div>
          <h1 className="text-white text-4xl font-bold mb-3">Medipath HMS</h1>
          <p className="text-teal-200 text-lg">
            Comprehensive Hospital Management System for modern healthcare delivery in Kenya.
          </p>
          <div className="mt-10 grid grid-cols-2 gap-4 text-left">
            {[
              { label: 'Patient Records', desc: 'Complete EMR management' },
              { label: 'M-Pesa Billing', desc: 'Seamless payments' },
              { label: 'Clinical Workflows', desc: 'OPD, IPD, Lab, Pharmacy' },
              { label: 'NHIF / SHA', desc: 'Insurance integration' },
            ].map(item => (
              <div key={item.label} className="bg-white/10 rounded-xl p-4">
                <p className="text-white font-semibold text-sm">{item.label}</p>
                <p className="text-teal-300 text-xs mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
              <p className="text-gray-500 mt-1">Sign in to your Medipath HMS account</p>
            </div>

            {serverError && (
              <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                <AlertCircle size={16} />
                <span>{serverError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
                <input
                  {...register('email')}
                  type="email"
                  placeholder="doctor@medipath.co.ke"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
                {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input type="checkbox" className="rounded border-gray-300 text-teal-600" />
                  Remember me
                </label>
                <Link to="/forgot-password" className="text-sm text-teal-600 hover:text-teal-700 font-medium">
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-semibold rounded-lg text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Signing in…' : 'Sign in'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-500">
              New patient?{' '}
              <Link to="/register" className="text-teal-600 hover:text-teal-700 font-medium">
                Register here
              </Link>
            </p>
          </div>

          <p className="mt-4 text-center text-xs text-gray-400">
            © {new Date().getFullYear()} Medipath HMS · Powered by Kenya Healthcare Innovation
          </p>
        </div>
      </div>
    </div>
  );
}
