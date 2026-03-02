import { useMutation, useQuery } from '@tanstack/react-query';
import { springServiceMutator } from '@/core/api/services/spring-service/service-mutator';
import { CustomerDTOStatus } from '@/core/api/generated/spring/schemas/CustomerDTOStatus';
import type { CustomerImportJobDTO } from '@/core/api/generated/spring/schemas/CustomerImportJobDTO';
import { SundryCreditorAddressDTO } from '@/core/api/generated/spring/schemas/SundryCreditorAddressDTO';
const resolveQueryOptions = (options?: any) => {
  if (!options) return {};
  return options.query ?? options;
};

const resolveMutationOptions = (options?: any) => {
  if (!options) return {};
  return options.mutation ?? options;
};

// Reusing Status enum from Customer since it is identical
export type SundryCreditorStatus = CustomerDTOStatus;

export interface SundryCreditorDTO {
  id?: number;
  creditorName: string;
  email?: string;
  mobile?: string;
  whatsApp?: string;
  contactPerson?: string;
  status: SundryCreditorStatus;
  createdBy?: string;
  createdDate?: string;
  lastModifiedBy?: string;
  lastModifiedDate?: string;
  addresses?: SundryCreditorAddressDTO[];
}

export type SundryCreditorBody = SundryCreditorDTO;

export interface SundryCreditorImportJobResponse {
  jobId?: string;
  message?: string;
}

// Using simple 'any' for params for now to avoid creating many types, 
// but in real app we should use proper criteria types.
export const getAllSundryCreditors = (params?: any) => {
  return springServiceMutator<SundryCreditorDTO[]>({
    url: '/api/sundry-creditors',
    method: 'GET',
    params,
  });
};

export const getSundryCreditorCount = (params?: any) => {
  return springServiceMutator<number>({
    url: '/api/sundry-creditors/count',
    method: 'GET',
    params,
  });
};

export const createSundryCreditor = (data: SundryCreditorBody) => {
  return springServiceMutator<SundryCreditorDTO>({
    url: '/api/sundry-creditors',
    method: 'POST',
    data,
  });
};

export const updateSundryCreditor = (id: number, data: SundryCreditorBody) => {
  return springServiceMutator<SundryCreditorDTO>({
    url: `/api/sundry-creditors/${id}`,
    method: 'PUT',
    data,
  });
};

export const deleteSundryCreditor = (id: number) => {
  return springServiceMutator<void>({
    url: `/api/sundry-creditors/${id}`,
    method: 'DELETE',
  });
};

export const getSundryCreditor = (id: number) => {
  return springServiceMutator<SundryCreditorDTO>({
    url: `/api/sundry-creditors/${id}`,
    method: 'GET',
  });
};

export const searchSundryCreditors = (params?: any) => {
  return springServiceMutator<SundryCreditorDTO[]>({
    url: '/api/sundry-creditors/_search',
    method: 'GET',
    params,
  });
};

export const importSundryCreditorsFromExcel = (data: { file: File }) => {
  const formData = new FormData();
  formData.append('file', data.file);

  return springServiceMutator<SundryCreditorImportJobResponse>(
    {
      url: '/api/sundry-creditors-bulk-import',
      method: 'POST',
      data: formData,
    },
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
};

export const getSundryCreditorImportProgress = (jobId: string) => {
  return springServiceMutator<CustomerImportJobDTO>({
    url: `/api/sundry-creditors-bulk-import/progress/${jobId}`,
    method: 'GET',
  });
};

export const dismissSundryCreditorImportJob = (jobId: string) => {
  return springServiceMutator<void>({
    url: `/api/sundry-creditors-bulk-import/${jobId}`,
    method: 'DELETE',
  });
};

export const getActiveSundryCreditorImportJobs = () => {
  return springServiceMutator<CustomerImportJobDTO[]>({
    url: '/api/sundry-creditors-bulk-import/active',
    method: 'GET',
  });
};

export const downloadSundryCreditorImportTemplate = () => {
  return springServiceMutator<Blob>(
    {
      url: '/api/sundry-creditors-bulk-import/import-template/download',
      method: 'GET',
    },
    {
      responseType: 'blob',
    }
  );
};

// React Query Hooks

export const useGetAllSundryCreditors = (params?: any, options?: any) => {
  const queryOptions = resolveQueryOptions(options);
  return useQuery({
    queryKey: ['getAllSundryCreditors', params],
    queryFn: () => getAllSundryCreditors(params),
    ...queryOptions,
  });
};

export const useGetSundryCreditor = (id: number, options?: any) => {
  const queryOptions = resolveQueryOptions(options);
  return useQuery({
    queryKey: ['getSundryCreditor', id],
    queryFn: () => getSundryCreditor(id),
    enabled: !!id,
    ...queryOptions,
  });
};

export const useCountSundryCreditors = (params?: any, options?: any) => {
  const queryOptions = resolveQueryOptions(options);
  return useQuery({
    queryKey: ['countSundryCreditors', params],
    queryFn: () => getSundryCreditorCount(params),
    ...queryOptions,
  });
};

export const useSearchSundryCreditors = (params?: any, options?: any) => {
  const queryOptions = resolveQueryOptions(options);
  return useQuery({
    queryKey: ['searchSundryCreditors', params],
    queryFn: () => searchSundryCreditors(params),
    ...queryOptions,
  });
};

export const useImportSundryCreditorsFromExcel = (options?: any) => {
  const mutationOptions = resolveMutationOptions(options);
  return useMutation({
    mutationFn: importSundryCreditorsFromExcel,
    ...mutationOptions,
  });
};

export const useGetSundryCreditorImportProgress = (jobId: string, options?: any) => {
  const queryOptions = resolveQueryOptions(options);
  return useQuery({
    queryKey: ['getSundryCreditorImportProgress', jobId],
    queryFn: () => getSundryCreditorImportProgress(jobId),
    ...queryOptions,
  });
};

export const useDismissSundryCreditorImportJob = (options?: any) => {
  const mutationOptions = resolveMutationOptions(options);
  return useMutation({
    mutationFn: (jobId: string) => dismissSundryCreditorImportJob(jobId),
    ...mutationOptions,
  });
};

export const useGetActiveSundryCreditorImportJobs = (options?: any) => {
  const queryOptions = resolveQueryOptions(options);
  return useQuery({
    queryKey: ['getActiveSundryCreditorImportJobs'],
    queryFn: () => getActiveSundryCreditorImportJobs(),
    ...queryOptions,
  });
};

export const useDownloadSundryCreditorImportTemplate = (options?: any) => {
  const queryOptions = resolveQueryOptions(options);
  return useQuery({
    queryKey: ['downloadSundryCreditorImportTemplate'],
    queryFn: () => downloadSundryCreditorImportTemplate(),
    ...queryOptions,
  });
};

export const useCreateSundryCreditor = (options?: any) => {
  const mutationOptions = resolveMutationOptions(options);
  return useMutation({
    mutationFn: createSundryCreditor,
    ...mutationOptions,
  });
};

export const useUpdateSundryCreditor = (options?: any) => {
  const mutationOptions = resolveMutationOptions(options);
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: SundryCreditorBody }) =>
      updateSundryCreditor(id, data),
    ...mutationOptions,
  });
};

export const useDeleteSundryCreditor = (options?: any) => {
  const mutationOptions = resolveMutationOptions(options);
  return useMutation({
    mutationFn: deleteSundryCreditor,
    ...mutationOptions,
  });
};
