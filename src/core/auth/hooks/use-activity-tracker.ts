/**
 * Activity Tracker Hook
 * Tracks user activity to determine idle state
 */

'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { AUTH_CACHE_CONFIG } from '../config/cache-config';
import type { ActivityTrackerOptions } from '../types';

export function useActivityTracker(options: ActivityTrackerOptions = {}) {
  const {
    timeout = AUTH_CACHE_CONFIG.activity.timeout,
    events = AUTH_CACHE_CONFIG.activity.events,
    immediate = true,
  } = options;

  const [isIdle, setIsIdle] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

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
    if (!immediate) return;

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
  }, [memoizedEvents, handleActivity, immediate, resetIdleTimer]);

  return {
    isIdle,
    lastActivity,
    minutesIdle: Math.floor((Date.now() - lastActivity) / 60000),
    resetActivity: handleActivity,
  };
}
