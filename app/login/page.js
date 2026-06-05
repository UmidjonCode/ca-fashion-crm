'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, LogIn } from 'lucide-react';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.push('/');
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.message || 'Parol noto\'g\'ri!');
      }
    } catch (err) {
      setError('Tizim xatosi yuz berdi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <div className="w-full max-w-md rounded-2xl bg-[#111116] border border-[#2a2a35] p-8 shadow-xl">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 rounded-full bg-teal-500 p-4 text-[#111116]">
            <Lock size={32} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-200">
            Admin Panel
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            Tizimga kirish uchun maxfiy parolni kiriting
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">
              Maxfiy Parol
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-[#2a2a35] bg-[#15151d] p-4 text-zinc-200 outline-none transition-all focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="rounded-xl bg-red-500/10 p-4 text-sm text-red-500 border border-red-500/20">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-500 px-4 py-4 text-sm font-medium text-[#111116] transition-all hover:bg-teal-400 disabled:opacity-70"
          >
            {loading ? 'Tekshirilmoqda...' : 'Tizimga kirish'}
            <LogIn size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
