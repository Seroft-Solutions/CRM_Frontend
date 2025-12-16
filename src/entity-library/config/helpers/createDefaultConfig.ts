import type { EntityLibraryConfig, StatusEnum } from '../entity-library-config';

/**
 * Create default entity library configuration
 * Provides sensible defaults for all features
 * Developers must still provide core identity and data integration
 */
export function createDefaultEntityLibraryConfig<
  TEntity extends object,
  TStatus extends StatusEnum
>(overrides: Partial<EntityLibraryConfig<TEntity, TStatus>>): EntityLibraryConfig<TEntity, TStatus> {
  return {
    // Core identity - REQUIRED, no defaults
    entityId: overrides.entityId!,
    displayName: overrides.displayName!,
    displayNamePlural: overrides.displayNamePlural!,
    basePath: overrides.basePath!,
    apiKeyPrefix: overrides.apiKeyPrefix!,
    
    // Data integration - REQUIRED, no defaults
    getEntityId: overrides.getEntityId!,
    statusEnum: overrides.statusEnum!,
    useGetAll: overrides.useGetAll!,
    useUpdate: overrides.useUpdate!,
    tableConfig: overrides.tableConfig!,

    // ============ DEFAULT FEATURES ============
    
    // Tabs
    features_tabs_enabled: overrides.features_tabs_enabled ?? true,
    features_tabs_defaultTab: overrides.features_tabs_defaultTab ?? 'active',
    features_tabs_customLabels: overrides.features_tabs_customLabels ?? {
      all: 'NA',
      active: 'NA',
      inactive: 'NA',
      archived: 'NA',
    },

    // Search & Filters
    features_search_enabled: overrides.features_search_enabled ?? true,
    features_search_placeholder: overrides.features_search_placeholder ?? 'NA',
    features_filters_enabled: overrides.features_filters_enabled ?? true,
    features_filters_collapsedByDefault: overrides.features_filters_collapsedByDefault ?? true,
    features_filters_showActiveChips: overrides.features_filters_showActiveChips ?? true,

    // Sorting
    features_sorting_enabled: overrides.features_sorting_enabled ?? true,
    features_sorting_multiColumn: overrides.features_sorting_multiColumn ?? false,
    features_sorting_defaultField: overrides.features_sorting_defaultField ?? 'NA',
    features_sorting_defaultDirection: overrides.features_sorting_defaultDirection ?? 'asc',

    // Pagination
    features_pagination_enabled: overrides.features_pagination_enabled ?? true,
    features_pagination_defaultPageSize: overrides.features_pagination_defaultPageSize ?? 10,
    features_pagination_pageSizeOptions: overrides.features_pagination_pageSizeOptions ?? [10, 25, 50, 100],
    features_pagination_showTotalCount: overrides.features_pagination_showTotalCount ?? true,
    features_pagination_showPageNumbers: overrides.features_pagination_showPageNumbers ?? true,
    features_pagination_showFirstLast: overrides.features_pagination_showFirstLast ?? true,
    features_pagination_strategy: overrides.features_pagination_strategy ?? 'offset',

    // Row Selection
    features_selection_enabled: overrides.features_selection_enabled ?? true,
    features_selection_enableSelectAll: overrides.features_selection_enableSelectAll ?? true,
    features_selection_maxSelection: overrides.features_selection_maxSelection ?? 0,
    features_selection_showCount: overrides.features_selection_showCount ?? true,

    // Bulk Actions
    features_bulkActions_enabled: overrides.features_bulkActions_enabled ?? true,
    features_bulkActions_setActive: overrides.features_bulkActions_setActive ?? true,
    features_bulkActions_setInactive: overrides.features_bulkActions_setInactive ?? true,
    features_bulkActions_archive: overrides.features_bulkActions_archive ?? true,
    features_bulkActions_delete: overrides.features_bulkActions_delete ?? false,
    features_bulkActions_custom: overrides.features_bulkActions_custom ?? [],

    // Row Actions
    features_rowActions_enabled: overrides.features_rowActions_enabled ?? true,
    features_rowActions_view: overrides.features_rowActions_view ?? true,
    features_rowActions_edit: overrides.features_rowActions_edit ?? true,
    features_rowActions_duplicate: overrides.features_rowActions_duplicate ?? false,
    features_rowActions_setActive: overrides.features_rowActions_setActive ?? true,
    features_rowActions_setInactive: overrides.features_rowActions_setInactive ?? true,
    features_rowActions_archive: overrides.features_rowActions_archive ?? true,
    features_rowActions_delete: overrides.features_rowActions_delete ?? false,
    features_rowActions_custom: overrides.features_rowActions_custom ?? [],

    // Column Visibility
    features_columnVisibility_enabled: overrides.features_columnVisibility_enabled ?? true,
    features_columnVisibility_storageKey: overrides.features_columnVisibility_storageKey ?? 'NA',
    features_columnVisibility_allowReorder: overrides.features_columnVisibility_allowReorder ?? false,
    features_columnVisibility_pinnedColumns: overrides.features_columnVisibility_pinnedColumns ?? [],

    // Export
    features_export_enabled: overrides.features_export_enabled ?? false,
    features_export_formats: overrides.features_export_formats ?? [],
    features_export_scope: overrides.features_export_scope ?? 'all',
    features_export_defaultFilename: overrides.features_export_defaultFilename ?? 'NA',

    // Import
    features_import_enabled: overrides.features_import_enabled ?? false,
    features_import_formats: overrides.features_import_formats ?? [],
    features_import_showPreview: overrides.features_import_showPreview ?? true,
    features_import_validateBeforeImport: overrides.features_import_validateBeforeImport ?? true,

    // Refresh
    features_refresh_enabled: overrides.features_refresh_enabled ?? true,
    features_refresh_autoRefresh: overrides.features_refresh_autoRefresh ?? false,
    features_refresh_intervalSeconds: overrides.features_refresh_intervalSeconds ?? 0,
    features_refresh_showTimestamp: overrides.features_refresh_showTimestamp ?? false,

    // Empty State
    features_emptyState_title: overrides.features_emptyState_title ?? 'NA',
    features_emptyState_description: overrides.features_emptyState_description ?? 'NA',
    features_emptyState_showCreateButton: overrides.features_emptyState_showCreateButton ?? true,
    features_emptyState_icon: overrides.features_emptyState_icon ?? 'NA',

    // Loading State
    features_loading_skeletonType: overrides.features_loading_skeletonType ?? 'rows',
    features_loading_skeletonRows: overrides.features_loading_skeletonRows ?? 5,
    features_loading_message: overrides.features_loading_message ?? 'NA',

    // Error Handling
    features_error_showBoundary: overrides.features_error_showBoundary ?? true,
    features_error_message: overrides.features_error_message ?? 'NA',
    features_error_showRetry: overrides.features_error_showRetry ?? true,
    features_error_autoRetry: overrides.features_error_autoRetry ?? false,
    features_error_maxRetries: overrides.features_error_maxRetries ?? 3,

    // Responsive
    features_responsive_enabled: overrides.features_responsive_enabled ?? true,
    features_responsive_mobileBreakpoint: overrides.features_responsive_mobileBreakpoint ?? 768,
    features_responsive_useCardLayout: overrides.features_responsive_useCardLayout ?? false,
    features_responsive_hiddenColumnsMobile: overrides.features_responsive_hiddenColumnsMobile ?? [],

    // Accessibility
    features_a11y_keyboardNavigation: overrides.features_a11y_keyboardNavigation ?? true,
    features_a11y_screenReaderAnnouncements: overrides.features_a11y_screenReaderAnnouncements ?? true,
    features_a11y_tableAriaLabel: overrides.features_a11y_tableAriaLabel ?? 'NA',
    features_a11y_focusIndicators: overrides.features_a11y_focusIndicators ?? true,

    // Theming
    features_theme_primaryColor: overrides.features_theme_primaryColor ?? 'NA',
    features_theme_accentColor: overrides.features_theme_accentColor ?? 'NA',
    features_theme_density: overrides.features_theme_density ?? 'normal',
    features_theme_zebraStriping: overrides.features_theme_zebraStriping ?? false,

    // Performance
    features_performance_virtualScrolling: overrides.features_performance_virtualScrolling ?? false,
    features_performance_virtualRowHeight: overrides.features_performance_virtualRowHeight ?? 48,
    features_performance_debounceMs: overrides.features_performance_debounceMs ?? 300,
    features_performance_optimisticUpdates: overrides.features_performance_optimisticUpdates ?? false,

    // Permissions
    features_permissions_view: overrides.features_permissions_view ?? 'NA',
    features_permissions_create: overrides.features_permissions_create ?? 'NA',
    features_permissions_edit: overrides.features_permissions_edit ?? 'NA',
    features_permissions_delete: overrides.features_permissions_delete ?? 'NA',
    features_permissions_bulkActions: overrides.features_permissions_bulkActions ?? 'NA',
    features_permissions_export: overrides.features_permissions_export ?? 'NA',
    features_permissions_import: overrides.features_permissions_import ?? 'NA',

    // Analytics
    features_analytics_enabled: overrides.features_analytics_enabled ?? false,
    features_analytics_eventPrefix: overrides.features_analytics_eventPrefix ?? 'NA',
    features_analytics_trackPageViews: overrides.features_analytics_trackPageViews ?? false,
    features_analytics_trackActions: overrides.features_analytics_trackActions ?? false,
    features_analytics_trackSearch: overrides.features_analytics_trackSearch ?? false,
  } as EntityLibraryConfig<TEntity, TStatus>;
}
