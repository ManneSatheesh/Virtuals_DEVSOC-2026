import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Sun } from 'lucide-react';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    // Supabase handles the token exchange from the URL hash automatically
    // via onAuthStateChange in AuthContext. We just wait and redirect.
    const timer = setTimeout(() => {
      navigate('/dashboard', { replace: true });
    }, 1500);

    return () => clearTimeout(timer);
  }, [navigate]);

  // If already authenticated, redirect immediately
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary to-orange-400 rounded-full animate-breathe flex items-center justify-center shadow-warm-lg">
          <Sun className="w-10 h-10 text-white" fill="currentColor" />
        </div>
        <p className="mt-6 text-lg text-text-main font-semibold">Signing you in...</p>
        <p className="mt-2 text-text-muted">Please wait while we complete authentication</p>
      </div>
    </div>
  );
}
