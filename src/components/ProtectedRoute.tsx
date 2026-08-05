import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { dashboardPathFor } from "@/lib/authRules";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
  requiredRoles?: string[];
  /** Set to false for routes a user without a role may still reach (e.g. onboarding). */
  requireRoleAssigned?: boolean;
}

export function ProtectedRoute({
  children,
  requiredRole,
  requiredRoles,
  requireRoleAssigned = true,
}: ProtectedRouteProps) {
  const { user, loading, ready, userRole, userRoles, isSuspended } = useAuth();
  const location = useLocation();
  const [hasShownToast, setHasShownToast] = useState(false);

  useEffect(() => {
    if (
      !loading &&
      !user &&
      !hasShownToast &&
      location.pathname !== "/login" &&
      location.pathname !== "/signup"
    ) {
      toast.error("Please log in to access this page");
      setHasShownToast(true);
    }
  }, [loading, user, hasShownToast, location.pathname]);

  // Wait for the initial session + role + profile fetch to settle.
  if (loading || !ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // Not authenticated - redirect to login, preserving the intended destination
  if (!user) {
    const intendedPath = location.pathname + location.search + location.hash;
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(intendedPath)}`}
        state={{ from: location }}
        replace
      />
    );
  }

  // Suspended or banned accounts never reach app surfaces.
  if (isSuspended) {
    return <Navigate to="/account-suspended" replace />;
  }

  // Signed in but no role yet (typical for OAuth / magic-link first sign-in).
  if (requireRoleAssigned && userRoles.length === 0) {
    const intendedPath = location.pathname + location.search + location.hash;
    return <Navigate to={`/onboarding?redirect=${encodeURIComponent(intendedPath)}`} replace />;
  }

  // Check if user has required role(s)
  if (requiredRoles && requiredRoles.length > 0) {
    const allowed = requiredRoles.some((r) => userRoles.includes(r));
    if (!allowed) {
      if (!hasShownToast) {
        toast.error("You don't have permission to access this page");
        setHasShownToast(true);
      }
      return <Navigate to={dashboardPathFor(userRole)} replace />;
    }
  } else if (requiredRole && !userRoles.includes(requiredRole)) {
    if (!hasShownToast) {
      toast.error("You don't have permission to access this page");
      setHasShownToast(true);
    }
    return <Navigate to={dashboardPathFor(userRole)} replace />;
  }

  return <>{children}</>;
}
