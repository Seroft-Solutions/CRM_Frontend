'use client';

import type { SystemConfigDTO } from '@/core/api/generated/spring/schemas';
import type { EntityLibraryConfig } from '@/entity-library/config';
import { SystemConfigDTOStatus } from '@/core/api/generated/spring/schemas/SystemConfigDTOStatus';
import {
  useGetAllSystemConfigs,
  useUpdateSystemConfig,
} from '@/core/api/generated/spring/endpoints/system-config-resource/system-config-resource.gen';
import { systemConfigTableConfig } from './table.config';
import { createDefaultEntityLibraryConfig } from '@/entity-library/config';

/**
 * Comprehensive Entity Library Configuration for System Configs
 * 
 * This configuration explicitly defines ALL capabilities and features
 * for the system configs entity management interface.
 * 
 * All fields are required to ensure no capability is overlooked.
 */
export const systemConfigLibraryConfig: EntityLibraryConfig<
  SystemConfigDTO,
  typeof SystemConfigDTOStatus
> = createDefaultEntityLibraryConfig({
  // ============ CORE IDENTITY ============
  entityId: 'system-config',
  displayName: 'System Config',
  displayNamePlural: 'System Configs',
  basePath: '/system-configs',
  apiKeyPrefix: '/api/system-configs',

  // ============ DATA INTEGRATION ============
  getEntityId: (entity) => entity.id,
  statusEnum: SystemConfigDTOStatus,
  useGetAll: useGetAllSystemConfigs,
  useUpdate: () => {
    const mutation = useUpdateSystemConfig();
    return {
      mutateAsync: async (params: { id: number; data: Partial<SystemConfigDTO> }) => {
        return mutation.mutateAsync({
          id: params.id,
          data: params.data as SystemConfigDTO,
        });
      },
    };
  },

  // ============ TABLE CONFIGURATION ============
  tableConfig: systemConfigTableConfig,

  // ============ FEATURES: TABS ============
  features_tabs_enabled: true,
  features_tabs_defaultTab: 'active',
  features_tabs_customLabels: {
    all: 'All Configs',
    active: 'Active',
    inactive: 'Inactive',
    archived: 'Archived',
  },

  // ============ FEATURES: SEARCH ============
  features_search_enabled: true,
  features_search_placeholder: 'Search by config key, type, or description...',

  // ============ FEATURES: FILTERS ============
  features_filters_enabled: true,
  features_filters_collapsedByDefault: false,
  features_filters_showActiveChips: true,

  // ============ FEATURES: SORTING ============
  features_sorting_enabled: true,
  features_sorting_multiColumn: false,
  features_sorting_defaultField: 'id',
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
  features_selection_maxSelection: 0, // 0 = unlimited
  features_selection_showCount: true,

  // ============ FEATURES: BULK ACTIONS ============
  features_bulkActions_enabled: true,
  features_bulkActions_setActive: true,
  features_bulkActions_setInactive: true,
  features_bulkActions_archive: true,
  features_bulkActions_delete: false,
  features_bulkActions_custom: [],

  // ============ FEATURES: ROW ACTIONS ============
  features_rowActions_enabled: true,
  features_rowActions_view: true,
  features_rowActions_edit: true,
  features_rowActions_duplicate: false,
  features_rowActions_setActive: true,
  features_rowActions_setInactive: true,
  features_rowActions_archive: true,
  features_rowActions_delete: false,
  features_rowActions_custom: [],

  // ============ FEATURES: COLUMN VISIBILITY ============
  features_columnVisibility_enabled: true,
  features_columnVisibility_storageKey: 'system-configs-columns',
  features_columnVisibility_allowReorder: false,
  features_columnVisibility_pinnedColumns: ['configKey', 'status'],

  // ============ FEATURES: EXPORT ============
  features_export_enabled: true,
  features_export_formats: ['csv', 'excel'],
  features_export_scope: 'all',
  features_export_defaultFilename: 'system-configs-export',

  // ============ FEATURES: IMPORT ============
  features_import_enabled: false,
  features_import_formats: [],
  features_import_showPreview: false,
  features_import_validateBeforeImport: false,

  // ============ FEATURES: REFRESH ============
  features_refresh_enabled: true,
  features_refresh_autoRefresh: false,
  features_refresh_intervalSeconds: 0,
  features_refresh_showTimestamp: true,

  // ============ FEATURES: EMPTY STATE ============
  features_emptyState_title: 'No System Configs Found',
  features_emptyState_description: 'Get started by creating your first system configuration.',
  features_emptyState_showCreateButton: true,
  features_emptyState_icon: 'settings',

  // ============ FEATURES: LOADING STATE ============
  features_loading_skeletonType: 'rows',
  features_loading_skeletonRows: 10,
  features_loading_message: 'Loading system configurations...',

  // ============ FEATURES: ERROR HANDLING ============
  features_error_showBoundary: true,
  features_error_message: 'Failed to load system configs. Please try again.',
  features_error_showRetry: true,
  features_error_autoRetry: false,
  features_error_maxRetries: 3,

  // ============ FEATURES: RESPONSIVE ============
  features_responsive_enabled: true,
  features_responsive_mobileBreakpoint: 768,
  features_responsive_useCardLayout: true,
  features_responsive_hiddenColumnsMobile: [
    'createdBy',
    'createdDate',
    'lastModifiedBy',
    'lastModifiedDate',
    'description',
  ],

  // ============ FEATURES: ACCESSIBILITY ============
  features_a11y_keyboardNavigation: true,
  features_a11y_screenReaderAnnouncements: true,
  features_a11y_tableAriaLabel: 'System Configurations Table',
  features_a11y_focusIndicators: true,

  // ============ FEATURES: THEMING ============
  features_theme_primaryColor: 'oklch(0.45_0.06_243)', // Navy
  features_theme_accentColor: '#f5b81d', // Yellow
  features_theme_density: 'normal',
  features_theme_zebraStriping: true,

  // ============ FEATURES: PERFORMANCE ============
  features_performance_virtualScrolling: false,
  features_performance_virtualRowHeight: 48,
  features_performance_debounceMs: 300,
  features_performance_optimisticUpdates: true,

  // ============ FEATURES: PERMISSIONS ============
  features_permissions_view: 'systemConfig:read',
  features_permissions_create: 'systemConfig:create',
  features_permissions_edit: 'systemConfig:update',
  features_permissions_delete: 'systemConfig:delete',
  features_permissions_bulkActions: 'systemConfig:update',
  features_permissions_export: 'systemConfig:read',
  features_permissions_import: 'systemConfig:create',

  // ============ FEATURES: ANALYTICS ============
  features_analytics_enabled: true,
  features_analytics_eventPrefix: 'system_config',
  features_analytics_trackPageViews: true,
  features_analytics_trackActions: true,
  features_analytics_trackSearch: true,
});
