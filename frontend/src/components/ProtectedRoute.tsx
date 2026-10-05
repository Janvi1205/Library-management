import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated } from '../api/api';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Reusable Client-Side Route Protection Component
 *
 * Checks if the librarian holds a valid JWT token stored in localStorage.
 * - If authenticated: Renders child components.
 * - If unauthenticated: Redirects to `/login`, preserving the intended destination
 *   in navigation state so the user can be redirected back after logging in.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const location = useLocation();

  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
