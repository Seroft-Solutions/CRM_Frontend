import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import { BaseEntity, EntityApiConfig, FormMode } from '../types';

/**
 * Hook that provides CRUD operations for an entity type
 * 
 * @param apiConfig API configuration for the entity
 * @param options Additional options
 */
export function useEntityApi<TData extends BaseEntity, TFilter = any>({
  apiConfig,
  options = {}
}: {
  apiConfig: EntityApiConfig<TData, TFilter>;
  options?: {
    onCreated?: (data: TData) => void;
    onUpdated?: (data: TData) => void;
    onDeleted?: (id: string | number) => void;
    transformData?: (data: any, mode: FormMode) => any;
    validateData?: (data: any, mode: FormMode) => void;
    defaultFilter?: TFilter;
    defaultPageSize?: number;
    defaultSort?: { field: string; order: 'asc' | 'desc' };
  };
}) {
  // State
  const [filters, setFilters] = useState<TFilter>(options.defaultFilter || {} as TFilter);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(options.defaultPageSize || 10);
  const [sort, setSort] = useState(options.defaultSort);
  
  // Hooks
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get all entities
  const {
    data,
    isLoading,
    isFetching,
    refetch
  } = useQuery({
    queryKey: [apiConfig.queryKeys.all, currentPage, pageSize, sort, filters],
    queryFn: () => apiConfig.getAll({
      page: currentPage,
      pageSize,
      sort,
      filters
    }),
    keepPreviousData: true
  });
  
  // Get entity by ID
  const getById = (id: string | number) => {
    if (!apiConfig.getById) {
      throw new Error('getById not implemented in apiConfig');
    }
    
    return useQuery({
      queryKey: [apiConfig.queryKeys.detail, id],
      queryFn: () => apiConfig.getById!(id),
      enabled: !!id
    });
  };
  
  // Create entity
  const createMutation = useMutation({
    mutationFn: (data: Omit<TData, 'id'>) => {
      const transformedData = options.transformData 
        ? options.transformData(data, 'create') 
        : data;
      
      if (options.validateData) {
        options.validateData(transformedData, 'create');
      }
      
      return apiConfig.create(transformedData);
    },
    onSuccess: (createdItem) => {
      queryClient.invalidateQueries({ queryKey: [apiConfig.queryKeys.all] });
      toast({
        title: 'Success',
        description: `Item created successfully.`,
      });
      
      if (options.onCreated) {
        options.onCreated(createdItem);
      }
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to create item.`,
        variant: 'destructive'
      });
      console.error('Create error:', error);
    }
  });
  
  // Update entity
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string | number, data: Partial<TData> }) => {
      const transformedData = options.transformData 
        ? options.transformData(data, 'edit') 
        : data;
      
      if (options.validateData) {
        options.validateData(transformedData, 'edit');
      }
      
      return apiConfig.update(id, transformedData);
    },
    onSuccess: (updatedItem) => {
      queryClient.invalidateQueries({ queryKey: [apiConfig.queryKeys.all] });
      queryClient.invalidateQueries({ queryKey: [apiConfig.queryKeys.detail, updatedItem.id] });
      toast({
        title: 'Success',
        description: `Item updated successfully.`,
      });
      
      if (options.onUpdated) {
        options.onUpdated(updatedItem);
      }
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update item.`,
        variant: 'destructive'
      });
      console.error('Update error:', error);
    }
  });
  
  // Delete entity
  const deleteMutation = useMutation({
    mutationFn: (id: string | number) => apiConfig.delete(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [apiConfig.queryKeys.all] });
      toast({
        title: 'Success',
        description: `Item deleted successfully.`,
      });
      
      if (options.onDeleted) {
        options.onDeleted(variables);
      }
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to delete item.`,
        variant: 'destructive'
      });
      console.error('Delete error:', error);
    }
  });
  
  // Pagination actions
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(0); // Reset to first page
  };
  
  // Sort actions
  const handleSortChange = (field: string, order: 'asc' | 'desc' | undefined) => {
    setSort(order ? { field, order } : undefined);
  };
  
  // Filter actions
  const handleFilterChange = (newFilters: TFilter) => {
    setFilters(newFilters);
    setCurrentPage(0); // Reset to first page
  };
  
  const resetFilters = () => {
    setFilters({} as TFilter);
    setCurrentPage(0);
  };
  
  return {
    // Data
    items: data?.items || [],
    totalItems: data?.totalItems || 0,
    totalPages: data?.totalPages || 0,
    
    // Loading state
    isLoading,
    isFetching,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    
    // Pagination state
    currentPage,
    pageSize,
    
    // Sort state
    sort,
    
    // Filter state
    filters,
    
    // Actions
    create: createMutation.mutate,
    update: updateMutation.mutate,
    delete: deleteMutation.mutate,
    getById,
    refresh: refetch,
    
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
