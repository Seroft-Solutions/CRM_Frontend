export const WAREHOUSE_STATUSES = ['DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED'] as const;

export type WarehouseStatus = (typeof WAREHOUSE_STATUSES)[number];

export interface IWarehouse {
  id?: number;
  name: string;
  code: string;
  address?: string;
  capacity?: number;
  status: WarehouseStatus;
  organizationId: number;
  organizationName?: string;
  createdBy?: string;
  createdDate?: string;
  lastModifiedBy?: string;
  lastModifiedDate?: string;
}

export interface WarehouseListParams {
  page?: number;
  size?: number;
  sort?: string[];
  'name.contains'?: string;
  'code.contains'?: string;
  'address.contains'?: string;
  'status.equals'?: WarehouseStatus;
  'organizationId.equals'?: number;
}

export type WarehouseSearchField = 'name' | 'code' | 'address';
