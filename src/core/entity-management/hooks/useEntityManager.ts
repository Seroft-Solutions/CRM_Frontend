import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import { 
  useApiQuery, 
  useApiMutation, 
  useApiDynamicMutation,
  useStandardPaginatedQuery,
  PaginationParams
} from '@/features/core/tanstack-query-api';
import { BaseEntity, EntityApiEndpoints, FormMode } from '../types';

/**
 * Hook that provides entity management operations using the existing tanstack-query-api
 * 
 * @param endpoints API endpoints configuration
 * @param options Additional options
 */
export function useEntityManager<TData extends BaseEntity, TFilter = Record<string, any>>({
  endpoints,
  options = {}
}: {
  endpoints: EntityApiEndpoints;
  options?: {
    onCreated?: (data: TData) => void;
    onUpdated?: (data: TData) => void;
    onDeleted?: (id: string | number) => void;
    transformData?: (data: any, mode: FormMode) => any;
    validateData?: (data: any, mode: FormMode) => void;
    defaultPageSize?: number;
    defaultFilters?: TFilter;
  };
}) {
  // State
  const [filters, setFilters] = useState<TFilter>(options.defaultFilters || {} as TFilter);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(options.defaultPageSize || 10);
  const [sortBy, setSortBy] = useState<string | undefined>(undefined);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | undefined>(undefined);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<TData | null>(null);
  const [formMode, setFormMode] = useState<FormMode>('view');
  
  // Hooks
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Prepare query parameters
  const queryParams: PaginationParams = {
    page: currentPage,
    size: pageSize,
    ...(sortBy && sortOrder && { sort: `${sortBy},${sortOrder}` }),
    ...filters
  };
  
  // Prepare API endpoints
  const getAllEndpoint = endpoints.getAll || endpoints.base;
  const getByIdEndpoint = (id: string | number) => 
    endpoints.getById ? `${endpoints.getById}/${id}` : `${endpoints.base}/${id}`;
  const createEndpoint = endpoints.create || endpoints.base;
  const updateEndpoint = (id: string | number) => 
    endpoints.update ? `${endpoints.update}/${id}` : `${endpoints.base}/${id}`;
  const deleteEndpoint = (id: string | number) => 
    endpoints.delete ? `${endpoints.delete}/${id}` : `${endpoints.base}/${id}`;
  
  // Get all entities
  const { 
    data,
    isLoading,
    isFetching,
    refetch
  } = useStandardPaginatedQuery<TData>(
    [endpoints.queryKeys.all],
    getAllEndpoint,
    queryParams
  );
  
  // Create mutation
  const createMutation = useApiMutation<TData, Omit<TData, 'id'>>(
    createEndpoint,
    'POST',
    {
      onSuccess: (createdItem) => {
        queryClient.invalidateQueries({ queryKey: [endpoints.queryKeys.all] });
        toast({
          title: 'Success',
          description: `Item created successfully.`,
        });
        closeModal();
        
        if (options.onCreated) {
          options.onCreated(createdItem);
        }
      },
      onError: (error) => {
        toast({
          title: 'Error',
          description: `Failed to create item: ${error.message}`,
          variant: 'destructive'
        });
      }
    }
  );
  
  // Update mutation
  const updateMutation = useApiDynamicMutation<TData, TData>(
    updateEndpoint,
    'PUT',
    {
      onSuccess: (updatedItem) => {
        queryClient.invalidateQueries({ queryKey: [endpoints.queryKeys.all] });
        queryClient.invalidateQueries({ queryKey: [endpoints.queryKeys.detail, updatedItem.id] });
        toast({
          title: 'Success',
          description: `Item updated successfully.`,
        });
        closeModal();
        
        if (options.onUpdated) {
          options.onUpdated(updatedItem);
        }
      },
      onError: (error) => {
        toast({
          title: 'Error',
          description: `Failed to update item: ${error.message}`,
          variant: 'destructive'
        });
      }
    }
  );
  
  // Delete mutation
  const deleteMutation = useApiDynamicMutation<void, { id: string | number }>(
    deleteEndpoint,
    'DELETE',
    {
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: [endpoints.queryKeys.all] });
        toast({
          title: 'Success',
          description: `Item deleted successfully.`,
        });
        closeModal();
        
        if (options.onDeleted) {
          options.onDeleted(variables.id);
        }
      },
      onError: (error) => {
        toast({
          title: 'Error',
          description: `Failed to delete item: ${error.message}`,
          variant: 'destructive'
        });
      }
    }
  );
  
  // Action handlers
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);
  
  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(0); // Reset to first page
  }, []);
  
  const handleSortChange = useCallback((field: string, order: 'asc' | 'desc' | undefined) => {
    setSortBy(field);
    setSortOrder(order);
  }, []);
  
  const handleFilterChange = useCallback((newFilters: TFilter) => {
    setFilters(newFilters);
    setCurrentPage(0); // Reset to first page
  }, []);
  
  const resetFilters = useCallback(() => {
    setFilters({} as TFilter);
    setCurrentPage(0);
  }, []);
  
  const openModal = useCallback((mode: FormMode, item?: TData | null) => {
    // Set form mode and open modal
    setFormMode(mode);
    setSelectedItem(item || null);
    setIsModalOpen(true);
  }, []);
  
  const closeModal = useCallback(() => {
    // First close the modal
    setIsModalOpen(false);
    
    // Small delay to reset state after modal animation completes
    setTimeout(() => {
      setSelectedItem(null);
      setFormMode('view');
    }, 300);
  }, []);
  
  // Get entity by ID
  const getById = useCallback((id: string | number) => {
    return useApiQuery<TData>(
      [endpoints.queryKeys.detail, id],
      getByIdEndpoint(id),
      { enabled: !!id }
    );
  }, [endpoints]);
  
  // Form submission handler
  const handleSubmit = useCallback((formData: any) => {
    // Transform data if needed
    const transformedData = options.transformData 
      ? options.transformData(formData, formMode) 
      : formData;
    
    // Validate data if needed
    if (options.validateData) {
      try {
        options.validateData(transformedData, formMode);
      } catch (error) {
        toast({
          title: 'Validation Error',
          description: error instanceof Error ? error.message : 'Invalid data',
          variant: 'destructive'
        });
        return;
      }
    }
    
    if (formMode === 'create') {
      createMutation.mutate(transformedData);
    } else if (formMode === 'edit' && selectedItem?.id) {
      updateMutation.mutate({ ...transformedData, id: selectedItem.id });
    }
  }, [formMode, selectedItem, options, createMutation, updateMutation, toast]);
  
  const handleDelete = useCallback((item: TData) => {
    if (item && item.id) {
      deleteMutation.mutate({ id: item.id });
    }
  }, [deleteMutation]);
  
  return {
    // Data
    items: data?.data || [],
    pagination: data?.pagination || {
      totalItems: 0,
      totalPages: 0,
      currentPage: 0,
      pageSize,
    },
    selectedItem,
    filters,
    
    // UI state
    isLoading: isLoading || isFetching,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isModalOpen,
    formMode,
    
    // Sort state
    sortBy,
    sortOrder,
    
    // Actions
    create: createMutation.mutate,
    update: updateMutation.mutate,
    delete: handleDelete,
    getById,
    refresh: refetch,
    handleSubmit,
    
    // Modal actions
    openModal,
    closeModal,
    
    // Pagination actions
    onPageChange: handlePageChange,
    onPageSizeChange: handlePageSizeChange,
    
    // Sort actions
    onSortChange: handleSortChange,
    
    // Filter actions
    onFilterChange: handleFilterChange,
    resetFilters,
  };
}
