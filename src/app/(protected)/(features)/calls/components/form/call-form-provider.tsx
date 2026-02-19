'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { useAccount, useUserAuthorities } from '@/core/auth';
import {
  useGetAllUserProfiles,
  useGetUserProfile,
} from '@/core/api/generated/spring/endpoints/user-profile-resource/user-profile-resource.gen';
import { useCreateCall } from '@/core/api/generated/spring/endpoints/call-resource/call-resource.gen';
import type { FormContextValue } from './form-types';
import { callFormConfig } from './call-form-config';
import { callFormSchema } from './call-form-schema';
import { callToast, handleCallError } from '../call-toast';
import { useCrossFormNavigation, useNavigationFromUrl } from '@/context/cross-form-navigation';
import { useEntityDrafts } from '@/core/hooks/use-entity-drafts';
import { SaveDraftDialog } from '@/components/form-drafts';
import { useOrganizationDetails, useUserOrganizations } from '@/hooks/useUserOrganizations';

const FormContext = createContext<FormContextValue | null>(null);

interface CallFormProviderProps {
  children: React.ReactNode;
  id?: number;
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}

export function CallFormProvider({ children, id, onSuccess, onError }: CallFormProviderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isNew = !id;
  const baseConfig = callFormConfig;
  const { hasGroup } = useUserAuthorities();
  const { data: accountData } = useAccount();
  const isBusinessPartner = hasGroup('Business Partners');

  const getOrganizationName = () => {
    if (typeof window === 'undefined') return 'DEFAULT';
    return localStorage.getItem('selectedOrganizationName') || 'DEFAULT';
  };

  const { data: userProfile } = useGetUserProfile(accountData?.id || '', {
    query: {
      enabled: isBusinessPartner && !!accountData?.id,
      staleTime: 5 * 60 * 1000,
    },
  });

  const config = React.useMemo(() => {
    if (isBusinessPartner) {
      return {
        ...baseConfig,
        steps: baseConfig.steps.filter((step) => step.id !== 'channel' && step.id !== 'assignment'),
      };
    }
    return baseConfig;
  }, [isBusinessPartner, baseConfig]);
  const formRef = useRef<HTMLDivElement>(null);

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
  const [currentDraftId, setCurrentDraftId] = useState<number | undefined>();
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);

  const [isInsideForm, setIsInsideForm] = useState(false);
  const hasAppliedUrlPrefillsRef = useRef(false);

  const { mutate: createEntity, isPending: isCreating } = useCreateCall();

  const draftsEnabled = config.behavior?.drafts?.enabled ?? false;
  const {
    drafts,
    hasLoadingDrafts: isLoadingDrafts,
    loadDraft,
    restoreDraft,
    deleteDraft,
    getLatestDraft,
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
    resolver: zodResolver(callFormSchema) as any,
    mode: config.validation.mode,
    reValidateMode: config.validation.revalidateMode,
    defaultValues: getDefaultValues(),
  });
  const prefilledRelationshipValues = React.useMemo(() => {
    const parseNumericId = (rawValue: string | null): number | undefined => {
      if (!rawValue) return undefined;

      const parsedValue = Number(rawValue);

      if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
        return undefined;
      }

      return parsedValue;
    };

    const parseStringId = (rawValue: string | null): string | undefined => {
      const trimmedValue = rawValue?.trim();
      return trimmedValue ? trimmedValue : undefined;
    };

    return {
      customer: parseNumericId(searchParams.get('customerId')),
      source: parseNumericId(searchParams.get('sourceId')),
      product: parseNumericId(searchParams.get('productId')),
      priority: parseNumericId(searchParams.get('priorityId')),
      callType: parseNumericId(searchParams.get('callTypeId')),
      subCallType: parseNumericId(searchParams.get('subCallTypeId')),
      callStatus: parseNumericId(searchParams.get('callStatusId')),
      channelType: parseNumericId(searchParams.get('channelTypeId')),
      channelParties: parseStringId(searchParams.get('channelPartiesId')),
      assignedTo: parseStringId(searchParams.get('assignedToId')),
    };
  }, [searchParams]);

  const { data: organizations, isLoading: OrganizationLoading } = useUserOrganizations();

  const orgId = organizations?.[0]?.id || '';

  const { data: organizationData } = useOrganizationDetails(orgId);
  const { data: tenantData } = useGetAllUserProfiles(
    { 'email.equals': organizationData?.attributes?.organizationEmail?.[0] || '' },
    {
      query: {
        enabled: !!organizationData,
      },
    }
  );
  console.log('ART User All Data:', tenantData);

  React.useEffect(() => {
    if (isNew && !form.getValues('leadNo')) {
      const orgCode = organizationData?.attributes?.organizationCode?.[0] || '';
      form.setValue('leadNo', orgCode);
    }
  }, [isNew, form, organizationData]);

  React.useEffect(() => {
    if (isNew && !form.getValues('assignedTo')) {
      const id = tenantData?.[0]?.id || '';
      form.setValue('assignedTo', id);
    }
  }, [isNew, form, tenantData]);

  React.useEffect(() => {
    if (!isNew || hasAppliedUrlPrefillsRef.current) {
      return;
    }

    const prefilledEntries = Object.entries(prefilledRelationshipValues).filter(
      ([, value]) => value !== undefined
    );

    if (prefilledEntries.length === 0) {
      return;
    }

    prefilledEntries.forEach(([fieldName, value]) => {
      form.setValue(fieldName as any, value, { shouldValidate: true });
    });

    hasAppliedUrlPrefillsRef.current = true;
  }, [form, isNew, prefilledRelationshipValues]);

  useEffect(() => {
    if (isBusinessPartner && accountData && isNew) {
      const currentChannelParties = form.getValues('channelParties');
      const currentChannelType = form.getValues('channelType');

      if (!currentChannelParties && typeof accountData.id === 'number') {
        form.setValue('channelParties', accountData.id);
      }

      if (
        !currentChannelType &&
        userProfile?.channelType?.id &&
        typeof userProfile.channelType.id === 'number'
      ) {
        form.setValue('channelType', userProfile.channelType.id);
      }
    }
  }, [isBusinessPartner, accountData, userProfile, isNew, form]);

  function getDefaultValues() {
    const defaults: Record<string, any> = {};

    if (isNew) {
      defaults.leadNo = '';
    }

    if (isBusinessPartner && accountData) {
      if (typeof accountData.id === 'number') {
        defaults.channelParties = accountData.id;
      }

      if (userProfile?.channelType?.id && typeof userProfile.channelType.id === 'number') {
        defaults.channelType = userProfile.channelType.id;
      }
    }

    config.fields.forEach((field) => {
      if (field.defaultValue !== undefined) {
        defaults[field.name] = field.defaultValue;
      } else {
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
      }
    });

    config.relationships.forEach((rel) => {
      defaults[rel.name] = rel.multiple ? [] : undefined;
    });

    return defaults;
  }

  const hasUnsavedChanges = useCallback(() => {
    return form.formState.isDirty && isNew && draftsEnabled;
  }, [form.formState.isDirty, isNew, draftsEnabled]);

  const showDraftDialogForNavigation = useCallback(
    (navigationCallback: () => void) => {
      if (hasUnsavedChanges()) {
        setPendingNavigation(() => navigationCallback);
        setShowDraftDialog(true);
        return true;
      }
      return false;
    },
    [hasUnsavedChanges]
  );

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
              callToast.formRestored();
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

    const reviewStepIndex = config.steps.length - 1;
    if (currentStep !== reviewStepIndex) {
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
        handleCallError(error);
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

    if (data.tempRemarks !== undefined) {
      entityToSave.tempRemarks = data.tempRemarks;
    }

    if (isNew && isBusinessPartner && accountData?.login) {
      entityToSave.createdBy = accountData.login;
    }

    if (isBusinessPartner && accountData) {
      entityToSave.channelParties = {
        id: accountData.id,
      };

      if (userProfile?.channelType?.id) {
        entityToSave.channelType = {
          id: userProfile.channelType.id,
        };
      }
    }

    Object.keys(entityToSave).forEach((key) => {
      if (entityToSave[key] === undefined) {
        delete entityToSave[key];
      }
    });

    entityToSave.status = 'ACTIVE';

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
    if (!isNew || !draftsEnabled) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges()) {
        const message = 'You have unsaved changes. Are you sure you want to leave?';
        e.preventDefault();
        e.returnValue = message;
        return message;
      }
    };

    const handlePopState = (e: PopStateEvent) => {
      if (hasUnsavedChanges()) {
        window.history.pushState(null, '', window.location.href);

        setPendingNavigation(() => () => {
          window.history.back();
        });
        setShowDraftDialog(true);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    if (hasUnsavedChanges()) {
      window.history.pushState(null, '', window.location.href);
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [hasUnsavedChanges, isNew, draftsEnabled]);

  useEffect(() => {
    if (!isNew || !draftsEnabled) return;

    const handleMouseEnter = () => setIsInsideForm(true);
    const handleMouseLeave = () => setIsInsideForm(false);

    const handleClickOutside = (event: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(event.target as Node)) {
        if (hasUnsavedChanges() && isInsideForm && !showDraftDialog) {
          setPendingNavigation(() => () => {
            setIsInsideForm(false);
          });
          setShowDraftDialog(true);
        }
      }
    };

    const formElement = formRef.current;
    if (formElement) {
      formElement.addEventListener('mouseenter', handleMouseEnter);
      formElement.addEventListener('mouseleave', handleMouseLeave);
      document.addEventListener('click', handleClickOutside, true);
    }

    return () => {
      if (formElement) {
        formElement.removeEventListener('mouseenter', handleMouseEnter);
        formElement.removeEventListener('mouseleave', handleMouseLeave);
      }
      document.removeEventListener('click', handleClickOutside, true);
    };
  }, [hasUnsavedChanges, isInsideForm, isNew, draftsEnabled, showDraftDialog]);

  useEffect(() => {
    if (!isNew || !draftsEnabled) return;

    const handleRouteChangeStart = (url: string) => {
      if (hasUnsavedChanges()) {
        console.log('Route change detected:', url);
      }
    };

    return () => {};
  }, [hasUnsavedChanges, isNew, draftsEnabled, router]);

  useEffect(() => {
    if (!isNew || !draftsEnabled) return;

    let isNavigating = false;

    const handleNavigationClick = (event: Event) => {
      if (isNavigating) return;

      const target = event.target as Element;

      const link = target.closest('a[href]') as HTMLAnchorElement;
      if (link && hasUnsavedChanges()) {
        const href = link.getAttribute('href');
        if (
          href &&
          !href.startsWith('http') &&
          !href.startsWith('mailto:') &&
          !href.startsWith('tel:') &&
          !href.startsWith('#')
        ) {
          event.preventDefault();
          event.stopImmediatePropagation();

          setPendingNavigation(() => () => {
            isNavigating = true;
            router.push(href);
            setTimeout(() => {
              isNavigating = false;
            }, 100);
          });
          setShowDraftDialog(true);
          return;
        }
      }

      const button = target.closest('button') as HTMLButtonElement;
      if (button && hasUnsavedChanges()) {
        const linkInsideButton = button.querySelector('a[href]') as HTMLAnchorElement;
        if (linkInsideButton) {
          const href = linkInsideButton.getAttribute('href');
          if (
            href &&
            !href.startsWith('http') &&
            !href.startsWith('mailto:') &&
            !href.startsWith('tel:') &&
            !href.startsWith('#')
          ) {
            event.preventDefault();
            event.stopImmediatePropagation();

            setPendingNavigation(() => () => {
              isNavigating = true;
              router.push(href);
              setTimeout(() => {
                isNavigating = false;
              }, 100);
            });
            setShowDraftDialog(true);
            return;
          }
        }

        const buttonText = button.textContent?.toLowerCase() || '';
        const isNavigationButton =
          buttonText.includes('back') ||
          buttonText.includes('cancel') ||
          buttonText.includes('close');

        if (isNavigationButton && formRef.current && !formRef.current.contains(button)) {
          console.log('Navigation button clicked with unsaved changes:', buttonText);
        }
      }
    };

    document.addEventListener('click', handleNavigationClick, true);

    return () => {
      document.removeEventListener('click', handleNavigationClick, true);
    };
  }, [hasUnsavedChanges, isNew, draftsEnabled, router]);

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

    const handleTriggerDraftCheck = (event: CustomEvent) => {
      const { onProceed } = event.detail;
      if (hasUnsavedChanges() && config.behavior?.drafts?.confirmDialog) {
        setPendingNavigation(() => onProceed);
        setShowDraftDialog(true);
      } else {
        onProceed();
      }
    };

    window.addEventListener('saveFormState', handleSaveFormState);
    window.addEventListener('triggerDraftCheck', handleTriggerDraftCheck as EventListener);

    return () => {
      window.removeEventListener('saveFormState', handleSaveFormState);
      window.removeEventListener('triggerDraftCheck', handleTriggerDraftCheck as EventListener);
    };
  }, [
    restorationAttempted,
    isNew,
    restoreFormState,
    saveFormState,
    handleEntityCreated,
    clearOldFormStates,
    config,
    hasUnsavedChanges,
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
      const entityToSave = transformFormDataForSubmission(completeFormData);

      entityToSave.status = 'DRAFT';

      await createEntity({ data: entityToSave });

      toast.success('Draft saved successfully');

      return true;
    } catch (error) {
      console.error('Failed to save draft:', error);
      toast.error('Failed to save draft');
      return false;
    }
  }, [draftsEnabled, isNew, form, allFormData, createEntity]);

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

        setTimeout(() => {
          form.reset(form.getValues(), { keepValues: true, keepDefaultValues: true });
          setIsInsideForm(false);
        }, 100);

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
            Object.keys(restorationData.formData).forEach((key) => {
              form.setValue(key, restorationData.formData[key]);
            });

            setAllFormData(restorationData.formData);

            if (restorationData.currentStep !== undefined) {
              setCurrentStep(restorationData.currentStep);
            }

            if (restorationData.draftId) {
              handleLoadDraft(restorationData.draftId, true).catch((error) => {
                console.warn('Failed to archive draft after restoration:', error);
              });
            }

            sessionStorage.removeItem('draftToRestore');
            setRestorationAttempted(true);
            setDraftRestorationInProgress(false);
            toast.success('Draft restored successfully');
            return;
          }
        } catch (error) {
          console.error('Failed to restore draft from management page:', error);
          sessionStorage.removeItem('draftToRestore');
          setDraftRestorationInProgress(false);
        }
      }
    }
  }, [
    draftsEnabled,
    isNew,
    isLoadingDrafts,
    restorationAttempted,
    draftRestorationInProgress,
    handleLoadDraft,
    config.entity,
  ]);

  useEffect(() => {
    if (draftsEnabled && isNew) {
      const draftCheckHandler = {
        formId: config.entity,
        checkDrafts: (onProceed: () => void) => {
          if (hasUnsavedChanges() && config.behavior?.drafts?.confirmDialog) {
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
    hasUnsavedChanges,
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
      isSavingDraft: isCreating,
      isDeletingDraft,
      showDraftDialog,
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
      <div ref={formRef} className="relative">
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
                if (success) {
                  setTimeout(() => {
                    form.reset(form.getValues(), { keepValues: true, keepDefaultValues: true });
                  }, 50);

                  if (pendingNavigation) {
                    pendingNavigation();
                    setPendingNavigation(null);
                  }
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
              formData={form.getValues()}
            />
          </>
        )}
      </div>
    </FormContext.Provider>
  );
}

export function useEntityForm(): FormContextValue {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error('useEntityForm must be used within a CallFormProvider');
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
