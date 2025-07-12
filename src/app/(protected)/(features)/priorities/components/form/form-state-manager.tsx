"use client";

import React, { useEffect, useRef } from "react";
import { useEntityForm } from "@/app/(protected)/(features)/priorities/components/form/priority-form-provider";

interface FormStateManagerProps {
  entity?: any;
}

export function FormStateManager({ entity }: FormStateManagerProps) {
  const { config, state, actions, form } = useEntityForm();
  const isInitialized = useRef(false);

  // Handle entity data loading for edit mode
  useEffect(() => {
    if (entity && !state.isLoading && !isInitialized.current) {
      isInitialized.current = true;
      
      // Don't restore form state when editing existing entity
    }
  }, [entity, state.isLoading]);

  // Auto-save form state on changes
  useEffect(() => {
    if (!config.behavior.autoSave.enabled || !config.behavior.persistence.enabled) return;
    if (entity || state.isLoading) return; // Don't auto-save when editing or loading
    
    const subscription = form.watch(() => {
      // Debounce the save operation
      const timeoutId = setTimeout(() => {
        actions.saveFormState();
      }, config.behavior.autoSave.debounceMs);
      
      return () => clearTimeout(timeoutId);
    });
    
    return () => subscription.unsubscribe();
  }, [form, actions, config, entity, state.isLoading]);

  // Auto-save drafts when enabled
  useEffect(() => {
    const draftsConfig = config.behavior?.drafts;
    if (!draftsConfig?.enabled || !draftsConfig.autoSave) return;
    if (entity || state.isLoading) return; // Don't auto-save when editing or loading
    
    const subscription = form.watch(() => {
      // Debounce the draft save operation
      const timeoutId = setTimeout(() => {
        if (state.isDirty) {
          actions.saveDraft();
        }
      }, config.behavior.autoSave.debounceMs);
      
      return () => clearTimeout(timeoutId);
    });
    
    return () => subscription.unsubscribe();
  }, [form, actions, config, entity, state.isLoading, state.isDirty]);

  // Handle page beforeunload event
  useEffect(() => {
    if (!config.behavior.persistence.enabled) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (state.isDirty && !entity) {
        // Check if drafts are enabled and should save on unload
        const draftsConfig = config.behavior?.drafts;
        if (draftsConfig?.enabled && (draftsConfig.saveBehavior === 'onUnload' || draftsConfig.saveBehavior === 'both')) {
          // For drafts, we can't show a dialog on beforeunload, so save automatically
          actions.saveDraft();
        } else {
          // Save form state before page unload (legacy behavior)
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

  // Handle save form state events from other parts of the app
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

  // Handle visibility change (when user switches tabs)
  useEffect(() => {
    if (!config.behavior.persistence.enabled) return;

    const handleVisibilityChange = () => {
      if (document.hidden && state.isDirty && !entity) {
        // Save form state when user switches away from tab
        actions.saveFormState();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [state.isDirty, entity, actions, config]);

  // Clean up old form states periodically
  useEffect(() => {
    if (!config.behavior.persistence.enabled) return;

    const cleanupInterval = setInterval(() => {
      const keysToRemove: string[] = [];
      const cutoffTime = Date.now() - (config.behavior.persistence.sessionTimeoutMinutes * 60 * 1000);
      
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
            // Remove invalid entries
            keysToRemove.push(key);
          }
        }
      }
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });
    }, 5 * 60 * 1000); // Clean up every 5 minutes

    return () => clearInterval(cleanupInterval);
  }, [config]);

  // Handle cross-entity creation flow
  useEffect(() => {
    if (entity || !config.behavior.crossEntity.enabled) return;

    const newEntityId = localStorage.getItem(config.behavior.crossEntity.newEntityIdKey);
    const relationshipInfo = localStorage.getItem(config.behavior.crossEntity.relationshipInfoKey);
    
    if (newEntityId && relationshipInfo) {
      try {
        const info = JSON.parse(relationshipInfo);
        
        // Wait a bit for form to be fully initialized
        const timeoutId = setTimeout(() => {
          const relationshipName = Object.keys(info)[0];
          if (relationshipName) {
            actions.handleEntityCreated(parseInt(newEntityId), relationshipName);
          }
          
          // Clean up
          localStorage.removeItem(config.behavior.crossEntity.newEntityIdKey);
          localStorage.removeItem(config.behavior.crossEntity.relationshipInfoKey);
          localStorage.removeItem(config.behavior.crossEntity.returnUrlKey);
          localStorage.removeItem('entityCreationContext');
        }, 100);
        
        return () => clearTimeout(timeoutId);
      } catch (error) {
        // Clean up on error
        localStorage.removeItem(config.behavior.crossEntity.newEntityIdKey);
        localStorage.removeItem(config.behavior.crossEntity.relationshipInfoKey);
      }
    }
  }, [entity, config, actions]);

  // Setup form field validation triggers
  useEffect(() => {
    // Set up field-level validation for better UX
    const subscription = form.watch((value, { name, type }) => {
      if (type === 'change' && name) {
        // Trigger validation for the changed field after a short delay
        const timeoutId = setTimeout(() => {
          form.trigger(name);
        }, 300);
        
        return () => clearTimeout(timeoutId);
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form]);

  // This component doesn't render anything visible
  return null;
}
