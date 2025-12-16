# Entity Library Comprehensive Configuration Guide

## Overview

The Entity Library uses a **comprehensive, explicit configuration system** that ensures no capability is overlooked. Every feature must be explicitly enabled or disabled - there are no silent defaults that might lead to missed functionality.

## Philosophy

### Why Comprehensive Configuration?

1. **No Surprises**: Developers must acknowledge every capability
2. **Clear Intent**: Explicit `false` or `'NA'` shows deliberate choice, not oversight
3. **Validation**: Automatic validation catches missing configurations
4. **Discoverability**: Reading one config file reveals all entity-library features
5. **Maintainability**: Easy to see what features each entity uses

### Traditional Approach (BAD)
```typescript
// Optional properties - easy to miss features
interface Config {
  entityName: string;
  export?: boolean;  // Is this disabled or forgotten?
  import?: boolean;  // Same question...
}
```

### Our Approach (GOOD)
```typescript
// All properties required - explicit decisions
interface EntityLibraryConfig {
  entityName: string;
  features_export_enabled: boolean;      // Must decide
  features_export_formats: string[];     // Must specify
  features_import_enabled: boolean;      // Must decide
  features_import_formats: string[];     // Must specify
}
```

## Configuration Structure

The configuration is organized into logical sections:

### 1. Core Identity
```typescript
entityId: 'system-config-attribute-option',
displayName: 'Attribute Option',
displayNamePlural: 'Attribute Options',
basePath: '/system-config-attribute-options',
apiKeyPrefix: '/api/system-config-attribute-options',
```

### 2. Data Integration
```typescript
getEntityId: (entity) => entity.id,
statusEnum: SystemConfigAttributeOptionDTOStatus,
useGetAll: useGetAllSystemConfigAttributeOptions,
useUpdate: useUpdateSystemConfigAttributeOption,
tableConfig: systemConfigAttributeOptionTableConfig,
```

### 3. Features (All Required)

#### Tabs
```typescript
features_tabs_enabled: true,                    // Show status filter tabs
features_tabs_defaultTab: 'active',             // Default selected tab
features_tabs_customLabels: {                   // Custom labels or 'NA'
  all: 'NA',
  active: 'NA',
  inactive: 'NA',
  archived: 'NA',
},
```

#### Search & Filters
```typescript
features_search_enabled: true,
features_search_placeholder: 'Search by code or label...',
features_filters_enabled: true,
features_filters_collapsedByDefault: true,
features_filters_showActiveChips: true,
```

#### Sorting
```typescript
features_sorting_enabled: true,
features_sorting_multiColumn: false,
features_sorting_defaultField: 'sortOrder',
features_sorting_defaultDirection: 'asc',
```

#### Pagination
```typescript
features_pagination_enabled: true,
features_pagination_defaultPageSize: 10,
features_pagination_pageSizeOptions: [10, 25, 50, 100],
features_pagination_showTotalCount: true,
features_pagination_showPageNumbers: true,
features_pagination_showFirstLast: true,
features_pagination_strategy: 'offset',
```

#### Row Selection
```typescript
features_selection_enabled: true,
features_selection_enableSelectAll: true,
features_selection_maxSelection: 0,          // 0 = unlimited
features_selection_showCount: true,
```

#### Bulk Actions
```typescript
features_bulkActions_enabled: true,
features_bulkActions_setActive: true,
features_bulkActions_setInactive: true,
features_bulkActions_archive: true,
features_bulkActions_delete: false,
features_bulkActions_custom: [],             // Custom actions
```

#### Row Actions
```typescript
features_rowActions_enabled: true,
features_rowActions_view: true,
features_rowActions_edit: true,
features_rowActions_duplicate: false,
features_rowActions_setActive: true,
features_rowActions_setInactive: true,
features_rowActions_archive: true,
features_rowActions_delete: false,
features_rowActions_custom: [],
```

#### Column Visibility
```typescript
features_columnVisibility_enabled: true,
features_columnVisibility_storageKey: 'entity-columns',
features_columnVisibility_allowReorder: false,
features_columnVisibility_pinnedColumns: [],
```

#### Export
```typescript
features_export_enabled: true,
features_export_formats: ['csv', 'excel'],
features_export_scope: 'all',
features_export_defaultFilename: 'export',
```

#### Import
```typescript
features_import_enabled: true,
features_import_formats: ['csv', 'excel'],
features_import_showPreview: true,
features_import_validateBeforeImport: true,
```

#### Refresh
```typescript
features_refresh_enabled: true,
features_refresh_autoRefresh: false,
features_refresh_intervalSeconds: 0,
features_refresh_showTimestamp: false,
```

#### Empty State
```typescript
features_emptyState_title: 'No items found',
features_emptyState_description: 'Create your first item.',
features_emptyState_showCreateButton: true,
features_emptyState_icon: 'NA',
```

#### Loading State
```typescript
features_loading_skeletonType: 'rows',
features_loading_skeletonRows: 5,
features_loading_message: 'NA',
```

#### Error Handling
```typescript
features_error_showBoundary: true,
features_error_message: 'Failed to load data',
features_error_showRetry: true,
features_error_autoRetry: false,
features_error_maxRetries: 3,
```

#### Responsive
```typescript
features_responsive_enabled: true,
features_responsive_mobileBreakpoint: 768,
features_responsive_useCardLayout: false,
features_responsive_hiddenColumnsMobile: ['id', 'sortOrder'],
```

#### Accessibility
```typescript
features_a11y_keyboardNavigation: true,
features_a11y_screenReaderAnnouncements: true,
features_a11y_tableAriaLabel: 'Data Table',
features_a11y_focusIndicators: true,
```

#### Theming
```typescript
features_theme_primaryColor: 'oklch(0.45 0.06 243)',
features_theme_accentColor: '#f5b81d',
features_theme_density: 'normal',
features_theme_zebraStriping: false,
```

#### Performance
```typescript
features_performance_virtualScrolling: false,
features_performance_virtualRowHeight: 48,
features_performance_debounceMs: 300,
features_performance_optimisticUpdates: false,
```

#### Permissions
```typescript
features_permissions_view: 'entity:read',
features_permissions_create: 'entity:create',
features_permissions_edit: 'entity:update',
features_permissions_delete: 'entity:delete',
features_permissions_bulkActions: 'entity:update',
features_permissions_export: 'entity:export',
features_permissions_import: 'entity:import',
```

#### Analytics
```typescript
features_analytics_enabled: false,
features_analytics_eventPrefix: 'NA',
features_analytics_trackPageViews: false,
features_analytics_trackActions: false,
features_analytics_trackSearch: false,
```

## Creating a New Entity Config

### Step 1: Use the Helper
```typescript
import { createDefaultEntityLibraryConfig, createEntityLibraryConfig } from '@/entity-library/utils';

export const myEntityConfig = createEntityLibraryConfig(
  createDefaultEntityLibraryConfig({
    // Core fields (required)
    entityId: 'my-entity',
    displayName: 'My Entity',
    displayNamePlural: 'My Entities',
    basePath: '/my-entities',
    apiKeyPrefix: '/api/my-entities',
    getEntityId: (entity) => entity.id,
    statusEnum: MyEntityDTOStatus,
    useGetAll: useGetAllMyEntities,
    useUpdate: useUpdateMyEntity,
    tableConfig: myEntityTableConfig,
    
    // Override any defaults as needed
    features_export_enabled: true,
    features_export_formats: ['csv'],
    features_permissions_view: 'myEntity:read',
  })
);
```

### Step 2: Validate
The `createEntityLibraryConfig` function automatically validates and throws errors for:
- Missing required fields
- Invalid combinations (e.g., bulk actions without selection)
- Logical inconsistencies

Console will show:
```
✅ Config valid
⚠️  Warning: Bulk actions enabled but row selection disabled
```

### Step 3: Check All Configs
```bash
tsx scripts/check-entity-configs.ts
```

## Validation

### Automatic Validation
```typescript
const validation = validateEntityLibraryConfig(config);

if (!validation.isValid) {
  console.error('Errors:', validation.errors);
  console.error('Missing:', validation.missingRequired);
}

if (validation.warnings.length > 0) {
  console.warn('Warnings:', validation.warnings);
}
```

### Validation Checks
- ✅ All required fields present
- ✅ No undefined values (explicit false or 'NA')
- ✅ Logical consistency (e.g., export scope='selected' requires selection)
- ⚠️  Warnings for unusual combinations
- ⚠️  Suggestions for optimization

## Best Practices

### 1. Use 'NA' for Unused String Fields
```typescript
// Good
features_search_placeholder: 'NA',

// Bad
features_search_placeholder: '',  // Ambiguous
```

### 2. Use `false` for Disabled Features
```typescript
// Good - explicitly disabled
features_export_enabled: false,

// Bad - unclear intent
// features_export_enabled: undefined,
```

### 3. Empty Arrays for No Custom Actions
```typescript
// Good
features_bulkActions_custom: [],

// Bad
// features_bulkActions_custom: undefined,
```

### 4. Document Why Features Are Disabled
```typescript
// Good
features_rowActions_duplicate: false,  // Duplication not meaningful for options
features_bulkActions_delete: false,    // Soft delete via archive only

// Acceptable if obvious
features_analytics_enabled: false,
```

### 5. Group Related Overrides
```typescript
createDefaultEntityLibraryConfig({
  // ... core config ...
  
  // Export feature group
  features_export_enabled: true,
  features_export_formats: ['csv', 'excel'],
  features_export_scope: 'all',
  features_export_defaultFilename: 'my-export',
  
  // Permissions group
  features_permissions_view: 'entity:read',
  features_permissions_create: 'entity:create',
  features_permissions_edit: 'entity:update',
  features_permissions_delete: 'entity:delete',
})
```

## Migration Guide

### From Old EntityConfig
```typescript
// OLD
const oldConfig: EntityConfig = {
  entityName: 'attribute-option',
  basePath: '/attribute-options',
  tableConfig,
  statusEnum,
  getEntityId: (e) => e.id,
  useGetAll,
  useUpdate,
  queryKeyPrefix: '/api',
};

// NEW
const newConfig = createEntityLibraryConfig(
  createDefaultEntityLibraryConfig({
    entityId: 'attribute-option',
    displayName: 'Attribute Option',
    displayNamePlural: 'Attribute Options',
    basePath: '/attribute-options',
    apiKeyPrefix: '/api/attribute-options',
    getEntityId: (e) => e.id,
    statusEnum,
    useGetAll,
    useUpdate,
    tableConfig,
    // All features get sensible defaults
    // Override as needed
  })
);
```

## FAQ

### Q: Why so many fields?
**A:** Explicitness prevents forgotten features. Every field represents a real entity-library capability.

### Q: Can I use optional fields?
**A:** No. Use `false` or `'NA'` to show features were considered and rejected.

### Q: What if I don't need a feature?
**A:** Set it to `false` or `'NA'`. This documents the decision.

### Q: Do I need to specify every field manually?
**A:** No. Use `createDefaultEntityLibraryConfig()` for sensible defaults, then override.

### Q: How do I know what features are available?
**A:** Read the config interface or look at a complete example config.

### Q: Can I add custom features?
**A:** Yes, use `features_bulkActions_custom` and `features_rowActions_custom` arrays.

## Examples

See:
- [entity-library.config.ts](../src/app/(protected)/(features)/system-config-attribute-options/config/entity-library.config.ts) - Full example

## Scripts

```bash
# Validate all configs
tsx scripts/check-entity-configs.ts

# Type-check entity library
npm run entity-library:typecheck
```

## Summary

The comprehensive configuration system ensures:
- ✅ No overlooked capabilities
- ✅ Explicit decisions documented
- ✅ Validation catches mistakes
- ✅ Easy discoverability
- ✅ Consistent behavior across entities
- ✅ Type safety throughout
