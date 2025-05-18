"use client";

import React, { createContext, useContext, ReactNode } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormMode } from '@/features/core/tanstack-query-api';

export interface FormContextType {
  form: UseFormReturn<any> | any; // Allow for both proper form or fallback object
  formMode: FormMode;
  isReadOnly: boolean;
  data?: any;
  onSubmit: () => void;
  onEdit?: () => void;
  onClose: () => void;
  onDelete?: (data: any) => void;
  canEdit: boolean;
  canDelete: boolean;
  isSubmitting: boolean;
}

export const FormContext = createContext<FormContextType | null>(null);

export interface FormProviderProps {
  form: UseFormReturn<any> | any; // Allow for both proper form or fallback object
  formMode: FormMode;
  data?: any;
  onSubmit: () => void;
  onEdit?: () => void;
  onClose: () => void;
  onDelete?: (data: any) => void;
  canEdit: boolean;
  canDelete: boolean;
  isSubmitting: boolean;
  children: ReactNode;
}

export function FormProvider({
  form,
  formMode,
  data,
  onSubmit,
  onEdit,
  onClose,
  onDelete,
  canEdit,
  canDelete,
  isSubmitting,
  children
}: FormProviderProps) {
  // Derive isReadOnly from formMode
  const isReadOnly = formMode === 'view';
  
  // Create a safe form object if the provided one is null or undefined
  const safeForm = form || {
    register: () => ({}),
    handleSubmit: (cb) => () => {},
    formState: { errors: {} },
    watch: () => {},
    setValue: () => {},
    getValues: () => ({}),
    reset: () => {},
    control: {}
  };
  
  const value = {
    form: safeForm,
    formMode,
    isReadOnly,
    data,
    onSubmit,
    onEdit,
    onClose,
    onDelete,
    canEdit,
    canDelete,
    isSubmitting
  };
  
  return (
    <FormContext.Provider value={value}>
      {children}
    </FormContext.Provider>
  );
}

export function useForm() {
  const context = useContext(FormContext);
  
  if (!context) {
    throw new Error('useForm must be used within a FormProvider');
  }
  
  return context;
}
