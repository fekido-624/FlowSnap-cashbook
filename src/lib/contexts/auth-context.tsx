
"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface UserMock {
  uid: string;
  email: string | null;
}

interface AuthContextType {
  user: UserMock | null;
  loading: boolean;
  login: (email: string) => Promise<void>;
  signup: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserMock | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const savedUser = localStorage.getItem('flowsnap_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const signup = async (email: string) => {
    const newUser = { uid: 'user_' + Math.random().toString(36).substr(2, 9), email };
    localStorage.setItem('flowsnap_user', JSON.stringify(newUser));
    setUser(newUser);
    router.push('/books');
  };

  const login = async (email: string) => {
    const newUser = { uid: 'user_mock_123', email };
    localStorage.setItem('flowsnap_user', JSON.stringify(newUser));
    setUser(newUser);
    router.push('/books');
  };

  const logout = async () => {
    localStorage.removeItem('flowsnap_user');
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
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
