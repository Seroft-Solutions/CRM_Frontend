'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface NavigationState {
  referrerForm?: string;
  referrerSessionId?: string;
  referrerField?: string;
  referrerUrl?: string;
  createdEntityId?: number;
  createdEntityType?: string;
  isRedirecting?: boolean;
}

interface DraftCheckHandler {
  checkDrafts: (onProceed: () => void) => void;
  formId: string;
}

interface NavigationContextType {
  navigationState: NavigationState;
  setNavigationState: (state: NavigationState) => void;
  navigateToCreateEntity: (params: {
    entityPath: string;
    referrerForm: string;
    referrerSessionId: string;
    referrerField: string;
    referrerUrl: string;
  }) => void;
  navigateBackToReferrer: (createdEntityId?: number, createdEntityType?: string) => void;
  clearNavigation: () => void;
  hasReferrer: () => boolean;
  // Draft-related methods
  registerDraftCheck: (handler: DraftCheckHandler) => void;
  unregisterDraftCheck: (formId: string) => void;
  navigateWithDraftCheck: (params: {
    entityPath: string;
    referrerForm: string;
    referrerSessionId: string;
    referrerField: string;
    referrerUrl: string;
  }) => void;
}

const NavigationContext = createContext<NavigationContextType | null>(null);

export function CrossFormNavigationProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [navigationState, setNavigationState] = useState<NavigationState>({});
  const [draftHandlers, setDraftHandlers] = useState<Map<string, DraftCheckHandler>>(new Map());

  const registerDraftCheck = useCallback((handler: DraftCheckHandler) => {
    setDraftHandlers(prev => {
      const newMap = new Map(prev);
      newMap.set(handler.formId, handler);
      return newMap;
    });
  }, []);

  const unregisterDraftCheck = useCallback((formId: string) => {
    setDraftHandlers(prev => {
      const newMap = new Map(prev);
      newMap.delete(formId);
      return newMap;
    });
  }, []);

  const navigateToCreateEntity = useCallback(
    (params: {
      entityPath: string;
      referrerForm: string;
      referrerSessionId: string;
      referrerField: string;
      referrerUrl: string;
    }) => {
      // Save current form state before navigating
      const saveEvent = new CustomEvent('saveFormState');
      window.dispatchEvent(saveEvent);

      // Update navigation state
      setNavigationState({
        referrerForm: params.referrerForm,
        referrerSessionId: params.referrerSessionId,
        referrerField: params.referrerField,
        referrerUrl: params.referrerUrl,
      });

      // Store navigation state in localStorage for persistence across reloads
      localStorage.setItem(
        'crossFormNavigation',
        JSON.stringify({
          referrerForm: params.referrerForm,
          referrerSessionId: params.referrerSessionId,
          referrerField: params.referrerField,
          referrerUrl: params.referrerUrl,
          timestamp: Date.now(),
        })
      );

      // Navigate with query parameters
      const url = new URL(params.entityPath, window.location.origin);
      url.searchParams.set('ref', params.referrerForm);
      url.searchParams.set('sessionId', params.referrerSessionId);
      url.searchParams.set('field', params.referrerField);
      url.searchParams.set('returnUrl', params.referrerUrl);

      router.push(url.pathname + url.search);
    },
    [router]
  );

  const navigateWithDraftCheck = useCallback(
    (params: {
      entityPath: string;
      referrerForm: string;
      referrerSessionId: string;
      referrerField: string;
      referrerUrl: string;
    }) => {
      // Check if there's an active draft handler for the current form
      const handler = draftHandlers.get(params.referrerForm);
      
      if (handler) {
        // Let the form handle the draft check
        handler.checkDrafts(() => {
          // Proceed with navigation after draft check
          navigateToCreateEntity(params);
        });
      } else {
        // No draft handler, proceed with normal navigation
        navigateToCreateEntity(params);
      }
    },
    [draftHandlers, navigateToCreateEntity]
  );
  const navigateBackToReferrer = useCallback(
    (createdEntityId?: number, createdEntityType?: string) => {
      const storedNavigation = localStorage.getItem('crossFormNavigation');
      const navState = storedNavigation ? JSON.parse(storedNavigation) : navigationState;

      console.log('navigateBackToReferrer called with:', { createdEntityId, createdEntityType });
      console.log('Navigation state:', navState);

      if (navState.referrerUrl) {
        // Set redirecting state immediately
        setNavigationState((prev) => ({ ...prev, isRedirecting: true }));

        // Store created entity info for auto-population
        if (createdEntityId) {
          const entityInfo = {
            entityId: createdEntityId,
            entityType: createdEntityType,
            targetField: navState.referrerField,
            targetSessionId: navState.referrerSessionId,
            timestamp: Date.now(),
          };

          console.log('Storing created entity info:', entityInfo);
          localStorage.setItem('createdEntityInfo', JSON.stringify(entityInfo));
        }

        // Clear navigation state
        localStorage.removeItem('crossFormNavigation');

        // Navigate back to referrer immediately
        router.push(navState.referrerUrl);

        // Clear redirect state after navigation
        setTimeout(() => {
          setNavigationState({});
        }, 100);
      }
    },
    [router, navigationState]
  );

  const clearNavigation = useCallback(() => {
    localStorage.removeItem('crossFormNavigation');
    localStorage.removeItem('createdEntityInfo');
    setNavigationState({});
  }, []);

  const hasReferrer = useCallback(() => {
    const storedNavigation = localStorage.getItem('crossFormNavigation');
    return !!(storedNavigation || navigationState.referrerUrl);
  }, [navigationState]);

  // Initialize navigation state from localStorage on mount
  React.useEffect(() => {
    const storedNavigation = localStorage.getItem('crossFormNavigation');
    if (storedNavigation) {
      try {
        const parsed = JSON.parse(storedNavigation);
        // Check if the stored navigation is not too old (24 hours)
        if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
          setNavigationState(parsed);
        } else {
          localStorage.removeItem('crossFormNavigation');
        }
      } catch (error) {
        console.error('Error parsing stored navigation:', error);
        localStorage.removeItem('crossFormNavigation');
      }
    }
  }, []);

  return (
    <NavigationContext.Provider
      value={{
        navigationState,
        setNavigationState,
        navigateToCreateEntity,
        navigateBackToReferrer,
        clearNavigation,
        hasReferrer,
        // Draft-related methods
        registerDraftCheck,
        unregisterDraftCheck,
        navigateWithDraftCheck,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

export function useCrossFormNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useCrossFormNavigation must be used within CrossFormNavigationProvider');
  }
  return context;
}

export function useNavigationFromUrl() {
  const [urlParams, setUrlParams] = React.useState<{
    ref?: string;
    sessionId?: string;
    field?: string;
    returnUrl?: string;
  }>({});

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      setUrlParams({
        ref: searchParams.get('ref') || undefined,
        sessionId: searchParams.get('sessionId') || undefined,
        field: searchParams.get('field') || undefined,
        returnUrl: searchParams.get('returnUrl') || undefined,
      });
    }
  }, []);

  return urlParams;
}
