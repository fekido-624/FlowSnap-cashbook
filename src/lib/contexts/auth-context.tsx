
"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface UserMock {
  uid: string;
  email: string | null;
  role: 'admin' | 'user';
}

interface AuthContextType {
  user: UserMock | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const USER_KEY = 'flowsnap_user';

/**
 * Call the server-side auth API.
 */
const authRequest = async <T,>(action: string, data: Record<string, any> = {}): Promise<T> => {
  const res = await fetch('/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, data }),
  });
  const body = await res.json();
  if (!res.ok) {
    throw new Error(body.error || 'Ralat pengesahan.');
  }
  return body as T;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserMock | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Restore session from localStorage (session info only, not account list)
    const savedUser = localStorage.getItem(USER_KEY);
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser({
          uid: parsed.uid,
          email: parsed.email,
          role: parsed.role || 'user'
        });
      } catch {
        localStorage.removeItem(USER_KEY);
      }
    }
    setLoading(false);
  }, []);

  const signup = async (email: string, password: string) => {
    await authRequest('signup', { email, password });
    router.push('/login');
  };

  const login = async (email: string, password: string) => {
    const result = await authRequest<{ uid: string; email: string; role: string }>('login', { email, password });
    const newUser: UserMock = {
      uid: result.uid,
      email: result.email,
      role: result.role as 'admin' | 'user',
    };
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    setUser(newUser);
    router.push('/books');
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (!user) throw new Error('Tiada pengguna aktif.');
    await authRequest('changePassword', {
      userId: user.uid,
      currentPassword,
      newPassword,
    });
  };

  const logout = async () => {
    localStorage.removeItem(USER_KEY);
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
