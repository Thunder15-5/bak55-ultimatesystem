import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
  requiredRoles?: string[];
}

export function ProtectedRoute({ children, requiredRole, requiredRoles }: ProtectedRouteProps) {
  const { user, loading, userRole } = useAuth();
  const location = useLocation();
  const [hasShownToast, setHasShownToast] = useState(false);

  useEffect(() => {
    if (!loading && !user && !hasShownToast && location.pathname !== '/login' && location.pathname !== '/signup') {
      toast.error("Please log in to access this page");
      setHasShownToast(true);
    }
  }, [loading, user, hasShownToast, location.pathname]);

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // Not authenticated - redirect to login, preserving the intended destination
  if (!user) {
    const intendedPath = location.pathname + location.search + location.hash;
    return <Navigate to={`/login?redirect=${encodeURIComponent(intendedPath)}`} state={{ from: location }} replace />;
  }

  // User is authenticated but role not loaded yet - show loading
  if (user && userRole === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // Check if user has required role(s)
  if (requiredRoles && requiredRoles.length > 0) {
    if (!userRole || !requiredRoles.includes(userRole)) {
      if (!hasShownToast) {
        toast.error("You don't have permission to access this page");
        setHasShownToast(true);
      }
      
      const dashboardPath = userRole === 'admin' ? '/admin' : `/${userRole}/dashboard`;
      return <Navigate to={dashboardPath} replace />;
    }
  } else if (requiredRole && userRole !== requiredRole) {
    if (!hasShownToast) {
      toast.error("You don't have permission to access this page");
      setHasShownToast(true);
    }
    
    const dashboardPath = userRole === 'admin' ? '/admin' : `/${userRole}/dashboard`;
    return <Navigate to={dashboardPath} replace />;
  }

  return <>{children}</>;
}
