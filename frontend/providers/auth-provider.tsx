// frontend/providers/auth-provider.tsx
'use client';

import { createContext, useContext, useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';

const AuthContext = createContext({});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { refreshUser, isAuthenticated } = useAuthStore();

  useEffect(() => {
    // Refresh user on mount if we have a token
    const token = localStorage.getItem('auth_token');
    if (token) {
      refreshUser();
    }
  }, [refreshUser]);

  return (
    <AuthContext.Provider value={{}}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
