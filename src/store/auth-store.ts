import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { User, UserRole, SocialLinks } from '@/types/user';
import { toast } from 'sonner';

interface AuthState {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  registrationStep: number;
  registrationData: Partial<RegisterData>;
  
  // Actions
  initializeAuth: () => Promise<void>;
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
      session: null,
      isAuthenticated: false,
      isLoading: false,
      registrationStep: 1,
      registrationData: {},

      initializeAuth: async () => {
        set({ isLoading: true });
        
        // Set up auth state listener
        supabase.auth.onAuthStateChange((event, session) => {
          set({ 
            session, 
            user: session?.user ? mapSupabaseUser(session.user) : null,
            isAuthenticated: !!session 
          });
        });

        // Check for existing session
        const { data: { session } } = await supabase.auth.getSession();
        set({ 
          session,
          user: session?.user ? mapSupabaseUser(session.user) : null,
          isAuthenticated: !!session,
          isLoading: false 
        });
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
                bio: userData.bio,
                location: userData.location,
              },
            },
          });

          if (error) throw error;

          toast.success('Registration successful! Please check your email to verify your account.');
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
          // Update user metadata in Supabase
          const { error } = await supabase.auth.updateUser({
            data: userData,
          });

          if (error) throw error;

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

// Helper function to map Supabase user to app User
function mapSupabaseUser(supabaseUser: SupabaseUser): User {
  return {
    id: supabaseUser.id,
    email: supabaseUser.email || '',
    username: supabaseUser.user_metadata?.username || supabaseUser.email?.split('@')[0] || '',
    role: (supabaseUser.user_metadata?.role as UserRole) || 'user',
    stageName: supabaseUser.user_metadata?.stage_name,
    bio: supabaseUser.user_metadata?.bio,
    location: supabaseUser.user_metadata?.location,
    avatar: supabaseUser.user_metadata?.avatar_url,
    socialLinks: supabaseUser.user_metadata?.social_links,
    createdAt: supabaseUser.created_at,
    updatedAt: supabaseUser.updated_at || supabaseUser.created_at,
  };
}
