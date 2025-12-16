# Entity Library Config Quick Reference

## ✅ Required Core Fields
```typescript
entityId: string                    // Unique identifier
displayName: string                 // Singular name
displayNamePlural: string          // Plural name
basePath: string                    // Route path
apiKeyPrefix: string               // Query key prefix
getEntityId: (entity) => number    // ID extractor
statusEnum: StatusEnum             // Status values
useGetAll: Hook                    // Fetch hook
useUpdate: Hook                    // Update hook
tableConfig: TableConfig           // Column config
```

## 🎨 Feature Categories

### 📑 Tabs (Status Filtering)
- `features_tabs_enabled`
- `features_tabs_defaultTab`
- `features_tabs_customLabels`

### 🔍 Search & Filters
- `features_search_enabled`
- `features_search_placeholder`
- `features_filters_enabled`
- `features_filters_collapsedByDefault`
- `features_filters_showActiveChips`

### ⬆️⬇️ Sorting
- `features_sorting_enabled`
- `features_sorting_multiColumn`
- `features_sorting_defaultField`
- `features_sorting_defaultDirection`

### 📄 Pagination
- `features_pagination_enabled`
- `features_pagination_defaultPageSize`
- `features_pagination_pageSizeOptions`
- `features_pagination_showTotalCount`
- `features_pagination_showPageNumbers`
- `features_pagination_showFirstLast`
- `features_pagination_strategy`

### ✅ Selection
- `features_selection_enabled`
- `features_selection_enableSelectAll`
- `features_selection_maxSelection`
- `features_selection_showCount`

### 🔨 Bulk Actions
- `features_bulkActions_enabled`
- `features_bulkActions_setActive`
- `features_bulkActions_setInactive`
- `features_bulkActions_archive`
- `features_bulkActions_delete`
- `features_bulkActions_custom`

### 🎯 Row Actions
- `features_rowActions_enabled`
- `features_rowActions_view`
- `features_rowActions_edit`
- `features_rowActions_duplicate`
- `features_rowActions_setActive`
- `features_rowActions_setInactive`
- `features_rowActions_archive`
- `features_rowActions_delete`
- `features_rowActions_custom`

### 👁️ Column Visibility
- `features_columnVisibility_enabled`
- `features_columnVisibility_storageKey`
- `features_columnVisibility_allowReorder`
- `features_columnVisibility_pinnedColumns`

### 📤 Export
- `features_export_enabled`
- `features_export_formats`
- `features_export_scope`
- `features_export_defaultFilename`

### 📥 Import
- `features_import_enabled`
- `features_import_formats`
- `features_import_showPreview`
- `features_import_validateBeforeImport`

### 🔄 Refresh
- `features_refresh_enabled`
- `features_refresh_autoRefresh`
- `features_refresh_intervalSeconds`
- `features_refresh_showTimestamp`

### 📭 Empty State
- `features_emptyState_title`
- `features_emptyState_description`
- `features_emptyState_showCreateButton`
- `features_emptyState_icon`

### ⏳ Loading
- `features_loading_skeletonType`
- `features_loading_skeletonRows`
- `features_loading_message`

### ❌ Error Handling
- `features_error_showBoundary`
- `features_error_message`
- `features_error_showRetry`
- `features_error_autoRetry`
- `features_error_maxRetries`

### 📱 Responsive
- `features_responsive_enabled`
- `features_responsive_mobileBreakpoint`
- `features_responsive_useCardLayout`
- `features_responsive_hiddenColumnsMobile`

### ♿ Accessibility
- `features_a11y_keyboardNavigation`
- `features_a11y_screenReaderAnnouncements`
- `features_a11y_tableAriaLabel`
- `features_a11y_focusIndicators`

### 🎨 Theming
- `features_theme_primaryColor`
- `features_theme_accentColor`
- `features_theme_density`
- `features_theme_zebraStriping`

### ⚡ Performance
- `features_performance_virtualScrolling`
- `features_performance_virtualRowHeight`
- `features_performance_debounceMs`
- `features_performance_optimisticUpdates`

### 🔐 Permissions
- `features_permissions_view`
- `features_permissions_create`
- `features_permissions_edit`
- `features_permissions_delete`
- `features_permissions_bulkActions`
- `features_permissions_export`
- `features_permissions_import`

### 📊 Analytics
- `features_analytics_enabled`
- `features_analytics_eventPrefix`
- `features_analytics_trackPageViews`
- `features_analytics_trackActions`
- `features_analytics_trackSearch`

## 💡 Quick Start

```typescript
import { createEntityLibraryConfig, createDefaultEntityLibraryConfig } from '@/entity-library';

export const myConfig = createEntityLibraryConfig(
  createDefaultEntityLibraryConfig({
    // ✅ REQUIRED: Core fields
    entityId: 'my-entity',
    displayName: 'My Entity',
    displayNamePlural: 'My Entities',
    basePath: '/my-entities',
    apiKeyPrefix: '/api/my-entities',
    getEntityId: (entity) => entity.id,
    statusEnum: MyEntityStatus,
    useGetAll: useGetAllMyEntities,
    useUpdate: useUpdateMyEntity,
    tableConfig: myTableConfig,
    
    // 🎯 OVERRIDE: Only what differs from defaults
    features_export_enabled: true,
    features_export_formats: ['csv', 'excel'],
    features_permissions_view: 'myEntity:read',
  })
);
```

## 🔍 Validation

```bash
# Check all configs
npx tsx scripts/check-entity-configs.ts

# Type-check
npm run entity-library:typecheck
```

## 📋 Common Patterns

### Minimal Config (View-Only)
```typescript
features_selection_enabled: false,
features_bulkActions_enabled: false,
features_rowActions_edit: false,
features_rowActions_archive: false,
```

### Export-Heavy Config
```typescript
features_export_enabled: true,
features_export_formats: ['csv', 'excel', 'json', 'pdf'],
features_export_scope: 'selected',
features_selection_enabled: true,
```

### High-Performance Config
```typescript
features_performance_virtualScrolling: true,
features_performance_debounceMs: 500,
features_performance_optimisticUpdates: true,
features_pagination_enabled: false, // Virtual scroll replaces pagination
```

## ⚠️ Common Mistakes

❌ **Forgetting to set a field**
```typescript
// Will throw validation error
const config = { entityId: 'test' };
```

❌ **Using undefined instead of 'NA'**
```typescript
features_search_placeholder: undefined  // Bad
features_search_placeholder: 'NA'       // Good
```

❌ **Enabling dependent features incorrectly**
```typescript
features_export_scope: 'selected',      // Requires selection
features_selection_enabled: false,      // Error!
```

✅ **Correct approach**
```typescript
features_export_scope: 'selected',
features_selection_enabled: true,       // Must enable
```

## 📚 Full Documentation

See: [docs/entity-library-comprehensive-config.md](./entity-library-comprehensive-config.md)
