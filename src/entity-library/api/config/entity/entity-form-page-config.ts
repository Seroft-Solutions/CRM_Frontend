import type { FormConfig } from '../form/form-config';

export type EntityFormSubmitMode = 'create' | 'update';

export interface EntityFormPageConfig<TEntity extends object> {
  /** Human-friendly label (e.g., "System Config"). Used for default titles/toasts. */
  entityName: string;

  /** Base route for list page (e.g., "/system-configs"). Used for default redirects. */
  basePath: string;

  /** API key prefix for TanStack Query invalidation (e.g., "/api/system-configs"). */
  queryKeyPrefix: string;

  /** Whether this page submits a create or update mutation. */
  submitMode: EntityFormSubmitMode;

  /** Required for update mode unless the ID is provided via props. */
  getEntityId?: (entity: TEntity) => number | undefined;

  /** Orval-generated query hook for fetching a single entity by id (used for update). */
  useGetById?: (id: number) => {
    data?: TEntity;
    isLoading: boolean;
    error?: unknown;
    refetch?: () => void;
  };

  /** Orval-generated mutation hook for creating an entity (used for create). */
  useCreate?: () => {
    mutateAsync: (params: { data: Partial<TEntity> }) => Promise<TEntity>;
  };

  /** Orval-generated mutation hook for updating an entity (used for update). */
  useUpdate?: () => {
    mutateAsync: (params: { id: number; data: Partial<TEntity> }) => Promise<TEntity>;
  };

  /**
   * Form configuration (fields, validation).
   *
   * `onSuccess`/`onError` are handled by `EntityFormPage` and do not need to be provided.
   * `defaultValues` can be provided and will be merged with fetched entity data in update mode.
   */
  form: Omit<FormConfig<TEntity>, 'onSuccess' | 'onError'>;

  /**
   * Map loaded entity data into form default values.
   * If omitted, `EntityFormPage` will use the fetched entity object as defaults.
   */
  getDefaultValues?: (entity?: TEntity) => Partial<TEntity>;

  /** Optional form title override (defaults to "Create {entityName}" / "Edit {entityName}"). */
  title?: string;

  /** Optional cancel handler (defaults to navigating back to basePath). */
  onCancel?: () => void;

  /**
   * Optional redirect behavior after successful submit.
   * - `list` (default): navigate to `basePath`
   * - `back`: router.back()
   * - `stay`: remain on the page
   * - function: fully custom
   */
  afterSubmit?: 'list' | 'back' | 'stay' | ((entity: TEntity) => void | Promise<void>);

  /** Optional value transformer before submitting to the mutation. */
  transformSubmit?: (values: Partial<TEntity>) => Partial<TEntity> | Promise<Partial<TEntity>>;

  /** Optional callback after successful mutation (runs before `afterSubmit`). */
  onSuccess?: (entity: TEntity) => void | Promise<void>;
}
