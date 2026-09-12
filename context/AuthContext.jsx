"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient, ApiError, refreshAccessToken } from '@/lib/apiClient';
import { isTokenExpired } from '@/lib/tokenUtils';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const clearSession = () => {
    localStorage.removeItem('lalbaba_user');
    localStorage.removeItem('lalbaba_token');
    localStorage.removeItem('lalbaba_refresh_token');
  };

  // Handle automatic logout on token expiration
  const handleTokenExpired = () => {
    setUser(null);
    clearSession();
    router.push('/login');
  };

  // Restore session on reload — if the access token expired but a refresh token is still
  // around, try a silent refresh (this also picks up any role/isActive change made while
  // the tab was closed) before giving up on the session.
  useEffect(() => {
    async function restore() {
      const savedUser = localStorage.getItem('lalbaba_user');
      const token = localStorage.getItem('lalbaba_token');
      const refreshToken = localStorage.getItem('lalbaba_refresh_token');

      if (!savedUser || savedUser === 'undefined') {
        setLoading(false);
        return;
      }

      try {
        if (token && !isTokenExpired(token)) {
          setUser(JSON.parse(savedUser));
          setLoading(false);
          return;
        }

        if (refreshToken) {
          const newToken = await refreshAccessToken();
          if (newToken) {
            const updatedUser = localStorage.getItem('lalbaba_user');
            setUser(JSON.parse(updatedUser));
            setLoading(false);
            return;
          }
        }

        clearSession();
      } catch {
        // corrupted storage → clean it
        clearSession();
      }

      setLoading(false);
    }

    restore();
  }, []);

  // Listen for token expiration events
  useEffect(() => {
    window.addEventListener('token-expired', handleTokenExpired);
    return () => window.removeEventListener('token-expired', handleTokenExpired);
  }, [router]);

  // A silent refresh (triggered by apiClient after a 401) may return an updated user —
  // e.g. a role change made by an admin while this session was open.
  useEffect(() => {
    function onRefreshed(e) {
      setUser(e.detail);
    }
    window.addEventListener('user-refreshed', onRefreshed);
    return () => window.removeEventListener('user-refreshed', onRefreshed);
  }, []);


  const login = async (email, password) => {
    try {
      const res = await apiClient('/auth/login', {
        method: 'POST',
        body: { email, password },
      });

      if (!res.success || !res.data?.user || !res.data?.token) {
        return { success: false, error: 'Invalid login response' };
      }

      const { user, token, refreshToken } = res.data;

      setUser(user);
      localStorage.setItem('lalbaba_user', JSON.stringify(user));
      localStorage.setItem('lalbaba_token', token);
      if (refreshToken) localStorage.setItem('lalbaba_refresh_token', refreshToken);

      return { success: true, user };
    } catch (err) {
      if (err instanceof ApiError) {
        return { success: false, error: err.message };
      }
      return { success: false, error: 'Login failed. Please try again.' };
    }
  };


  const logout = () => {
    const refreshToken = localStorage.getItem('lalbaba_refresh_token');
    setUser(null);
    clearSession();
    window.dispatchEvent(new CustomEvent('user-logout'));
    router.push('/login');

    if (refreshToken) {
      // Best-effort revoke — don't block navigation on it.
      apiClient('/auth/logout', { method: 'POST', body: { refreshToken } }).catch(() => {});
    }
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
