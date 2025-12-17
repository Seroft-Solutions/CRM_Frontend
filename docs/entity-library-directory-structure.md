# Entity Library Directory Structure

Clean, organized, and purpose-driven architecture.

## 📁 Directory Organization

```
src/entity-library/
├── actions/              # Entity action creators
│   ├── createEntityActions.ts
│   └── index.ts
│
├── components/           # React components
│   ├── common/          # Shared UI components
│   ├── forms/           # Form components
│   ├── tables/          # Table components
│   ├── EntityTablePage.tsx  # Complete table page component
│   └── index.ts
│
├── config/              # Configuration system
│   ├── entity-library-config.ts  # EntityConfig + shared config types
│   ├── types.ts         # Table/column config types
│   └── index.ts
│
├── hooks/               # React hooks
│   └── useColumnVisibility.ts
│
├── types/               # Core TypeScript types
│   ├── common.ts        # Shared types
│   ├── entity-table.ts  # Table-specific types
│   ├── table.ts         # Table state types
│   └── index.ts
│
├── utils/               # General utilities
│   ├── rhf/            # React Hook Form utilities
│   ├── useEntityTableModel.ts
│   ├── validateWizardStep.ts
│   ├── zod-to-rhf.ts
│   └── index.ts
│
└── index.ts            # Main entry point
```

## 🎯 Directory Responsibilities

### `/actions`
**Purpose**: Entity operation creators and action factories

**Contains**:
- `createEntityActions()` - Factory for bulk/row CRUD actions
- Status update actions (activate, deactivate, archive)
- Custom action builders

**When to use**: Creating reusable entity operations that work across different entities

### `/components`
**Purpose**: All React UI components

**Subdirectories**:
- `/common` - Reusable UI primitives
- `/forms` - Form components and wizards
- `/tables` - Table-related components (rows, cells, headers, pagination)
- Root level - High-level composed components like `EntityTablePage`

**When to use**: Building or modifying UI elements

### `/config`
**Purpose**: Configuration system - types

**Contains**:
- `entity-library-config.ts` - `EntityConfig` and shared config types
- `types.ts` - Table, column, pagination config types

**Key Types**:
- `EntityConfig` - Simple config (8 core fields)
- `TableConfig` - Column definitions
- `StatusEnum` - Entity status type

**When to use**: Creating or modifying entity configurations

### `/hooks`
**Purpose**: Reusable React hooks

**Contains**:
- `useColumnVisibility` - Manage column show/hide state
- Custom hooks for entity-library features

**When to use**: Extracting stateful logic to share across components

### `/types`
**Purpose**: Core TypeScript type definitions

**Contains**:
- `common.ts` - Shared types (EntityId, etc.)
- `entity-table.ts` - Table component prop types
- `table.ts` - Table state and filter types

**When to use**: Type checking, not configuration (config goes in `/config`)

### `/utils`
**Purpose**: Pure utility functions and model helpers

**Contains**:
- `useEntityTableModel` - Table state management
- `validateWizardStep` - Form validation
- `zod-to-rhf` - Schema conversion
- `/rhf` - React Hook Form utilities

**When to use**: Stateless logic, data transformations, helpers

## 📋 Import Patterns

### For Configuration
```typescript
import { 
  EntityConfig,
  TableConfig,
  StatusEnum,
} from '@/entity-library/config';
```

### For Actions
```typescript
import { createEntityActions } from '@/entity-library/actions';
```

### For Components
```typescript
import { 
  EntityTablePage,
  EntityTable,
} from '@/entity-library/components';
```

### For Hooks
```typescript
import { useColumnVisibility } from '@/entity-library/hooks';
```

### For Types
```typescript
import type { 
  TableState,
  EntityId,
} from '@/entity-library/types';
```

### For Utilities
```typescript
import { useEntityTableModel } from '@/entity-library/utils';
```

## 🔄 Migration from Old Structure

### Old (Scattered)
```
utils/
  ├── createEntityActions.ts         ❌ Mixed with other utils
  ├── createDefaultConfig.ts         ❌ Mixed with other utils
types/
  ├── entity-config.ts               ❌ Mixed with core types
  ├── entity-library-config.ts       ❌ Config in types dir
```

### New (Organized)
```
actions/
  └── createEntityActions.ts         ✅ Clear purpose
config/
  ├── entity-library-config.ts       ✅ All config together
  └── helpers/
      └── createDefaultConfig.ts     ✅ Config helpers grouped
types/
  └── [core types only]              ✅ No config here
```

## 📊 File Counts by Directory

| Directory | Files | Purpose |
|-----------|-------|---------|
| `/actions` | 2 | Action creators |
| `/components` | 20+ | React UI |
| `/config` | 5 | Configuration |
| `/hooks` | 2 | React hooks |
| `/types` | 4 | Core types |
| `/utils` | 10+ | Utilities |

## 🎯 Design Principles

1. **Purpose-Driven**: Each directory has ONE clear responsibility
2. **No Mixing**: Actions ≠ Utils ≠ Config ≠ Types
3. **Discoverability**: Clear naming makes imports obvious
4. **Scalability**: Easy to add new files in the right place
5. **No Legacy**: Old patterns removed, only best practices remain

## ✅ Benefits

- **Clear Mental Model**: Know exactly where to find/add code
- **Better Imports**: Semantic imports (`@/entity-library/actions`)
- **Easier Refactoring**: Changes isolated to specific directories
- **Faster Onboarding**: Directory names explain purpose
- **No Duplication**: Single source of truth for each concern

## 📝 Adding New Code

### New Action Creator
```
actions/
  ├── createEntityActions.ts
  └── createMyNewAction.ts  ← Add here
```

### New Config Helper
```
config/
  └── helpers/
      ├── createDefaultConfig.ts
      └── createMyConfigHelper.ts  ← Add here
```

### New Component
```
components/
  └── tables/              ← Add table components here
  └── forms/               ← Add form components here
  └── MyNewFeature.tsx     ← Add high-level components at root
```

### New Hook
```
hooks/
  ├── useColumnVisibility.ts
  └── useMyNewHook.ts      ← Add here
```

## 🚀 Quick Start

1. **Creating a new entity config**:
   - Import from `@/entity-library/config`
   - Create an `EntityConfig` with a `TableConfig`

2. **Using entity table**:
   - Import `EntityTablePage` from `@/entity-library/components`
   - Pass your config

3. **Adding custom actions**:
   - Import `createEntityActions` from `@/entity-library/actions`
   - Extend with custom actions

4. **Creating custom components**:
   - Add to appropriate subdirectory in `/components`
   - Export from `components/index.ts`

## 📚 See Also

- `src/entity-library/README.md`
