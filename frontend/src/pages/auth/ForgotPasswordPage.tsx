// frontend/src/pages/auth/ForgotPasswordPage.tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';

export function ForgotPasswordPage() {
  const [email, setEmail]   = useState('');
  const [sent,  setSent]    = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    setSent(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md">
        <Link to="/login" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft size={16}/> Back to login
        </Link>
        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          {sent ? (
            <div className="text-center py-4">
              <CheckCircle size={48} className="text-green-500 mx-auto mb-4"/>
              <h2 className="text-xl font-bold text-gray-900">Check your email</h2>
              <p className="text-gray-500 text-sm mt-2">If <strong>{email}</strong> is registered, you will receive a password reset link shortly.</p>
              <Link to="/login" className="mt-6 inline-block text-sm text-teal-600 font-medium hover:text-teal-700">Return to login</Link>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center mb-4">
                  <Mail size={22} className="text-teal-700"/>
                </div>
                <h2 className="text-xl font-bold text-gray-900">Reset your password</h2>
                <p className="text-gray-500 text-sm mt-1">Enter your registered email and we will send a reset link.</p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)} required
                    placeholder="you@example.com"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-semibold rounded-lg text-sm transition-colors disabled:opacity-60">
                  {loading ? 'Sending…' : 'Send Reset Link'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
