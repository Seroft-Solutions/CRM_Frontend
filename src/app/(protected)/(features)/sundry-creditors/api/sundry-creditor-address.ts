import { useMutation, useQuery } from '@tanstack/react-query';
import { springServiceMutator } from '@/core/api/services/spring-service/service-mutator';
import type { SundryCreditorDTO } from './sundry-creditor';
import type { AreaDTO } from '@/core/api/generated/spring/schemas/AreaDTO';

const resolveQueryOptions = (options?: any) => {
  if (!options) return {};
  return options.query ?? options;
};

const resolveMutationOptions = (options?: any) => {
  if (!options) return {};
  return options.mutation ?? options;
};

export interface SundryCreditorAddressDTO {
  id?: number;
  completeAddress: string;
  area?: AreaDTO;
  isDefault: boolean;
  createdBy?: string;
  createdDate?: string;
  lastModifiedBy?: string;
  lastModifiedDate?: string;
  sundryCreditor: Pick<SundryCreditorDTO, 'id' | 'creditorName'>;
}

export const getAllSundryCreditorAddresses = (params?: any) => {
  return springServiceMutator<SundryCreditorAddressDTO[]>({
    url: '/api/sundry-creditor-addresses',
    method: 'GET',
    params,
  });
};

export const getSundryCreditorAddress = (id: number) => {
  return springServiceMutator<SundryCreditorAddressDTO>({
    url: `/api/sundry-creditor-addresses/${id}`,
    method: 'GET',
  });
};

export const createSundryCreditorAddress = (data: SundryCreditorAddressDTO) => {
  return springServiceMutator<SundryCreditorAddressDTO>({
    url: '/api/sundry-creditor-addresses',
    method: 'POST',
    data,
  });
};

export const updateSundryCreditorAddress = (id: number, data: SundryCreditorAddressDTO) => {
  return springServiceMutator<SundryCreditorAddressDTO>({
    url: `/api/sundry-creditor-addresses/${id}`,
    method: 'PUT',
    data,
  });
};

export const deleteSundryCreditorAddress = (id: number) => {
  return springServiceMutator<void>({
    url: `/api/sundry-creditor-addresses/${id}`,
    method: 'DELETE',
  });
};

export const useGetAllSundryCreditorAddresses = (params?: any, options?: any) => {
  const queryOptions = resolveQueryOptions(options);
  return useQuery({
    queryKey: ['getAllSundryCreditorAddresses', params],
    queryFn: () => getAllSundryCreditorAddresses(params),
    ...queryOptions,
  });
};

export const useGetSundryCreditorAddress = (id: number, options?: any) => {
  const queryOptions = resolveQueryOptions(options);
  return useQuery({
    queryKey: ['getSundryCreditorAddress', id],
    queryFn: () => getSundryCreditorAddress(id),
    enabled: !!id,
    ...queryOptions,
  });
};

export const useCreateSundryCreditorAddress = (options?: any) => {
  const mutationOptions = resolveMutationOptions(options);
  return useMutation({
    mutationFn: createSundryCreditorAddress,
    ...mutationOptions,
  });
};

export const useUpdateSundryCreditorAddress = (options?: any) => {
  const mutationOptions = resolveMutationOptions(options);
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: SundryCreditorAddressDTO }) =>
      updateSundryCreditorAddress(id, data),
    ...mutationOptions,
  });
};

export const useDeleteSundryCreditorAddress = (options?: any) => {
  const mutationOptions = resolveMutationOptions(options);
  return useMutation({
    mutationFn: deleteSundryCreditorAddress,
    ...mutationOptions,
  });
};
