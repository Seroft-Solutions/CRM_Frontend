import type { TableConfig } from './types';

/**
 * Status enum type - must have ACTIVE, INACTIVE, ARCHIVED values
 */
export type StatusEnum = {
  ACTIVE: string;
  INACTIVE: string;
  ARCHIVED: string;
  [key: string]: string;
};

/**
 * Status tab for filtering entities
 */
export type StatusTab = 'all' | 'active' | 'inactive' | 'archived';

/**
 * Simple Entity Configuration
 * Used by EntityTablePage for basic table functionality
 * Contains only the essential fields needed for table rendering
 */
export interface EntityConfig<TEntity extends object, TStatus extends StatusEnum> {
  /** Display name plural (e.g., 'System Configs') */
  entityName: string;
  
  /** Base URL path (e.g., '/system-configs') */
  basePath: string;
  
  /** Complete table configuration with columns, sorting, pagination */
  tableConfig: TableConfig<TEntity>;
  
  /** Status enum with ACTIVE, INACTIVE, ARCHIVED */
  statusEnum: TStatus;
  
  /** Function to extract entity ID */
  getEntityId: (entity: TEntity) => number | undefined;
  
  /** Orval-generated hook for fetching all entities */
  useGetAll: (params: any) => {
    data?: { content?: TEntity[]; totalElements?: number } | TEntity[];
    isLoading: boolean;
    refetch: () => void;
  };
  
  /** Orval-generated mutation hook for updating entities */
  useUpdate: () => {
    mutateAsync: (params: { id: number; data: Partial<TEntity> }) => Promise<any>;
  };
  
  /** API endpoint prefix for query invalidation (e.g., '/api/system-configs') */
  queryKeyPrefix: string;
}
