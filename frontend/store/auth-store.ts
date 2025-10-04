// frontend/store/auth-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Artist, UserRole, SocialLinks } from '@/types/user';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  registrationStep: number;
  registrationData: Partial<RegisterData>;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  updateProfile: (userData: Partial<User>) => void;
  refreshUser: () => Promise<void>;
  setRegistrationStep: (step: number) => void;
  updateRegistrationData: (data: Partial<RegisterData>) => void;
  clearRegistrationData: () => void;
  socialLogin: (provider: 'google' | 'apple' | 'facebook') => Promise<void>;
}

interface RegisterData {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
  stageName?: string;
  genres?: string[];
  bio?: string;
  location?: string;
  socialLinks?: SocialLinks;
  acceptTerms: boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      registrationStep: 1,
      registrationData: {},

      setRegistrationStep: (step: number) => {
        set({ registrationStep: step });
      },

      updateRegistrationData: (data: Partial<RegisterData>) => {
        const currentData = get().registrationData;
        set({ registrationData: { ...currentData, ...data } });
      },

      clearRegistrationData: () => {
        set({ registrationData: {}, registrationStep: 1 });
      },

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message);
          }

          const { user, token } = await response.json();
          
          localStorage.setItem('auth_token', token);
          set({ user, isAuthenticated: true, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (userData: RegisterData) => {
        set({ isLoading: true });
        try {
          const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message);
          }

          const { user, token } = await response.json();
          
          localStorage.setItem('auth_token', token);
          set({ 
            user, 
            isAuthenticated: true, 
            isLoading: false,
            registrationData: {},
            registrationStep: 1 
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      socialLogin: async (provider: 'google' | 'apple' | 'facebook') => {
        set({ isLoading: true });
        try {
          // Redirect to backend social auth endpoint
          window.location.href = `/api/auth/${provider}`;
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        localStorage.removeItem('auth_token');
        set({ user: null, isAuthenticated: false });
        // Redirect to home page
        window.location.href = '/';
      },

      updateProfile: (userData: Partial<User>) => {
        const { user } = get();
        if (user) {
          set({ user: { ...user, ...userData } });
        }
      },

      refreshUser: async () => {
        try {
          const token = localStorage.getItem('auth_token');
          if (!token) return;

          const response = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const user = await response.json();
            set({ user, isAuthenticated: true });
          } else {
            // Token is invalid, logout user
            get().logout();
          }
        } catch (error) {
          console.error('Failed to refresh user:', error);
          get().logout();
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated,
        registrationData: state.registrationData,
        registrationStep: state.registrationStep,
      }),
    }
  )
);
