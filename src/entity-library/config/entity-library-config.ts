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
    data?: { content?: TEntity[]; totalElements?: number };
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

/**
 * Comprehensive Entity Library Configuration
 * ALL fields are required to ensure no capability is overlooked
 */
export interface EntityLibraryConfig<TEntity extends object, TStatus extends StatusEnum> {
  // ============ CORE IDENTITY ============
  /** Unique identifier for the entity type (e.g., 'system-config') */
  entityId: string;
  
  /** Display name singular (e.g., 'System Config') */
  displayName: string;
  
  /** Display name plural (e.g., 'System Configs') */
  displayNamePlural: string;
  
  /** Base URL path (e.g., '/system-configs') */
  basePath: string;
  
  /** API endpoint prefix for query invalidation (e.g., '/api/system-configs') */
  apiKeyPrefix: string;

  // ============ DATA INTEGRATION ============
  /** Function to extract entity ID */
  getEntityId: (entity: TEntity) => number | undefined;
  
  /** Status enum with ACTIVE, INACTIVE, ARCHIVED */
  statusEnum: TStatus;
  
  /** Orval-generated hook for fetching all entities */
  useGetAll: (params: any) => {
    data?: { content?: TEntity[]; totalElements?: number };
    isLoading: boolean;
    refetch: () => void;
  };
  
  /** Orval-generated mutation hook for updating entities */
  useUpdate: () => {
    mutateAsync: (params: { id: number; data: Partial<TEntity> }) => Promise<any>;
  };

  // ============ TABLE CONFIGURATION ============
  /** Complete table configuration with columns, sorting, pagination */
  tableConfig: TableConfig<TEntity>;

  // ============ FEATURES: TABS ============
  /** Enable status-based filtering tabs (Active, Inactive, Archived, All) */
  features_tabs_enabled: boolean;
  
  /** Default tab to show on page load */
  features_tabs_defaultTab: 'all' | 'active' | 'inactive' | 'archived';
  
  /** Custom tab labels (use 'NA' to use defaults) */
  features_tabs_customLabels: {
    all: string | 'NA';
    active: string | 'NA';
    inactive: string | 'NA';
    archived: string | 'NA';
  };

  // ============ FEATURES: SEARCH & FILTERS ============
  /** Enable global search across all searchable columns */
  features_search_enabled: boolean;
  
  /** Search placeholder text (use 'NA' for default) */
  features_search_placeholder: string | 'NA';
  
  /** Enable advanced filter panel with column-specific filters */
  features_filters_enabled: boolean;
  
  /** Show filter panel collapsed by default */
  features_filters_collapsedByDefault: boolean;
  
  /** Show active filter chips above table */
  features_filters_showActiveChips: boolean;

  // ============ FEATURES: SORTING ============
  /** Enable column sorting */
  features_sorting_enabled: boolean;
  
  /** Allow multi-column sorting */
  features_sorting_multiColumn: boolean;
  
  /** Default sort field (use 'NA' to use table config default) */
  features_sorting_defaultField: keyof TEntity | 'NA';
  
  /** Default sort direction */
  features_sorting_defaultDirection: 'asc' | 'desc';

  // ============ FEATURES: PAGINATION ============
  /** Enable pagination */
  features_pagination_enabled: boolean;
  
  /** Default page size */
  features_pagination_defaultPageSize: number;
  
  /** Available page size options */
  features_pagination_pageSizeOptions: number[];
  
  /** Show total count of records */
  features_pagination_showTotalCount: boolean;
  
  /** Show page number buttons (1, 2, 3...) */
  features_pagination_showPageNumbers: boolean;
  
  /** Show first/last navigation buttons */
  features_pagination_showFirstLast: boolean;
  
  /** Pagination strategy */
  features_pagination_strategy: 'offset' | 'cursor';

  // ============ FEATURES: ROW SELECTION ============
  /** Enable row selection with checkboxes */
  features_selection_enabled: boolean;
  
  /** Enable select all checkbox in header */
  features_selection_enableSelectAll: boolean;
  
  /** Maximum number of rows that can be selected (0 = unlimited) */
  features_selection_maxSelection: number;
  
  /** Show selection count in UI */
  features_selection_showCount: boolean;

  // ============ FEATURES: BULK ACTIONS ============
  /** Enable bulk actions for selected rows */
  features_bulkActions_enabled: boolean;
  
  /** Enable "Set Active" bulk action */
  features_bulkActions_setActive: boolean;
  
  /** Enable "Set Inactive" bulk action */
  features_bulkActions_setInactive: boolean;
  
  /** Enable "Archive" bulk action */
  features_bulkActions_archive: boolean;
  
  /** Enable "Delete" bulk action (permanent) */
  features_bulkActions_delete: boolean;
  
  /** Custom bulk actions (use empty array if none) */
  features_bulkActions_custom: Array<{
    id: string;
    label: string;
    icon?: string;
    variant?: 'default' | 'destructive' | 'outline';
    requiresConfirmation: boolean;
    confirmationMessage?: string;
  }>;

  // ============ FEATURES: ROW ACTIONS ============
  /** Enable row actions dropdown menu */
  features_rowActions_enabled: boolean;
  
  /** Enable "View" row action */
  features_rowActions_view: boolean;
  
  /** Enable "Edit" row action */
  features_rowActions_edit: boolean;
  
  /** Enable "Duplicate" row action */
  features_rowActions_duplicate: boolean;
  
  /** Enable "Set Active" row action */
  features_rowActions_setActive: boolean;
  
  /** Enable "Set Inactive" row action */
  features_rowActions_setInactive: boolean;
  
  /** Enable "Archive" row action */
  features_rowActions_archive: boolean;
  
  /** Enable "Delete" row action (permanent) */
  features_rowActions_delete: boolean;
  
  /** Custom row actions (use empty array if none) */
  features_rowActions_custom: Array<{
    id: string;
    label: string;
    icon?: string;
    variant?: 'default' | 'destructive' | 'outline';
    requiresConfirmation: boolean;
    confirmationMessage?: string;
  }>;

  // ============ FEATURES: COLUMN VISIBILITY ============
  /** Enable column visibility toggle */
  features_columnVisibility_enabled: boolean;
  
  /** LocalStorage key for persisting visibility preferences */
  features_columnVisibility_storageKey: string | 'NA';
  
  /** Allow users to reorder columns */
  features_columnVisibility_allowReorder: boolean;
  
  /** Columns that cannot be hidden */
  features_columnVisibility_pinnedColumns: Array<keyof TEntity>;

  // ============ FEATURES: EXPORT ============
  /** Enable data export functionality */
  features_export_enabled: boolean;
  
  /** Supported export formats */
  features_export_formats: Array<'csv' | 'excel' | 'json' | 'pdf'>;
  
  /** Export all data or only visible/selected */
  features_export_scope: 'all' | 'visible' | 'selected';
  
  /** Default filename for exports (use 'NA' for auto-generated) */
  features_export_defaultFilename: string | 'NA';

  // ============ FEATURES: IMPORT ============
  /** Enable data import functionality */
  features_import_enabled: boolean;
  
  /** Supported import formats */
  features_import_formats: Array<'csv' | 'excel' | 'json'>;
  
  /** Show import preview before confirming */
  features_import_showPreview: boolean;
  
  /** Validate data before import */
  features_import_validateBeforeImport: boolean;

  // ============ FEATURES: REFRESH ============
  /** Enable manual refresh button */
  features_refresh_enabled: boolean;
  
  /** Enable auto-refresh at intervals */
  features_refresh_autoRefresh: boolean;
  
  /** Auto-refresh interval in seconds (0 = disabled) */
  features_refresh_intervalSeconds: number;
  
  /** Show last refresh timestamp */
  features_refresh_showTimestamp: boolean;

  // ============ FEATURES: EMPTY STATE ============
  /** Custom empty state title (use 'NA' for default) */
  features_emptyState_title: string | 'NA';
  
  /** Custom empty state description (use 'NA' for default) */
  features_emptyState_description: string | 'NA';
  
  /** Show "Create New" button in empty state */
  features_emptyState_showCreateButton: boolean;
  
  /** Custom empty state icon (use 'NA' for default) */
  features_emptyState_icon: string | 'NA';

  // ============ FEATURES: LOADING STATE ============
  /** Loading skeleton type */
  features_loading_skeletonType: 'rows' | 'shimmer' | 'spinner' | 'custom';
  
  /** Number of skeleton rows to show */
  features_loading_skeletonRows: number;
  
  /** Custom loading message (use 'NA' for default) */
  features_loading_message: string | 'NA';

  // ============ FEATURES: ERROR HANDLING ============
  /** Show error boundary for table errors */
  features_error_showBoundary: boolean;
  
  /** Custom error message (use 'NA' for default) */
  features_error_message: string | 'NA';
  
  /** Show retry button on error */
  features_error_showRetry: boolean;
  
  /** Automatic retry on network errors */
  features_error_autoRetry: boolean;
  
  /** Max retry attempts */
  features_error_maxRetries: number;

  // ============ FEATURES: RESPONSIVE ============
  /** Enable responsive mobile layout */
  features_responsive_enabled: boolean;
  
  /** Mobile breakpoint in pixels */
  features_responsive_mobileBreakpoint: number;
  
  /** Show card layout on mobile instead of table */
  features_responsive_useCardLayout: boolean;
  
  /** Columns to hide on mobile (use empty array for none) */
  features_responsive_hiddenColumnsMobile: Array<keyof TEntity>;

  // ============ FEATURES: ACCESSIBILITY ============
  /** Enable keyboard navigation */
  features_a11y_keyboardNavigation: boolean;
  
  /** Enable screen reader announcements */
  features_a11y_screenReaderAnnouncements: boolean;
  
  /** ARIA label for table (use 'NA' for default) */
  features_a11y_tableAriaLabel: string | 'NA';
  
  /** Enable focus indicators */
  features_a11y_focusIndicators: boolean;

  // ============ FEATURES: THEMING ============
  /** Custom primary color (use 'NA' for default navy) */
  features_theme_primaryColor: string | 'NA';
  
  /** Custom accent color (use 'NA' for default yellow) */
  features_theme_accentColor: string | 'NA';
  
  /** Table density */
  features_theme_density: 'compact' | 'normal' | 'comfortable';
  
  /** Enable zebra striping for rows */
  features_theme_zebraStriping: boolean;

  // ============ FEATURES: PERFORMANCE ============
  /** Enable virtual scrolling for large datasets */
  features_performance_virtualScrolling: boolean;
  
  /** Row height for virtual scrolling */
  features_performance_virtualRowHeight: number;
  
  /** Enable request debouncing for filters/search */
  features_performance_debounceMs: number;
  
  /** Enable optimistic updates */
  features_performance_optimisticUpdates: boolean;

  // ============ FEATURES: PERMISSIONS ============
  /** Permission required to view table */
  features_permissions_view: string | 'NA';
  
  /** Permission required to create */
  features_permissions_create: string | 'NA';
  
  /** Permission required to edit */
  features_permissions_edit: string | 'NA';
  
  /** Permission required to delete */
  features_permissions_delete: string | 'NA';
  
  /** Permission required for bulk actions */
  features_permissions_bulkActions: string | 'NA';
  
  /** Permission required for export */
  features_permissions_export: string | 'NA';
  
  /** Permission required for import */
  features_permissions_import: string | 'NA';

  // ============ FEATURES: ANALYTICS ============
  /** Track user interactions for analytics */
  features_analytics_enabled: boolean;
  
  /** Analytics event prefix (use 'NA' to auto-generate) */
  features_analytics_eventPrefix: string | 'NA';
  
  /** Track page views */
  features_analytics_trackPageViews: boolean;
  
  /** Track action clicks */
  features_analytics_trackActions: boolean;
  
  /** Track search queries */
  features_analytics_trackSearch: boolean;
}

/**
 * Validation result for entity library config
 */
export interface ConfigValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  missingRequired: string[];
}

/**
 * Validate entity library configuration
 * Ensures all required fields are properly set
 */
export function validateEntityLibraryConfig<TEntity extends object, TStatus extends StatusEnum>(
  config: Partial<EntityLibraryConfig<TEntity, TStatus>>
): ConfigValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const missingRequired: string[] = [];

  // Check core identity fields
  if (!config.entityId) missingRequired.push('entityId');
  if (!config.displayName) missingRequired.push('displayName');
  if (!config.displayNamePlural) missingRequired.push('displayNamePlural');
  if (!config.basePath) missingRequired.push('basePath');
  if (!config.apiKeyPrefix) missingRequired.push('apiKeyPrefix');

  // Check data integration
  if (!config.getEntityId) missingRequired.push('getEntityId');
  if (!config.statusEnum) missingRequired.push('statusEnum');
  if (!config.useGetAll) missingRequired.push('useGetAll');
  if (!config.useUpdate) missingRequired.push('useUpdate');
  if (!config.tableConfig) missingRequired.push('tableConfig');

  // Validate feature flags are explicitly set (not undefined)
  const featureFlags = Object.keys(config).filter(key => key.startsWith('features_'));
  const allFeatureKeys = getRequiredFeatureKeys();
  
  allFeatureKeys.forEach(key => {
    if (!(key in config)) {
      missingRequired.push(key);
    }
  });

  // Logical validations
  if (config.features_bulkActions_enabled && !config.features_selection_enabled) {
    warnings.push('Bulk actions enabled but row selection is disabled. Users cannot select rows for bulk operations.');
  }

  if (config.features_pagination_enabled && config.features_performance_virtualScrolling) {
    warnings.push('Both pagination and virtual scrolling are enabled. Virtual scrolling typically replaces pagination.');
  }

  if (config.features_export_scope === 'selected' && !config.features_selection_enabled) {
    errors.push('Export scope is "selected" but row selection is disabled.');
  }

  if (config.features_columnVisibility_storageKey !== 'NA' && config.features_columnVisibility_storageKey === '') {
    errors.push('Column visibility storage key is empty. Use "NA" if persistence is not needed.');
  }

  if (config.features_refresh_autoRefresh && config.features_refresh_intervalSeconds === 0) {
    errors.push('Auto-refresh is enabled but interval is 0. Set a positive interval or disable auto-refresh.');
  }

  if (config.features_pagination_enabled && config.features_pagination_pageSizeOptions?.length === 0) {
    warnings.push('Pagination enabled but no page size options provided.');
  }

  return {
    isValid: errors.length === 0 && missingRequired.length === 0,
    errors,
    warnings,
    missingRequired,
  };
}

/**
 * Get all required feature configuration keys
 */
function getRequiredFeatureKeys(): string[] {
  return [
    // Tabs
    'features_tabs_enabled',
    'features_tabs_defaultTab',
    'features_tabs_customLabels',
    // Search & Filters
    'features_search_enabled',
    'features_search_placeholder',
    'features_filters_enabled',
    'features_filters_collapsedByDefault',
    'features_filters_showActiveChips',
    // Sorting
    'features_sorting_enabled',
    'features_sorting_multiColumn',
    'features_sorting_defaultField',
    'features_sorting_defaultDirection',
    // Pagination
    'features_pagination_enabled',
    'features_pagination_defaultPageSize',
    'features_pagination_pageSizeOptions',
    'features_pagination_showTotalCount',
    'features_pagination_showPageNumbers',
    'features_pagination_showFirstLast',
    'features_pagination_strategy',
    // Row Selection
    'features_selection_enabled',
    'features_selection_enableSelectAll',
    'features_selection_maxSelection',
    'features_selection_showCount',
    // Bulk Actions
    'features_bulkActions_enabled',
    'features_bulkActions_setActive',
    'features_bulkActions_setInactive',
    'features_bulkActions_archive',
    'features_bulkActions_delete',
    'features_bulkActions_custom',
    // Row Actions
    'features_rowActions_enabled',
    'features_rowActions_view',
    'features_rowActions_edit',
    'features_rowActions_duplicate',
    'features_rowActions_setActive',
    'features_rowActions_setInactive',
    'features_rowActions_archive',
    'features_rowActions_delete',
    'features_rowActions_custom',
    // Column Visibility
    'features_columnVisibility_enabled',
    'features_columnVisibility_storageKey',
    'features_columnVisibility_allowReorder',
    'features_columnVisibility_pinnedColumns',
    // Export
    'features_export_enabled',
    'features_export_formats',
    'features_export_scope',
    'features_export_defaultFilename',
    // Import
    'features_import_enabled',
    'features_import_formats',
    'features_import_showPreview',
    'features_import_validateBeforeImport',
    // Refresh
    'features_refresh_enabled',
    'features_refresh_autoRefresh',
    'features_refresh_intervalSeconds',
    'features_refresh_showTimestamp',
    // Empty State
    'features_emptyState_title',
    'features_emptyState_description',
    'features_emptyState_showCreateButton',
    'features_emptyState_icon',
    // Loading State
    'features_loading_skeletonType',
    'features_loading_skeletonRows',
    'features_loading_message',
    // Error Handling
    'features_error_showBoundary',
    'features_error_message',
    'features_error_showRetry',
    'features_error_autoRetry',
    'features_error_maxRetries',
    // Responsive
    'features_responsive_enabled',
    'features_responsive_mobileBreakpoint',
    'features_responsive_useCardLayout',
    'features_responsive_hiddenColumnsMobile',
    // Accessibility
    'features_a11y_keyboardNavigation',
    'features_a11y_screenReaderAnnouncements',
    'features_a11y_tableAriaLabel',
    'features_a11y_focusIndicators',
    // Theming
    'features_theme_primaryColor',
    'features_theme_accentColor',
    'features_theme_density',
    'features_theme_zebraStriping',
    // Performance
    'features_performance_virtualScrolling',
    'features_performance_virtualRowHeight',
    'features_performance_debounceMs',
    'features_performance_optimisticUpdates',
    // Permissions
    'features_permissions_view',
    'features_permissions_create',
    'features_permissions_edit',
    'features_permissions_delete',
    'features_permissions_bulkActions',
    'features_permissions_export',
    'features_permissions_import',
    // Analytics
    'features_analytics_enabled',
    'features_analytics_eventPrefix',
    'features_analytics_trackPageViews',
    'features_analytics_trackActions',
    'features_analytics_trackSearch',
  ];
}

/**
 * Helper to create a complete entity library config with defaults
 * Forces developer to acknowledge all capabilities
 */
export function createEntityLibraryConfig<TEntity extends object, TStatus extends StatusEnum>(
  config: EntityLibraryConfig<TEntity, TStatus>
): EntityLibraryConfig<TEntity, TStatus> {
  const validation = validateEntityLibraryConfig(config);
  
  if (!validation.isValid) {
    console.error('❌ Entity Library Config Validation Failed:');
    if (validation.missingRequired.length > 0) {
      console.error('Missing required fields:', validation.missingRequired);
    }
    if (validation.errors.length > 0) {
      console.error('Errors:', validation.errors);
    }
    throw new Error(
      `Invalid entity library config for "${config.entityId}". Missing: ${validation.missingRequired.join(', ')}`
    );
  }

  if (validation.warnings.length > 0) {
    console.warn('⚠️  Entity Library Config Warnings:');
    validation.warnings.forEach(warning => console.warn(`  - ${warning}`));
  }

  return config;
}
