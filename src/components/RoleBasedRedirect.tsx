import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface Props {
  to?: string;
}

export function RoleBasedRedirect({ to = 'dashboard' }: Props) {
  const { userRole, loading, user } = useAuth();
  const navigate = useNavigate();
  const params = useParams();

  useEffect(() => {
    // Wait for auth to load
    if (loading) return;
    
    // If not logged in, redirect to login
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }
    
    // If role is loaded, redirect to role-specific path
    if (userRole) {
      let path = to;
      Object.entries(params).forEach(([key, value]) => {
        path = path.replace(`:${key}`, value || '');
      });
      
      if (userRole === 'admin' && to === 'dashboard') {
        navigate('/admin', { replace: true });
      } else {
        navigate(`/${userRole}/${path}`, { replace: true });
      }
    }
  }, [userRole, loading, user, to, navigate, params]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  );
}