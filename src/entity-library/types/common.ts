export type EntityId = string | number;

export type Nullable<T> = T | null | undefined;

export type KeyOf<TEntity> = Extract<keyof TEntity, string>;

export interface PaginatedResult<T> {
  items: T[];
  total?: number;
}
