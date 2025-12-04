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
  signUp: (email: string, password: string, userData: SignUpData) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  userRole: string | null;
  userRoles: string[];
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
  const [isActivated, setIsActivated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Try to restore from session storage for instant UI
    const cachedRole = sessionStorage.getItem('userRole');
    if (cachedRole) {
      setUserRole(cachedRole);
    }

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch activation status and user roles using setTimeout to avoid deadlock
          setTimeout(() => {
            supabase
              .from("profiles")
              .select("is_activated, activation_code")
              .eq("id", session.user.id)
              .single()
              .then(({ data: profile }) => {
                const activated = !profile?.activation_code || profile?.is_activated || false;
                setIsActivated(activated);
              });

            supabase
              .from("user_roles")
              .select("role")
              .eq("user_id", session.user.id)
              .then(({ data: roles }) => {
                const allRoles = roles?.map((r: any) => r.role) ?? [];
                setUserRoles(allRoles);
                
                let primaryRole = null;
                if (allRoles.includes('admin')) primaryRole = 'admin';
                else if (allRoles.includes('artist')) primaryRole = 'artist';
                else if (allRoles.includes('brand')) primaryRole = 'brand';
                else if (allRoles.includes('fan')) primaryRole = 'fan';
                
                setUserRole(primaryRole);
                if (primaryRole) {
                  sessionStorage.setItem('userRole', primaryRole);
                }
              });
          }, 0);
        } else {
          setUserRole(null);
          setUserRoles([]);
          setIsActivated(false);
          sessionStorage.removeItem('userRole');
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        supabase
          .from("profiles")
          .select("is_activated, activation_code")
          .eq("id", session.user.id)
          .single()
          .then(({ data: profile }) => {
            const activated = !profile?.activation_code || profile?.is_activated || false;
            setIsActivated(activated);
          });

        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .then(({ data: roles }) => {
            const allRoles = roles?.map((r: any) => r.role) ?? [];
            setUserRoles(allRoles);
            
            let primaryRole = null;
            if (allRoles.includes('admin')) primaryRole = 'admin';
            else if (allRoles.includes('artist')) primaryRole = 'artist';
            else if (allRoles.includes('brand')) primaryRole = 'brand';
            else if (allRoles.includes('fan')) primaryRole = 'fan';
            
            setUserRole(primaryRole);
            if (primaryRole) {
              sessionStorage.setItem('userRole', primaryRole);
            }
            setLoading(false);
          });
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const sendActivationEmail = async (userId: string, email: string, username: string): Promise<boolean> => {
    try {
      // Wait a moment for the database trigger to complete
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Get the activation code from the profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("activation_code")
        .eq("id", userId)
        .single();

      if (profileError) {
        console.error("Could not fetch profile:", profileError);
        return false;
      }

      if (!profile?.activation_code) {
        console.error("No activation code found for user");
        return false;
      }

      // Send activation email via edge function
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to: email,
          subject: 'Your BAK55 Activation Code',
          template: 'activation',
          data: {
            username: username || email.split('@')[0],
            activation_code: profile.activation_code
          }
        }
      });

      if (error) {
        console.error("Failed to send activation email:", error);
        return false;
      }

      console.log("Activation email sent successfully:", data);
      return true;
    } catch (err) {
      console.error("Error sending activation email:", err);
      return false;
    }
  };

  const signUp = async (email: string, password: string, userData: SignUpData) => {
    try {
      const redirectUrl = `${window.location.origin}/verify-email`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            username: userData.username,
            role: userData.role,
            display_name: userData.displayName || userData.username,
            bio: userData.bio || null,
            location: userData.location || null,
            stage_name: userData.stageName || userData.username,
            genres: userData.genres || [],
            company_name: userData.companyName || userData.username,
            industry: userData.industry || null,
          }
        }
      });

      if (error) {
        console.error("Signup error:", error);
        return { error };
      }

      if (data.user) {
        // Try to send activation email (don't block signup if it fails)
        const emailSent = await sendActivationEmail(data.user.id, email, userData.username);
        
        if (emailSent) {
          toast.success("Account created! Check your email for your activation code.");
        } else {
          toast.success("Account created! You can request your activation code on the next screen.");
        }
        
        navigate("/verify-account");
      }

      return { error: null };
    } catch (err: any) {
      console.error("Unexpected signup error:", err);
      return { error: { message: err.message || "An unexpected error occurred during signup" } };
    }
  };

  const signIn = async (email: string, password: string) => {
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
        else if (allRoles.includes('artist')) role = 'artist';
        else if (allRoles.includes('brand')) role = 'brand';
        else if (allRoles.includes('fan')) role = 'fan';

        toast.success("Logged in successfully!");
        
        if (role === "admin") {
          navigate("/admin");
        } else if (role) {
          navigate(`/${role}/dashboard`);
        } else {
          navigate("/dashboard");
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