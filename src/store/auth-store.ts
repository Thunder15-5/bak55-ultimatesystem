import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';
import { toast } from 'sonner';

interface User {
  id: string;
  email: string;
  username: string;
  role: 'artist' | 'brand' | 'admin';
  avatar?: string;
  bio?: string;
  location?: string;
  stageName?: string;
  genres?: string[];
  companyName?: string;
  createdAt: string;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  registrationStep: number;
  registrationData: Partial<RegisterData>;
  
  // Actions
  initializeAuth: () => Promise<void>;
  fetchUserProfile: (userId: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (userData: Partial<User>) => Promise<void>;
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
  role: 'artist' | 'brand' | 'admin';
  stageName?: string;
  genres?: string[];
  bio?: string;
  location?: string;
  companyName?: string;
  industry?: string;
  website?: string;
  acceptTerms: boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      isAuthenticated: false,
      isLoading: false,
      registrationStep: 1,
      registrationData: {},

      initializeAuth: async () => {
        set({ isLoading: true });
        
        // Set up auth state listener
        supabase.auth.onAuthStateChange((event, session) => {
          if (session?.user) {
            setTimeout(() => {
              get().fetchUserProfile(session.user.id);
            }, 0);
          } else {
            set({ session: null, user: null, isAuthenticated: false });
          }
        });

        // Check for existing session
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await get().fetchUserProfile(session.user.id);
        }
        set({ isLoading: false });
      },

      fetchUserProfile: async (userId: string) => {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*, user_roles(role), artist_profiles(*), brand_profiles(*)')
            .eq('id', userId)
            .single();

          if (profile) {
            const role = profile.user_roles?.[0]?.role || 'artist';
            const user: User = {
              id: profile.id,
              email: profile.email,
              username: profile.username,
              role: role as 'artist' | 'brand' | 'admin',
              avatar: profile.avatar_url,
              bio: profile.bio,
              location: profile.location,
              stageName: profile.artist_profiles?.[0]?.stage_name,
              genres: profile.artist_profiles?.[0]?.genres,
              companyName: profile.brand_profiles?.[0]?.company_name,
              createdAt: profile.created_at,
            };

            const { data: { session } } = await supabase.auth.getSession();
            set({ user, session, isAuthenticated: true });
          }
        } catch (error: any) {
          console.error('Error fetching profile:', error);
          set({ user: null, session: null, isAuthenticated: false });
        }
      },

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
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) throw error;

          toast.success('Welcome back!');
          set({ isLoading: false });
        } catch (error: any) {
          set({ isLoading: false });
          toast.error(error.message || 'Failed to login');
          throw error;
        }
      },

      register: async (userData: RegisterData) => {
        set({ isLoading: true });
        try {
          const { data, error } = await supabase.auth.signUp({
            email: userData.email,
            password: userData.password,
            options: {
              emailRedirectTo: `${window.location.origin}/`,
              data: {
                username: userData.username,
                role: userData.role,
                stage_name: userData.stageName,
                genres: userData.genres,
                bio: userData.bio,
                location: userData.location,
                company_name: userData.companyName,
                industry: userData.industry,
                website: userData.website,
              },
            },
          });

          if (error) throw error;

          toast.success('Registration successful! Welcome to BAK55 Talent!');
          
          // Wait a moment for trigger to complete, then fetch profile
          setTimeout(() => {
            if (data.user) {
              get().fetchUserProfile(data.user.id);
            }
          }, 1000);
          
          set({ 
            isLoading: false,
            registrationData: {},
            registrationStep: 1 
          });
        } catch (error: any) {
          set({ isLoading: false });
          toast.error(error.message || 'Failed to register');
          throw error;
        }
      },

      socialLogin: async (provider: 'google' | 'apple' | 'facebook') => {
        set({ isLoading: true });
        try {
          const { error } = await supabase.auth.signInWithOAuth({
            provider,
            options: {
              redirectTo: `${window.location.origin}/`,
            },
          });

          if (error) throw error;
        } catch (error: any) {
          set({ isLoading: false });
          toast.error(error.message || `Failed to login with ${provider}`);
          throw error;
        }
      },

      logout: async () => {
        try {
          await supabase.auth.signOut();
          set({ user: null, session: null, isAuthenticated: false });
          toast.success('Logged out successfully');
          window.location.href = '/';
        } catch (error: any) {
          toast.error(error.message || 'Failed to logout');
        }
      },

      updateProfile: async (userData: Partial<User>) => {
        const { user } = get();
        if (!user) return;

        try {
          // Update profile table
          const { error: profileError } = await supabase
            .from('profiles')
            .update({
              username: userData.username,
              bio: userData.bio,
              location: userData.location,
              avatar_url: userData.avatar,
            })
            .eq('id', user.id);

          if (profileError) throw profileError;

          // Update role-specific tables
          if (user.role === 'artist' && (userData.stageName || userData.genres)) {
            const { error: artistError } = await supabase
              .from('artist_profiles')
              .update({
                stage_name: userData.stageName,
                genres: userData.genres,
              })
              .eq('user_id', user.id);

            if (artistError) throw artistError;
          }

          if (user.role === 'brand' && userData.companyName) {
            const { error: brandError } = await supabase
              .from('brand_profiles')
              .update({
                company_name: userData.companyName,
              })
              .eq('user_id', user.id);

            if (brandError) throw brandError;
          }

          set({ user: { ...user, ...userData } });
          toast.success('Profile updated successfully');
        } catch (error: any) {
          toast.error(error.message || 'Failed to update profile');
          throw error;
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        registrationData: state.registrationData,
        registrationStep: state.registrationStep,
      }),
    }
  )
);

