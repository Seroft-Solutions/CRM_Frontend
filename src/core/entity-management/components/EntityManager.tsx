import React, { useCallback, useMemo, useRef, useEffect } from 'react';
import { 
  useEntityApi, 
  EntityApiEndpoints, 
  FormMode,
  BaseEntity
} from '@/features/core/tanstack-query-api';
import { EntityManagerProps } from '../types';
import { useAuth } from '@/features/core/auth';
import { EntityStore, createEntityStore } from '../store';
import { logger } from '../utils/logger';
import { useToast } from '@/components/ui/use-toast';
import { ToastProps } from '@/components/ui/toast';

// Import context and hooks
import { EntityManagerProvider } from '../context';
import { useEntityModal, useEntitySync, useEntityPermissions } from '../hooks';

// Import components
import { EntityManagerLayout } from './templates';
import { EntityTable } from './organisms';
import { EntityFormSheet } from './organisms';
import { EntityFormDialog } from './organisms';

/**
 * EntityManager component for managing entity data
 * This component is the main entry point for the entity management system
 */
export function EntityManager<TData extends BaseEntity = any, TFilter = any>({
  // Zustand store
  store,
  // Core configuration
  endpoints,
  permissions,
  labels,
  
  // Table configuration
  columns,
  tableProps,
  filterableColumns,
  searchableColumns,
  
  // Form configuration
  formFields,
  formSections,
  defaultValues,
  transformFormData,
  validateFormData,
  formProps,
  validationSchema,
  
  // Customization
  renderFilters,
  
  // Events
  onCreated,
  onUpdated,
  onDeleted,
  onFilterChange,
  
  // Additional features
  enableExport,
  exportData,
  enableRowSelection = false,
  bulkActions,
  enableInlineEdit = false,
  
  // UI behavior
  showDeleteInViewMode = false,
  formDisplayMode = 'dialog',
  
  // Default pagination
  defaultPageSize = 10,
  defaultFilters,
}: EntityManagerProps<TData, TFilter> & { store?: EntityStore<TData, TFilter> }) {
  // Initialize logger
  const componentLogger = useMemo(() => logger.createContext('EntityManager'), []);
  
  // Hooks
  const { isTokenValidated, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  
  // Create a new store if one wasn't provided
  const entityStore = useMemo(() => {
    if (store) {
      componentLogger.info('Using provided store');
      return store;
    }
    
    componentLogger.info('Creating new entity store');
    return createEntityStore<TData, TFilter>('entity-manager', {
      defaultPageSize,
      defaultFilters,
      enableLogging: true
    });
  }, [store, defaultPageSize, defaultFilters, componentLogger]);
  
  // Use Zustand store selectors for fine-grained subscriptions
  const isModalOpen = entityStore(useCallback((state) => state.isModalOpen, []));
  const currentFormMode = entityStore(useCallback((state) => state.formMode, []));
  const selectedItem = entityStore(useCallback((state) => state.selectedItem, []));
  
  // Use entity api hook (from tanstack-query-api)
  const entityApi = useEntityApi<TData, TFilter>({
    endpoints,
    options: {
      onCreated,
      onUpdated,
      onDeleted,
      transformData: transformFormData,
      validateData: validateFormData,
      defaultPageSize,
      defaultFilters,
    }
  });
  
  // Use the modal management hook
  const { openModal, closeModal } = useEntityModal({
    entityStore,
    onSelectItem: entityApi.selectItem,
    onSetFormMode: entityApi.setFormMode,
  });
  
  // Use the entity sync hook to keep the store in sync with API data
  useEntitySync({
    entityStore,
    items: entityApi.items,
    pagination: entityApi.pagination,
    isLoading: entityApi.isLoading,
    error: entityApi.error,
    isAuthLoading,
    isTokenValidated,
  });
  
  // Check permissions
  const { canView, canCreate, canUpdate, canDelete } = useEntityPermissions({
    permissions,
  });
  
  // Handle API errors
  useEffect(() => {
    if (entityApi.error?.status === 401) {
      componentLogger.error(`Authentication error (401 Unauthorized). The user may need to log in again.`);
      toast({
        title: "Authentication Error",
        description: "Your session has expired. Please log in again.",
        variant: "destructive",
      });
    } else if (entityApi.error) {
      componentLogger.error(`API error encountered:`, entityApi.error);
    }
  }, [entityApi.error, toast, componentLogger]);
  
  // Prepare export function for the table
  const handleExport = useCallback(() => {
    if (exportData && entityApi.items) {
      exportData(entityApi.items);
    } else {
      // Simple CSV export if no custom export function is provided
      const data = entityApi.items || [];
      
      if (data.length === 0) {
        console.warn('No data to export');
        return;
      }
      
      // Convert to CSV
      const header = Object.keys(data[0]).join(',');
      const rows = data.map(item => 
        Object.values(item).map(value => 
          typeof value === 'string' && value.includes(',') ? `"${value}"` : value
        ).join(',')
      );
      
      const csv = [header, ...rows].join('\n');
      
      // Download file
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${labels.entityNamePlural.toLowerCase().replace(/\s+/g, '_')}_export.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [exportData, entityApi.items, labels.entityNamePlural]);
  
  // Create contextValue for the provider
  const contextValue = useMemo(() => ({
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
    showToast: (props: Pick<ToastProps, 'title' | 'description' | 'variant'>) => {
      toast({
        title: props.title,
        description: props.description,
        variant: props.variant || 'default',
      });
    },
  }), [
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
    toast
  ]);
  
  return (
    <EntityManagerProvider {...contextValue}>
      <EntityManagerLayout>
        {/* Data Table */}
        <EntityTable
          columns={columns}
          filterableColumns={filterableColumns}
          searchableColumns={searchableColumns}
          enableRowSelection={enableRowSelection}
          enableRowClick={true}
          tableProps={{
            ...tableProps,
            enableExport,
            onExport: enableExport ? handleExport : undefined,
          }}
          onRowClick={(item) => openModal('view', item)}
          onFilterChange={onFilterChange}
        />
        
        {/* Modal Form - Choose between dialog and sheet variants */}
        {formDisplayMode === 'sheet' ? (
          <EntityFormSheet
            open={isModalOpen}
            formMode={currentFormMode}
            onClose={closeModal}
            onChangeFormMode={(mode) => {
              componentLogger.debug(`Changing form mode to ${mode}`);
              entityApi.setFormMode(mode);
              entityStore.setFormMode(mode);
            }}
            formFields={formFields}
            formSections={formSections}
            defaultValues={defaultValues}
            formProps={formProps}
            validationSchema={validationSchema}
            isSubmitting={entityApi.isCreating || entityApi.isUpdating}
            showDeleteInViewMode={showDeleteInViewMode}
          />
        ) : (
          <EntityFormDialog
            open={isModalOpen}
            formMode={currentFormMode}
            onClose={closeModal}
            onChangeFormMode={(mode) => {
              componentLogger.debug(`Changing form mode to ${mode}`);
              entityApi.setFormMode(mode);
              entityStore.setFormMode(mode);
            }}
            formFields={formFields}
            formSections={formSections}
            defaultValues={defaultValues}
            formProps={formProps}
            validationSchema={validationSchema}
            isSubmitting={entityApi.isCreating || entityApi.isUpdating}
            showDeleteInViewMode={showDeleteInViewMode}
          />
        )}
      </EntityManagerLayout>
    </EntityManagerProvider>
  );
}
