import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { 
  useEntityApi, 
  EntityApiEndpoints, 
  FormMode,
  BaseEntity
} from '@/features/core/tanstack-query-api';
import { EntityStore } from '../store';
import { EntityLabels, EntityPermissions } from '../types';
import { useToast } from '@/components/ui/use-toast';

/**
 * Context type definition for EntityManager
 */
export interface EntityManagerContextValue<TData extends BaseEntity = any, TFilter = any> {
  // Core API
  entityApi: ReturnType<typeof useEntityApi<TData, TFilter>>;
  
  // Store
  entityStore: EntityStore<TData, TFilter>;
  
  // Configuration
  labels: EntityLabels;
  permissions?: EntityPermissions;
  
  // Modal management
  openModal: (mode: FormMode, item?: TData | null) => void;
  closeModal: () => void;
  
  // Permission helpers
  canView: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  
  // UI helpers
  showToast: (props: { title: string; description?: string; variant?: 'default' | 'destructive' }) => void;
}

// Create the context with a default value of undefined
const EntityManagerContext = createContext<EntityManagerContextValue | undefined>(undefined);

/**
 * Props for the EntityManagerProvider component
 */
export interface EntityManagerProviderProps<TData extends BaseEntity = any, TFilter = any> {
  children: ReactNode;
  entityApi: ReturnType<typeof useEntityApi<TData, TFilter>>;
  entityStore: EntityStore<TData, TFilter>;
  labels: EntityLabels;
  permissions?: EntityPermissions;
  openModal: (mode: FormMode, item?: TData | null) => void;
  closeModal: () => void;
  canView: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

/**
 * Context provider for the EntityManager
 */
export function EntityManagerProvider<TData extends BaseEntity = any, TFilter = any>({
  children,
  entityApi,
  entityStore,
  labels,
  permissions,
  openModal,
  closeModal,
  canView,
  canCreate,
  canUpdate,
  canDelete,
}: EntityManagerProviderProps<TData, TFilter>) {
  const { toast } = useToast();
  
  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      entityApi,
      entityStore,
      labels,
      permissions,
      openModal,
      closeModal,
      canView,
      canCreate,
      canUpdate,
      canDelete,
      showToast: (props) => {
        toast({
          title: props.title,
          description: props.description,
          variant: props.variant || 'default',
        });
      },
    }),
    [
      entityApi,
      entityStore,
      labels,
      permissions,
      openModal,
      closeModal,
      canView,
      canCreate,
      canUpdate,
      canDelete,
      toast,
    ]
  );

  return (
    <EntityManagerContext.Provider value={contextValue}>
      {children}
    </EntityManagerContext.Provider>
  );
}

/**
 * Custom hook to use the EntityManager context
 */
export function useEntityManager<TData extends BaseEntity = any, TFilter = any>(): EntityManagerContextValue<TData, TFilter> {
  const context = useContext(EntityManagerContext);
  
  if (context === undefined) {
    throw new Error('useEntityManager must be used within an EntityManagerProvider');
  }
  
  return context as EntityManagerContextValue<TData, TFilter>;
}
