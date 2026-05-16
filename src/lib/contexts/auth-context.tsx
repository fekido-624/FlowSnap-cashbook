
"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface UserMock {
  uid: string;
  email: string | null;
  role: 'admin' | 'user';
}

interface UserAccount {
  uid: string;
  email: string;
  password: string;
  role: 'admin' | 'user';
  status: 'pending' | 'active' | 'frozen';
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
const ACCOUNTS_KEY = 'flowsnap_accounts';
const DEFAULT_ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@flowsnap.local';
const DEFAULT_ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123';

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const getSavedAccounts = (): UserAccount[] => {
  if (typeof window === 'undefined') return [];
  try {
    const saved = JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || '[]');
    const adminAccount: UserAccount = {
      uid: 'admin_' + Math.random().toString(36).substring(2, 11),
      email: normalizeEmail(DEFAULT_ADMIN_EMAIL),
      password: DEFAULT_ADMIN_PASSWORD,
      role: 'admin',
      status: 'active'
    };

    if (!Array.isArray(saved) || saved.length === 0) {
      saveAccounts([adminAccount]);
      return [adminAccount];
    }

    const accounts = saved as UserAccount[];
    const hasAdmin = accounts.some((account) => account.role === 'admin');
    if (!hasAdmin) {
      const updated = [adminAccount, ...accounts];
      saveAccounts(updated);
      return updated;
    }

    return accounts;
  } catch {
    const adminAccount: UserAccount = {
      uid: 'admin_' + Math.random().toString(36).substring(2, 11),
      email: normalizeEmail(DEFAULT_ADMIN_EMAIL),
      password: DEFAULT_ADMIN_PASSWORD,
      role: 'admin',
      status: 'active'
    };
    saveAccounts([adminAccount]);
    return [adminAccount];
  }
};

const saveAccounts = (accounts: UserAccount[]) => {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserMock | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const savedUser = localStorage.getItem(USER_KEY);
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      setUser({
        uid: parsed.uid,
        email: parsed.email,
        role: parsed.role || 'user'
      });
    }
    setLoading(false);
  }, []);

  const signup = async (email: string, password: string) => {
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) throw new Error('Email diperlukan.');
    if (password.length < 6) throw new Error('Kata laluan mesti sekurang-kurangnya 6 aksara.');

    const accounts = getSavedAccounts();
    const existing = accounts.find((account) => account.email === normalizedEmail);
    if (existing) {
      throw new Error('Email ini telah digunakan. Sila log masuk atau guna email lain.');
    }

    const newAccount: UserAccount = {
      uid: 'user_' + Math.random().toString(36).substring(2, 11),
      email: normalizedEmail,
      password,
      role: 'user',
      status: 'pending'
    };

    accounts.push(newAccount);
    saveAccounts(accounts);

    router.push('/login');
  };

  const login = async (email: string, password: string) => {
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) throw new Error('Email diperlukan.');
    if (!password) throw new Error('Kata laluan diperlukan.');

    const accounts = getSavedAccounts();
    const account = accounts.find((item) => item.email === normalizedEmail && item.password === password);
    if (!account) {
      throw new Error('Email atau kata laluan tidak betul. Sila cuba lagi.');
    }

    if (account.status === 'pending') {
      throw new Error('Akaun anda masih menunggu kelulusan admin.');
    }

    if (account.status === 'frozen') {
      throw new Error('Akaun anda telah dibekukan. Hubungi admin.');
    }

    const newUser = { uid: account.uid, email: account.email, role: account.role };
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    setUser(newUser);
    router.push('/books');
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (!user) throw new Error('Tiada pengguna aktif.');
    if (!currentPassword) throw new Error('Kata laluan semasa diperlukan.');
    if (newPassword.length < 6) throw new Error('Kata laluan baru mesti sekurang-kurangnya 6 aksara.');

    const accounts = getSavedAccounts();
    const accountIndex = accounts.findIndex((account) => account.uid === user.uid);
    if (accountIndex === -1) throw new Error('Akaun tidak dijumpai.');
    if (accounts[accountIndex].password !== currentPassword) throw new Error('Kata laluan semasa tidak betul.');

    accounts[accountIndex] = {
      ...accounts[accountIndex],
      password: newPassword
    };
    saveAccounts(accounts);
  };

  const logout = async () => {
    localStorage.removeItem(USER_KEY);
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
