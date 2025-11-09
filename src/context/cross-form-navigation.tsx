'use client';

import React, { createContext, ReactNode, useCallback, useContext, useState } from 'react';
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
    setDraftHandlers((prev) => {
      const newMap = new Map(prev);
      newMap.set(handler.formId, handler);
      return newMap;
    });
  }, []);

  const unregisterDraftCheck = useCallback((formId: string) => {
    setDraftHandlers((prev) => {
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
      const saveEvent = new CustomEvent('saveFormState');
      window.dispatchEvent(saveEvent);

      setNavigationState({
        referrerForm: params.referrerForm,
        referrerSessionId: params.referrerSessionId,
        referrerField: params.referrerField,
        referrerUrl: params.referrerUrl,
      });

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
      const handler = draftHandlers.get(params.referrerForm);

      if (handler) {
        handler.checkDrafts(() => {
          navigateToCreateEntity(params);
        });
      } else {
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
        setNavigationState((prev) => ({ ...prev, isRedirecting: true }));

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

        localStorage.removeItem('crossFormNavigation');

        router.push(navState.referrerUrl);

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

  React.useEffect(() => {
    const storedNavigation = localStorage.getItem('crossFormNavigation');
    if (storedNavigation) {
      try {
        const parsed = JSON.parse(storedNavigation);

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
