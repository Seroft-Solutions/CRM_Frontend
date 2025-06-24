'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';

interface UseActivityTrackerOptions {
  timeout?: number; // ms of inactivity before considered idle
  events?: string[]; // DOM events to track
}

export function useActivityTracker(options: UseActivityTrackerOptions = {}) {
  const {
    timeout = 5 * 60 * 1000, // 5 minutes default
    events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'],
  } = options;

  const [isIdle, setIsIdle] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Memoize events array to prevent re-renders
  const memoizedEvents = useMemo(() => events, [events.join(',')]);

  const resetIdleTimer = useCallback(() => {
    const now = Date.now();
    setLastActivity(now);
    setIsIdle(false);

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      setIsIdle(true);
    }, timeout);
  }, [timeout]);

  const handleActivity = useCallback(() => {
    resetIdleTimer();
  }, [resetIdleTimer]);

  useEffect(() => {
    // Initial setup
    resetIdleTimer();

    // Add event listeners
    memoizedEvents.forEach((event) => {
      document.addEventListener(event, handleActivity, true);
    });

    return () => {
      // Cleanup
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      memoizedEvents.forEach((event) => {
        document.removeEventListener(event, handleActivity, true);
      });
    };
  }, [memoizedEvents, handleActivity]); // Removed resetIdleTimer from deps

  return {
    isIdle,
    lastActivity,
    minutesIdle: Math.floor((Date.now() - lastActivity) / 60000),
    resetActivity: handleActivity,
  };
}
