'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

interface UseActivityTrackerOptions {
  timeout?: number // ms of inactivity before considered idle
  events?: string[] // DOM events to track
}

export function useActivityTracker(options: UseActivityTrackerOptions = {}) {
  const {
    timeout = 5 * 60 * 1000, // 5 minutes default
    events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
  } = options

  const [isIdle, setIsIdle] = useState(false)
  const [lastActivity, setLastActivity] = useState(Date.now())
  const timeoutRef = useRef<NodeJS.Timeout>()

  const resetIdleTimer = useCallback(() => {
    const now = Date.now()
    setLastActivity(now)
    setIsIdle(false)

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      setIsIdle(true)
    }, timeout)
  }, [timeout])

  const handleActivity = useCallback(() => {
    resetIdleTimer()
  }, [resetIdleTimer])

  useEffect(() => {
    // Initial setup
    resetIdleTimer()

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true)
    })

    return () => {
      // Cleanup
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true)
      })
    }
  }, [events, handleActivity, resetIdleTimer])

  return {
    isIdle,
    lastActivity,
    minutesIdle: Math.floor((Date.now() - lastActivity) / 60000),
    resetActivity: handleActivity
  }
}
