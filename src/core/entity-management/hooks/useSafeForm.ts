"use client";

import { useState, useEffect } from 'react';
import { useForm as useReactHookForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

/**
 * A wrapper around react-hook-form's useForm that provides safer initialization
 * and error handling for turbopack compatibility
 */
export function useSafeForm(options: any = {}) {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Create a safe version of the options
  const safeOptions = {
    defaultValues: options.defaultValues || {},
    resolver: options.validationSchema ? zodResolver(options.validationSchema) : undefined,
    mode: 'onChange'
  };
  
  // Initialize form with error handling
  let form;
  try {
    form = useReactHookForm(safeOptions);
  } catch (e) {
    console.error('Error initializing form:', e);
    setError(e instanceof Error ? e : new Error(String(e)));
    
    // Return a minimal implementation to prevent further errors
    form = {
      register: () => ({}),
      handleSubmit: (cb) => () => {},
      formState: { errors: {} },
      watch: () => {},
      setValue: () => {},
      getValues: () => ({}),
      reset: () => {},
      control: {}
    };
  }
  
  // Mark as ready after initial render
  useEffect(() => {
    setIsReady(true);
  }, []);
  
  return {
    form,
    isReady,
    error
  };
}
