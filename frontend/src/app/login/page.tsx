'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { loginUser } from '@/api';

export default function LoginPage() {
  const { login, user, isLoading } = useAuth();
  const router = useRouter();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState<string | null>(null);
  const [loading,  setLoading]  = useState(false);

  useEffect(() => {
    if (!isLoading && user) router.replace('/');
  }, [user, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await loginUser({ email, password });
      login(data);
      router.replace('/');
    } catch (err: any) {
      setError(err.message ?? 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f1210] px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <span className="text-4xl">🌿</span>
          <h1 className="font-display text-3xl text-[#e8ead6] mt-2">SmartLivestock</h1>
          <p className="text-sm text-[#7a8c79] mt-1">Sign in to your account</p>
        </div>

        {/* Card */}
        <div className="bg-[#161a17] border border-[#2a3029] rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-mono uppercase tracking-widest text-[#7a8c79]">Email</span>
              <input
                type="email" required value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="bg-[#1e2520] border border-[#2a3029] rounded-lg px-3 py-2.5 text-sm text-[#e8ead6] placeholder:text-[#3a4239] focus:outline-none focus:border-[#6dba7d] transition-colors"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-mono uppercase tracking-widest text-[#7a8c79]">Password</span>
              <input
                type="password" required value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-[#1e2520] border border-[#2a3029] rounded-lg px-3 py-2.5 text-sm text-[#e8ead6] placeholder:text-[#3a4239] focus:outline-none focus:border-[#6dba7d] transition-colors"
              />
            </label>

            {error && (
              <p className="text-xs text-rose-400 bg-rose-900/20 border border-rose-900/50 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit" disabled={loading}
              className="py-2.5 rounded-lg bg-[#6dba7d] text-[#0f1210] font-semibold text-sm hover:bg-[#7dca8d] transition-colors disabled:opacity-50 mt-1"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-[#7a8c79] mt-6">
            No account?{' '}
            <a href="/register" className="text-[#6dba7d] hover:underline">Register here</a>
          </p>
        </div>
      </div>
    </div>
  );
}
