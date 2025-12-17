# Entity Library – Public API

This document defines what is considered **public** (stable, intended for feature code to import) vs **internal** (implementation detail) within `src/entity-library`.

## Source of truth

- Public API definitions live in `src/entity-library/api/`.
- Feature code should import only from `@/entity-library`, `@/entity-library/config`, and `@/entity-library/types`.
  - Optional: `@/entity-library/actions` and `@/entity-library/components` (both map to the API facades).

## Public imports (recommended)

Use these entrypoints from feature code:

- `@/entity-library`
  - `EntityTablePage`, `EntityTable`
  - `EntityFormPage`, `EntityForm`, `FormWizard`
  - `createEntityActions`
  - Re-exports from `@/entity-library/config`
  - Re-exports from `@/entity-library/types`

- `@/entity-library/config`
  - `EntityTablePageConfig`, `StatusEnum`, `StatusTab`
  - Table config types (columns, actions, pagination, sorting, etc.)
  - Form config types (fields, wizard steps, etc.)

## Internal modules (do not import from features)

These paths are **internal implementation details** and should only be imported from within the entity-library itself:

- `@/entity-library/components/tables/*` (not part of API)
- `@/entity-library/components/forms/*` (not part of API)
- `@/entity-library/hooks/*` (blocked by `tsconfig.json` paths)
- `@/entity-library/utils/*` (blocked by `tsconfig.json` paths)

Rationale: features should remain DTO-driven (configs/forms only) and avoid building UI by stitching table micro-components together.

## Notes

- If a feature needs additional capabilities, prefer extending the API facades (`EntityTablePage`, `EntityFormPage`, etc.) and config types rather than importing internal micro-components.
