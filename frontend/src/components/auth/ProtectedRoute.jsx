import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import LoadingScreen from '../common/LoadingScreen';
import { useAuthStore } from '@/store/authStore';

const ProtectedRoute = ({ isAuthenticated }) => {
  const location = useLocation();
  const { isLoading } = useAuthStore();

  // Show loading screen while checking authentication
  if (isLoading) {
    return <LoadingScreen />;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  // Render child routes if authenticated
  return <Outlet />;
};

export default ProtectedRoute;