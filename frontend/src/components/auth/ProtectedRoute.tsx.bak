import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from "../../contexts/AuthContext";

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { currentUser, userProfile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    // Or a spinner
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && userProfile) {
    if (!allowedRoles.includes(userProfile.role)) {
      // Redirect to unauthorized or home
      // For now, let's just go home if not allowed
      return <Navigate to="/" replace />;
    }
  }

  return <Outlet />;
};
