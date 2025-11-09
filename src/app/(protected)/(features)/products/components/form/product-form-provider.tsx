'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { FormContextValue } from './form-types';
import { productFormConfig } from './product-form-config';
import { productFormSchema } from './product-form-schema';
import { handleProductError, productToast } from '../product-toast';
import { useCrossFormNavigation, useNavigationFromUrl } from '@/context/cross-form-navigation';
import { useEntityDrafts } from '@/core/hooks/use-entity-drafts';
import { DraftRestorationDialog, SaveDraftDialog } from '@/components/form-drafts';

const FormContext = createContext<FormContextValue | null>(null);

interface ProductFormProviderProps {
  children: React.ReactNode;
  id?: number;
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}

export function ProductFormProvider({
  children,
  id,
  onSuccess,
  onError,
}: ProductFormProviderProps) {
  const router = useRouter();
  const isNew = !id;
  const config = productFormConfig;

  const { navigationState, hasReferrer, registerDraftCheck, unregisterDraftCheck } =
    useCrossFormNavigation();
  const urlParams = useNavigationFromUrl();

  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmSubmission, setConfirmSubmission] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isAutoPopulating, setIsAutoPopulating] = useState(false);
  const [restorationAttempted, setRestorationAttempted] = useState(false);
  const [draftRestorationInProgress, setDraftRestorationInProgress] = useState(false);

  const [allFormData, setAllFormData] = useState<Record<string, any>>({});

  const [showDraftDialog, setShowDraftDialog] = useState(false);
  const [showRestorationDialog, setShowRestorationDialog] = useState(false);
  const [currentDraftId, setCurrentDraftId] = useState<number | undefined>();
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);

  const draftsEnabled = config.behavior?.drafts?.enabled ?? false;
  const {
    drafts,
    hasLoadingDrafts: isLoadingDrafts,
    saveDraft,
    loadDraft,
    restoreDraft,
    deleteDraft,
    getLatestDraft,
    isSaving: isSavingDraft,
    isDeleting: isDeletingDraft,
  } = useEntityDrafts({
    entityType: config.entity,
    enabled: draftsEnabled && isNew,
    maxDrafts: config.behavior?.drafts?.maxDrafts ?? 5,
  });

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

  const form = useForm<Record<string, any>>({
    resolver: zodResolver(productFormSchema),
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

  const saveFormState = useCallback(
    (forCrossNavigation = false) => {
      if (!isNew || !config.behavior.persistence.enabled || !forCrossNavigation) return;
      if (typeof window === 'undefined') return;

      const formData = form.getValues();
      const formState = {
        data: formData,
        currentStep,
        timestamp: Date.now(),
        entity: config.entity,
        sessionId: formSessionId,
        crossFormNavigation: true,
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

            if (!suppressToast) {
              productToast.formRestored();
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

      if (!skipValidation && !isAutoPopulating) {
        form.trigger(relationshipName as any);
      }
    },
    [form, config, isAutoPopulating]
  );

  const validateStep = useCallback(
    async (stepIndex?: number): Promise<boolean> => {
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

  const nextStep = useCallback(async (): Promise<boolean> => {
    const currentValues = form.getValues();
    setAllFormData((prev) => ({ ...prev, ...currentValues }));

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
  }, [currentStep, config, validateStep, form]);

  const prevStep = useCallback(() => {
    const currentValues = form.getValues();
    setAllFormData((prev) => ({ ...prev, ...currentValues }));

    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      if (currentStep === config.steps.length - 1) {
        setConfirmSubmission(false);
      }
    }
  }, [currentStep, config, form]);

  const goToStep = useCallback(
    async (stepIndex: number): Promise<boolean> => {
      if (stepIndex < 0 || stepIndex >= config.steps.length) return false;

      const currentValues = form.getValues();
      setAllFormData((prev) => ({ ...prev, ...currentValues }));

      if (config.behavior.navigation.allowStepSkipping) {
        setCurrentStep(stepIndex);
        return true;
      }

      for (let i = 0; i < stepIndex; i++) {
        const isValid = await validateStep(i);
        if (!isValid) return false;
      }

      setCurrentStep(stepIndex);
      return true;
    },
    [config, validateStep, form]
  );

  const submitForm = useCallback(async () => {
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

      const entityToSave = transformFormDataForSubmission(formData);

      if (onSuccess) {
        await onSuccess(entityToSave);
      }

      cleanupFormState();
    } catch (error) {
      if (onError) {
        onError(error);
      } else {
        handleProductError(error);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [currentStep, config, form, onSuccess, onError, isAutoPopulating]);

  function transformFormDataForSubmission(data: Record<string, any>) {
    const entityToSave: Record<string, any> = {};

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
        if (value !== '' && value != null) {
          entityToSave[fieldConfig.name] = String(value);
        } else if (fieldConfig.required) {
          entityToSave[fieldConfig.name] = null;
        }
      }
    });

    config.relationships.forEach((relConfig) => {
      const value = data[relConfig.name];

      if (relConfig.multiple) {
        if (value && Array.isArray(value) && value.length > 0) {
          entityToSave[relConfig.name] = value.map((id) => ({ [relConfig.primaryKey]: id }));
        } else {
          entityToSave[relConfig.name] = value || [];
        }
      } else {
        if (value) {
          entityToSave[relConfig.name] = { [relConfig.primaryKey]: value };
        } else {
          entityToSave[relConfig.name] = null;
        }
      }
    });

    Object.keys(entityToSave).forEach((key) => {
      if (entityToSave[key] === undefined) {
        delete entityToSave[key];
      }
    });

    return entityToSave;
  }

  const cleanupFormState = useCallback(() => {
    if (typeof window === 'undefined') return;

    const storageKey = `${config.behavior.persistence.storagePrefix}${formSessionId}`;
    localStorage.removeItem(storageKey);
    sessionStorage.removeItem(`${config.entity}_FormSession`);

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

  useEffect(() => {
    if (!restorationAttempted && isNew) {
      setRestorationAttempted(true);
      clearOldFormStates();

      const createdEntityInfo = localStorage.getItem('createdEntityInfo');
      if (createdEntityInfo) {
        try {
          const info = JSON.parse(createdEntityInfo);

          const sessionMatches = info.targetSessionId === formSessionId;
          const isRecent = Date.now() - info.timestamp < 5 * 60 * 1000;

          if (sessionMatches || isRecent) {
            setIsAutoPopulating(true);

            const restored = restoreFormState(true);

            setTimeout(
              () => {
                handleEntityCreated(info.entityId, info.targetField, true);

                localStorage.removeItem('createdEntityInfo');

                toast.success(`${info.entityType} created and selected successfully`);

                setTimeout(() => {
                  setIsAutoPopulating(false);
                }, 300);
              },
              restored ? 600 : 200
            );
          } else {
            localStorage.removeItem('createdEntityInfo');

            restoreFormState();
          }
        } catch (error) {
          console.error('Error processing created entity info:', error);
          localStorage.removeItem('createdEntityInfo');

          restoreFormState();
        }
        return;
      }

      const newEntityId = localStorage.getItem(config.behavior.crossEntity.newEntityIdKey);
      const relationshipInfo = localStorage.getItem(
        config.behavior.crossEntity.relationshipInfoKey
      );

      if (newEntityId && relationshipInfo) {
        try {
          const info = JSON.parse(relationshipInfo);

          setIsAutoPopulating(true);
          const restored = restoreFormState(true);

          setTimeout(
            () => {
              handleEntityCreated(parseInt(newEntityId), Object.keys(info)[0] || 'id', true);

              toast.success('Entity created and selected successfully');

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

          restoreFormState();
        }
        return;
      }

      restoreFormState(draftRestorationInProgress);
    }

    const handleSaveFormState = () => {
      if (isNew) {
        saveFormState(true);
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

  const getNavigationProps = useCallback(
    (fieldName: string) => ({
      referrerForm: config.entity,
      referrerSessionId: formSessionId,
      referrerField: fieldName,
    }),
    [config.entity, formSessionId]
  );

  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      if (type === 'change' && name) {
        setAllFormData((prev) => ({
          ...prev,
          [name]: value[name],
        }));
      }
    });

    return () => subscription.unsubscribe();
  }, [form]);

  useEffect(() => {
    const currentValues = form.getValues();
    setAllFormData((prev) => ({ ...prev, ...currentValues }));
  }, [form]);

  const handleSaveDraft = useCallback(async (): Promise<boolean> => {
    if (!draftsEnabled || !isNew) return false;

    try {
      const currentFormValues = form.getValues();
      const completeFormData = { ...allFormData, ...currentFormValues };

      const success = await saveDraft(completeFormData, currentStep, formSessionId, currentDraftId);

      if (success) {
        toast.success('Draft saved successfully');
      } else {
        toast.error('Failed to save draft');
      }

      return success;
    } catch (error) {
      console.error('Failed to save draft:', error);
      toast.error('Failed to save draft');
      return false;
    }
  }, [
    draftsEnabled,
    isNew,
    form,
    allFormData,
    currentStep,
    formSessionId,
    currentDraftId,
    saveDraft,
  ]);

  const handleLoadDraft = useCallback(
    async (draftId: number, suppressToast = false): Promise<boolean> => {
      if (!draftsEnabled) return false;

      try {
        const draftData = await restoreDraft(draftId);
        if (!draftData) {
          if (!suppressToast) {
            toast.error('Draft not found or has been deleted');
          }
          return false;
        }

        Object.keys(draftData.formData).forEach((key) => {
          form.setValue(key, draftData.formData[key]);
        });

        setAllFormData(draftData.formData);

        if (draftData.currentStep !== undefined) {
          setCurrentStep(draftData.currentStep);
        }

        setCurrentDraftId(undefined);
        setShowRestorationDialog(false);

        if (!suppressToast) {
          toast.success('Draft restored successfully');
        }
        return true;
      } catch (error) {
        console.error('Failed to restore draft:', error);
        if (!suppressToast) {
          toast.error('Failed to restore draft');
        }
        return false;
      }
    },
    [draftsEnabled, restoreDraft, form]
  );

  const handleDeleteDraft = useCallback(
    async (draftId: number): Promise<boolean> => {
      if (!draftsEnabled) return false;

      try {
        const success = await deleteDraft(draftId);
        if (success) {
          toast.success('Draft deleted successfully');
        } else {
          toast.error('Failed to delete draft');
        }
        return success;
      } catch (error) {
        console.error('Failed to delete draft:', error);
        toast.error('Failed to delete draft');
        return false;
      }
    },
    [draftsEnabled, deleteDraft]
  );

  const handleCheckForDrafts = useCallback(() => {
    if (!draftsEnabled || !isNew || !config.behavior?.drafts?.showRestorationDialog) return;

    if (drafts.length > 0 && !restorationAttempted) {
      setShowRestorationDialog(true);
      setRestorationAttempted(true);
    }
  }, [
    draftsEnabled,
    isNew,
    config.behavior?.drafts?.showRestorationDialog,
    drafts.length,
    restorationAttempted,
  ]);

  useEffect(() => {
    if (
      draftsEnabled &&
      isNew &&
      !isLoadingDrafts &&
      !restorationAttempted &&
      !draftRestorationInProgress
    ) {
      const draftToRestore = sessionStorage.getItem('draftToRestore');
      if (draftToRestore) {
        setDraftRestorationInProgress(true);
        try {
          const restorationData = JSON.parse(draftToRestore);
          if (restorationData.entityType === config.entity) {
            handleLoadDraft(restorationData.draftId, true).then((success) => {
              if (success) {
                sessionStorage.removeItem('draftToRestore');
                setRestorationAttempted(true);

                toast.success('Draft restored successfully');
              }
              setDraftRestorationInProgress(false);
            });
            return;
          }
        } catch (error) {
          console.error('Failed to restore draft from management page:', error);
          sessionStorage.removeItem('draftToRestore');
          setDraftRestorationInProgress(false);
        }
      }

      handleCheckForDrafts();
    }
  }, [
    draftsEnabled,
    isNew,
    isLoadingDrafts,
    restorationAttempted,
    draftRestorationInProgress,
    handleCheckForDrafts,
    handleLoadDraft,
    config.entity,
  ]);

  useEffect(() => {
    if (draftsEnabled && isNew) {
      const draftCheckHandler = {
        formId: config.entity,
        checkDrafts: (onProceed: () => void) => {
          if (form.formState.isDirty && config.behavior?.drafts?.confirmDialog) {
            setPendingNavigation(() => onProceed);
            setShowDraftDialog(true);
          } else {
            onProceed();
          }
        },
      };

      registerDraftCheck(draftCheckHandler);

      return () => {
        unregisterDraftCheck(config.entity);
      };
    }
  }, [
    draftsEnabled,
    isNew,
    config.entity,
    config.behavior?.drafts?.confirmDialog,
    form.formState.isDirty,
    registerDraftCheck,
    unregisterDraftCheck,
  ]);

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

      drafts,
      isLoadingDrafts,
      isSavingDraft,
      isDeletingDraft,
      showDraftDialog,
      showRestorationDialog,
      currentDraftId,
      draftRestorationInProgress,
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

      saveDraft: handleSaveDraft,
      loadDraft: handleLoadDraft,
      deleteDraft: handleDeleteDraft,
      checkForDrafts: handleCheckForDrafts,
    },
    form,
    navigation: {
      hasReferrer: hasReferrer(),
      urlParams,
      navigationState,
    },
  };

  return (
    <FormContext.Provider value={contextValue}>
      {children}

      {/* Draft Dialogs */}
      {draftsEnabled && (
        <>
          <SaveDraftDialog
            open={showDraftDialog}
            onOpenChange={setShowDraftDialog}
            entityType={config.entity}
            onSaveDraft={async () => {
              const success = await handleSaveDraft();
              if (success && pendingNavigation) {
                pendingNavigation();
                setPendingNavigation(null);
              }
              return success;
            }}
            onDiscardChanges={() => {
              if (pendingNavigation) {
                pendingNavigation();
                setPendingNavigation(null);
              }
            }}
            onCancel={() => {
              setPendingNavigation(null);
            }}
            isDirty={form.formState.isDirty}
          />

          <DraftRestorationDialog
            open={showRestorationDialog}
            onOpenChange={setShowRestorationDialog}
            entityType={config.entity}
            drafts={drafts}
            onRestoreDraft={handleLoadDraft}
            onDeleteDraft={handleDeleteDraft}
            onStartFresh={() => {
              setShowRestorationDialog(false);
            }}
            isLoading={isLoadingDrafts}
          />
        </>
      )}
    </FormContext.Provider>
  );
}

export function useEntityForm(): FormContextValue {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error('useEntityForm must be used within a ProductFormProvider');
  }
  return context;
}

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
