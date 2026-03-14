export interface ColumnVisibilityConfig<TEntity extends object> {
  defaultHidden?: Array<keyof TEntity>;
  storageKey?: string;
  userConfigurable?: boolean;
}
