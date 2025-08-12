/**
 * FIXED: Enhanced hooks for proper cache invalidation after mutations
 * 
 * This hook ensures that data is automatically refreshed after any mutation
 * operations (create, update, delete) without requiring manual page refresh.
 */

import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { toast } from 'sonner';

export interface CacheInvalidationConfig {
  queryKeys: string[];
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
  successMessage?: string;
  errorMessage?: string;
}

/**
 * Hook for handling data mutations with automatic cache invalidation
 */
export function useDataMutationWithRefresh() {
  const queryClient = useQueryClient();

  const invalidateQueries = useCallback(
    async (queryKeys: string[]) => {
      // Invalidate specific query keys
      await Promise.all(
        queryKeys.map(key => 
          queryClient.invalidateQueries({ 
            queryKey: [key],
            exact: false, // This will invalidate all queries that start with this key
          })
        )
      );
      
      // Also refetch any active queries to ensure immediate UI update
      await Promise.all(
        queryKeys.map(key => 
          queryClient.refetchQueries({ 
            queryKey: [key],
            exact: false,
          })
        )
      );
    },
    [queryClient]
  );

  const executeWithRefresh = useCallback(
    async <T>(
      operation: () => Promise<T>,
      config: CacheInvalidationConfig
    ): Promise<T> => {
      try {
        const result = await operation();
        
        // Invalidate and refetch related queries
        await invalidateQueries(config.queryKeys);
        
        // Show success message if configured
        if (config.showSuccessToast !== false && config.successMessage) {
          toast.success(config.successMessage);
        }
        
        return result;
      } catch (error: any) {
        // Show error message if configured
        if (config.showErrorToast !== false) {
          const errorMessage = config.errorMessage || error.message || 'Operation failed';
          toast.error(errorMessage);
        }
        
        throw error;
      }
    },
    [invalidateQueries]
  );

  return {
    executeWithRefresh,
    invalidateQueries,
  };
}

/**
 * Specific hooks for common entity operations
 */

// Calls management
export function useCallsDataMutation() {
  const { executeWithRefresh } = useDataMutationWithRefresh();
  
  const deleteCall = useCallback(
    async (callId: string, deleteOperation: () => Promise<void>) => {
      return executeWithRefresh(
        deleteOperation,
        {
          queryKeys: ['calls', 'call-resource', 'dashboard'],
          successMessage: 'Call deleted successfully',
          errorMessage: 'Failed to delete call',
        }
      );
    },
    [executeWithRefresh]
  );

  const createCall = useCallback(
    async (createOperation: () => Promise<any>) => {
      return executeWithRefresh(
        createOperation,
        {
          queryKeys: ['calls', 'call-resource', 'dashboard'],
          successMessage: 'Call created successfully',
          errorMessage: 'Failed to create call',
        }
      );
    },
    [executeWithRefresh]
  );

  const updateCall = useCallback(
    async (updateOperation: () => Promise<any>) => {
      return executeWithRefresh(
        updateOperation,
        {
          queryKeys: ['calls', 'call-resource', 'dashboard'],
          successMessage: 'Call updated successfully',
          errorMessage: 'Failed to update call',
        }
      );
    },
    [executeWithRefresh]
  );

  return { deleteCall, createCall, updateCall };
}

// Customers management
export function useCustomersDataMutation() {
  const { executeWithRefresh } = useDataMutationWithRefresh();
  
  const deleteCustomer = useCallback(
    async (deleteOperation: () => Promise<void>) => {
      return executeWithRefresh(
        deleteOperation,
        {
          queryKeys: ['customers', 'customer-resource', 'dashboard'],
          successMessage: 'Customer deleted successfully',
          errorMessage: 'Failed to delete customer',
        }
      );
    },
    [executeWithRefresh]
  );

  const createCustomer = useCallback(
    async (createOperation: () => Promise<any>) => {
      return executeWithRefresh(
        createOperation,
        {
          queryKeys: ['customers', 'customer-resource', 'dashboard'],
          successMessage: 'Customer created successfully',
          errorMessage: 'Failed to create customer',
        }
      );
    },
    [executeWithRefresh]
  );

  const updateCustomer = useCallback(
    async (updateOperation: () => Promise<any>) => {
      return executeWithRefresh(
        updateOperation,
        {
          queryKeys: ['customers', 'customer-resource', 'dashboard'],
          successMessage: 'Customer updated successfully',
          errorMessage: 'Failed to update customer',
        }
      );
    },
    [executeWithRefresh]
  );

  return { deleteCustomer, createCustomer, updateCustomer };
}

// Products management
export function useProductsDataMutation() {
  const { executeWithRefresh } = useDataMutationWithRefresh();
  
  const deleteProduct = useCallback(
    async (deleteOperation: () => Promise<void>) => {
      return executeWithRefresh(
        deleteOperation,
        {
          queryKeys: ['products', 'product-resource', 'dashboard'],
          successMessage: 'Product deleted successfully',
          errorMessage: 'Failed to delete product',
        }
      );
    },
    [executeWithRefresh]
  );

  const createProduct = useCallback(
    async (createOperation: () => Promise<any>) => {
      return executeWithRefresh(
        createOperation,
        {
          queryKeys: ['products', 'product-resource', 'dashboard'],
          successMessage: 'Product created successfully',
          errorMessage: 'Failed to create product',
        }
      );
    },
    [executeWithRefresh]
  );

  const updateProduct = useCallback(
    async (updateOperation: () => Promise<any>) => {
      return executeWithRefresh(
        updateOperation,
        {
          queryKeys: ['products', 'product-resource', 'dashboard'],
          successMessage: 'Product updated successfully',
          errorMessage: 'Failed to update product',
        }
      );
    },
    [executeWithRefresh]
  );

  return { deleteProduct, createProduct, updateProduct };
}

// Business Partners management
export function useBusinessPartnersDataMutation() {
  const { executeWithRefresh } = useDataMutationWithRefresh();
  
  const deletePartner = useCallback(
    async (deleteOperation: () => Promise<void>) => {
      return executeWithRefresh(
        deleteOperation,
        {
          queryKeys: ['business-partners', 'keycloak-partners', 'organizations'],
          successMessage: 'Business partner removed successfully',
          errorMessage: 'Failed to remove business partner',
        }
      );
    },
    [executeWithRefresh]
  );

  const updatePartner = useCallback(
    async (updateOperation: () => Promise<any>) => {
      return executeWithRefresh(
        updateOperation,
        {
          queryKeys: ['business-partners', 'keycloak-partners', 'organizations'],
          successMessage: 'Business partner updated successfully',
          errorMessage: 'Failed to update business partner',
        }
      );
    },
    [executeWithRefresh]
  );

  const invitePartner = useCallback(
    async (inviteOperation: () => Promise<any>) => {
      return executeWithRefresh(
        inviteOperation,
        {
          queryKeys: ['business-partners', 'keycloak-partners', 'organizations', 'invitations'],
          successMessage: 'Business partner invited successfully',
          errorMessage: 'Failed to invite business partner',
        }
      );
    },
    [executeWithRefresh]
  );

  return { deletePartner, updatePartner, invitePartner };
}

// User management
export function useUserManagementDataMutation() {
  const { executeWithRefresh } = useDataMutationWithRefresh();
  
  const deleteUser = useCallback(
    async (deleteOperation: () => Promise<void>) => {
      return executeWithRefresh(
        deleteOperation,
        {
          queryKeys: ['users', 'user-management', 'organizations'],
          successMessage: 'User deleted successfully',
          errorMessage: 'Failed to delete user',
        }
      );
    },
    [executeWithRefresh]
  );

  const updateUser = useCallback(
    async (updateOperation: () => Promise<any>) => {
      return executeWithRefresh(
        updateOperation,
        {
          queryKeys: ['users', 'user-management', 'organizations'],
          successMessage: 'User updated successfully',
          errorMessage: 'Failed to update user',
        }
      );
    },
    [executeWithRefresh]
  );

  const inviteUser = useCallback(
    async (inviteOperation: () => Promise<any>) => {
      return executeWithRefresh(
        inviteOperation,
        {
          queryKeys: ['users', 'user-management', 'organizations', 'invitations'],
          successMessage: 'User invited successfully',
          errorMessage: 'Failed to invite user',
        }
      );
    },
    [executeWithRefresh]
  );

  return { deleteUser, updateUser, inviteUser };
}

/**
 * General cache management utilities
 */
export function useCacheManagement() {
  const queryClient = useQueryClient();

  const refreshAllData = useCallback(async () => {
    await queryClient.invalidateQueries();
    toast.success('Data refreshed successfully');
  }, [queryClient]);

  const clearAllCache = useCallback(() => {
    queryClient.clear();
    toast.success('Cache cleared successfully');
  }, [queryClient]);

  const refreshSpecificData = useCallback(
    async (queryKeys: string[]) => {
      await Promise.all(
        queryKeys.map(key => 
          queryClient.invalidateQueries({ 
            queryKey: [key],
            exact: false,
          })
        )
      );
      toast.success('Data refreshed successfully');
    },
    [queryClient]
  );

  return {
    refreshAllData,
    clearAllCache,
    refreshSpecificData,
  };
}
