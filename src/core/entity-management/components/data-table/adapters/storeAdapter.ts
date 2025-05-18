import { EntityStore } from '../../../store';
import { EntityTableStore } from '../store';

/**
 * Creates an adapter that transforms an EntityStore instance into an EntityTableStore
 * This ensures compatibility between the generic entity store and the data table component
 * 
 * @param store The EntityStore instance to adapt
 * @returns An EntityTableStore compatible object
 */
export function createStoreAdapter<TData, TFilter>(store: EntityStore<TData, TFilter>): EntityTableStore<TData> {
  return {
    // Map state properties
    sorting: store.getState().sorting,
    columnFilters: store.getState().columnFilters,
    columnVisibility: store.getState().columnVisibility,
    selectedItems: store.getState().selectedItems,
    isLoading: store.getState().isLoading,
    
    // Map methods
    setSorting: (sorting) => store.setState({ sorting }),
    setColumnFilters: (filters) => store.setState({ columnFilters: filters }),
    setColumnVisibility: (visibility) => store.setState({ columnVisibility: visibility }),
    setSelectedItems: (items) => store.setState({ selectedItems: items }),
    setLoading: (isLoading) => store.setState({ isLoading })
  };
}
