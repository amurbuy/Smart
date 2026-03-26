'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { AuthResponse } from '@/types';

interface AuthCtx {
  user: AuthResponse | null;
  token: string | null;
  login: (data: AuthResponse) => void;
  logout: () => void;
  isLoading: boolean;
}

const Ctx = createContext<AuthCtx>({
  user: null, token: null,
  login: () => {}, logout: () => {}, isLoading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<AuthResponse | null>(null);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    const raw = localStorage.getItem('sl_user');
    if (raw) {
      try { setUser(JSON.parse(raw)); } catch {}
    }
    setLoading(false);
  }, []);

  const login = (data: AuthResponse) => {
    localStorage.setItem('sl_token', data.token);
    localStorage.setItem('sl_user', JSON.stringify(data));
    setUser(data);
  };

  const logout = () => {
    localStorage.removeItem('sl_token');
    localStorage.removeItem('sl_user');
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <Ctx.Provider value={{ user, token: user?.token ?? null, login, logout, isLoading }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
