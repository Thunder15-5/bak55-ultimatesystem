import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, userData: SignUpData) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  userRole: string | null;
}

interface SignUpData {
  username: string;
  role: "artist" | "fan" | "brand";
  displayName?: string;
  bio?: string;
  location?: string;
  stageName?: string;
  genres?: string[];
  companyName?: string;
  industry?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch user role immediately without setTimeout
          supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", session.user.id)
            .single()
            .then(({ data: roleData }) => {
              setUserRole(roleData?.role ?? null);
            });
        } else {
          setUserRole(null);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .single()
          .then(({ data: roleData }) => {
            setUserRole(roleData?.role ?? null);
            setLoading(false);
          });
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, userData: SignUpData) => {
    const redirectUrl = `${window.location.origin}/verify-email`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          username: userData.username,
          role: userData.role,
          display_name: userData.displayName,
          bio: userData.bio,
          location: userData.location,
          stage_name: userData.stageName,
          genres: userData.genres,
          company_name: userData.companyName,
          industry: userData.industry,
        }
      }
    });

    if (!error && data.user) {
      // Send welcome email
      try {
        await supabase.functions.invoke("send-email", {
          body: {
            to: email,
            subject: "Welcome to BAK55 Talent!",
            template: "welcome",
            data: {
              username: userData.username || email.split('@')[0],
            },
          },
        });
      } catch (emailError) {
        console.error("Failed to send welcome email:", emailError);
      }

      toast.success("Account created! Please check your email to verify your account.");
      navigate("/verify-email");
    }

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!error) {
      toast.success("Logged in successfully!");
      navigate("/dashboard");
    }

    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUserRole(null);
    toast.success("Logged out successfully!");
    navigate("/");
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut, userRole }}>
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
