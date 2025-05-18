import { useEffect, useRef } from 'react';
import { BaseEntity } from '@/features/core/tanstack-query-api';
import { EntityStore } from '../store';
import { logger } from '../utils/logger';

/**
 * Props for the useEntitySync hook
 */
interface UseEntitySyncProps<TData extends BaseEntity = any, TFilter = any> {
  entityStore: EntityStore<TData, TFilter>;
  items: TData[] | undefined;
  pagination: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
  };
  isLoading: boolean;
  error: Error | null;
  isAuthLoading: boolean;
  isTokenValidated: boolean;
}

/**
 * Hook to synchronize API data with the entity store
 */
export function useEntitySync<TData extends BaseEntity = any, TFilter = any>({
  entityStore,
  items,
  pagination,
  isLoading,
  error,
  isAuthLoading,
  isTokenValidated,
}: UseEntitySyncProps<TData, TFilter>) {
  // Create a logger context
  const hookLogger = logger.createContext('useEntitySync');
  
  // Ref to track updating state to prevent infinite loops
  const isUpdatingRef = useRef(false);
  
  // Sync store with API data
  useEffect(() => {
    // Skip updates while auth is loading or until token is validated
    if (isAuthLoading || !isTokenValidated) {
      return;
    }
    
    // Only update if data is available and we're not already in an update
    if (items && !isUpdatingRef.current) {
      hookLogger.debug('Syncing API data with store');
      
      // Set the updating flag to prevent re-entry
      isUpdatingRef.current = true;
      
      try {
        // Get a snapshot of the store state once
        const storeState = entityStore.getState();
        
        // Batch all store updates together to minimize re-renders
        const updates: Record<string, any> = {};
        
        // Only update the store if the data has actually changed
        if (JSON.stringify(storeState.items) !== JSON.stringify(items)) {
          updates['items'] = items;
        }
        
        // Only update pagination values if they've changed
        if (storeState.totalItems !== pagination.totalItems) {
          updates['totalItems'] = pagination.totalItems;
        }
        
        if (storeState.totalPages !== pagination.totalPages) {
          updates['totalPages'] = pagination.totalPages;
        }
        
        if (storeState.currentPage !== pagination.currentPage) {
          updates['currentPage'] = pagination.currentPage;
        }
        
        if (storeState.isLoading !== isLoading) {
          updates['isLoading'] = isLoading;
        }
        
        // Apply all updates in a single batch if there are any changes
        if (Object.keys(updates).length > 0) {
          // Use setTimeout to break the potential synchronous loop
          setTimeout(() => {
            try {
              // Apply each update using the appropriate method
              if (updates['items'] && typeof storeState.setItems === 'function') {
                storeState.setItems(updates['items']);
              }
              
              if (updates['totalItems'] && typeof storeState.setTotalItems === 'function') {
                storeState.setTotalItems(updates['totalItems']);
              }
              
              if (updates['totalPages'] && typeof storeState.setTotalPages === 'function') {
                storeState.setTotalPages(updates['totalPages']);
              }
              
              if (updates['currentPage'] && typeof storeState.setCurrentPage === 'function') {
                storeState.setCurrentPage(updates['currentPage']);
              }
              
              if (updates['isLoading'] && typeof storeState.setLoading === 'function') {
                storeState.setLoading(updates['isLoading']);
              }
              
              // Handle errors
              if (error && typeof storeState.setError === 'function') {
                storeState.setError(error);
              }
            } finally {
              // Always reset the updating flag after applying updates
              isUpdatingRef.current = false;
            }
          }, 0);
        } else {
          // No updates needed, reset the flag
          isUpdatingRef.current = false;
        }
      } catch (error) {
        hookLogger.error('Error syncing store with API data:', error instanceof Error ? error.message : String(error));
        isUpdatingRef.current = false;
      }
    }
  }, [entityStore, items, pagination, isLoading, error, hookLogger, isAuthLoading, isTokenValidated]);
}
