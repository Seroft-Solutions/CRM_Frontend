import { springServiceMutator } from '@/core/api/services/spring-service/service-mutator';
import { IDiscount } from '../types/discount';

export const getDiscounts = (params?: any) => {
    return springServiceMutator<IDiscount[]>({
        url: '/api/discounts',
        method: 'GET',
        params,
    });
};

export const getDiscount = (id: number) => {
    return springServiceMutator<IDiscount>({
        url: `/api/discounts/${id}`,
        method: 'GET',
    });
};

export const getDiscountByCode = (code: string) => {
    return springServiceMutator<IDiscount>({
        url: `/api/discounts/code/${code}`,
        method: 'GET',
    });
};

export const createDiscount = (discount: IDiscount) => {
    return springServiceMutator<IDiscount>({
        url: '/api/discounts',
        method: 'POST',
        data: discount,
    });
};

export const updateDiscount = (id: number, discount: IDiscount) => {
    return springServiceMutator<IDiscount>({
        url: `/api/discounts/${id}`,
        method: 'PUT',
        data: discount,
    });
};

export const partialUpdateDiscount = (id: number, discount: IDiscount) => {
    return springServiceMutator<IDiscount>({
        url: `/api/discounts/${id}`,
        method: 'PATCH',
        data: discount,
    });
};

export const deleteDiscount = (id: number) => {
    return springServiceMutator<void>({
        url: `/api/discounts/${id}`,
        method: 'DELETE',
    });
};
