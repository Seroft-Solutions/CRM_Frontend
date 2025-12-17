# Entity Library – Public API

This document defines what is considered **public** (stable, intended for feature code to import) vs **internal** (implementation detail) within `src/entity-library`.

## Public imports (recommended)

Use these entrypoints from feature code:

- `@/entity-library`
  - `EntityTablePage`
  - `createEntityActions`
  - Re-exports from `@/entity-library/config`
  - Re-exports from `@/entity-library/types`

- `@/entity-library/config`
  - `EntityConfig`, `EntityLibraryConfig`
  - `validateEntityLibraryConfig`, `createEntityLibraryConfig`, `createDefaultEntityLibraryConfig`
  - Table config types (columns, actions, pagination, sorting, etc.)

## Internal modules (do not import from features)

These paths are **internal implementation details** and should only be imported from within the entity-library itself:

- `@/entity-library/components/tables/*`
- `@/entity-library/components/forms/*`
- `@/entity-library/hooks/*`
- `@/entity-library/utils/*`

Rationale: features should remain DTO-driven (configs/forms only) and avoid building UI by stitching table micro-components together.

## Notes

- The root barrel `src/entity-library/index.ts` is intentionally small to reduce accidental coupling.
- If a feature needs additional capabilities, prefer extending `EntityTablePage`/config types rather than importing internal micro-components.
