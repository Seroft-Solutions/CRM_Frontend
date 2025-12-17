import type { ReactNode } from 'react';

export interface ColumnConfig<TEntity extends object> {
  field: keyof TEntity;
  header: string;
  type?: ColumnType;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  minWidth?: string;
  maxWidth?: string;
  align?: 'left' | 'center' | 'right';
  truncate?: boolean;
  showTooltip?: boolean;
  render?: (value: TEntity[keyof TEntity], row: TEntity) => ReactNode;
  relationshipConfig?: RelationshipCellConfig;
  format?: FormatConfig;
}

export type ColumnType =
  | 'text'
  | 'number'
  | 'date'
  | 'datetime'
  | 'boolean'
  | 'relationship'
  | 'badge'
  | 'image'
  | 'custom';

export interface RelationshipCellConfig {
  targetEntity: string;
  displayField: string;
  linkTo?: string;
  showCount?: boolean;
}

export interface FormatConfig {
  dateFormat?: string;
  numberFormat?: Intl.NumberFormatOptions;
  prefix?: string;
  suffix?: string;
}
