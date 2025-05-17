"use client";

/**
 * useLocalStorage hook
 *
 * A hook for persisting state in localStorage.
 */
import { useState, useEffect, useCallback } from 'react';

/**
 * Hook for persisting state in localStorage
 *
 * @param key - The localStorage key
 * @param initialValue - The initial value or value factory function
 * @returns A stateful value and a function to update it
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T | (() => T)
): [T, (value: T | ((val: T) => T)) => void] {
  // Get the initial value from localStorage or use the provided initialValue
  const initialize = (): T => {
    try {
      if (typeof window === 'undefined') {
        return typeof initialValue === 'function' ? (initialValue as () => T)() : initialValue;
      }

      const item = window.localStorage.getItem(key);

      if (item) {
        return JSON.parse(item);
      }

      return typeof initialValue === 'function' ? (initialValue as () => T)() : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);

      return typeof initialValue === 'function' ? (initialValue as () => T)() : initialValue;
    }
  };

  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(initialize);

  // Update localStorage when the state changes
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  // Return a wrapped version of useState's setter function that
  // persists the new value to localStorage
  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        // Allow value to be a function so we have the same API as useState
        const valueToStore = value instanceof Function ? value(storedValue) : value;

        // Save state
        setStoredValue(valueToStore);
      } catch (error) {
        console.error(`Error setting value for localStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  return [storedValue, setValue];
}
