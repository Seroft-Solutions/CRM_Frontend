/**
 * Session Monitoring Component
 *
 * Tracks user session activity and provides warnings for session timeout
 */
import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../hooks';

interface SessionMonitoringProps {
  warningTime?: number; // Time in ms before session expires to show warning
  checkInterval?: number; // How often to check session (ms)
  onWarning?: () => void; // Callback when warning threshold is reached
  onTimeout?: () => void; // Callback when session times out
  children?: React.ReactNode;
}

export function SessionMonitoring({
  warningTime = 5 * 60 * 1000, // 5 minutes before timeout by default
  checkInterval = 60 * 1000, // Check every minute by default
  onWarning,
  onTimeout,
  children,
}: SessionMonitoringProps) {
  const { user, logout, refreshAuth, getTokenExpiration } = useAuth();
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  // Check if session is about to expire
  const checkSession = useCallback(() => {
    if (!user) return;

    const expiration = getTokenExpiration?.();
    if (!expiration) return;

    const now = Date.now();
    const timeUntilExpiration = expiration - now;

    setTimeRemaining(Math.max(0, timeUntilExpiration));

    if (timeUntilExpiration <= 0) {
      // Session expired
      setShowWarning(false);
      onTimeout?.();
      logout();
    } else if (timeUntilExpiration <= warningTime) {
      // Show warning
      setShowWarning(true);
      onWarning?.();
    } else {
      // Session active
      setShowWarning(false);
    }
  }, [user, getTokenExpiration, warningTime, onTimeout, onWarning, logout]);

  // Set up event listeners for user activity
  useEffect(() => {
    if (!user) return;

    // Track user activity
    const activity = () => {
      if (timeRemaining && timeRemaining <= warningTime) {
        // User is active and close to timeout, refresh the token
        refreshAuth();
      }
    };

    // User activity events
    window.addEventListener('mousemove', activity);
    window.addEventListener('keydown', activity);
    window.addEventListener('click', activity);
    window.addEventListener('scroll', activity);

    // Cleanup
    return () => {
      window.removeEventListener('mousemove', activity);
      window.removeEventListener('keydown', activity);
      window.removeEventListener('click', activity);
      window.removeEventListener('scroll', activity);
    };
  }, [user, refreshAuth, timeRemaining, warningTime]);

  // Set up interval to check session
  useEffect(() => {
    if (!user) return;

    // Initial check
    checkSession();

    // Check session periodically
    const interval = setInterval(checkSession, checkInterval);

    // Cleanup
    return () => clearInterval(interval);
  }, [user, checkSession, checkInterval]);

  // Format time remaining for display
  const formatTimeRemaining = () => {
    if (timeRemaining === null) return '';

    const minutes = Math.floor(timeRemaining / 60000);
    const seconds = Math.floor((timeRemaining % 60000) / 1000);

    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Return early if no user is logged in
  if (!user) return null;

  // Render the session timeout warning if needed
  return (
    <>
      {showWarning && (
        <div className="session-warning">
          <div className="session-warning__content">
            <h3>Session Expiring Soon</h3>
            <p>Your session will expire in {formatTimeRemaining()}.</p>
            <p>Do you want to continue working?</p>
            <button className="session-warning__button" onClick={() => refreshAuth()}>
              Yes, Keep Working
            </button>
          </div>
        </div>
      )}
      {children}
    </>
  );
}
