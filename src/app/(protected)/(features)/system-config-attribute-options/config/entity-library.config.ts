import type { SystemConfigAttributeOptionDTO } from '@/core/api/generated/spring/schemas';
import type { EntityLibraryConfig } from '@/entity-library/config';
import { SystemConfigAttributeOptionDTOStatus } from '@/core/api/generated/spring/schemas/SystemConfigAttributeOptionDTOStatus';
import {
  useGetAllSystemConfigAttributeOptions,
  useUpdateSystemConfigAttributeOption,
} from '@/core/api/generated/spring/endpoints/system-config-attribute-option-resource/system-config-attribute-option-resource.gen';
import { systemConfigAttributeOptionTableConfig } from './table.config';
import { createEntityLibraryConfig, createDefaultEntityLibraryConfig } from '@/entity-library/config';

/**
 * COMPREHENSIVE Entity Library Configuration for System Config Attribute Options
 * Every capability is explicitly defined - nothing is overlooked
 */
export const systemConfigAttributeOptionFullConfig: EntityLibraryConfig<
  SystemConfigAttributeOptionDTO,
  typeof SystemConfigAttributeOptionDTOStatus
> = createEntityLibraryConfig(
  createDefaultEntityLibraryConfig({
    // ============ CORE IDENTITY ============
    entityId: 'system-config-attribute-option',
    displayName: 'Attribute Option',
    displayNamePlural: 'Attribute Options',
    basePath: '/system-config-attribute-options',
    apiKeyPrefix: '/api/system-config-attribute-options',

    // ============ DATA INTEGRATION ============
    getEntityId: (entity) => entity.id,
    statusEnum: SystemConfigAttributeOptionDTOStatus,
    useGetAll: useGetAllSystemConfigAttributeOptions,
    useUpdate: useUpdateSystemConfigAttributeOption,
    tableConfig: systemConfigAttributeOptionTableConfig,

    // ============ FEATURES: TABS ============
    features_tabs_enabled: true,
    features_tabs_defaultTab: 'active',
    features_tabs_customLabels: {
      all: 'NA',
      active: 'NA',
      inactive: 'NA',
      archived: 'NA',
    },

    // ============ FEATURES: SEARCH & FILTERS ============
    features_search_enabled: true,
    features_search_placeholder: 'Search by code or label...',
    features_filters_enabled: true,
    features_filters_collapsedByDefault: true,
    features_filters_showActiveChips: true,

    // ============ FEATURES: SORTING ============
    features_sorting_enabled: true,
    features_sorting_multiColumn: false,
    features_sorting_defaultField: 'sortOrder',
    features_sorting_defaultDirection: 'asc',

    // ============ FEATURES: PAGINATION ============
    features_pagination_enabled: true,
    features_pagination_defaultPageSize: 10,
    features_pagination_pageSizeOptions: [10, 25, 50, 100],
    features_pagination_showTotalCount: true,
    features_pagination_showPageNumbers: true,
    features_pagination_showFirstLast: true,
    features_pagination_strategy: 'offset',

    // ============ FEATURES: ROW SELECTION ============
    features_selection_enabled: true,
    features_selection_enableSelectAll: true,
    features_selection_maxSelection: 0, // unlimited
    features_selection_showCount: true,

    // ============ FEATURES: BULK ACTIONS ============
    features_bulkActions_enabled: true,
    features_bulkActions_setActive: true,
    features_bulkActions_setInactive: true,
    features_bulkActions_archive: true,
    features_bulkActions_delete: false, // soft delete via archive only
    features_bulkActions_custom: [],

    // ============ FEATURES: ROW ACTIONS ============
    features_rowActions_enabled: true,
    features_rowActions_view: true,
    features_rowActions_edit: true,
    features_rowActions_duplicate: false, // not needed for options
    features_rowActions_setActive: true,
    features_rowActions_setInactive: true,
    features_rowActions_archive: true,
    features_rowActions_delete: false,
    features_rowActions_custom: [],

    // ============ FEATURES: COLUMN VISIBILITY ============
    features_columnVisibility_enabled: true,
    features_columnVisibility_storageKey: 'system-config-attribute-option-columns',
    features_columnVisibility_allowReorder: false,
    features_columnVisibility_pinnedColumns: [],

    // ============ FEATURES: EXPORT ============
    features_export_enabled: true,
    features_export_formats: ['csv', 'excel'],
    features_export_scope: 'all',
    features_export_defaultFilename: 'attribute-options',

    // ============ FEATURES: IMPORT ============
    features_import_enabled: true,
    features_import_formats: ['csv', 'excel'],
    features_import_showPreview: true,
    features_import_validateBeforeImport: true,

    // ============ FEATURES: REFRESH ============
    features_refresh_enabled: true,
    features_refresh_autoRefresh: false,
    features_refresh_intervalSeconds: 0,
    features_refresh_showTimestamp: false,

    // ============ FEATURES: EMPTY STATE ============
    features_emptyState_title: 'No attribute options found',
    features_emptyState_description: 'Create your first attribute option to get started.',
    features_emptyState_showCreateButton: true,
    features_emptyState_icon: 'NA',

    // ============ FEATURES: LOADING STATE ============
    features_loading_skeletonType: 'rows',
    features_loading_skeletonRows: 5,
    features_loading_message: 'NA',

    // ============ FEATURES: ERROR HANDLING ============
    features_error_showBoundary: true,
    features_error_message: 'Failed to load attribute options',
    features_error_showRetry: true,
    features_error_autoRetry: false,
    features_error_maxRetries: 3,

    // ============ FEATURES: RESPONSIVE ============
    features_responsive_enabled: true,
    features_responsive_mobileBreakpoint: 768,
    features_responsive_useCardLayout: false,
    features_responsive_hiddenColumnsMobile: ['id', 'sortOrder'],

    // ============ FEATURES: ACCESSIBILITY ============
    features_a11y_keyboardNavigation: true,
    features_a11y_screenReaderAnnouncements: true,
    features_a11y_tableAriaLabel: 'Attribute Options Table',
    features_a11y_focusIndicators: true,

    // ============ FEATURES: THEMING ============
    features_theme_primaryColor: 'oklch(0.45 0.06 243)', // navy
    features_theme_accentColor: '#f5b81d', // yellow
    features_theme_density: 'normal',
    features_theme_zebraStriping: false,

    // ============ FEATURES: PERFORMANCE ============
    features_performance_virtualScrolling: false,
    features_performance_virtualRowHeight: 48,
    features_performance_debounceMs: 300,
    features_performance_optimisticUpdates: false,

    // ============ FEATURES: PERMISSIONS ============
    features_permissions_view: 'systemConfigAttributeOption:read',
    features_permissions_create: 'systemConfigAttributeOption:create',
    features_permissions_edit: 'systemConfigAttributeOption:update',
    features_permissions_delete: 'systemConfigAttributeOption:delete',
    features_permissions_bulkActions: 'systemConfigAttributeOption:update',
    features_permissions_export: 'systemConfigAttributeOption:export',
    features_permissions_import: 'systemConfigAttributeOption:import',

    // ============ FEATURES: ANALYTICS ============
    features_analytics_enabled: false,
    features_analytics_eventPrefix: 'NA',
    features_analytics_trackPageViews: false,
    features_analytics_trackActions: false,
    features_analytics_trackSearch: false,
  })
);
