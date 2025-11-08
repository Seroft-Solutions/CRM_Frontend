'use client';

import React, { useEffect, useRef } from 'react';
import { useEntityForm } from './product-category-form-provider';

interface FormStateManagerProps {
  entity?: any;
}

export function FormStateManager({ entity }: FormStateManagerProps) {
  const { config, state, actions, form } = useEntityForm();
  const isInitialized = useRef(false);

  useEffect(() => {
    if (entity && !state.isLoading && !isInitialized.current) {
      isInitialized.current = true;
    }
  }, [entity, state.isLoading]);

  useEffect(() => {
    if (!config.behavior.autoSave.enabled || !config.behavior.persistence.enabled) return;
    if (entity || state.isLoading) return;

    const subscription = form.watch(() => {
      const timeoutId = setTimeout(() => {
        actions.saveFormState();
      }, config.behavior.autoSave.debounceMs);

      return () => clearTimeout(timeoutId);
    });

    return () => subscription.unsubscribe();
  }, [form, actions, config, entity, state.isLoading]);

  useEffect(() => {
    const draftsConfig = config.behavior?.drafts;
    if (!draftsConfig?.enabled || !draftsConfig.autoSave) return;
    if (entity || state.isLoading) return;

    const subscription = form.watch(() => {
      const timeoutId = setTimeout(() => {
        if (state.isDirty) {
          actions.saveDraft();
        }
      }, config.behavior.autoSave.debounceMs);

      return () => clearTimeout(timeoutId);
    });

    return () => subscription.unsubscribe();
  }, [form, actions, config, entity, state.isLoading, state.isDirty]);

  useEffect(() => {
    if (!config.behavior.persistence.enabled) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (state.isDirty && !entity) {
        const draftsConfig = config.behavior?.drafts;
        if (
          draftsConfig?.enabled &&
          (draftsConfig.saveBehavior === 'onUnload' || draftsConfig.saveBehavior === 'both')
        ) {
          actions.saveDraft();
        } else {
          actions.saveFormState();
        }

        if (config.behavior.navigation.confirmOnCancel) {
          event.preventDefault();
          event.returnValue = 'Are you sure you want to leave? Your changes may not be saved.';
          return event.returnValue;
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [state.isDirty, entity, actions, config]);

  useEffect(() => {
    const handleSaveFormState = () => {
      if (!entity && config.behavior.persistence.enabled) {
        actions.saveFormState();
      }
    };

    window.addEventListener('saveFormState', handleSaveFormState);

    return () => {
      window.removeEventListener('saveFormState', handleSaveFormState);
    };
  }, [entity, actions, config]);

  useEffect(() => {
    if (!config.behavior.persistence.enabled) return;

    const handleVisibilityChange = () => {
      if (document.hidden && state.isDirty && !entity) {
        actions.saveFormState();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [state.isDirty, entity, actions, config]);

  useEffect(() => {
    if (!config.behavior.persistence.enabled) return;

    const cleanupInterval = setInterval(
      () => {
        const keysToRemove: string[] = [];
        const cutoffTime =
          Date.now() - config.behavior.persistence.sessionTimeoutMinutes * 60 * 1000;

        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.startsWith(config.behavior.persistence.storagePrefix)) {
            try {
              const value = localStorage.getItem(key);
              if (value) {
                const parsed = JSON.parse(value);
                if (parsed.timestamp && parsed.timestamp < cutoffTime) {
                  keysToRemove.push(key);
                }
              }
            } catch (error) {
              keysToRemove.push(key);
            }
          }
        }

        keysToRemove.forEach((key) => {
          localStorage.removeItem(key);
        });
      },
      5 * 60 * 1000
    );

    return () => clearInterval(cleanupInterval);
  }, [config]);

  useEffect(() => {
    if (entity || !config.behavior.crossEntity.enabled) return;

    const newEntityId = localStorage.getItem(config.behavior.crossEntity.newEntityIdKey);
    const relationshipInfo = localStorage.getItem(config.behavior.crossEntity.relationshipInfoKey);

    if (newEntityId && relationshipInfo) {
      try {
        const info = JSON.parse(relationshipInfo);

        const timeoutId = setTimeout(() => {
          const relationshipName = Object.keys(info)[0];
          if (relationshipName) {
            actions.handleEntityCreated(parseInt(newEntityId), relationshipName);
          }

          localStorage.removeItem(config.behavior.crossEntity.newEntityIdKey);
          localStorage.removeItem(config.behavior.crossEntity.relationshipInfoKey);
          localStorage.removeItem(config.behavior.crossEntity.returnUrlKey);
          localStorage.removeItem('entityCreationContext');
        }, 100);

        return () => clearTimeout(timeoutId);
      } catch (error) {
        localStorage.removeItem(config.behavior.crossEntity.newEntityIdKey);
        localStorage.removeItem(config.behavior.crossEntity.relationshipInfoKey);
      }
    }
  }, [entity, config, actions]);

  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      if (type === 'change' && name) {
        const timeoutId = setTimeout(() => {
          form.trigger(name);
        }, 300);

        return () => clearTimeout(timeoutId);
      }
    });

    return () => subscription.unsubscribe();
  }, [form]);

  return null;
}
