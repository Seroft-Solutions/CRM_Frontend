export const WAREHOUSE_STATUSES = ['DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED'] as const;

export type WarehouseStatus = (typeof WAREHOUSE_STATUSES)[number];

export interface IWarehouseShelf {
  id?: number;
  name: string;
  capacity: number;
}

export interface IWarehouseArea {
  id?: number;
  name: string;
  shelves?: IWarehouseShelf[];
}

export interface IWarehouse {
  id?: number;
  name: string;
  code: string;
  address?: string;
  areas?: IWarehouseArea[];
  status: WarehouseStatus;
  createdBy?: string;
  createdDate?: string;
  lastModifiedBy?: string;
  lastModifiedDate?: string;
}

export interface WarehouseListParams {
  page?: number;
  size?: number;
  sort?: string[];
  query?: string;
  'name.contains'?: string;
  'code.contains'?: string;
  'address.contains'?: string;
  'createdBy.contains'?: string;
  'lastModifiedBy.contains'?: string;
  'status.equals'?: WarehouseStatus;
  [key: string]: string | number | string[] | undefined;
}

export type WarehouseSearchField = 'name' | 'code' | 'address';
