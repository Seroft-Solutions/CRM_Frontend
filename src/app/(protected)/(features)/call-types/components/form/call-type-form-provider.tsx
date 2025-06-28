'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { FormConfig, FormState, FormActions, FormContextValue } from './form-types';
import { callTypeFormConfig } from './call-type-form-config';
import { callTypeFormSchema } from './call-type-form-schema';
import { callTypeToast, handleCallTypeError } from '../call-type-toast';
import { useCrossFormNavigation, useNavigationFromUrl } from '@/context/cross-form-navigation';

const FormContext = createContext<FormContextValue | null>(null);

interface CallTypeFormProviderProps {
  children: React.ReactNode;
  id?: number;
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}

export function CallTypeFormProvider({
  children,
  id,
  onSuccess,
  onError,
}: CallTypeFormProviderProps) {
  const router = useRouter();
  const isNew = !id;
  const config = callTypeFormConfig;

  // Cross-form navigation hooks
  const { navigationState, hasReferrer } = useCrossFormNavigation();
  const urlParams = useNavigationFromUrl();

  // Form state management
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmSubmission, setConfirmSubmission] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isAutoPopulating, setIsAutoPopulating] = useState(false);
  const [restorationAttempted, setRestorationAttempted] = useState(false);

  // Generate unique session ID for this form instance
  const [formSessionId] = useState(() => {
    if (typeof window === 'undefined') {
      return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    const existingSession = sessionStorage.getItem(`${config.entity}_FormSession`);
    if (existingSession && isNew) {
      return existingSession;
    }
    const newSessionId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    if (isNew) {
      sessionStorage.setItem(`${config.entity}_FormSession`, newSessionId);
    }
    return newSessionId;
  });

  // Initialize React Hook Form
  const form = useForm<Record<string, any>>({
    resolver: zodResolver(callTypeFormSchema),
    mode: config.validation.mode,
    revalidateMode: config.validation.revalidateMode,
    defaultValues: getDefaultValues(),
  });

  function getDefaultValues() {
    const defaults: Record<string, any> = {};

    config.fields.forEach((field) => {
      switch (field.type) {
        case 'boolean':
          defaults[field.name] = false;
          break;
        case 'number':
          defaults[field.name] = '';
          break;
        case 'date':
          defaults[field.name] = undefined;
          break;
        case 'enum':
          defaults[field.name] = field.required ? field.options?.[0]?.value : undefined;
          break;
        default:
          defaults[field.name] = '';
      }
    });

    config.relationships.forEach((rel) => {
      defaults[rel.name] = rel.multiple ? [] : undefined;
    });

    return defaults;
  }

  // Form state persistence functions - only for cross-form navigation
  const saveFormState = useCallback(
    (forCrossNavigation = false) => {
      // Only save form state for cross-form navigation scenarios
      if (!isNew || !config.behavior.persistence.enabled || !forCrossNavigation) return;
      if (typeof window === 'undefined') return;

      const formData = form.getValues();
      const formState = {
        data: formData,
        currentStep,
        timestamp: Date.now(),
        entity: config.entity,
        sessionId: formSessionId,
        crossFormNavigation: true, // Mark this as cross-form navigation state
      };

      const storageKey = `${config.behavior.persistence.storagePrefix}${formSessionId}`;
      localStorage.setItem(storageKey, JSON.stringify(formState));
    },
    [form, currentStep, isNew, formSessionId, config]
  );

  const restoreFormState = useCallback(
    (suppressToast = false): boolean => {
      if (!isNew || !config.behavior.persistence.enabled) return false;

      if (typeof window === 'undefined') return false;

      const currentSessionId = sessionStorage.getItem(`${config.entity}_FormSession`);
      if (!currentSessionId || currentSessionId !== formSessionId) {
        return false;
      }

      const storageKey = `${config.behavior.persistence.storagePrefix}${formSessionId}`;
      const savedStateStr = localStorage.getItem(storageKey);

      if (savedStateStr) {
        try {
          const savedState = JSON.parse(savedStateStr);
          const timeoutMs = config.behavior.persistence.sessionTimeoutMinutes * 60 * 1000;
          const isRecent = Date.now() - savedState.timestamp < timeoutMs;
          const isSameSession = savedState.sessionId === formSessionId;
          const isSameEntity = savedState.entity === config.entity;
          const isCrossFormState = savedState.crossFormNavigation === true;

          // Only restore states that were saved for cross-form navigation
          if (isRecent && isSameSession && isSameEntity && isCrossFormState) {
            setIsRestoring(true);

            Object.keys(savedState.data).forEach((key) => {
              const value = savedState.data[key];
              if (value !== undefined && value !== null) {
                form.setValue(key as any, value);
              }
            });

            setCurrentStep(savedState.currentStep || 0);

            setTimeout(() => setIsRestoring(false), 100);

            // Only show form restored toast if not suppressed (i.e., not during cross-entity auto-population)
            if (!suppressToast) {
              callTypeToast.formRestored();
            }

            return true;
          } else {
            localStorage.removeItem(storageKey);
          }
        } catch (error) {
          console.error('Failed to restore form state:', error);
          localStorage.removeItem(storageKey);
        }
      }
      return false;
    },
    [form, isNew, formSessionId, config]
  );

  // Clear old form states
  const clearOldFormStates = useCallback(() => {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (
        key?.startsWith(config.behavior.persistence.storagePrefix) &&
        !key.endsWith(formSessionId)
      ) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  }, [formSessionId, config]);

  // Handle newly created relationship entities
  const handleEntityCreated = useCallback(
    (entityId: number, relationshipName: string, skipValidation = false) => {
      const relationshipConfig = config.relationships.find((rel) => rel.name === relationshipName);
      if (!relationshipConfig) return;

      const currentValue = form.getValues(relationshipName as any);

      if (relationshipConfig.multiple) {
        const newValue = Array.isArray(currentValue) ? [...currentValue, entityId] : [entityId];
        form.setValue(relationshipName as any, newValue, { shouldValidate: !skipValidation });
      } else {
        form.setValue(relationshipName as any, entityId, { shouldValidate: !skipValidation });
      }

      // Only trigger validation if not skipping it (e.g., during auto-population)
      if (!skipValidation && !isAutoPopulating) {
        form.trigger(relationshipName as any);
      }
    },
    [form, config, isAutoPopulating]
  );

  // Validation for current step
  const validateStep = useCallback(
    async (stepIndex?: number): Promise<boolean> => {
      // Skip validation during auto-population to prevent interference
      if (isAutoPopulating) {
        return true;
      }

      const targetStep = stepIndex ?? currentStep;
      const stepConfig = config.steps[targetStep];
      if (!stepConfig) return true;

      const fieldsToValidate = [...stepConfig.fields, ...stepConfig.relationships];
      const result = await form.trigger(fieldsToValidate);
      return result;
    },
    [form, currentStep, config, isAutoPopulating]
  );

  // Navigation actions
  const nextStep = useCallback(async (): Promise<boolean> => {
    if (!config.behavior.navigation.validateOnNext) {
      if (currentStep < config.steps.length - 1) {
        setCurrentStep(currentStep + 1);
        return true;
      }
      return false;
    }

    const isValid = await validateStep();
    if (isValid && currentStep < config.steps.length - 1) {
      setCurrentStep(currentStep + 1);
      return true;
    }
    return false;
  }, [currentStep, config, validateStep]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      if (currentStep === config.steps.length - 1) {
        setConfirmSubmission(false);
      }
    }
  }, [currentStep, config]);

  const goToStep = useCallback(
    async (stepIndex: number): Promise<boolean> => {
      if (stepIndex < 0 || stepIndex >= config.steps.length) return false;

      if (config.behavior.navigation.allowStepSkipping) {
        setCurrentStep(stepIndex);
        return true;
      }

      // Validate all steps up to target step
      for (let i = 0; i < stepIndex; i++) {
        const isValid = await validateStep(i);
        if (!isValid) return false;
      }

      setCurrentStep(stepIndex);
      return true;
    },
    [config, validateStep]
  );

  // Form submission
  const submitForm = useCallback(async () => {
    // Don't allow submission during auto-population
    if (isAutoPopulating) {
      return;
    }

    if (currentStep !== config.steps.length - 1) {
      return;
    }

    const isValid = await form.trigger();

    if (!isValid) {
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = form.getValues();

      // Transform data for submission
      const entityToSave = transformFormDataForSubmission(formData);

      if (onSuccess) {
        await onSuccess(entityToSave);
      }

      // Clean up form state
      cleanupFormState();
    } catch (error) {
      if (onError) {
        onError(error);
      } else {
        handleCallTypeError(error);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [currentStep, config, form, onSuccess, onError, isAutoPopulating]);

  function transformFormDataForSubmission(data: Record<string, any>) {
    const entityToSave: Record<string, any> = {};

    // Handle regular fields
    config.fields.forEach((fieldConfig) => {
      const value = data[fieldConfig.name];

      if (fieldConfig.type === 'number') {
        if (value !== '' && value != null && !isNaN(Number(value))) {
          entityToSave[fieldConfig.name] = Number(value);
        } else if (fieldConfig.required) {
          entityToSave[fieldConfig.name] = null;
        }
      } else if (fieldConfig.type === 'enum') {
        if (value === '__none__' || value === '' || value == null) {
          if (fieldConfig.required) {
            entityToSave[fieldConfig.name] = null;
          }
        } else {
          entityToSave[fieldConfig.name] = value;
        }
      } else if (fieldConfig.type === 'date') {
        if (value && value instanceof Date) {
          entityToSave[fieldConfig.name] = value.toISOString();
        } else if (value && typeof value === 'string') {
          entityToSave[fieldConfig.name] = new Date(value).toISOString();
        } else if (fieldConfig.required) {
          entityToSave[fieldConfig.name] = null;
        }
      } else if (fieldConfig.type === 'boolean') {
        entityToSave[fieldConfig.name] = Boolean(value);
      } else {
        // String fields
        if (value !== '' && value != null) {
          entityToSave[fieldConfig.name] = String(value);
        } else if (fieldConfig.required) {
          entityToSave[fieldConfig.name] = null;
        }
      }
    });

    // Handle relationships - use reference object pattern { entityName: { id: value } }
    config.relationships.forEach((relConfig) => {
      const value = data[relConfig.name];

      if (relConfig.multiple) {
        // For many-to-many or one-to-many relationships
        if (value && Array.isArray(value) && value.length > 0) {
          entityToSave[relConfig.name] = value.map((id) => ({ [relConfig.primaryKey]: id }));
        } else {
          entityToSave[relConfig.name] = value || [];
        }
      } else {
        // For many-to-one relationships - use reference object pattern
        if (value) {
          entityToSave[relConfig.name] = { [relConfig.primaryKey]: value };
        } else {
          entityToSave[relConfig.name] = null;
        }
      }
    });

    // Remove undefined values to avoid sending them to the backend
    Object.keys(entityToSave).forEach((key) => {
      if (entityToSave[key] === undefined) {
        delete entityToSave[key];
      }
    });

    return entityToSave;
  }

  // Form cleanup
  const cleanupFormState = useCallback(() => {
    if (typeof window === 'undefined') return;

    const storageKey = `${config.behavior.persistence.storagePrefix}${formSessionId}`;
    localStorage.removeItem(storageKey);
    sessionStorage.removeItem(`${config.entity}_FormSession`);

    // Clear all old form states for this entity type
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(config.behavior.persistence.storagePrefix)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));

    form.reset();
    setCurrentStep(0);
    setConfirmSubmission(false);
  }, [formSessionId, config, form]);

  const resetForm = useCallback(() => {
    form.reset(getDefaultValues());
    setCurrentStep(0);
    setConfirmSubmission(false);
  }, [form]);

  // Form restoration on mount and auto-population
  useEffect(() => {
    if (!restorationAttempted && isNew) {
      setRestorationAttempted(true);
      clearOldFormStates();

      // Check for auto-population from cross-form navigation (primary path)
      const createdEntityInfo = localStorage.getItem('createdEntityInfo');
      if (createdEntityInfo) {
        try {
          const info = JSON.parse(createdEntityInfo);

          // Check if this form should receive the created entity
          const sessionMatches = info.targetSessionId === formSessionId;
          const isRecent = Date.now() - info.timestamp < 5 * 60 * 1000;

          if (sessionMatches || isRecent) {
            setIsAutoPopulating(true);

            const restored = restoreFormState(true); // Suppress form restoration toast

            // Auto-populate with proper timing and validation control
            setTimeout(
              () => {
                // Set the value without triggering validation during auto-population
                handleEntityCreated(info.entityId, info.targetField, true);

                // Clear the created entity info
                localStorage.removeItem('createdEntityInfo');

                // Show single comprehensive success message
                toast.success(`${info.entityType} created and selected successfully`);

                // Re-enable auto-populating state after a short delay
                setTimeout(() => {
                  setIsAutoPopulating(false);
                }, 300);
              },
              restored ? 600 : 200
            );
          } else {
            // Clean up stale entity info
            localStorage.removeItem('createdEntityInfo');
            // No auto-population, fall through to normal restoration
            restoreFormState();
          }
        } catch (error) {
          console.error('Error processing created entity info:', error);
          localStorage.removeItem('createdEntityInfo');
          // Error occurred, fall through to normal restoration
          restoreFormState();
        }
        return; // Exit early since we handled the createdEntityInfo case
      }

      // Fallback to legacy auto-population logic (only if no createdEntityInfo)
      const newEntityId = localStorage.getItem(config.behavior.crossEntity.newEntityIdKey);
      const relationshipInfo = localStorage.getItem(
        config.behavior.crossEntity.relationshipInfoKey
      );

      if (newEntityId && relationshipInfo) {
        try {
          const info = JSON.parse(relationshipInfo);

          setIsAutoPopulating(true);
          const restored = restoreFormState(true); // Suppress form restoration toast for legacy path too

          setTimeout(
            () => {
              handleEntityCreated(parseInt(newEntityId), Object.keys(info)[0] || 'id', true);

              // Show single success message for legacy path
              toast.success('Entity created and selected successfully');

              // Clean up
              localStorage.removeItem(config.behavior.crossEntity.newEntityIdKey);
              localStorage.removeItem(config.behavior.crossEntity.relationshipInfoKey);
              localStorage.removeItem(config.behavior.crossEntity.returnUrlKey);
              localStorage.removeItem('entityCreationContext');

              setTimeout(() => {
                setIsAutoPopulating(false);
              }, 300);
            },
            restored ? 600 : 200
          );
        } catch (error) {
          console.error('Error processing newly created entity:', error);
          // Error occurred, fall through to normal restoration
          restoreFormState();
        }
        return; // Exit early since we handled the legacy case
      }

      // Normal form restoration (only if no auto-population occurred)
      restoreFormState();
    }

    const handleSaveFormState = () => {
      if (isNew) {
        saveFormState(true); // Save with cross-form navigation flag
      }
    };

    window.addEventListener('saveFormState', handleSaveFormState);

    return () => {
      window.removeEventListener('saveFormState', handleSaveFormState);
    };
  }, [
    restorationAttempted,
    isNew,
    restoreFormState,
    saveFormState,
    handleEntityCreated,
    clearOldFormStates,
    config,
  ]);

  // Helper function to get navigation props for relationship components
  const getNavigationProps = useCallback(
    (fieldName: string) => ({
      referrerForm: config.entity,
      referrerSessionId: formSessionId,
      referrerField: fieldName,
    }),
    [config.entity, formSessionId]
  );

  // Create context value
  const contextValue: FormContextValue = {
    config,
    state: {
      currentStep,
      isLoading: isLoading || isAutoPopulating,
      isSubmitting,
      isDirty: form.formState.isDirty,
      errors: form.formState.errors,
      values: form.getValues(),
      touchedFields: form.formState.touchedFields as Record<string, boolean>,
      isAutoPopulating,
    },
    actions: {
      nextStep,
      prevStep,
      goToStep,
      validateStep,
      submitForm,
      resetForm,
      saveFormState,
      restoreFormState,
      handleEntityCreated,
      getNavigationProps,
    },
    form,
    navigation: {
      hasReferrer: hasReferrer(),
      urlParams,
      navigationState,
    },
  };

  return <FormContext.Provider value={contextValue}>{children}</FormContext.Provider>;
}

// Custom hook to use form context
export function useEntityForm(): FormContextValue {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error('useEntityForm must be used within a CallTypeFormProvider');
  }
  return context;
}

// Additional hooks for specific functionality
export function useFormConfig() {
  const { config } = useEntityForm();
  return config;
}

export function useFormState() {
  const { state } = useEntityForm();
  return state;
}

export function useFormActions() {
  const { actions } = useEntityForm();
  return actions;
}
