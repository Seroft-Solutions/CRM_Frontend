import type { TableConfig } from '../table/table-config';
import type { ReactNode } from 'react';

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

export interface EntityTablePageToolbarConfig {
  /**
   * Visual theme for the toolbar row.
   * - `default`: neutral toolbar (default)
   * - `sidebar`: slate toolbar with yellow accents (matches sidebar)
   */
  theme?: 'default' | 'sidebar';

  /**
   * Left side of the table toolbar (e.g., big Create button).
   * This is rendered before status tabs (when enabled).
   */
  left?: ReactNode;

  /**
   * Right side of the table toolbar (e.g., extra buttons).
   * Refresh and column menu are rendered after this.
   */
  right?: ReactNode;

  /**
   * Whether to show the default status tabs.
   * Defaults to true.
   */
  showStatusTabs?: boolean;

  /**
   * Which status tabs to show (defaults to all).
   */
  statusTabs?: StatusTab[];
}

/**
 * Entity Table Page Configuration
 * Used by `EntityTablePage` for full table-page functionality.
 */
export interface EntityTablePageConfig<TEntity extends object, TStatus extends StatusEnum> {
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
  useGetAll: (params: Record<string, unknown>) => {
    data?: { content?: TEntity[]; totalElements?: number } | TEntity[];
    isLoading: boolean;
    refetch: () => void;
  };

  /** Orval-generated mutation hook for updating entities */
  useUpdate: () => {
    mutateAsync: (params: { id: number; data: Partial<TEntity> }) => Promise<unknown>;
  };

  /** API endpoint prefix for query invalidation (e.g., '/api/system-configs') */
  queryKeyPrefix: string;

  /** Optional toolbar customization (create button, extra actions, status tabs). */
  toolbar?: EntityTablePageToolbarConfig;

  /**
   * Whether to include the default "View" row action (navigates to `${basePath}/${id}`).
   * Defaults to true.
   */
  includeViewAction?: boolean;

  /**
   * Whether to include the default "Edit" row action (navigates to `${basePath}/${id}/edit`).
   * Defaults to true.
   */
  includeEditAction?: boolean;
}
