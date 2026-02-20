export interface RowActionConfig<TEntity extends object> {
  id: string;
  label: string;
  onClick?: (row: TEntity) => void | Promise<void>;
  requiresConfirmation?: boolean;
  confirmationMessage?: string | ((row: TEntity) => string);
  variant?: 'default' | 'destructive';
}

export interface BulkActionConfig<TEntity extends object> {
  id: string;
  label: string;
  onClick?: (rows: TEntity[]) => void | Promise<void>;
  requiresConfirmation?: boolean;
  confirmationMessage?: string | ((count: number) => string);
  variant?: 'default' | 'destructive';
}
