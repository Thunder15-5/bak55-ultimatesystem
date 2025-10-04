import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth-store';

// Lazy load pages
import HomePage from './pages/home';
import LoginPage from './pages/login';
import RegisterPage from './pages/register';
import ForgotPasswordPage from './pages/forgot-password';
import PricingPage from './pages/pricing';
import CompetitionsPage from './pages/competitions';
import ArtistDashboardPage from './pages/artist/dashboard';
import ArtistSubscriptionPage from './pages/artist/subscription';
import BrandDashboardPage from './pages/brand/dashboard';
import AdminPage from './pages/admin';

function App() {
  const { initializeAuth, isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to={getDashboardPath(user?.role)} />} />
      <Route path="/register" element={!isAuthenticated ? <RegisterPage /> : <Navigate to={getDashboardPath(user?.role)} />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/competitions" element={<CompetitionsPage />} />

      {/* Protected routes */}
      <Route path="/artist/dashboard" element={isAuthenticated ? <ArtistDashboardPage /> : <Navigate to="/login" />} />
      <Route path="/artist/subscription" element={isAuthenticated ? <ArtistSubscriptionPage /> : <Navigate to="/login" />} />
      <Route path="/brand/dashboard" element={isAuthenticated ? <BrandDashboardPage /> : <Navigate to="/login" />} />
      <Route path="/admin" element={isAuthenticated && user?.role === 'admin' ? <AdminPage /> : <Navigate to="/login" />} />
    </Routes>
  );
}

function getDashboardPath(role?: string) {
  switch (role) {
    case 'artist':
      return '/artist/dashboard';
    case 'brand':
      return '/brand/dashboard';
    case 'admin':
      return '/admin';
    default:
      return '/';
  }
}

export default App;
