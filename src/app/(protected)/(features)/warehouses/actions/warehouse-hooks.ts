import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  countWarehouses,
  createWarehouse,
  deleteWarehouse,
  getWarehouse,
  getWarehouses,
  updateWarehouse,
} from './warehouse-api';
import { IWarehouse, WarehouseListParams } from '../types/warehouse';
import { warehouseToast } from '../components/warehouse-toast';

type WarehouseCountParams = Omit<WarehouseListParams, 'page' | 'size' | 'sort'>;

export const useWarehousesQuery = (params: WarehouseListParams) => {
  return useQuery({
    queryKey: ['warehouses', params],
    queryFn: () => getWarehouses(params),
    placeholderData: (previousData) => previousData,
  });
};

export const useWarehouseCountQuery = (params: WarehouseCountParams) => {
  return useQuery({
    queryKey: ['warehouses-count', params],
    queryFn: () => countWarehouses(params),
  });
};

export const useWarehouseQuery = (id?: number) => {
  return useQuery({
    queryKey: ['warehouse', id],
    queryFn: () => getWarehouse(id as number),
    enabled: typeof id === 'number' && Number.isFinite(id),
  });
};

export const useCreateWarehouseMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (warehouse: IWarehouse) => createWarehouse(warehouse),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      queryClient.invalidateQueries({ queryKey: ['warehouses-count'] });
      warehouseToast.created();
    },
    onError: (error) => {
      warehouseToast.createError(error);
    },
  });
};

export const useUpdateWarehouseMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, warehouse }: { id: number; warehouse: IWarehouse }) =>
      updateWarehouse(id, warehouse),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      queryClient.invalidateQueries({ queryKey: ['warehouses-count'] });
      queryClient.invalidateQueries({ queryKey: ['warehouse', variables.id] });
      warehouseToast.updated();
    },
    onError: (error) => {
      warehouseToast.updateError(error);
    },
  });
};

export const useDeleteWarehouseMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteWarehouse(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      queryClient.invalidateQueries({ queryKey: ['warehouses-count'] });
      warehouseToast.deleted();
    },
    onError: (error) => {
      warehouseToast.deleteError(error);
    },
  });
};
