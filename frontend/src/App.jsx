import React, { useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import Layout from '@/components/layout/Layout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import LoadingScreen from '@/components/common/LoadingScreen';

// Lazy load pages
const Dashboard = React.lazy(() => import('@/pages/Dashboard'));
const ContentGenerator = React.lazy(() => import('@/pages/ContentGenerator'));
const ContentList = React.lazy(() => import('@/pages/ContentList'));
const Analytics = React.lazy(() => import('@/pages/Analytics'));
const FigmaIntegration = React.lazy(() => import('@/pages/FigmaIntegration'));
const Settings = React.lazy(() => import('@/pages/Settings'));
const Login = React.lazy(() => import('@/pages/auth/Login'));
const Register = React.lazy(() => import('@/pages/auth/Register'));
const ForgotPassword = React.lazy(() => import('@/pages/auth/ForgotPassword'));
const ResetPassword = React.lazy(() => import('@/pages/auth/ResetPassword'));
const NotFound = React.lazy(() => import('@/pages/NotFound'));

function App() {
  const { isAuthenticated, checkAuth } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <React.Suspense fallback={<LoadingScreen />}>
      <Routes>
        {/* Public routes */}
        <Route
          path="/login"
          element={
            !isAuthenticated ? (
              <Login />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          }
        />
        <Route
          path="/register"
          element={
            !isAuthenticated ? (
              <Register />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          }
        />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute isAuthenticated={isAuthenticated} />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/content">
              <Route index element={<ContentList />} />
              <Route path="new" element={<ContentGenerator />} />
              <Route path=":id" element={<ContentGenerator />} />
            </Route>
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/figma" element={<FigmaIntegration />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>

        {/* Redirect root to dashboard or login */}
        <Route
          path="/"
          element={
            <Navigate
              to={isAuthenticated ? "/dashboard" : "/login"}
              replace
            />
          }
        />

        {/* 404 page */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </React.Suspense>
  );
}

export default App;