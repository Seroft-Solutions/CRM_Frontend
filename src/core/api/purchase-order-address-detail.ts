import { useMutation } from '@tanstack/react-query';
import type {
    QueryClient,
    UseMutationOptions,
    UseMutationResult,
} from '@tanstack/react-query';
import { springServiceMutator } from '@/core/api/services/spring-service/service-mutator';

export interface PurchaseOrderAddressDetailDTO {
    id?: number;
    purchaseOrderId?: number;
    shipToFirstName?: string;
    shipToMiddleName?: string;
    shipToLastName?: string;
    shipToAddLine1?: string;
    shipToAddLine2?: string;
    shipToCity?: string;
    shipToState?: string;
    shipToZipcode?: string;
    shipToContact?: string;
    shipToCountry?: string;
    billToSameFlag?: boolean;
    billToFirstName?: string;
    billToMiddleName?: string;
    billToLastName?: string;
    billToAddLine1?: string;
    billToAddLine2?: string;
    billToCity?: string;
    billToState?: string;
    billToZipcode?: string;
    billToContact?: string;
    billToCountry?: string;
    updatedBy?: string;
    lastUpdated?: string;
    createdBy?: string;
    createdDate?: string;
    lastModifiedBy?: string;
    lastModifiedDate?: string;
}

export const createPurchaseOrderAddressDetail = (purchaseOrderAddressDetailDTO: PurchaseOrderAddressDetailDTO) =>
    springServiceMutator<PurchaseOrderAddressDetailDTO>({
        url: '/api/purchase-order-address-details',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        data: purchaseOrderAddressDetailDTO,
    });

export const useCreatePurchaseOrderAddressDetail = (
    options?: UseMutationOptions<PurchaseOrderAddressDetailDTO, Error, { data: PurchaseOrderAddressDetailDTO }>,
    queryClient?: QueryClient
): UseMutationResult<PurchaseOrderAddressDetailDTO, Error, { data: PurchaseOrderAddressDetailDTO }> =>
    useMutation(
        {
            mutationFn: ({ data }) => createPurchaseOrderAddressDetail(data),
            ...options,
        },
        queryClient
    );

export const updatePurchaseOrderAddressDetail = (id: number, purchaseOrderAddressDetailDTO: PurchaseOrderAddressDetailDTO) =>
    springServiceMutator<PurchaseOrderAddressDetailDTO>({
        url: `/api/purchase-order-address-details/${id}`,
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        data: purchaseOrderAddressDetailDTO,
    });

export const useUpdatePurchaseOrderAddressDetail = (
    options?: UseMutationOptions<
        PurchaseOrderAddressDetailDTO,
        Error,
        { id: number; data: PurchaseOrderAddressDetailDTO }
    >,
    queryClient?: QueryClient
): UseMutationResult<PurchaseOrderAddressDetailDTO, Error, { id: number; data: PurchaseOrderAddressDetailDTO }> =>
    useMutation(
        {
            mutationFn: ({ id, data }) => updatePurchaseOrderAddressDetail(id, data),
            ...options,
        },
        queryClient
    );
