import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth-store';

// Pages
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
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a1a] via-[#2d1b69] to-[#1a1a1a] text-white font-[Inter]">
      {/* Optional Global Navbar */}
      {/* <Navbar /> */}

      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-10">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<HomePage />} />
          <Route
            path="/login"
            element={
              !isAuthenticated ? (
                <LoginPage />
              ) : (
                <Navigate to={getDashboardPath(user?.role)} />
              )
            }
          />
          <Route
            path="/register"
            element={
              !isAuthenticated ? (
                <RegisterPage />
              ) : (
                <Navigate to={getDashboardPath(user?.role)} />
              )
            }
          />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/competitions" element={<CompetitionsPage />} />

          {/* Protected routes */}
          <Route
            path="/artist/dashboard"
            element={
              isAuthenticated ? (
                <ArtistDashboardPage />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/artist/subscription"
            element={
              isAuthenticated ? (
                <ArtistSubscriptionPage />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/brand/dashboard"
            element={
              isAuthenticated ? (
                <BrandDashboardPage />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/admin"
            element={
              isAuthenticated && user?.role === 'admin' ? (
                <AdminPage />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
        </Routes>
      </main>

      {/* Optional Global Footer */}
      {/* <Footer /> */}
    </div>
  );
}

function getDashboardPath(role) {
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
