# Entity Library – External API

Everything inside `src/entity-library/api/` is intended to be imported from feature code.

Recommended imports:

- `@/entity-library`
  - `EntityTablePage`, `EntityTable`
  - `EntityFormPage`, `EntityForm`, `FormWizard`
  - `createEntityActions`
  - Re-exports from `@/entity-library/config` and `@/entity-library/types`

- `@/entity-library/actions`
  - `createEntityActions` (plus exported helper types)

- `@/entity-library/components`
  - `EntityTablePage`, `EntityTable`
  - `EntityFormPage`, `EntityForm`, `FormWizard`

- `@/entity-library/config`
  - Entity: `EntityTablePageConfig`, `StatusEnum`, `StatusTab`
  - Table configs: `TableConfig`, `ColumnConfig`, `PaginationConfig`, `SortConfig`, `RowActionConfig`, `BulkActionConfig`, etc.
  - Form configs: `FormConfig`, `FieldConfig`, `WizardConfig`, etc.

- `@/entity-library/types`
  - Shared types: `EntityId`, `TableState`, `EntityTableProps`, etc.

Internal modules (not available to feature code):

- `@/entity-library/hooks/*` (blocked via `tsconfig.json` paths)
- `@/entity-library/utils/*` (blocked via `tsconfig.json` paths)
