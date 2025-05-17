"use client";

/**
 * useMediaQuery hook
 *
 * A hook for detecting responsive breakpoints with media queries.
 */
import { useState, useEffect } from 'react';

/**
 * Hook for detecting if a media query matches
 *
 * @param query - The media query to match
 * @returns Whether the media query matches
 */
export function useMediaQuery(query: string): boolean {
  // Check if we're on the client side
  const isClient = typeof window === 'object';

  // State to store the match result
  const [matches, setMatches] = useState<boolean>(() => {
    if (!isClient) {
      return false;
    }

    return window.matchMedia(query).matches;
  });

  // Effect to add event listener
  useEffect(() => {
    if (!isClient) {
      return;
    }

    const mediaQuery = window.matchMedia(query);

    // Handler function
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Add the event listener
    if (mediaQuery.addListener) {
      // Deprecated but needed for older browsers
      mediaQuery.addListener(handleChange);
    } else {
      mediaQuery.addEventListener('change', handleChange);
    }

    // Initial check
    setMatches(mediaQuery.matches);

    // Cleanup
    return () => {
      if (mediaQuery.removeListener) {
        // Deprecated but needed for older browsers
        mediaQuery.removeListener(handleChange);
      } else {
        mediaQuery.removeEventListener('change', handleChange);
      }
    };
  }, [query, isClient]);

  return matches;
}
