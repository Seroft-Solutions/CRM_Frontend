import { useMutation, useQuery } from '@tanstack/react-query';
import { springServiceMutator } from '@/core/api/services/spring-service/service-mutator';
import { AreaDTO } from '@/core/api/generated/spring/schemas/AreaDTO';
import { CustomerDTOStatus } from '@/core/api/generated/spring/schemas/CustomerDTOStatus';
import { PaginatedResponse } from '@/core/api/services/base/types';

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
    area: AreaDTO;
}

export type SundryCreditorBody = SundryCreditorDTO;

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

// React Query Hooks

export const useGetAllSundryCreditors = (params?: any, options?: any) => {
    return useQuery({
        queryKey: ['getAllSundryCreditors', params],
        queryFn: () => getAllSundryCreditors(params),
        ...options,
    });
};

export const useGetSundryCreditor = (id: number, options?: any) => {
    return useQuery({
        queryKey: ['getSundryCreditor', id],
        queryFn: () => getSundryCreditor(id),
        ...options,
    });
};

export const useCountSundryCreditors = (params?: any, options?: any) => {
    return useQuery({
        queryKey: ['countSundryCreditors', params],
        queryFn: () => getSundryCreditorCount(params),
        ...options,
    });
};

export const useSearchSundryCreditors = (params?: any, options?: any) => {
    return useQuery({
        queryKey: ['searchSundryCreditors', params],
        queryFn: () => searchSundryCreditors(params),
        ...options,
    });
};

export const useCreateSundryCreditor = (options?: any) => {
    return useMutation({
        mutationFn: createSundryCreditor,
        ...options,
    });
};

export const useUpdateSundryCreditor = (options?: any) => {
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: SundryCreditorBody }) => updateSundryCreditor(id, data),
        ...options,
    });
};

export const useDeleteSundryCreditor = (options?: any) => {
    return useMutation({
        mutationFn: deleteSundryCreditor,
        ...options,
    });
};
