'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { registerUser } from '@/api';

export default function RegisterPage() {
  const { login, user, isLoading } = useAuth();
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [error,    setError]    = useState<string | null>(null);
  const [loading,  setLoading]  = useState(false);

  useEffect(() => {
    if (!isLoading && user) router.replace('/');
  }, [user, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirm) { setError('Passwords do not match'); return; }
    if (password.length < 6)  { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      const data = await registerUser({ fullName, email, password });
      login(data);
      router.replace('/');
    } catch (err: any) {
      setError(err.message ?? 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "bg-[#1e2520] border border-[#2a3029] rounded-lg px-3 py-2.5 text-sm text-[#e8ead6] placeholder:text-[#3a4239] focus:outline-none focus:border-[#6dba7d] transition-colors";
  const labelCls = "text-xs font-mono uppercase tracking-widest text-[#7a8c79]";

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f1210] px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-4xl">🌿</span>
          <h1 className="font-display text-3xl text-[#e8ead6] mt-2">SmartLivestock</h1>
          <p className="text-sm text-[#7a8c79] mt-1">Create your account</p>
        </div>

        <div className="bg-[#161a17] border border-[#2a3029] rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <label className="flex flex-col gap-1.5">
              <span className={labelCls}>Full Name</span>
              <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)}
                placeholder="John Smith" className={inputCls} />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className={labelCls}>Email</span>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" className={inputCls} />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className={labelCls}>Password</span>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Min. 6 characters" className={inputCls} />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className={labelCls}>Confirm Password</span>
              <input type="password" required value={confirm} onChange={e => setConfirm(e.target.value)}
                placeholder="••••••••" className={inputCls} />
            </label>

            {error && (
              <p className="text-xs text-rose-400 bg-rose-900/20 border border-rose-900/50 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button type="submit" disabled={loading}
              className="py-2.5 rounded-lg bg-[#6dba7d] text-[#0f1210] font-semibold text-sm hover:bg-[#7dca8d] transition-colors disabled:opacity-50 mt-1">
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-[#7a8c79] mt-6">
            Already have an account?{' '}
            <a href="/login" className="text-[#6dba7d] hover:underline">Sign in</a>
          </p>
        </div>
      </div>
    </div>
  );
}
