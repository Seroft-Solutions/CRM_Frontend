import { useCallback, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormMode, BaseEntity } from '../types';
import { EntityStore, createEntityStore } from '../store';
import { logger } from '../utils/logger';

/**
 * Hook for managing entity form state and operations using a Zustand store
 * @param options Form configuration options
 * @returns Form state and methods
 */
export function useEntityForm<TData extends BaseEntity = any, TFilter = any>({
  defaultValues,
  validationSchema,
  onSubmit,
  onCancel,
  initialMode = 'view',
  initialData = null,
  store,
  storeId = 'entity-form',
  keepValuesOnModeChange = false,
}: {
  defaultValues?: Partial<TData>;
  validationSchema?: any;
  onSubmit: (data: TData, mode: FormMode) => void | Promise<void>;
  onCancel?: () => void;
  initialMode?: FormMode;
  initialData?: TData | null;
  store?: EntityStore<TData, TFilter>;
  storeId?: string;
  keepValuesOnModeChange?: boolean;
}) {
  // Create a dedicated logger for this form instance
  const formLogger = useMemo(() => logger.createContext(`EntityForm:${storeId}`), [storeId]);
  
  // Create a local store if none is provided
  const formStore = useMemo(() => {
    if (store) {
      formLogger.debug('Using provided store');
      return store;
    }
    
    formLogger.debug('Creating new entity store');
    return createEntityStore<TData, TFilter>(storeId, {
      enableLogging: true
    });
  }, [store, storeId, formLogger]);
  
  // Initialize store with initial values if provided
  useEffect(() => {
    if (initialMode && formStore.formMode !== initialMode) {
      formLogger.debug(`Setting initial form mode: ${initialMode}`);
      formStore.setFormMode(initialMode);
    }
    
    if (initialData && !formStore.selectedItem) {
      formLogger.debug('Setting initial form data');
      formStore.setSelectedItem(initialData);
    }
  }, [formStore, initialMode, initialData, formLogger]);
  
  // Access store state through selectors
  const formMode = formStore.useFormMode();
  const data = formStore.useSelectedItem();
  const formData = formStore.useFormData();
  const isSubmitting = formStore.useIsSubmitting();
  const submitError = formStore.useSubmitError();
  
  // Create form with react-hook-form
  const form = useForm({
    defaultValues: (data || formData || defaultValues) as any,
    resolver: validationSchema ? zodResolver(validationSchema) : undefined,
  });
  
  // Reset form when data changes
  const resetForm = useCallback(() => {
    form.reset(data || formData || defaultValues || {});
  }, [form, data, formData, defaultValues]);
  
  // Handle form mode changes with option to keep values
  const handleModeChange = useCallback((mode: FormMode, newData?: TData | null) => {
    formLogger.debug(`Changing form mode to ${mode}`, undefined, { newData: !!newData });
    formStore.setFormMode(mode);
    
    if (newData !== undefined) {
      formStore.setSelectedItem(newData);
    }
    
    if (!keepValuesOnModeChange) {
      resetForm();
    }
  }, [formStore, resetForm, keepValuesOnModeChange, formLogger]);
  
  // Handle form submission with better error handling
  const handleSubmit = useCallback(async (data: any) => {
    formLogger.info('Submitting form data', undefined, { mode: formMode });
    formStore.setSubmitError(null);
    formStore.setSubmitting(true);
    
    try {
      // Update form data in store
      formStore.updateFormData(data);
      // Submit the data
      await onSubmit(data, formMode);
      formLogger.info('Form submission successful');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      formLogger.error('Form submission error:', errorMessage, { error });
      formStore.setSubmitError(errorMessage);
    } finally {
      formStore.setSubmitting(false);
    }
  }, [formStore, formMode, onSubmit, formLogger]);
  
  // Handle form cancel with logging
  const handleCancel = useCallback(() => {
    formLogger.debug('Cancelling form');
    if (onCancel) {
      onCancel();
    }
    resetForm();
    if (formMode !== 'view') {
      formStore.setFormMode('view');
    }
  }, [formMode, formStore, onCancel, resetForm, formLogger]);
  
  // Utility for phone input fields to copy to another field
  const copyField = useCallback((fromField: string, toField: string) => {
    const value = form.getValues(fromField);
    form.setValue(toField, value);
  }, [form]);
  
  // Return a memoized value to prevent unnecessary re-renders
  const formState = useMemo(() => ({
    // Form state
    form,
    store: formStore,
    formMode,
    data,
    formData,
    isSubmitting,
    submitError,
    isReadOnly: formMode === 'view',
    isCreating: formMode === 'create',
    isEditing: formMode === 'edit',
    
    // Actions
    setFormMode: handleModeChange,
    handleSubmit: form.handleSubmit(handleSubmit),
    handleCancel,
    resetForm,
    copyField,
    
    // Directly expose some store methods for convenience
    updateFormData: formStore.updateFormData,
    setSubmitError: formStore.setSubmitError,
    
    // Logger
    logger: formLogger,
  }), [
    form, 
    formStore, 
    formMode, 
    data, 
    formData, 
    isSubmitting, 
    submitError, 
    handleModeChange, 
    handleSubmit, 
    handleCancel, 
    resetForm, 
    copyField, 
    formLogger
  ]);
  
  return formState;
}
