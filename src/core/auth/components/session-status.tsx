/**
 * Session Status Indicator
 * Shows current session status and idle time (for development/testing)
 */

'use client';

import { useIdleTimeout } from '../hooks/use-idle-timeout';

interface SessionStatusProps {
  className?: string;
  showInProduction?: boolean;
}

export function SessionStatus({ className, showInProduction = false }: SessionStatusProps) {
  const { 
    isIdle, 
    minutesIdle, 
    getActivityStatus, 
    getTimeUntilWarning, 
    getTimeUntilLogout 
  } = useIdleTimeout();

  // Hide in production unless explicitly shown
  if (process.env.NODE_ENV === 'production' && !showInProduction) {
    return null;
  }

  const activityStatus = getActivityStatus();
  const timeUntilWarning = getTimeUntilWarning();
  const timeUntilLogout = getTimeUntilLogout();

  return (
    <div className={`text-xs text-muted-foreground p-2 bg-muted/50 rounded ${className}`}>
      <div>Status: {activityStatus}</div>
      <div>Idle: {minutesIdle}m</div>
      <div>Warning in: {timeUntilWarning}m</div>
      <div>Logout in: {timeUntilLogout}m</div>
      {isIdle && <div className="text-orange-600 font-medium">⚠ User is idle</div>}
    </div>
  );
}
