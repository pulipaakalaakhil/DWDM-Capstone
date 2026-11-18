import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '../api/client';

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: string;
  department: string;
  two_factor_enabled?: boolean;
}

interface AuthContextType {
  user: AdminUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (usernameOrEmail: string, password: string) => Promise<any>;
  verify2FA: (tempToken: string, code: string) => Promise<any>;
  resend2FA: (tempToken: string) => Promise<any>;
  register: (data: {
    username: string;
    email: string;
    full_name: string;
    password: string;
    department?: string;
    role?: string;
    two_factor_enabled?: boolean;
  }) => Promise<any>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const DEFAULT_ADMIN: AdminUser = {
  id: 1,
  username: 'admin',
  email: 'admin@traffic.bbmp.gov.in',
  full_name: 'Executive Traffic Controller',
  role: 'Chief Traffic Operations Director',
  department: 'BBMP Central Traffic Command Hub',
  two_factor_enabled: true
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(() => {
    const saved = localStorage.getItem('traffic_admin_user');
    if (saved) {
      try { return JSON.parse(saved); } catch { return DEFAULT_ADMIN; }
    }
    return DEFAULT_ADMIN; // Default fallback for seamless capstone presentation
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('traffic_admin_token') || 'demo_active_session_token';
  });

  const [isLoading, setIsLoading] = useState(false);

  const login = async (usernameOrEmail: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await authApi.login({ username_or_email: usernameOrEmail, password });
      if (res.data.success && res.data.token) {
        setToken(res.data.token);
        setUser(res.data.user);
        localStorage.setItem('traffic_admin_token', res.data.token);
        localStorage.setItem('traffic_admin_user', JSON.stringify(res.data.user));
      }
      return res.data;
    } finally {
      setIsLoading(false);
    }
  };

  const verify2FA = async (tempToken: string, code: string) => {
    setIsLoading(true);
    try {
      const res = await authApi.verify2FA({ temp_token: tempToken, code });
      if (res.data.success && res.data.token) {
        setToken(res.data.token);
        setUser(res.data.user);
        localStorage.setItem('traffic_admin_token', res.data.token);
        localStorage.setItem('traffic_admin_user', JSON.stringify(res.data.user));
      }
      return res.data;
    } finally {
      setIsLoading(false);
    }
  };

  const resend2FA = async (tempToken: string) => {
    const res = await authApi.resend2FA(tempToken);
    return res.data;
  };

  const register = async (data: any) => {
    setIsLoading(true);
    try {
      const res = await authApi.register(data);
      return res.data;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('traffic_admin_token');
    localStorage.removeItem('traffic_admin_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        verify2FA,
        resend2FA,
        register,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
