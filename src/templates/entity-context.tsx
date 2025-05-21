'use client';

import { 
  createContext, 
  useContext, 
  useState, 
  useCallback, 
  ReactNode,
  useMemo
} from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// This is a generic entity context template
// It should be customized for each entity type

interface EntityContextProps<T> {
  // Pagination state
  page: number;
  pageSize: number;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  
  // Sorting state
  sort: string;
  order: string;
  setSort: (field: string) => void;
  
  // Filter state
  filters: Record<string, any>;
  setFilter: (field: string, value: any) => void;
  clearFilters: () => void;
  
  // Selection state
  selected: T[];
  setSelected: (items: T[]) => void;
  clearSelected: () => void;
  
  // Entity operations
  refreshData: () => void;
  invalidateQueries: () => void;
}

// Create a generic context
export const createEntityContext = <T extends { id?: number | string; }>() => {
  const EntityContext = createContext<EntityContextProps<T> | undefined>(undefined);
  
  // Provider component
  const EntityProvider = ({ 
    children,
    baseQueryKey = [], // Base query key for React Query
  }: { 
    children: ReactNode;
    baseQueryKey?: string[];
  }) => {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const queryClient = useQueryClient();
    
    // Get initial values from URL
    const initialPage = Number(searchParams.get('page') || '0');
    const initialSize = Number(searchParams.get('size') || '20');
    const initialSort = searchParams.get('sort') || 'id';
    const initialOrder = searchParams.get('order') || 'DESC';
    
    // State for pagination
    const [page, setPageInternal] = useState(initialPage);
    const [pageSize, setPageSizeInternal] = useState(initialSize);
    
    // State for sorting
    const [sort, setSortInternal] = useState(initialSort);
    const [order, setOrderInternal] = useState(initialOrder);
    
    // State for filters
    const [filters, setFilters] = useState<Record<string, any>>({});
    
    // State for selection
    const [selected, setSelected] = useState<T[]>([]);
    
    // Update URL when pagination, sorting, or filters change
    const updateUrl = useCallback(() => {
      const params = new URLSearchParams(searchParams.toString());
      
      // Update pagination params
      params.set('page', page.toString());
      params.set('size', pageSize.toString());
      
      // Update sorting params
      params.set('sort', sort);
      params.set('order', order);
      
      // Update filter params
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.set(key, value.toString());
        } else {
          params.delete(key);
        }
      });
      
      // Push new URL
      router.push(`${pathname}?${params.toString()}`);
    }, [pathname, router, searchParams, page, pageSize, sort, order, filters]);
    
    // Pagination handlers
    const setPage = useCallback((newPage: number) => {
      setPageInternal(newPage);
      setTimeout(updateUrl, 0);
    }, [updateUrl]);
    
    const setPageSize = useCallback((newSize: number) => {
      setPageSizeInternal(newSize);
      setPageInternal(0); // Reset to first page when changing page size
      setTimeout(updateUrl, 0);
    }, [updateUrl]);
    
    // Sorting handlers
    const setSort = useCallback((field: string) => {
      if (sort === field) {
        // Toggle order if same field
        setOrderInternal(order === 'ASC' ? 'DESC' : 'ASC');
      } else {
        // Set new sort field and default to ascending
        setSortInternal(field);
        setOrderInternal('ASC');
      }
      setTimeout(updateUrl, 0);
    }, [sort, order, updateUrl]);
    
    // Filter handlers
    const setFilter = useCallback((field: string, value: any) => {
      setFilters(prev => ({
        ...prev,
        [field]: value
      }));
      setPageInternal(0); // Reset to first page when changing filters
      setTimeout(updateUrl, 0);
    }, [updateUrl]);
    
    const clearFilters = useCallback(() => {
      setFilters({});
      setTimeout(updateUrl, 0);
    }, [updateUrl]);
    
    // Selection handlers
    const clearSelected = useCallback(() => {
      setSelected([]);
    }, []);
    
    // Data operations
    const refreshData = useCallback(() => {
      queryClient.invalidateQueries({ queryKey: baseQueryKey });
      toast.success('Data refreshed');
    }, [queryClient, baseQueryKey]);
    
    const invalidateQueries = useCallback(() => {
      queryClient.invalidateQueries({ queryKey: baseQueryKey });
    }, [queryClient, baseQueryKey]);
    
    // Context value
    const value = useMemo(() => ({
      // Pagination
      page,
      pageSize,
      setPage,
      setPageSize,
      
      // Sorting
      sort,
      order,
      setSort,
      
      // Filters
      filters,
      setFilter,
      clearFilters,
      
      // Selection
      selected,
      setSelected,
      clearSelected,
      
      // Operations
      refreshData,
      invalidateQueries
    }), [
      page, pageSize, setPage, setPageSize,
      sort, order, setSort,
      filters, setFilter, clearFilters,
      selected, setSelected, clearSelected,
      refreshData, invalidateQueries
    ]);
    
    return (
      <EntityContext.Provider value={value}>
        {children}
      </EntityContext.Provider>
    );
  };
  
  // Custom hook to use the context
  const useEntityContext = () => {
    const context = useContext(EntityContext);
    if (context === undefined) {
      throw new Error('useEntityContext must be used within an EntityProvider');
    }
    return context;
  };
  
  return { EntityProvider, useEntityContext };
};

// Export the function to create a typed entity context
export default createEntityContext;
