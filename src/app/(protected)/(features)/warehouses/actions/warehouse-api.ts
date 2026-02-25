import { springServiceMutator } from '@/core/api/services/spring-service/service-mutator';
import { IWarehouse, WarehouseListParams } from '../types/warehouse';

export const getWarehouses = (params?: WarehouseListParams) => {
  return springServiceMutator<IWarehouse[]>({
    url: '/api/warehouses',
    method: 'GET',
    params,
  });
};

export const countWarehouses = (params?: Omit<WarehouseListParams, 'page' | 'size' | 'sort'>) => {
  return springServiceMutator<number>({
    url: '/api/warehouses/count',
    method: 'GET',
    params,
  });
};

export const getWarehouse = (id: number) => {
  return springServiceMutator<IWarehouse>({
    url: `/api/warehouses/${id}`,
    method: 'GET',
  });
};

export const createWarehouse = (warehouse: IWarehouse) => {
  return springServiceMutator<IWarehouse>({
    url: '/api/warehouses',
    method: 'POST',
    data: warehouse,
  });
};

export const updateWarehouse = (id: number, warehouse: IWarehouse) => {
  return springServiceMutator<IWarehouse>({
    url: `/api/warehouses/${id}`,
    method: 'PUT',
    data: warehouse,
  });
};

export const deleteWarehouse = (id: number) => {
  return springServiceMutator<void>({
    url: `/api/warehouses/${id}`,
    method: 'DELETE',
  });
};
