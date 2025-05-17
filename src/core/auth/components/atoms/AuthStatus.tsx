/**
 * AuthStatus component
 *
 * Displays the current authentication status.
 */
import React from 'react';
import { useAuth } from '../../hooks';

export interface AuthStatusProps {
  className?: string;
}

export const AuthStatus: React.FC<AuthStatusProps> = ({ className = '' }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className={`auth-status auth-status--loading ${className}`}>
        <span className="auth-status__label">Authenticating...</span>
      </div>
    );
  }

  if (isAuthenticated && user) {
    return (
      <div className={`auth-status auth-status--authenticated ${className}`}>
        <span className="auth-status__label">Signed in as </span>
        <span className="auth-status__user">{user.displayName || user.email}</span>
      </div>
    );
  }

  return (
    <div className={`auth-status auth-status--unauthenticated ${className}`}>
      <span className="auth-status__label">Not signed in</span>
    </div>
  );
};
