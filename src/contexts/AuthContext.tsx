import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isActivated: boolean;
  signUp: (email: string, password: string, userData: SignUpData, redirectUrl?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string, redirectUrl?: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  userRole: string | null;
  userRoles: string[];
}

interface SignUpData {
  username: string;
  role: "artist" | "fan" | "brand" | "producer";
  displayName?: string;
  bio?: string;
  location?: string;
  stageName?: string;
  genres?: string[];
  companyName?: string;
  industry?: string;
  producerName?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isActivated, setIsActivated] = useState(true); // Default to true - no activation required
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const navigate = useNavigate();

  const fetchUserRoles = async (userId: string) => {
    try {
      const { data: roles, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      if (error) {
        console.error("Error fetching user roles:", error);
        return;
      }

      const allRoles = roles?.map((r: any) => r.role) ?? [];
      setUserRoles(allRoles);
      
      let primaryRole = null;
      if (allRoles.includes('admin')) primaryRole = 'admin';
      else if (allRoles.includes('brand')) primaryRole = 'brand';
      else if (allRoles.includes('producer')) primaryRole = 'producer';
      else if (allRoles.includes('artist')) primaryRole = 'artist';
      else if (allRoles.includes('fan')) primaryRole = 'fan';
      
      setUserRole(primaryRole);
      if (primaryRole) {
        sessionStorage.setItem('userRole', primaryRole);
      }
    } catch (err) {
      console.error("Error in fetchUserRoles:", err);
    }
  };

  useEffect(() => {
    let isMounted = true;
    let initialLoadDone = false;

    // Try to restore from session storage for instant UI
    const cachedRole = sessionStorage.getItem('userRole');
    if (cachedRole) {
      setUserRole(cachedRole);
    }

    // Set up auth state listener FIRST (for ongoing changes only)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        // Only handle ongoing changes AFTER initial load is done
        if (!initialLoadDone) return;
        
        if (session?.user) {
          // Use setTimeout to avoid deadlock per Supabase docs
          setTimeout(() => {
            if (!isMounted) return;
            fetchUserRoles(session.user.id);
          }, 0);
        } else {
          setUserRole(null);
          setUserRoles([]);
          sessionStorage.removeItem('userRole');
        }
      }
    );

    // INITIAL load - this is the ONLY place that controls loading state
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!isMounted) return;

        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchUserRoles(session.user.id);
        } else {
          setUserRole(null);
          setUserRoles([]);
          sessionStorage.removeItem('userRole');
        }
      } catch (err) {
        console.error("Auth initialization error:", err);
      } finally {
        if (isMounted) {
          initialLoadDone = true;
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, userData: SignUpData, redirectUrl?: string) => {
    try {
      const PRODUCTION_DOMAIN = "https://www.bak55talent.co.ke";
      const emailRedirect = `${PRODUCTION_DOMAIN}/login`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: emailRedirect,
          data: {
            username: userData.username,
            role: userData.role,
            displayName: userData.displayName || userData.username,
            display_name: userData.displayName || userData.username,
            bio: userData.bio || null,
            location: userData.location || null,
            stageName: userData.stageName || userData.username,
            stage_name: userData.stageName || userData.username,
            genres: userData.genres || [],
            companyName: userData.companyName || userData.username,
            company_name: userData.companyName || userData.username,
            industry: userData.industry || null,
            producerName: userData.producerName || userData.username,
            producer_name: userData.producerName || userData.username,
          }
        }
      });

      if (error) {
        console.error("Signup error:", error);
        return { error };
      }

      if (data.user) {
        toast.success("Account created successfully! Welcome to BAK55!");
        
        // Send welcome email in background (don't block)
        try {
          await supabase.functions.invoke('send-email', {
            body: {
              to: email,
              subject: 'Welcome to BAK55 Talent!',
              template: 'welcome',
              data: { username: userData.username }
            }
          });
        } catch (emailErr) {
          console.log('Welcome email error (non-blocking):', emailErr);
        }
        
        // Navigate to redirect URL if provided, otherwise to appropriate dashboard
        if (redirectUrl) {
          navigate(redirectUrl);
        } else if (userData.role === 'artist') {
          navigate('/artist/dashboard');
        } else if (userData.role === 'brand') {
          navigate('/brand/dashboard');
        } else if (userData.role === 'producer') {
          navigate('/producer/dashboard');
        } else {
          navigate('/fan/dashboard');
        }
      }

      return { error: null };
    } catch (err: any) {
      console.error("Unexpected signup error:", err);
      return { error: { message: err.message || "An unexpected error occurred during signup" } };
    }
  };

  const signIn = async (email: string, password: string, redirectUrl?: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error };
      }

      if (data.user) {
        const { data: roles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.user.id);

        const allRoles = roles?.map((r: any) => r.role) ?? [];
        
        let role = null;
        if (allRoles.includes('admin')) role = 'admin';
        else if (allRoles.includes('brand')) role = 'brand';
        else if (allRoles.includes('producer')) role = 'producer';
        else if (allRoles.includes('artist')) role = 'artist';
        else if (allRoles.includes('fan')) role = 'fan';

        toast.success("Logged in successfully!");
        
        // Navigate to redirect URL if provided, otherwise to appropriate dashboard
        if (redirectUrl) {
          navigate(redirectUrl);
        } else if (role === "admin") {
          navigate("/admin");
        } else if (role) {
          navigate(`/${role}/dashboard`);
        } else {
          navigate("/fan/dashboard");
        }
      }

      return { error: null };
    } catch (err: any) {
      console.error("Unexpected login error:", err);
      return { error: { message: err.message || "An unexpected error occurred during login" } };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUserRole(null);
    setUserRoles([]);
    sessionStorage.clear();
    toast.success("Logged out successfully!");
    navigate("/");
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isActivated, signUp, signIn, signOut, userRole, userRoles }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}