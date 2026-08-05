import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { lovable } from "@/integrations/lovable/index";
import {
  authRedirectUrl,
  authErrorMessage,
  dashboardPathFor,
  primaryRoleOf,
} from "@/lib/authRules";

export interface AccountProfile {
  id: string;
  username: string | null;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
  banned: boolean | null;
  suspended_at: string | null;
  suspension_reason: string | null;
  onboarding_completed: boolean | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  /** True once the initial session + role + profile fetch has settled. */
  ready: boolean;
  isActivated: boolean;
  profile: AccountProfile | null;
  isSuspended: boolean;
  suspensionReason: string | null;
  emailVerified: boolean;
  needsOnboarding: boolean;
  userRole: string | null;
  userRoles: string[];
  signUp: (email: string, password: string, userData: SignUpData, redirectUrl?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string, redirectUrl?: string) => Promise<{ error: any }>;
  signInWithGoogle: (redirectPath?: string) => Promise<{ error: any }>;
  signInWithMagicLink: (email: string, redirectPath?: string) => Promise<{ error: any }>;
  sendPasswordReset: (email: string) => Promise<{ error: any }>;
  resendVerification: (email?: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  /** Revokes every session for this user on all devices. */
  signOutAllDevices: () => Promise<{ error: any }>;
  refreshAccount: () => Promise<void>;
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
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const navigate = useNavigate();
  const mounted = useRef(true);

  const loadAccount = useCallback(async (userId: string) => {
    const [rolesRes, profileRes] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", userId),
      supabase
        .from("profiles")
        .select(
          "id, username, display_name, email, avatar_url, banned, suspended_at, suspension_reason, onboarding_completed"
        )
        .eq("id", userId)
        .maybeSingle(),
    ]);

    if (!mounted.current) return;

    if (rolesRes.error) {
      console.error("Failed to load roles", rolesRes.error);
    } else {
      const allRoles = (rolesRes.data ?? []).map((r) => String(r.role));
      setUserRoles(allRoles);
      const primary = primaryRoleOf(allRoles);
      setUserRole(primary);
      if (primary) sessionStorage.setItem("userRole", primary);
      else sessionStorage.removeItem("userRole");
    }

    if (profileRes.error) {
      console.error("Failed to load profile", profileRes.error);
    } else {
      setProfile((profileRes.data as AccountProfile) ?? null);
    }
  }, []);

  const clearAccount = useCallback(() => {
    setUserRole(null);
    setUserRoles([]);
    setProfile(null);
    sessionStorage.removeItem("userRole");
  }, []);

  useEffect(() => {
    mounted.current = true;
    let initialLoadDone = false;

    const cachedRole = sessionStorage.getItem("userRole");
    if (cachedRole) setUserRole(cachedRole);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!mounted.current) return;

      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (!initialLoadDone) return;

      if (nextSession?.user) {
        // Defer to avoid deadlocking the auth callback.
        setTimeout(() => {
          if (mounted.current) loadAccount(nextSession.user.id);
        }, 0);
      } else if (event === "SIGNED_OUT") {
        clearAccount();
      }
    });

    (async () => {
      try {
        const {
          data: { session: initialSession },
        } = await supabase.auth.getSession();
        if (!mounted.current) return;

        setSession(initialSession);
        setUser(initialSession?.user ?? null);

        if (initialSession?.user) await loadAccount(initialSession.user.id);
        else clearAccount();
      } catch (err) {
        console.error("Auth initialization error:", err);
      } finally {
        if (mounted.current) {
          initialLoadDone = true;
          setLoading(false);
          setReady(true);
        }
      }
    })();

    return () => {
      mounted.current = false;
      subscription.unsubscribe();
    };
  }, [loadAccount, clearAccount]);

  const refreshAccount = useCallback(async () => {
    if (user?.id) await loadAccount(user.id);
  }, [user?.id, loadAccount]);

  const signUp = async (
    email: string,
    password: string,
    userData: SignUpData,
    redirectUrl?: string
  ) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: authRedirectUrl("/auth/callback"),
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
          },
        },
      });

      if (error) return { error };

      // With email confirmation on, signUp returns no session — the user is NOT
      // logged in yet. Never route them into the app in that case.
      if (data.user && !data.session) {
        navigate(`/verify-email?email=${encodeURIComponent(email)}`, { replace: true });
        return { error: null };
      }

      if (data.session) {
        await loadAccount(data.user!.id);
        toast.success("Welcome to BAK55!");
        navigate(redirectUrl || dashboardPathFor(userData.role), { replace: true });
      }

      return { error: null };
    } catch (err: any) {
      console.error("Unexpected signup error:", err);
      return { error: { message: authErrorMessage(err) } };
    }
  };

  const signIn = async (email: string, password: string, redirectUrl?: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error };
      if (!data.user) return { error: { message: "Login failed. Please try again." } };

      const [rolesRes, profileRes] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", data.user.id),
        supabase
          .from("profiles")
          .select("suspended_at, suspension_reason, banned")
          .eq("id", data.user.id)
          .maybeSingle(),
      ]);

      const suspended = Boolean(profileRes.data?.suspended_at || profileRes.data?.banned);
      await loadAccount(data.user.id);

      if (suspended) {
        navigate("/account-suspended", { replace: true });
        return { error: null };
      }

      const role = primaryRoleOf((rolesRes.data ?? []).map((r) => String(r.role)));
      toast.success("Logged in successfully");
      navigate(redirectUrl || dashboardPathFor(role), { replace: true });
      return { error: null };
    } catch (err: any) {
      console.error("Unexpected login error:", err);
      return { error: { message: authErrorMessage(err) } };
    }
  };

  const signInWithGoogle = async (redirectPath?: string) => {
    try {
      if (redirectPath) sessionStorage.setItem("signupIntentRedirect", redirectPath);
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: authRedirectUrl("/auth/callback"),
      });
      if (result.error) return { error: { message: authErrorMessage(result.error) } };
      return { error: null };
    } catch (err: any) {
      return { error: { message: authErrorMessage(err) } };
    }
  };

  const signInWithMagicLink = async (email: string, redirectPath?: string) => {
    try {
      if (redirectPath) sessionStorage.setItem("signupIntentRedirect", redirectPath);
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: authRedirectUrl("/auth/callback") },
      });
      if (error) return { error: { message: authErrorMessage(error) } };
      return { error: null };
    } catch (err: any) {
      return { error: { message: authErrorMessage(err) } };
    }
  };

  const sendPasswordReset = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: authRedirectUrl("/reset-password"),
      });
      if (error) return { error: { message: authErrorMessage(error) } };
      return { error: null };
    } catch (err: any) {
      return { error: { message: authErrorMessage(err) } };
    }
  };

  const resendVerification = async (email?: string) => {
    const target = email || user?.email;
    if (!target) return { error: { message: "No email address to send to." } };
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: target,
        options: { emailRedirectTo: authRedirectUrl("/auth/callback") },
      });
      if (error) return { error: { message: authErrorMessage(error) } };
      return { error: null };
    } catch (err: any) {
      return { error: { message: authErrorMessage(err) } };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    clearAccount();
    sessionStorage.clear();
    toast.success("Logged out");
    navigate("/", { replace: true });
  };

  const signOutAllDevices = async () => {
    try {
      const { error } = await supabase.auth.signOut({ scope: "global" });
      if (error) return { error: { message: authErrorMessage(error) } };
      clearAccount();
      sessionStorage.clear();
      navigate("/login", { replace: true });
      return { error: null };
    } catch (err: any) {
      return { error: { message: authErrorMessage(err) } };
    }
  };

  const isSuspended = Boolean(profile?.suspended_at || profile?.banned);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        ready,
        isActivated: true,
        profile,
        isSuspended,
        suspensionReason: profile?.suspension_reason ?? null,
        emailVerified: Boolean(user?.email_confirmed_at),
        needsOnboarding: Boolean(user) && ready && userRoles.length === 0,
        userRole,
        userRoles,
        signUp,
        signIn,
        signInWithGoogle,
        signInWithMagicLink,
        sendPasswordReset,
        resendVerification,
        signOut,
        signOutAllDevices,
        refreshAccount,
      }}
    >
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
