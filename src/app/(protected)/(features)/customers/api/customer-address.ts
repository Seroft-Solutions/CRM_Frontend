import { useMutation, useQuery } from '@tanstack/react-query';
import { springServiceMutator } from '@/core/api/services/spring-service/service-mutator';
import type { CustomerDTO } from '@/core/api/generated/spring/schemas/CustomerDTO';

const resolveQueryOptions = (options?: any) => {
  if (!options) return {};
  return options.query ?? options;
};

const resolveMutationOptions = (options?: any) => {
  if (!options) return {};
  return options.mutation ?? options;
};

export interface CustomerAddressDTO {
  id?: number;
  completeAddress: string;
  isDefault: boolean;
  createdBy?: string;
  createdDate?: string;
  lastModifiedBy?: string;
  lastModifiedDate?: string;
  customer: { id?: CustomerDTO['id']; customerBusinessName?: string };
}

export const getAllCustomerAddresses = (params?: any) => {
  return springServiceMutator<CustomerAddressDTO[]>({
    url: '/api/customer-addresses',
    method: 'GET',
    params,
  });
};

export const getCustomerAddress = (id: number) => {
  return springServiceMutator<CustomerAddressDTO>({
    url: `/api/customer-addresses/${id}`,
    method: 'GET',
  });
};

export const createCustomerAddress = (data: CustomerAddressDTO) => {
  return springServiceMutator<CustomerAddressDTO>({
    url: '/api/customer-addresses',
    method: 'POST',
    data,
  });
};

export const updateCustomerAddress = (id: number, data: CustomerAddressDTO) => {
  return springServiceMutator<CustomerAddressDTO>({
    url: `/api/customer-addresses/${id}`,
    method: 'PUT',
    data,
  });
};

export const deleteCustomerAddress = (id: number) => {
  return springServiceMutator<void>({
    url: `/api/customer-addresses/${id}`,
    method: 'DELETE',
  });
};

export const useGetAllCustomerAddresses = (params?: any, options?: any) => {
  const queryOptions = resolveQueryOptions(options);
  return useQuery({
    queryKey: ['getAllCustomerAddresses', params],
    queryFn: () => getAllCustomerAddresses(params),
    ...queryOptions,
  });
};

export const useGetCustomerAddress = (id: number, options?: any) => {
  const queryOptions = resolveQueryOptions(options);
  return useQuery({
    queryKey: ['getCustomerAddress', id],
    queryFn: () => getCustomerAddress(id),
    enabled: !!id,
    ...queryOptions,
  });
};

export const useCreateCustomerAddress = (options?: any) => {
  const mutationOptions = resolveMutationOptions(options);
  return useMutation({
    mutationFn: createCustomerAddress,
    ...mutationOptions,
  });
};

export const useUpdateCustomerAddress = (options?: any) => {
  const mutationOptions = resolveMutationOptions(options);
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: CustomerAddressDTO }) =>
      updateCustomerAddress(id, data),
    ...mutationOptions,
  });
};

export const useDeleteCustomerAddress = (options?: any) => {
  const mutationOptions = resolveMutationOptions(options);
  return useMutation({
    mutationFn: deleteCustomerAddress,
    ...mutationOptions,
  });
};
