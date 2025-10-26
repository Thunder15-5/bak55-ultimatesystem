import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useEffect, useState } from "react";

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
    // Only show toast if we're done loading AND user is definitely not authenticated
    if (!loading && !user && !hasShownToast && location.pathname !== '/login' && location.pathname !== '/signup') {
      toast.error("Please log in to access this page");
      setHasShownToast(true);
    }
  }, [loading, user, hasShownToast, location.pathname]);

  // Show loading spinner only while checking auth, not if user exists
  if (loading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user has required role(s)
  if (requiredRoles && requiredRoles.length > 0) {
    if (!userRole || !requiredRoles.includes(userRole)) {
      if (!hasShownToast) {
        toast.error("You don't have permission to access this page");
        setHasShownToast(true);
      }
      
      // Redirect to role-specific dashboard
      return <Navigate to={userRole ? `/${userRole}/dashboard` : "/dashboard"} replace />;
    }
  } else if (requiredRole && userRole !== requiredRole) {
    if (!hasShownToast) {
      toast.error("You don't have permission to access this page");
      setHasShownToast(true);
    }
    
    return <Navigate to={userRole ? `/${userRole}/dashboard` : "/dashboard"} replace />;
  }

  return <>{children}</>;
}
