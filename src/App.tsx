import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth-store';

// Components
import Layout from './components/Layout';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

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
    <div className="min-h-screen bg-gradient-dark text-white font-sans antialiased">
      {/* Global Layout Wrapper */}
      <Layout>
        {/* Conditionally render navbar - show on all pages except auth pages */}
        <Routes>
          <Route path="/login" element={null} />
          <Route path="/register" element={null} />
          <Route path="/forgot-password" element={null} />
          <Route path="*" element={<Navbar />} />
        </Routes>

        <main className="flex-1">
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<HomePage />} />
            <Route
              path="/login"
              element={
                !isAuthenticated ? (
                  <LoginPage />
                ) : (
                  <Navigate to={getDashboardPath(user?.role)} replace />
                )
              }
            />
            <Route
              path="/register"
              element={
                !isAuthenticated ? (
                  <RegisterPage />
                ) : (
                  <Navigate to={getDashboardPath(user?.role)} replace />
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
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route
              path="/artist/subscription"
              element={
                isAuthenticated ? (
                  <ArtistSubscriptionPage />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route
              path="/brand/dashboard"
              element={
                isAuthenticated ? (
                  <BrandDashboardPage />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route
              path="/admin"
              element={
                isAuthenticated && user?.role === 'admin' ? (
                  <AdminPage />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />

            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Conditionally render footer - show on all pages except auth pages */}
        <Routes>
          <Route path="/login" element={null} />
          <Route path="/register" element={null} />
          <Route path="/forgot-password" element={null} />
          <Route path="*" element={<Footer />} />
        </Routes>
      </Layout>
    </div>
  );
}

function getDashboardPath(role?: string): string {
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
