export interface SortConfig<TEntity extends object> {
  field: keyof TEntity;
  direction: 'asc' | 'desc';
}
