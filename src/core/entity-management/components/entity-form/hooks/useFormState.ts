"use client";

import { useState, useCallback } from 'react';
import { useForm as useReactHookForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormMode } from '@/features/core/tanstack-query-api';

export interface UseFormStateOptions {
  defaultValues?: any;
  validationSchema?: any;
  externalForm?: any;
}

export function useFormState({
  defaultValues = {},
  validationSchema,
  externalForm
}: UseFormStateOptions = {}) {
  // Form mode state
  const [formMode, setFormMode] = useState<FormMode>('view');
  
  // Create a safer form initialization
  let internalForm;
  
  try {
    // Use a more defensive approach to form initialization
    internalForm = useReactHookForm({
      defaultValues: defaultValues || {},
      resolver: validationSchema ? zodResolver(validationSchema) : undefined,
      mode: 'onChange' // Enable real-time validation as user types
    });
  } catch (error) {
    console.error('Error initializing form in useFormState:', error);
    
    // Provide a fallback form implementation to prevent crashes
    internalForm = {
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
  
  // Use external form if provided, otherwise use internal form
  const form = externalForm || internalForm;
  
  // Handle changing form mode
  const changeFormMode = useCallback((mode: FormMode) => {
    setFormMode(mode);
  }, []);
  
  // Computed read-only state
  const isReadOnly = formMode === 'view';
  
  return {
    form,
    formMode,
    isReadOnly,
    changeFormMode,
    setFormMode
  };
}
