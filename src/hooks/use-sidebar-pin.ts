'use client';

import { useEffect, useState } from 'react';

const PINNED_SIDEBAR_KEY = 'sidebar-pinned';

export function useSidebarPin() {
  const [isPinned, setIsPinned] = useState(false);
  const [hasMounted, setHasMounted] = useState(false); // Added hasMounted state

  useEffect(() => {
    // Load initial state from localStorage
    const stored = localStorage.getItem(PINNED_SIDEBAR_KEY);
    if (stored !== null) {
      setIsPinned(JSON.parse(stored));
    }
    setHasMounted(true); // Set hasMounted to true after client-side hydration
  }, []);

  const togglePin = () => {
    const newPinned = !isPinned;
    setIsPinned(newPinned);
    localStorage.setItem(PINNED_SIDEBAR_KEY, JSON.stringify(newPinned));
  };

  return {
    isPinned,
    togglePin,
    hasMounted, // Return hasMounted
  };
}
