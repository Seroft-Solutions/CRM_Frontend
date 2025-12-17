# @crmcup/entity-library

**A comprehensive, configuration-driven entity management system for React applications.**

Build complete CRUD interfaces for any entity type with minimal code—just provide a configuration object and let the library handle tables, forms, actions, and state management.

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Purpose & Goals](#-purpose--goals)
- [Architecture](#-architecture)
- [Entry Point](#-entry-point)
- [Quick Start](#-quick-start)
- [Configuration System](#-configuration-system)
- [Core Components](#-core-components)
- [Usage Guide](#-usage-guide)
- [API Reference](#-api-reference)
- [Directory Structure](#-directory-structure)
- [Future Scalability](#-future-scalability)
- [Best Practices](#-best-practices)
- [Portability](#-portability)

---

## 🎯 Overview

The Entity Library is a **zero-coupling, DTO-driven table and form system** that eliminates boilerplate for CRUD operations across CRM entities. Instead of writing custom table components, pagination logic, filters, and actions for each entity, you define a simple configuration and the library handles everything.

### What You Get

- ✅ **Complete table UI** with sorting, filtering, pagination, column visibility
- ✅ **Status-based tabs** (Active, Inactive, Archived, All)
- ✅ **Bulk & row actions** (activate, deactivate, archive, delete)
- ✅ **Type-safe configuration** with comprehensive validation
- ✅ **Automatic query invalidation** with TanStack Query integration
- ✅ **Responsive design** with navy/yellow theme
- ✅ **Accessibility-first** components from shadcn/ui
- ✅ **Zero CRM coupling** - completely portable

### Before & After

**Before (Custom Implementation)**:
```tsx
// 200+ lines of custom table component per entity
// Custom hooks for pagination, filters, sorting
// Manual query invalidation
// Duplicated action handlers
// Inconsistent UX across entities
```

**After (Entity Library)**:
```tsx
// 20 lines of configuration
import { EntityTablePage } from '@/entity-library';

export default function SystemConfigsPage() {
  return <EntityTablePage config={systemConfigEntity} />;
}
```

---

## 🎯 Purpose & Goals

### Core Purpose
Provide a **reusable, type-safe foundation** for building entity management interfaces that:
1. Eliminates 95% of boilerplate code
2. Ensures consistent UX across all entities
3. Maintains strict type safety from backend DTOs to UI
4. Scales effortlessly as new entities are added

### Design Goals

#### 1. **Zero CRM Coupling**
- No imports from `src/app`, `src/features`, or `src/core`
- Can be copied to any Next.js/React project
- Framework-agnostic where possible

#### 2. **Configuration Over Code**
- Declarative configuration objects instead of imperative code
- All entity capabilities defined in a single config file
- Type-safe configuration with compile-time validation

#### 3. **Type Safety First**
- Fully generic TypeScript implementation
- DTOs from backend drive all types
- Orval-generated hooks ensure API contract compliance

#### 4. **Comprehensive, Not Minimal**
- All features explicitly configured (no magic defaults that hide capabilities)
- Validation ensures no config fields are forgotten
- Clear errors when configuration is incomplete

#### 5. **Professional Component Design**
- Proper naming: `EntityTable`, `EntityForm` (not "shared" or "common")
- Micro-components: small, composable, single-responsibility
- Follows React best practices and Next.js App Router conventions

---

## 🏗️ Architecture

### High-Level Design

```
┌─────────────────────────────────────────────────────────────┐
│                     Feature Layer                            │
│  (system-configs, customers, products, etc.)                 │
│                                                              │
│  • entity.config.ts    ← Simple EntityConfig                │
│  • page.tsx            ← Uses EntityTablePage                │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ Imports from
                     ↓
┌─────────────────────────────────────────────────────────────┐
│                   Entity Library                             │
│  (Reusable, zero-coupling, DTO-driven)                      │
│                                                              │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐           │
│  │  Config    │  │ Components │  │  Actions   │           │
│  │  System    │  │            │  │            │           │
│  │            │  │  • Tables  │  │  • Bulk    │           │
│  │  • Types   │  │  • Forms   │  │  • Row     │           │
│  │  • Schema  │  │  • Pages   │  │  • Custom  │           │
│  │  • Helpers │  │            │  │            │           │
│  └────────────┘  └────────────┘  └────────────┘           │
│                                                              │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐           │
│  │   Hooks    │  │   Types    │  │   Utils    │           │
│  │            │  │            │  │            │           │
│  │  • Column  │  │  • Table   │  │  • Model   │           │
│  │    Vis     │  │  • Entity  │  │  • Zod/RHF │           │
│  └────────────┘  └────────────┘  └────────────┘           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ Uses
                     ↓
┌─────────────────────────────────────────────────────────────┐
│              External Dependencies                           │
│                                                              │
│  • TanStack Query (data fetching)                           │
│  • Orval (API client generation)                            │
│  • shadcn/ui (UI components)                                │
│  • React Hook Form + Zod (forms)                            │
└─────────────────────────────────────────────────────────────┘
```

### Architecture Principles

#### 1. **Layered Architecture**
```
Feature Layer (entity-specific)
    ↓
Entity Library (reusable)
    ↓
External Dependencies (React, Query, UI)
```

#### 2. **Dependency Inversion**
- Library defines interfaces (config, hooks)
- Features implement specifics (DTOs, Orval hooks)
- No upward dependencies from library to features

#### 3. **Single Source of Truth**
- Configuration defines all behavior
- No hidden state or implicit logic
- Validation enforces completeness

#### 4. **Component Composition**
```
EntityTablePage (high-level)
  ├── Tabs (status filtering)
  ├── EntityTable (table logic)
  │   ├── TableHeader (columns, sorting)
  │   ├── TableBody (rows, data)
  │   └── TablePagination (page controls)
  └── Actions (bulk/row operations)
```

---

## 🚪 Entry Point

### Main Export: `index.ts`

The library's entry point organizes all exports by concern:

```typescript
/**
 * Entity Library Entry Point
 * 
 * Import Order:
 * 1. Configuration (types, validation, helpers)
 * 2. Actions (CRUD operation creators)
 * 3. Hooks (React hooks)
 * 4. Types (core TypeScript definitions)
 * 5. Utilities (helper functions)
 * 6. Components (React UI)
 */

// Configuration system (types, validation, helpers)
export * from './config';

// Action creators
export * from './actions';

// React hooks
export * from './hooks';

// Core types
export * from './types';

// Utilities
export * from './utils';

// React components
export * from './components';
```

### Import Patterns

#### For Features (Recommended)
```typescript
// Configuration
import { 
  EntityConfig,
} from '@/entity-library/config';

// Components
import { EntityTablePage } from '@/entity-library';

// Actions (if custom actions needed)
import { createEntityActions } from '@/entity-library/actions';
```

#### Within Entity Library
```typescript
// Absolute imports for clarity
import { TableConfig } from '@/entity-library/config';
import { createEntityActions } from '@/entity-library/actions';
import type { TableState } from '@/entity-library/types';
```

---

## 🚀 Quick Start

### Step 1: Create Entity Config

```typescript
// src/features/system-configs/config/entity.config.ts
import { EntityConfig } from '@/entity-library/config';
import { SystemConfigDTO, SystemConfigStatus } from '@/generated/api';
import { 
  useGetAllSystemConfigs,
  useUpdateSystemConfig 
} from '@/generated/hooks';

export const systemConfigEntity: EntityConfig<
  SystemConfigDTO,
  typeof SystemConfigStatus
> = {
  entityName: 'System Configs',
  basePath: '/system-configs',
  queryKeyPrefix: '/api/system-configs',
  statusEnum: SystemConfigStatus,
  getEntityId: (entity) => entity.id,
  useGetAll: useGetAllSystemConfigs,
  useUpdate: useUpdateSystemConfig,
  
  tableConfig: {
    columns: [
      { 
        field: 'configKey', 
        label: 'Config Key', 
        sortable: true, 
        filterable: true 
      },
      { 
        field: 'configValue', 
        label: 'Value', 
        sortable: false, 
        filterable: true 
      },
      { 
        field: 'description', 
        label: 'Description', 
        sortable: false, 
        filterable: false 
      },
    ],
    defaultSort: { field: 'configKey', direction: 'asc' },
    pagination: {
      enabled: true,
      defaultPageSize: 10,
      pageSizeOptions: [10, 25, 50],
    },
  },
};
```

### Step 2: Create Page Component

```typescript
// src/app/(dashboard)/system-configs/page.tsx
import { EntityTablePage } from '@/entity-library';
import { systemConfigEntity } from '@/features/system-configs/config/entity.config';

export default function SystemConfigsPage() {
  return <EntityTablePage config={systemConfigEntity} />;
}
```

### Step 3: Done! 🎉

You now have a complete entity management interface with:
- Sortable, filterable table
- Status tabs (Active, Inactive, Archived, All)
- Bulk actions (activate, deactivate, archive)
- Row actions (edit, activate, deactivate, archive)
- Pagination with configurable page sizes
- Column visibility controls
- Responsive design
- Type-safe DTOs

---

## ⚙️ Configuration System

### EntityConfig (Simple)
Build entity table pages by providing a single `EntityConfig` object.

**Contains**: 8 essential fields
- Entity identity (name, path)
- Data integration (hooks, ID extractor)
- Table configuration (columns, sorting, pagination)

```typescript
interface EntityConfig<TEntity, TStatus> {
  entityName: string;
  basePath: string;
  tableConfig: TableConfig<TEntity>;
  statusEnum: TStatus;
  getEntityId: (entity: TEntity) => number | undefined;
  useGetAll: (params: any) => QueryResult;
  useUpdate: () => MutationHook;
  queryKeyPrefix: string;
}
```

---

## 🧩 Core Components

### EntityTablePage

**Purpose**: Complete table page with tabs, filters, pagination, and actions

**Props**:
```typescript
interface EntityTablePageProps<TEntity, TStatus> {
  config: EntityConfig<TEntity, TStatus>;
}
```

**Features**:
- Status tabs (Active, Inactive, Archived, All)
- Sortable columns
- Filterable columns
- Pagination controls
- Bulk selection
- Bulk actions (activate, deactivate, archive)
- Row actions (edit, status changes)
- Refresh button
- Column visibility toggle
- Responsive layout

**Example**:
```typescript
<EntityTablePage config={systemConfigEntity} />
```

### EntityTable

**Purpose**: Core table component without page-level UI (tabs, refresh)

**Use when**: Need table in custom layout (e.g., embedded in dialog)

**Props**:
```typescript
interface EntityTableProps<TEntity> {
  entities: TEntity[];
  columns: ColumnConfig<TEntity>[];
  state: TableState<TEntity>;
  onStateChange: (state: TableState<TEntity>) => void;
  // ... other props
}
```

---

## 📚 Usage Guide

### Basic Entity Setup

1. **Generate API client** (Orval):
```bash
npm run orval
```

2. **Create entity config**:
```typescript
// features/my-entity/config/entity.config.ts
export const myEntity: EntityConfig<MyDTO, typeof MyStatus> = {
  // ... configuration
};
```

3. **Create page**:
```typescript
// app/(dashboard)/my-entity/page.tsx
import { EntityTablePage } from '@/entity-library';
import { myEntity } from '@/features/my-entity/config/entity.config';

export default function MyEntityPage() {
  return <EntityTablePage config={myEntity} />;
}
```

### Custom Actions

```typescript
import { createEntityActions } from '@/entity-library/actions';

const customActions = {
  ...createEntityActions(config),
  
  // Add custom action
  sendEmail: async (entity: MyDTO) => {
    await sendEmailAPI(entity.email);
    toast.success('Email sent');
  },
};
```

### Advanced Configuration

```typescript
// Advanced behavior is configured via `TableConfig`
export const myEntityTableConfig: TableConfig<MyDTO> = {
  columns: [
    { field: 'name', header: 'Name', sortable: true, filterable: true },
    { field: 'status', header: 'Status', sortable: true, filterable: true },
  ],
  defaultSort: { field: 'name', direction: 'asc' },
  pagination: { defaultPageSize: 25, pageSizeOptions: [10, 25, 50], showPageSizeSelector: true },
  columnVisibility: { storageKey: 'my-entity-columns', userConfigurable: true },
  rowSelection: { enabled: true },
  emptyState: { title: 'No records', description: 'Try adjusting filters.' },
};
```

---

## 📖 API Reference

### Configuration

#### `EntityConfig<TEntity, TStatus>`
Simple entity configuration with 8 core fields.

**Type Parameters**:
- `TEntity` - DTO type from backend
- `TStatus` - Status enum with ACTIVE, INACTIVE, ARCHIVED

**Fields**: See [Configuration System](#-configuration-system)

#### `TableConfig<TEntity>`
Table-specific configuration (columns, sorting, pagination).

```typescript
interface TableConfig<TEntity> {
  columns: ColumnConfig<TEntity>[];
  defaultSort?: { field: keyof TEntity; direction: 'asc' | 'desc' };
  pagination: PaginationConfig;
}
```

#### `ColumnConfig<TEntity>`
Column definition for table display.

```typescript
interface ColumnConfig<TEntity> {
  field: keyof TEntity;
  label: string;
  sortable: boolean;
  filterable: boolean;
  width?: string;
  render?: (value: any, entity: TEntity) => React.ReactNode;
}
```

### Actions

#### `createEntityActions(config)`
Factory for generating entity actions.

**Parameters**:
- `config: EntityConfig` - Entity configuration

**Returns**: Object with action functions
- `activateRow(entity)` - Activate single entity
- `deactivateRow(entity)` - Deactivate single entity
- `archiveRow(entity)` - Archive single entity
- `activateBulk(entities)` - Activate multiple
- `deactivateBulk(entities)` - Deactivate multiple
- `archiveBulk(entities)` - Archive multiple

**Example**:
```typescript
const actions = createEntityActions(systemConfigEntity);
await actions.activateRow(entity);
```

### Hooks

#### `useColumnVisibility(columns)`
Manage column show/hide state.

**Parameters**:
- `columns: ColumnConfig[]` - Table columns

**Returns**:
```typescript
{
  visibleColumns: ColumnConfig[];
  toggleColumn: (field: string) => void;
  isVisible: (field: string) => boolean;
}
```

### Utilities

#### `useEntityTableModel(config, activeTab)`
Table state management with query integration.

**Parameters**:
- `config: EntityConfig` - Entity configuration
- `activeTab: StatusTab` - Current active tab

**Returns**:
```typescript
{
  state: TableState;
  setState: (state: TableState) => void;
  queryParams: QueryParams;
  queryResult: QueryResult;
  queryClient: QueryClient;
}
```

---

## 📂 Directory Structure

```
src/entity-library/
│
├── actions/                    # Entity action creators
│   ├── createEntityActions.ts  # Factory for CRUD actions
│   └── index.ts                # Exports
│
├── components/                 # React UI components
│   ├── common/                 # Shared UI primitives
│   ├── forms/                  # Form components
│   ├── tables/                 # Table components
│   │   ├── EntityTable.tsx     # Core table
│   │   ├── TableHeader.tsx     # Header with sorting
│   │   ├── TableBody.tsx       # Data rows
│   │   └── TablePagination.tsx # Page controls
│   ├── EntityTablePage.tsx     # Complete table page
│   └── index.ts                # Exports
│
├── config/                     # Configuration system
│   ├── entity-library-config.ts    # Config interfaces
│   ├── types.ts                # Table/column types
│   └── index.ts                # Exports
│
├── hooks/                      # React hooks
│   ├── useColumnVisibility.ts  # Column toggle hook
│   └── index.ts                # Exports
│
├── types/                      # Core TypeScript types
│   ├── common.ts               # Shared types (EntityId, etc.)
│   ├── entity-table.ts         # Table prop types
│   ├── table.ts                # Table state types
│   └── index.ts                # Exports
│
├── utils/                      # Utility functions
│   ├── rhf/                    # React Hook Form utils
│   ├── useEntityTableModel.ts  # Table state manager
│   ├── validateWizardStep.ts   # Form validation
│   ├── zod-to-rhf.ts           # Schema conversion
│   └── index.ts                # Exports
│
├── index.ts                    # Main entry point
├── package.json                # Library metadata
└── README.md                   # This file
```

### Directory Responsibilities

| Directory | Purpose | When to Add Files |
|-----------|---------|------------------|
| `/actions` | Action creators and operation factories | Creating new entity operations |
| `/components` | React UI components | Adding new UI elements |
| `/config` | Configuration types and validation | Extending config capabilities |
| `/hooks` | React hooks | Extracting stateful logic |
| `/types` | Core type definitions | Adding new type categories |
| `/utils` | Pure utility functions | Adding helpers and transforms |

See [Directory Structure Guide](../../docs/entity-library-directory-structure.md) for detailed documentation.

---

## 🚀 Future Scalability

### Planned Features

#### Phase 1: Enhanced Forms
- Form wizard component
- Multi-step forms with validation
- Relationship management (one-to-many, many-to-many)
- File upload support

#### Phase 2: Advanced Tables
- Virtual scrolling for large datasets
- Inline editing
- Drag-and-drop row reordering
- Advanced filtering (date ranges, multi-select)

#### Phase 3: Data Visualization
- Export to CSV/Excel/PDF
- Print preview
- Chart generation from table data
- Report builder

#### Phase 4: Collaboration
- Real-time updates (WebSocket integration)
- Activity logs and audit trails
- Comments and annotations
- User assignments

#### Phase 5: Extensibility
- Plugin system for custom actions
- Custom column renderers
- Custom filter components
- Theme customization API

### Architecture for Growth

The library is designed to scale:

1. **Additive, Not Breaking**: New features added via config fields, existing code untouched
2. **Opt-In Complexity**: Advanced features disabled by default, enabled via config
3. **Modular Components**: Each feature in separate file, lazy-loaded when needed
4. **Type-Safe Extensions**: Generics and interfaces allow custom types throughout

### Migration Path

When adding new capabilities:

1. Add new fields to `TableConfig` / related types
2. Implement feature in the appropriate component/hook
3. Update docs and example configs

This ensures **zero breaking changes** for existing implementations.

---

## ✅ Best Practices

### Configuration

✅ **Do**:
- Use `EntityConfig` for simple tables
- Keep configs in `features/[entity]/config/` directory
- Set unused fields to `false` or `'NA'` (never leave undefined)

❌ **Don't**:
- Mix feature logic in config files
- Import from entity-library into config
- Use optional fields (all fields required for explicitness)

### Components

✅ **Do**:
- Use `EntityTablePage` for full-page tables
- Use `EntityTable` for embedded tables
- Keep custom components in feature directories
- Compose with entity-library components

❌ **Don't**:
- Modify entity-library components directly
- Create monolithic components (keep small and focused)
- Bypass config system with props drilling

### Actions

✅ **Do**:
- Use `createEntityActions()` as base
- Extend with custom actions as needed
- Handle errors with toast notifications
- Invalidate queries after mutations

❌ **Don't**:
- Duplicate action logic across entities
- Skip error handling
- Forget to invalidate related queries

### Types

✅ **Do**:
- Use DTOs from Orval generation
- Keep types in `/types` directory
- Export types from index files
- Use strict TypeScript mode

❌ **Don't**:
- Use `any` types
- Create duplicate type definitions
- Import types from feature directories

---

## 🌍 Portability

The entity-library is **intentionally self-contained** and can be copied to any Next.js/React project.

### Zero Coupling Guarantee

**No imports from**:
- `src/app` (app-specific routes)
- `src/features` (feature implementations)
- `src/core` (CRM business logic)

**Only imports from**:
- External packages (React, TanStack Query, shadcn/ui)
- Self-contained entity-library directories

### Porting to Another Project

1. Copy `src/entity-library/` directory
2. Install dependencies:
   ```bash
   npm install @tanstack/react-query
   npm install react-hook-form zod
   ```
3. Install shadcn/ui components used by library
4. Update import paths if needed
5. Generate API client (Orval or similar)
6. Create entity configs for your DTOs

### Customization Points

- **Theme**: Update colors in component files (search for `oklch(0.45_0.06_243)`)
- **UI Library**: Replace shadcn/ui with your component library
- **Data Fetching**: Swap TanStack Query for SWR or Redux
- **Form Library**: Replace React Hook Form with Formik

---

## 🤝 Contributing

### Adding New Features

1. Create feature directory (e.g., `/config`, `/actions`)
2. Implement feature with types and validation
3. Export from directory `index.ts`
4. Update main `index.ts` export
5. Add tests if applicable
6. Update this README

### Code Style

- **TypeScript strict mode** enabled
- **Functional components** with hooks
- **Named exports** (no default exports)
- **Explicit types** (no inference for public APIs)
- **Comments** for non-obvious logic

### Review Checklist

- [ ] No imports from `src/app`, `src/features`, `src/core`
- [ ] All types exported from index files
- [ ] Configuration fields added to validation
- [ ] Defaults provided in `createDefaultConfig`
- [ ] Documentation updated
- [ ] Example usage provided

---

## 📄 License

Internal CRMCup library. Proprietary.

---

## 📚 Additional Documentation

- [Directory Structure Guide](../../docs/entity-library-directory-structure.md)
- [Comprehensive Config Guide](../../docs/entity-library-comprehensive-config.md)
- [Config Quick Reference](../../docs/entity-library-config-quick-reference.md)

---

**Built with ❤️ for CRMCup**
