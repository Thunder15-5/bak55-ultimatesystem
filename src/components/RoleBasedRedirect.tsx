import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface Props {
  to?: string;
}

export function RoleBasedRedirect({ to = 'dashboard' }: Props) {
  const { userRole, loading } = useAuth();
  const navigate = useNavigate();
  const params = useParams();

  useEffect(() => {
    if (!loading && userRole) {
      // Replace :id params if present
      let path = to;
      Object.entries(params).forEach(([key, value]) => {
        path = path.replace(`:${key}`, value || '');
      });
      
      navigate(`/${userRole}/${path}`, { replace: true });
    }
  }, [userRole, loading, to, navigate, params]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  );
}
