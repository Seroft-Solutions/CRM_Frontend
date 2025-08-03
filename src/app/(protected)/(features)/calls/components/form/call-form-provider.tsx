// ===============================================================
// 🛑 MANUALLY MODIFIED FILE - SAFE TO EDIT 🛑
// - Enhanced form provider with business partner support
// - Dynamically filters out channel and assignment steps for business partners
// - Auto-populates channel, assignment, and createdBy data for business partners
// - Fetches user profile data to get correct channel type information
// - Review step correctly shows only visible steps (including remarks)
// - Fixed form submission validation and data population
// - Added auth hooks for user group detection
// ===============================================================
"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useUserAuthorities } from '@/core/auth';
import { useAccount } from '@/core/auth';
import { useGetUserProfile } from '@/core/api/generated/spring/endpoints/user-profile-resource/user-profile-resource.gen';
import type { 
  FormConfig, 
  FormState, 
  FormActions, 
  FormContextValue 
} from "./form-types";
import { callFormConfig } from "./call-form-config";
import { callFormSchema } from "./call-form-schema";
import { callToast, handleCallError } from "../call-toast";
import { useCrossFormNavigation, useNavigationFromUrl } from "@/context/cross-form-navigation";
import { useEntityDrafts } from "@/core/hooks/use-entity-drafts";
import { SaveDraftDialog, DraftRestorationDialog } from "@/components/form-drafts";

const FormContext = createContext<FormContextValue | null>(null);

interface CallFormProviderProps {
  children: React.ReactNode;
  id?: number;
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}

export function CallFormProvider({ 
  children, 
  id, 
  onSuccess, 
  onError 
}: CallFormProviderProps) {
  const router = useRouter();
  const isNew = !id;
  const baseConfig = callFormConfig;
  const { hasGroup } = useUserAuthorities();
  const { data: accountData } = useAccount();
  const isBusinessPartner = hasGroup('Business Partners');
  
  // Fetch user profile data to get channel type information for business partners
  const { data: userProfile } = useGetUserProfile(
    accountData?.id,
    {
      query: {
        enabled: isBusinessPartner && !!accountData?.id,
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
      }
    }
  );
  
  // Create filtered config for business partners (exclude channel and assignment steps)
  const config = React.useMemo(() => {
    if (isBusinessPartner) {
      return {
        ...baseConfig,
        steps: baseConfig.steps.filter(step => step.id !== 'channel' && step.id !== 'assignment')
      };
    }
    return baseConfig;
  }, [isBusinessPartner, baseConfig]);
  const formRef = useRef<HTMLDivElement>(null);
  
  // Cross-form navigation hooks
  const { navigationState, hasReferrer, registerDraftCheck, unregisterDraftCheck } = useCrossFormNavigation();
  const urlParams = useNavigationFromUrl();
  
  // Form state management
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmSubmission, setConfirmSubmission] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isAutoPopulating, setIsAutoPopulating] = useState(false);
  const [restorationAttempted, setRestorationAttempted] = useState(false);
  const [draftRestorationInProgress, setDraftRestorationInProgress] = useState(false);
  
  // Comprehensive form data state to track all steps
  const [allFormData, setAllFormData] = useState<Record<string, any>>({});
  
  // Draft-related state
  const [showDraftDialog, setShowDraftDialog] = useState(false);
  const [showRestorationDialog, setShowRestorationDialog] = useState(false);
  const [currentDraftId, setCurrentDraftId] = useState<number | undefined>();
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);
  
  // Navigation protection state
  const [isInsideForm, setIsInsideForm] = useState(false);

  // Initialize drafts hook
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
    resolver: zodResolver(callFormSchema),
    mode: config.validation.mode,
    revalidateMode: config.validation.revalidateMode,
    defaultValues: getDefaultValues()
  });

  // Auto-populate channel and assignment data when account/profile data loads for business partners
  useEffect(() => {
    if (isBusinessPartner && accountData && isNew) {
      // Only set if not already set to avoid overriding user changes
      const currentChannelParties = form.getValues('channelParties');
      const currentChannelType = form.getValues('channelType');

      if (!currentChannelParties && typeof accountData.id === 'number') {
        form.setValue('channelParties', accountData.id);
      }
      
      // Use user profile data for channel type
      if (!currentChannelType && userProfile?.channelType?.id && typeof userProfile.channelType.id === 'number') {
        form.setValue('channelType', userProfile.channelType.id);
      }

    }
  }, [isBusinessPartner, accountData, userProfile, isNew, form]);

  function getDefaultValues() {
    const defaults: Record<string, any> = {};
    
    // Auto-populate channel and assignment data for business partners
    if (isBusinessPartner && accountData) {
      // Channel data - ensure these are numbers
      if (typeof accountData.id === 'number') {
        defaults.channelParties = accountData.id;
      }
      // Get channel type from user profile, not account data
      if (userProfile?.channelType?.id && typeof userProfile.channelType.id === 'number') {
        defaults.channelType = userProfile.channelType.id;
      }

    }
    
    config.fields.forEach(field => {
      switch (field.type) {
        case 'boolean':
          defaults[field.name] = false;
          break;
        case 'number':
          defaults[field.name] = "";
          break;
        case 'date':
          defaults[field.name] = undefined;
          break;
        case 'enum':
          defaults[field.name] = field.required ? field.options?.[0]?.value : undefined;
          break;
        default:
          defaults[field.name] = "";
      }
    });

    config.relationships.forEach(rel => {
      defaults[rel.name] = rel.multiple ? [] : undefined;
    });

    return defaults;
  }

  // Check if form has unsaved changes
  const hasUnsavedChanges = useCallback(() => {
    return form.formState.isDirty && isNew && draftsEnabled;
  }, [form.formState.isDirty, isNew, draftsEnabled]);

  // Show draft dialog when trying to navigate with unsaved changes
  const showDraftDialogForNavigation = useCallback((navigationCallback: () => void) => {
    if (hasUnsavedChanges()) {
      setPendingNavigation(() => navigationCallback);
      setShowDraftDialog(true);
      return true; // Navigation blocked
    }
    return false; // Navigation allowed
  }, [hasUnsavedChanges]);

  // Form state persistence functions - only for cross-form navigation
  const saveFormState = useCallback((forCrossNavigation = false) => {
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
      crossFormNavigation: true // Mark this as cross-form navigation state
    };
    
    const storageKey = `${config.behavior.persistence.storagePrefix}${formSessionId}`;      localStorage.setItem(storageKey, JSON.stringify(formState));
    }, [form, currentStep, isNew, formSessionId, config]);

  const restoreFormState = useCallback((suppressToast = false): boolean => {
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
          
          Object.keys(savedState.data).forEach(key => {
            const value = savedState.data[key];
            if (value !== undefined && value !== null) {
              form.setValue(key as any, value);
            }
          });
          
          setCurrentStep(savedState.currentStep || 0);
          
          setTimeout(() => setIsRestoring(false), 100);
          
          // Only show form restored toast if not suppressed (i.e., not during cross-entity auto-population)
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
  }, [form, isNew, formSessionId, config]);

  // Clear old form states
  const clearOldFormStates = useCallback(() => {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(config.behavior.persistence.storagePrefix) && !key.endsWith(formSessionId)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }, [formSessionId, config]);

  // Handle newly created relationship entities
  const handleEntityCreated = useCallback((entityId: number, relationshipName: string, skipValidation = false) => {
    const relationshipConfig = config.relationships.find(rel => rel.name === relationshipName);
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
  }, [form, config, isAutoPopulating]);

  // Validation for current step
  const validateStep = useCallback(async (stepIndex?: number): Promise<boolean> => {
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
  }, [form, currentStep, config, isAutoPopulating]);

  // Navigation actions
  const nextStep = useCallback(async (): Promise<boolean> => {
    // Preserve current form values before moving to next step
    const currentValues = form.getValues();
    setAllFormData(prev => ({ ...prev, ...currentValues }));
    
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
    // Preserve current form values before moving to previous step
    const currentValues = form.getValues();
    setAllFormData(prev => ({ ...prev, ...currentValues }));
    
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      if (currentStep === config.steps.length - 1) {
        setConfirmSubmission(false);
      }
    }
  }, [currentStep, config, form]);

  const goToStep = useCallback(async (stepIndex: number): Promise<boolean> => {
    if (stepIndex < 0 || stepIndex >= config.steps.length) return false;
    
    // Preserve current form values before changing step
    const currentValues = form.getValues();
    setAllFormData(prev => ({ ...prev, ...currentValues }));
    
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
  }, [config, validateStep, form]);

  // Form submission
  const submitForm = useCallback(async () => {
    // Don't allow submission during auto-population
    if (isAutoPopulating) {
      return;
    }
    
    // Check if we're on the last step (review step)
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
        handleCallError(error);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [currentStep, config, form, onSuccess, onError, isAutoPopulating]);

  function transformFormDataForSubmission(data: Record<string, any>) {
    const entityToSave: Record<string, any> = {};

    // Handle regular fields
    config.fields.forEach(fieldConfig => {
      const value = data[fieldConfig.name];
      
      if (fieldConfig.type === 'number') {
        if (value !== '' && value != null && !isNaN(Number(value))) {
          entityToSave[fieldConfig.name] = Number(value);
        } else if (fieldConfig.required) {
          entityToSave[fieldConfig.name] = null;
        }
      } else if (fieldConfig.type === 'enum') {
        if (value === "__none__" || value === '' || value == null) {
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
    config.relationships.forEach(relConfig => {
      const value = data[relConfig.name];
      
      if (relConfig.multiple) {
        // For many-to-many or one-to-many relationships  
        if (value && Array.isArray(value) && value.length > 0) {
          entityToSave[relConfig.name] = value.map(id => ({ [relConfig.primaryKey]: id }));
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

    // Handle special fields that are not in config (like tempRemarks)
    if (data.tempRemarks !== undefined) {
      entityToSave.tempRemarks = data.tempRemarks;
    }

    // Add createdBy field for business partners when creating new records
    if (isNew && isBusinessPartner && accountData?.login) {
      entityToSave.createdBy = accountData.login;
    }

    // Auto-populate channel and assignment data for business partners (since these steps are skipped)
    if (isBusinessPartner && accountData) {
      // Set the current user as the channel party
      entityToSave.channelParties = {
        id: accountData.id
      };

      // Set the channel type from user's profile if available
      if (userProfile?.channelType?.id) {
        entityToSave.channelType = {
          id: userProfile.channelType.id
        };
      }

    }

    // Remove undefined values to avoid sending them to the backend
    Object.keys(entityToSave).forEach(key => {
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
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    form.reset();
    setCurrentStep(0);
    setConfirmSubmission(false);
  }, [formSessionId, config, form]);

  const resetForm = useCallback(() => {
    form.reset(getDefaultValues());
    setCurrentStep(0);
    setConfirmSubmission(false);
  }, [form]);

  // Browser navigation protection (back/forward buttons, URL changes)
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
        // Prevent the navigation
        window.history.pushState(null, '', window.location.href);
        
        // Show draft dialog
        setPendingNavigation(() => () => {
          // Allow the navigation to proceed
          window.history.back();
        });
        setShowDraftDialog(true);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    // Push current state to handle back button
    if (hasUnsavedChanges()) {
      window.history.pushState(null, '', window.location.href);
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [hasUnsavedChanges, isNew, draftsEnabled]);

  // Outside click detection
  useEffect(() => {
    if (!isNew || !draftsEnabled) return;

    const handleMouseEnter = () => setIsInsideForm(true);
    const handleMouseLeave = () => setIsInsideForm(false);
    
    const handleClickOutside = (event: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(event.target as Node)) {
        // User clicked outside the form
        if (hasUnsavedChanges() && isInsideForm) {
          // Only show dialog if user was previously inside the form
          setPendingNavigation(() => () => {
            // Focus is lost, but no actual navigation needed
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
  }, [hasUnsavedChanges, isInsideForm, isNew, draftsEnabled]);

  // Router event handling for programmatic navigation
  useEffect(() => {
    if (!isNew || !draftsEnabled) return;

    const handleRouteChangeStart = (url: string) => {
      // Only block if we have unsaved changes and it's a different route
      if (hasUnsavedChanges() && url !== router.asPath) {
        // This might not work in all cases, but we'll handle it with Link interception
        console.log('Route change detected:', url);
      }
    };

    // Note: Next.js 13+ App Router doesn't have routeChangeStart events
    // So we rely primarily on Link click interception
    
    return () => {
      // Cleanup if needed
    };
  }, [hasUnsavedChanges, isNew, draftsEnabled, router]);

  // Intercept all Link clicks and navigation attempts
  useEffect(() => {
    if (!isNew || !draftsEnabled) return;

    let isNavigating = false;

    // Global click handler to intercept all navigation clicks
    const handleNavigationClick = (event: Event) => {
      if (isNavigating) return;

      const target = event.target as Element;
      
      // Check for Link components (anchor tags)
      const link = target.closest('a[href]') as HTMLAnchorElement;
      if (link && hasUnsavedChanges()) {
        const href = link.getAttribute('href');
        if (href && !href.startsWith('http') && !href.startsWith('mailto:') && !href.startsWith('tel:') && !href.startsWith('#')) {
          event.preventDefault();
          event.stopImmediatePropagation();
          
          // Show draft dialog with the navigation callback
          setPendingNavigation(() => () => {
            isNavigating = true;
            router.push(href);
            setTimeout(() => { isNavigating = false; }, 100);
          });
          setShowDraftDialog(true);
          return;
        }
      }

      // Special handling for ContextAwareBackButton (contains a Link inside a Button)
      const button = target.closest('button') as HTMLButtonElement;
      if (button && hasUnsavedChanges()) {
        // Check if this button contains a Link (like ContextAwareBackButton)
        const linkInsideButton = button.querySelector('a[href]') as HTMLAnchorElement;
        if (linkInsideButton) {
          const href = linkInsideButton.getAttribute('href');
          if (href && !href.startsWith('http') && !href.startsWith('mailto:') && !href.startsWith('tel:') && !href.startsWith('#')) {
            event.preventDefault();
            event.stopImmediatePropagation();
            
            // Show draft dialog with the navigation callback
            setPendingNavigation(() => () => {
              isNavigating = true;
              router.push(href);
              setTimeout(() => { isNavigating = false; }, 100);
            });
            setShowDraftDialog(true);
            return;
          }
        }
        
        // Check if this is a navigation button by text content
        const buttonText = button.textContent?.toLowerCase() || '';
        const isNavigationButton = 
          buttonText.includes('back') || 
          buttonText.includes('cancel') ||
          buttonText.includes('close');
          
        if (isNavigationButton && formRef.current && !formRef.current.contains(button)) {
          // For generic navigation buttons, we can't easily determine the target
          // So we'll just show a warning for now
          console.log('Navigation button clicked with unsaved changes:', buttonText);
        }
      }
    };

    // Add capture phase listener to catch events before other handlers
    document.addEventListener('click', handleNavigationClick, true);

    return () => {
      document.removeEventListener('click', handleNavigationClick, true);
    };
  }, [hasUnsavedChanges, isNew, draftsEnabled, router]);

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
            setTimeout(() => {
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
              
            }, restored ? 600 : 200);
            
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
      const relationshipInfo = localStorage.getItem(config.behavior.crossEntity.relationshipInfoKey);
      
      if (newEntityId && relationshipInfo) {
        try {
          const info = JSON.parse(relationshipInfo);
          
          setIsAutoPopulating(true);
          const restored = restoreFormState(true); // Suppress form restoration toast for legacy path too
          
          setTimeout(() => {
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
          }, restored ? 600 : 200);
          
        } catch (error) {
          console.error('Error processing newly created entity:', error);
          // Error occurred, fall through to normal restoration
          restoreFormState();
        }
        return; // Exit early since we handled the legacy case
      }
      
      // Normal form restoration (only if no auto-population occurred)
      // But suppress toast if draft restoration is in progress
      restoreFormState(draftRestorationInProgress);
    }

    const handleSaveFormState = () => {
      if (isNew) {
        saveFormState(true); // Save with cross-form navigation flag
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
  }, [restorationAttempted, isNew, restoreFormState, saveFormState, handleEntityCreated, clearOldFormStates, config, hasUnsavedChanges]);

  // Helper function to get navigation props for relationship components
  const getNavigationProps = useCallback((fieldName: string) => ({
    referrerForm: config.entity,
    referrerSessionId: formSessionId,
    referrerField: fieldName,
  }), [config.entity, formSessionId]);

  // Watch form changes and maintain comprehensive form data
  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      if (type === 'change' && name) {
        setAllFormData(prev => ({
          ...prev,
          [name]: value[name]
        }));
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form]);

  // Initialize comprehensive form data with current form values
  useEffect(() => {
    const currentValues = form.getValues();
    setAllFormData(prev => ({ ...prev, ...currentValues }));
  }, [form]);

  // Draft action handlers
  const handleSaveDraft = useCallback(async (): Promise<boolean> => {
    if (!draftsEnabled || !isNew) return false;
    
    try {
      // Use comprehensive form data instead of just current form values
      const currentFormValues = form.getValues();
      const completeFormData = { ...allFormData, ...currentFormValues };
      
      const success = await saveDraft(completeFormData, currentStep, formSessionId, currentDraftId);
      
      if (success) {
        toast.success("Draft saved successfully");
      } else {
        toast.error("Failed to save draft");
      }
      
      return success;
    } catch (error) {
      console.error("Failed to save draft:", error);
      toast.error("Failed to save draft");
      return false;
    }
  }, [draftsEnabled, isNew, form, allFormData, currentStep, formSessionId, currentDraftId, saveDraft]);

  const handleLoadDraft = useCallback(async (draftId: number, suppressToast = false): Promise<boolean> => {
    if (!draftsEnabled) return false;
    
    try {
      // Attempt to restore draft data
      const draftData = await restoreDraft(draftId);
      if (!draftData) {
        if (!suppressToast) {
          toast.error("Draft not found or has been deleted");
        }
        return false;
      }

      // Restore form data to both React Hook Form and comprehensive state
      Object.keys(draftData.formData).forEach(key => {
        form.setValue(key, draftData.formData[key]);
      });
      
      // Update comprehensive form data state
      setAllFormData(draftData.formData);
      
      // Restore current step
      if (draftData.currentStep !== undefined) {
        setCurrentStep(draftData.currentStep);
      }
      
      setCurrentDraftId(undefined); // Clear since draft restoration is complete
      setShowRestorationDialog(false);
      
      // Show single success message only if not suppressed
      if (!suppressToast) {
        toast.success("Draft restored successfully");
      }
      return true;
      
    } catch (error) {
      console.error("Failed to restore draft:", error);
      if (!suppressToast) {
        toast.error("Failed to restore draft");
      }
      return false;
    }
  }, [draftsEnabled, restoreDraft, form]);

  const handleDeleteDraft = useCallback(async (draftId: number): Promise<boolean> => {
    if (!draftsEnabled) return false;
    
    try {
      const success = await deleteDraft(draftId);
      if (success) {
        toast.success("Draft deleted successfully");
      } else {
        toast.error("Failed to delete draft");
      }
      return success;
    } catch (error) {
      console.error("Failed to delete draft:", error);
      toast.error("Failed to delete draft");
      return false;
    }
  }, [draftsEnabled, deleteDraft]);

  const handleCheckForDrafts = useCallback(() => {
    if (!draftsEnabled || !isNew || !config.behavior?.drafts?.showRestorationDialog) return;
    
    if (drafts.length > 0 && !restorationAttempted) {
      setShowRestorationDialog(true);
      setRestorationAttempted(true);
    }
  }, [draftsEnabled, isNew, config.behavior?.drafts?.showRestorationDialog, drafts.length, restorationAttempted]);

  // Check for drafts on mount and handle restoration from drafts page
  useEffect(() => {
    if (draftsEnabled && isNew && !isLoadingDrafts && !restorationAttempted && !draftRestorationInProgress) {
      // First check if there's a specific draft to restore from the drafts management page
      const draftToRestore = sessionStorage.getItem('draftToRestore');
      if (draftToRestore) {
        setDraftRestorationInProgress(true);
        try {
          const restorationData = JSON.parse(draftToRestore);
          if (restorationData.entityType === config.entity) {
            // Restore the specific draft (suppress toast since this is from management page)
            handleLoadDraft(restorationData.draftId, true).then((success) => {
              if (success) {
                sessionStorage.removeItem('draftToRestore');
                setRestorationAttempted(true);
                // Show single comprehensive message for management page restoration
                toast.success("Draft restored successfully");
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
      
      // Otherwise, show restoration dialog if drafts exist
      handleCheckForDrafts();
    }
  }, [draftsEnabled, isNew, isLoadingDrafts, restorationAttempted, draftRestorationInProgress, handleCheckForDrafts, handleLoadDraft, config.entity]);

  // Register draft check with cross-form navigation
  useEffect(() => {
    if (draftsEnabled && isNew) {
      const draftCheckHandler = {
        formId: config.entity,
        checkDrafts: (onProceed: () => void) => {
          if (hasUnsavedChanges() && config.behavior?.drafts?.confirmDialog) {
            // Show draft dialog
            setPendingNavigation(() => onProceed);
            setShowDraftDialog(true);
          } else {
            // No changes or dialog disabled, proceed directly
            onProceed();
          }
        }
      };
      
      registerDraftCheck(draftCheckHandler);
      
      return () => {
        unregisterDraftCheck(config.entity);
      };
    }
  }, [draftsEnabled, isNew, config.entity, config.behavior?.drafts?.confirmDialog, hasUnsavedChanges, registerDraftCheck, unregisterDraftCheck]);

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
      // Draft-related state
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
      // Draft-related actions
      saveDraft: handleSaveDraft,
      loadDraft: handleLoadDraft,
      deleteDraft: handleDeleteDraft,
      checkForDrafts: handleCheckForDrafts,
    },
    form,
    navigation: {
      hasReferrer: hasReferrer(),
      urlParams,
      navigationState
    }
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
      </div>
    </FormContext.Provider>
  );
}

// Custom hook to use form context
export function useEntityForm(): FormContextValue {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error('useEntityForm must be used within a CallFormProvider');
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
