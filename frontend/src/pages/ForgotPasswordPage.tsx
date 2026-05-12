import { useState } from 'react';
import { Mail, Lock, Globe, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const response = await fetch('http://127.0.0.1:5000/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, new_password: newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update password');
      }

      setSuccess('Password updated successfully! You can now log in.');
      setEmail('');
      setNewPassword('');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#f4f4f9' }}>
      <div className="w-full max-w-md relative z-10">
        <div className="bg-white rounded-3xl p-8 sm:p-10 card-shadow border border-gray-100">
          
          <button 
            onClick={() => navigate('/login')}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-orange-500 font-semibold mb-8 transition-colors"
          >
            <ArrowLeft size={16} /> Back to Login
          </button>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-gray-100 border border-gray-200">
                <Lock size={26} className="text-gray-400" />
              </div>
            </div>
            
            <h1 className="text-2xl font-bold mb-2" style={{ color: '#1e2a5e' }}>
              Reset Password
            </h1>
            <p className="text-sm text-gray-500">
              Enter your registered email address and your new password to update your account.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm text-center font-medium">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-3 rounded-xl bg-green-50 border border-green-100 text-green-700 text-sm text-center font-medium">
              {success}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: '#1e2a5e' }}>Account Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={18} className="text-gray-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all font-medium"
                  placeholder="you@domain.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: '#1e2a5e' }}>New Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={18} className="text-gray-400" />
                </div>
                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all font-medium"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !!success}
              className="w-full flex items-center justify-center gap-2 py-3.5 mt-6 rounded-xl font-semibold text-white gradient-orange transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  Update Password
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
