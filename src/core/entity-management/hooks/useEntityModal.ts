import { useCallback, useRef } from 'react';
import { FormMode, BaseEntity } from '@/features/core/tanstack-query-api';
import { EntityStore } from '../store';
import { logger } from '../utils/logger';

/**
 * Props for the useEntityModal hook
 */
interface UseEntityModalProps<TData extends BaseEntity = any, TFilter = any> {
  entityStore: EntityStore<TData, TFilter>;
  onSelectItem: (item: TData | null) => void;
  onSetFormMode: (mode: FormMode) => void;
}

/**
 * Hook to manage modal state and operations for entity management
 */
export function useEntityModal<TData extends BaseEntity = any, TFilter = any>({
  entityStore,
  onSelectItem,
  onSetFormMode,
}: UseEntityModalProps<TData, TFilter>) {
  // Create a logger context
  const hookLogger = logger.createContext('useEntityModal');
  
  // Ref to track updating state to prevent infinite loops
  const isUpdatingRef = useRef(false);
  
  /**
   * Opens the modal in the specified mode with the given item
   */
  const openModal = useCallback((mode: FormMode, item?: TData | null) => {
    hookLogger.debug(`Opening modal in ${mode} mode`, undefined, { item });
    
    if (isUpdatingRef.current) return; // Prevent re-entrant calls
    
    isUpdatingRef.current = true;
    try {
      // For create mode, ensure item is null to prevent showing data from previous items
      const itemToUse = mode === 'create' ? null : (item || null);
      
      // Use requestAnimationFrame + setTimeout to ensure proper batching
      requestAnimationFrame(() => {
        setTimeout(() => {
          try {
            // First update API state
            onSelectItem(itemToUse);
            onSetFormMode(mode);
            
            // Then update store state in a separate tick
            requestAnimationFrame(() => {
              setTimeout(() => {
                try {
                  // Get a fresh snapshot of the store state
                  const storeState = entityStore.getState();
                  
                  // Call the action function if it exists
                  if (typeof storeState.openModal === 'function') {
                    storeState.openModal(mode, itemToUse);
                  }
                } finally {
                  // Only clear the flag after all operations complete
                  isUpdatingRef.current = false;
                }
              }, 0);
            });
          } catch (error) {
            hookLogger.error('Error in openModal:', error instanceof Error ? error.message : String(error));
            isUpdatingRef.current = false;
          }
        }, 0);
      });
    } catch (error) {
      hookLogger.error('Error in openModal:', error instanceof Error ? error.message : String(error));
      isUpdatingRef.current = false;
    }
  }, [entityStore, onSelectItem, onSetFormMode, hookLogger]);
  
  /**
   * Closes the modal and resets state
   */
  const closeModal = useCallback(() => {
    hookLogger.debug('Closing modal');
    
    if (isUpdatingRef.current) return; // Prevent re-entrant calls
    
    isUpdatingRef.current = true;
    try {
      // Use requestAnimationFrame + setTimeout for batching
      requestAnimationFrame(() => {
        setTimeout(() => {
          try {
            // First update API state
            onSelectItem(null);
            onSetFormMode('view');
            
            // Then update store state in a separate tick
            requestAnimationFrame(() => {
              setTimeout(() => {
                try {
                  // Get a fresh snapshot of the store state
                  const storeState = entityStore.getState();
                  
                  // Perform store updates
                  if (typeof storeState.closeModal === 'function') {
                    storeState.closeModal();
                  }
                  
                  // Ensure selected item is completely cleared
                  if (typeof storeState.setSelectedItem === 'function') {
                    storeState.setSelectedItem(null);
                  }
                  
                  hookLogger.debug('Modal closed and state reset successfully');
                } finally {
                  // Only clear the flag after all operations complete
                  isUpdatingRef.current = false;
                }
              }, 0);
            });
          } catch (error) {
            hookLogger.error('Error in closeModal:', error instanceof Error ? error.message : String(error));
            isUpdatingRef.current = false;
          }
        }, 0);
      });
    } catch (error) {
      hookLogger.error('Error in closeModal:', error instanceof Error ? error.message : String(error));
      isUpdatingRef.current = false;
    }
  }, [entityStore, onSelectItem, onSetFormMode, hookLogger]);
  
  /**
   * Creates a wrapper for callbacks that need to close the modal
   */
  const wrapWithModalClose = useCallback((callback?: (data: any) => void) => {
    return async (data: any) => {
      // Call the callback if provided 
      if (callback) {
        await Promise.resolve(callback(data));
      }
      
      // Use setTimeout to break potential render cycles
      setTimeout(() => {
        // Close the modal
        closeModal();
      }, 0);
    };
  }, [closeModal]);
  
  return {
    openModal,
    closeModal,
    wrapWithModalClose,
  };
}
