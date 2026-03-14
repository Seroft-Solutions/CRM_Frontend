import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getDiscounts,
    getDiscount,
    createDiscount,
    updateDiscount,
    partialUpdateDiscount,
    deleteDiscount,
} from '../actions/discount-api';
import { IDiscount } from '../types/discount';
import { discountToast } from '../components/discount-toast';

export const useDiscountsQuery = (params?: any) => {
    return useQuery({
        queryKey: ['discounts', params],
        queryFn: () => getDiscounts(params),
    });
};

export const useDiscountQuery = (id: number) => {
    return useQuery({
        queryKey: ['discount', id],
        queryFn: () => getDiscount(id),
        enabled: !!id,
    });
};

export const useCreateDiscountMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createDiscount,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['discounts'] });
            discountToast.created();
        },
        onError: (error: any) => {
            discountToast.createError(error?.message);
        },
    });
};

export const useUpdateDiscountMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, discount }: { id: number; discount: IDiscount }) =>
            updateDiscount(id, discount),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['discounts'] });
            queryClient.invalidateQueries({ queryKey: ['discount', variables.id] });
            discountToast.updated();
        },
        onError: (error: any) => {
            discountToast.updateError(error?.message);
        },
    });
};

export const useDeleteDiscountMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteDiscount,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['discounts'] });
            discountToast.deleted();
        },
        onError: (error: any) => {
            discountToast.deleteError(error?.message);
        },
    });
};
