# Entity Management Framework

A comprehensive framework for building CRUD-based entity management interfaces with tables, forms, and modals following atomic design principles.

## Framework Overview

The Entity Management framework provides a flexible system for managing entities (database records) with consistent CRUD operations, form handling, data tables, and permission controls.

### Key Features

- **Complete CRUD Operations**: Create, read, update, and delete entities with a consistent API
- **Form Management**: Flexible form building with sections, field dependencies, and validation
- **Data Tables**: Sortable, filterable, searchable tables with pagination and bulk actions
- **Permission Controls**: Role-based access control integration
- **UI Components**: Follows atomic design principles with atoms, molecules, organisms, and templates

## Architecture 

The framework follows atomic design and feature-based architecture:

```
entity-management/
├── components/                # UI components organized by atomic design
│   ├── atoms/                 # Basic UI elements
│   ├── molecules/             # Combinations of atoms
│   ├── organisms/             # Complex components made of molecules
│   ├── templates/             # Page layouts
│   ├── data-table/            # Data table components
│   ├── entity-form/           # Form components
│   ├── form-fields/           # Field renderer components
│   └── ...
├── context/                   # React context providers
├── hooks/                     # Custom React hooks
├── services/                  # API and other services
├── store/                     # State management (Zustand)
├── types/                     # TypeScript type definitions
├── utils/                     # Utility functions
└── validation/                # Validation logic
```

## Main Components

### EntityManager

The main entry point for creating entity management interfaces:

```tsx
<EntityManager
  endpoints={{
    getAll: '/api/users',
    getById: '/api/users/{id}',
    create: '/api/users',
    update: '/api/users/{id}',
    delete: '/api/users/{id}',
  }}
  permissions={{
    feature: 'users',
    view: 'users:view',
    create: 'users:create',
    update: 'users:update',
    delete: 'users:delete',
  }}
  labels={{
    entityName: 'User',
    entityNamePlural: 'Users',
    createTitle: 'Create New User',
    editTitle: 'Edit User',
    viewTitle: 'User Details',
  }}
  columns={[
    // Table column definitions
  ]}
  formFields={[
    // Form field definitions
  ]}
  formSections={[
    // Form section definitions
  ]}
/>
```

### EntityTable

Table component for displaying, filtering, and selecting entities:

```tsx
<EntityTable
  columns={columns}
  filterableColumns={['status', 'role']}
  searchableColumns={['name', 'email']}
  enableRowSelection={true}
  enableRowClick={true}
  onRowClick={(item) => showDetails(item)}
/>
```

### EntityForm

Form component for creating, editing, and viewing entities:

```tsx
<EntityForm
  formMode="create"
  fields={formFields}
  sections={formSections}
  onSubmit={handleSubmit}
  validationSchema={validationSchema}
/>
```

## Hooks

- `useEntityManager`: Access entity manager context
- `useEntityModal`: Manage entity modals
- `useEntityPermissions`: Check permissions for actions
- `useFormDependencies`: Handle form field dependencies
- `useDependentFields`: Fetch dependent options (for dropdowns)

## State Management

Uses Zustand for state management:

```tsx
const entityStore = createEntityStore<User, UserFilter>('users', {
  defaultPageSize: 10,
  defaultFilters: { status: 'active' },
});
```

## Types and Interfaces

```tsx
interface EntityManagerProps<TData extends BaseEntity = any, TFilter = any> {
  // Core configuration
  endpoints: EntityApiEndpoints;
  permissions?: EntityPermissions;
  labels: EntityLabels;
  
  // Table configuration
  columns: ColumnDef<TData, any>[];
  tableProps?: Partial<EntityDataTableProps<TData, any>>;
  
  // Form configuration
  formFields?: FieldConfig[];
  formSections?: SectionConfig[];
  defaultValues?: Partial<TData>;
  // ...
}
```

## Usage Guidelines

1. **Use Atomic Design**: Follow the atoms -> molecules -> organisms pattern
2. **Feature-Based Structure**: Keep entity-specific components in their feature folders
3. **Core vs Features**: This framework is a core module that should be consumed by features
4. **TypeScript Best Practices**: Always use proper types instead of `any`
5. **Consistent Naming**: Follow the naming conventions in the codebase

## Future Improvements

- Add comprehensive test suite
- Implement form field polymorphism
- Enhance accessibility features
- Add visual customization options

## Development Guidelines

When modifying the Entity Management framework:

1. Ensure backward compatibility
2. Write comprehensive tests
3. Document public APIs
4. Follow atomic design principles
5. Avoid duplicate code
6. Use TypeScript properly (avoid `any` types)