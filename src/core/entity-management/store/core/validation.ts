import { z } from 'zod';
import { FormMode } from '@/features/core/tanstack-query-api';
import { ColumnFiltersState, SortingState, VisibilityState } from '@tanstack/react-table';

// Primitive schemas
export const formModeSchema = z.enum(['create', 'edit', 'view', 'delete']);

export const columnFilterSchema = z.object({
  id: z.string(),
  value: z.any()
});

export const sortingSchema = z.object({
  id: z.string(),
  desc: z.boolean()
});

// State schemas
export const formStateSchema = <TData>() => z.object({
  isModalOpen: z.boolean(),
  formMode: formModeSchema,
  selectedItem: z.custom<TData | null>(),
  formData: z.record(z.any()),
  isSubmitting: z.boolean(),
  submitError: z.string().nullable()
});

export const tableStateSchema = <TData>() => z.object({
  items: z.array(z.custom<TData>()),
  totalItems: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
  currentPage: z.number().int().nonnegative(),
  pageSize: z.number().int().positive(),
  isLoading: z.boolean(),
  error: z.instanceof(Error).nullable()
});

export const selectionStateSchema = <TData>() => z.object({
  selectedItems: z.array(z.custom<TData>()),
  selectedIds: z.array(z.string())
});

export const filterStateSchema = <TFilter>() => z.object({
  filters: z.custom<TFilter>(),
  columnFilters: z.array(columnFilterSchema),
  columnVisibility: z.record(z.boolean()),
  globalFilter: z.string(),
  searchQuery: z.string(),
  searchColumn: z.string(),
  sorting: z.array(sortingSchema)
});

// Configuration schemas
export const entityStoreConfigSchema = <TFilter>() => z.object({
  storeId: z.string().optional(),
  defaultPageSize: z.number().int().positive().optional(),
  defaultSearchColumn: z.string().optional(),
  defaultFilters: z.custom<TFilter>().optional(),
  persist: z.boolean().optional(),
  enableLogging: z.boolean().optional(),
  updateThreshold: z.number().int().positive().optional()
});

// Helper functions
export const validateFormState = <TData>(data: unknown) => {
  return formStateSchema<TData>().parse(data);
};

export const validateTableState = <TData>(data: unknown) => {
  return tableStateSchema<TData>().parse(data);
};

export const validateSelectionState = <TData>(data: unknown) => {
  return selectionStateSchema<TData>().parse(data);
};

export const validateFilterState = <TFilter>(data: unknown) => {
  return filterStateSchema<TFilter>().parse(data);
};

export const validateStoreConfig = <TFilter>(data: unknown) => {
  return entityStoreConfigSchema<TFilter>().parse(data);
};