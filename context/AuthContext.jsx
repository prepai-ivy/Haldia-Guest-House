"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient, ApiError } from '@/lib/apiClient';
import { isTokenExpired } from '@/lib/tokenUtils';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Handle automatic logout on token expiration
  const handleTokenExpired = () => {
    setUser(null);
    localStorage.removeItem('lalbaba_user');
    localStorage.removeItem('lalbaba_token');
    router.push('/login');
  };

  // Restore session on reload
  useEffect(() => {
    const savedUser = localStorage.getItem('lalbaba_user');
    const token = localStorage.getItem('lalbaba_token');

    if (savedUser && token && savedUser !== 'undefined') {
      try {
        // Check if token is expired
        if (isTokenExpired(token)) {
          localStorage.removeItem('lalbaba_user');
          localStorage.removeItem('lalbaba_token');
          setLoading(false);
          return;
        }
        setUser(JSON.parse(savedUser));
      } catch {
        // corrupted storage → clean it
        localStorage.removeItem('lalbaba_user');
        localStorage.removeItem('lalbaba_token');
      }
    }

    setLoading(false);
  }, []);

  // Listen for token expiration events
  useEffect(() => {
    window.addEventListener('token-expired', handleTokenExpired);
    return () => window.removeEventListener('token-expired', handleTokenExpired);
  }, [router]);


  const login = async (email, password) => {
    try {
      const res = await apiClient('/auth/login', {
        method: 'POST',
        body: { email, password },
      });

      if (!res.success || !res.data?.user || !res.data?.token) {
        return { success: false, error: 'Invalid login response' };
      }

      const { user, token } = res.data;

      setUser(user);
      localStorage.setItem('lalbaba_user', JSON.stringify(user));
      localStorage.setItem('lalbaba_token', token);

      return { success: true, user };
    } catch (err) {
      if (err instanceof ApiError) {
        return { success: false, error: err.message };
      }
      return { success: false, error: 'Login failed. Please try again.' };
    }
  };


  const logout = () => {
    setUser(null);
    localStorage.removeItem('lalbaba_user');
    localStorage.removeItem('lalbaba_token');
    window.dispatchEvent(new CustomEvent('user-logout'));
    router.push('/login');
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    isSuperAdmin: user?.role === 'SUPER_ADMIN',
    isAdmin: user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN',
    isCustomer: user?.role === 'CUSTOMER',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
