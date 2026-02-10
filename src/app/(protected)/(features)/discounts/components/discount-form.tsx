'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useDebounce } from '@/hooks/use-debounce';
import { getDiscountByCode } from '../actions/discount-api';
import { useCreateDiscountMutation, useUpdateDiscountMutation, useDiscountQuery } from '../actions/discount-hooks';
import { IDiscount } from '../types/discount';
import { useRouter } from 'next/navigation';
import { Save, Loader2 } from 'lucide-react';
import Link from 'next/link';

const duplicateCodeMessage = 'Discount code already exists.';
const codeCheckFailedMessage = 'Unable to verify discount code right now.';

const toTimeInputValue = (value?: string | null) => {
    if (!value) {
        return '';
    }

    const [hours, minutes] = value.split(':');
    if (hours === undefined || minutes === undefined) {
        return value;
    }

    return `${hours}:${minutes}`;
};

const discountFormSchema = z
    .object({
        discountCode: z.string().min(2, 'Code must be at least 2 characters').max(20),
        discountType: z.enum(['PERCENTAGE', 'AMOUNT']),
        discountCategory: z.enum(['PROMO', 'SEASONAL', 'BUNDLE', 'VOUCHER']),
        discountValue: z.number().min(0),
        maxDiscountValue: z.number().min(0).optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        discountStartTime: z.string().optional(),
        discountEndTime: z.string().optional(),
    })
    .superRefine((values, ctx) => {
        const discountValue = Number(values.discountValue);
        const maxDiscountValue =
            values.maxDiscountValue === undefined ? undefined : Number(values.maxDiscountValue);

        if (values.discountType === 'PERCENTAGE') {
            if (!Number.isFinite(maxDiscountValue)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'Max discount value is required for percentage discounts',
                    path: ['maxDiscountValue'],
                });
            } else if (Number.isFinite(discountValue) && maxDiscountValue <= discountValue) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'Max discount value must be greater than discount value',
                    path: ['maxDiscountValue'],
                });
            }
        }

        const startDateValue = values.startDate?.trim();
        const endDateValue = values.endDate?.trim();
        const discountStartTimeValue = values.discountStartTime?.trim();
        const discountEndTimeValue = values.discountEndTime?.trim();

        if (startDateValue && endDateValue && endDateValue < startDateValue) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'End date must be on or after start date',
                path: ['endDate'],
            });
        }

        if (
            startDateValue &&
            endDateValue &&
            startDateValue === endDateValue &&
            discountStartTimeValue &&
            discountEndTimeValue &&
            discountEndTimeValue <= discountStartTimeValue
        ) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'End time must be after start time for the same date',
                path: ['discountEndTime'],
            });
        }
    });
type DiscountFormValues = z.infer<typeof discountFormSchema>;

interface DiscountFormProps {
    id?: number;
}

export function DiscountForm({ id }: DiscountFormProps) {
    const router = useRouter();
    const { data: existingDiscount, isLoading: isLoadingExisting } = useDiscountQuery(id!);
    const { mutate: createDiscount, isPending: isCreating } = useCreateDiscountMutation();
    const { mutate: updateDiscount, isPending: isUpdating } = useUpdateDiscountMutation();
    const [isCheckingCode, setIsCheckingCode] = React.useState(false);

    const form = useForm<DiscountFormValues>({
        resolver: zodResolver(discountFormSchema) as any,
        defaultValues: {
            discountCode: '',
            discountType: 'PERCENTAGE',
            discountCategory: 'PROMO',
            discountValue: 0,
            maxDiscountValue: undefined,
            startDate: '',
            endDate: '',
            discountStartTime: '',
            discountEndTime: '',
        },
    });

    const watchedDiscountCode = form.watch('discountCode');
    const debouncedDiscountCode = useDebounce(watchedDiscountCode, 400);
    const discountType = form.watch('discountType');

    const clearManualDiscountCodeError = React.useCallback(() => {
        const fieldError = form.getFieldState('discountCode').error;
        if (
            fieldError?.type === 'manual' &&
            (fieldError.message === duplicateCodeMessage || fieldError.message === codeCheckFailedMessage)
        ) {
            form.clearErrors('discountCode');
        }
    }, [form]);

    React.useEffect(() => {
        if (existingDiscount) {
            form.reset({
                discountCode: existingDiscount.discountCode || '',
                discountType: (existingDiscount.discountType as any) || 'PERCENTAGE',
                discountCategory: (existingDiscount.discountCategory as any) || 'PROMO',
                discountValue: existingDiscount.discountValue || 0,
                maxDiscountValue: existingDiscount.maxDiscountValue ?? undefined,
                startDate: existingDiscount.startDate || '',
                endDate: existingDiscount.endDate || '',
                discountStartTime: toTimeInputValue(existingDiscount.discountStartTime),
                discountEndTime: toTimeInputValue(existingDiscount.discountEndTime),
            });
        }
    }, [existingDiscount, form]);

    React.useEffect(() => {
        if (discountType === 'AMOUNT') {
            form.setValue('maxDiscountValue', undefined, { shouldValidate: true, shouldDirty: true });
            form.clearErrors('maxDiscountValue');
        }
    }, [discountType, form]);

    React.useEffect(() => {
        const code = debouncedDiscountCode?.trim();

        if (!code || code.length < 2) {
            clearManualDiscountCodeError();
            setIsCheckingCode(false);
            return;
        }

        if (existingDiscount?.discountCode && code.toUpperCase() === existingDiscount.discountCode.toUpperCase()) {
            clearManualDiscountCodeError();
            setIsCheckingCode(false);
            return;
        }

        let isActive = true;
        setIsCheckingCode(true);

        getDiscountByCode(code)
            .then((discount) => {
                if (!isActive) return;
                if (discount?.id && discount.id !== id) {
                    form.setError('discountCode', { type: 'manual', message: duplicateCodeMessage });
                } else {
                    clearManualDiscountCodeError();
                }
            })
            .catch((error) => {
                if (!isActive) return;
                if (error?.response?.status === 404) {
                    clearManualDiscountCodeError();
                } else {
                    form.setError('discountCode', { type: 'manual', message: codeCheckFailedMessage });
                }
            })
            .finally(() => {
                if (isActive) {
                    setIsCheckingCode(false);
                }
            });

        return () => {
            isActive = false;
        };
    }, [debouncedDiscountCode, existingDiscount?.discountCode, id, form, clearManualDiscountCodeError]);

    const applyServerErrors = (error: any) => {
        const messageKey = error?.response?.data?.message;
        const title = error?.response?.data?.title || error?.message;

        switch (messageKey) {
            case 'error.discountcodeexists':
                form.setError('discountCode', { type: 'server', message: title || duplicateCodeMessage });
                return;
            case 'error.maxdiscountinvalid':
                form.setError('maxDiscountValue', {
                    type: 'server',
                    message: title || 'Max discount value must be greater than discount value',
                });
                return;
            case 'error.discountdaterange':
                form.setError('endDate', { type: 'server', message: title || 'End date must be on or after start date' });
                return;
            case 'error.discounttimerange':
                form.setError('discountEndTime', {
                    type: 'server',
                    message: title || 'End time must be after start time for the same date',
                });
                return;
            default:
                return;
        }
    };

    function onSubmit(values: DiscountFormValues) {
        const payload: IDiscount = {
            ...values,
            ...(id ? { id } : {}),
            status: existingDiscount?.status || 'ACTIVE',
            startDate: values.startDate || undefined,
            endDate: values.endDate || undefined,
            discountStartTime: values.discountStartTime || undefined,
            discountEndTime: values.discountEndTime || undefined,
        };
        if (values.discountType === 'AMOUNT') {
            delete payload.maxDiscountValue;
        }

        if (id) {
            updateDiscount(
                { id, discount: payload },
                {
                    onSuccess: () => router.push('/discounts'),
                    onError: applyServerErrors,
                }
            );
        } else {
            createDiscount(payload, {
                onSuccess: () => router.push('/discounts'),
                onError: applyServerErrors,
            });
        }
    }

    if (id && isLoadingExisting) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-6">
                    <div className="space-y-4">
                        <div
                            className={`grid grid-cols-1 gap-4 md:grid-cols-2 ${
                                discountType === 'PERCENTAGE' ? 'lg:grid-cols-5' : 'lg:grid-cols-4'
                            }`}
                        >
                            <TypedFormField
                                control={form.control}
                                name="discountCategory"
                                render={({ field }: any) => (
                                    <FormItem>
                                        <FormLabel>Discount Category</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="h-10 w-full">
                                                    <SelectValue placeholder="Select category" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="PROMO">Promo</SelectItem>
                                                <SelectItem value="SEASONAL">Seasonal</SelectItem>
                                                <SelectItem value="BUNDLE">Bundle</SelectItem>
                                                <SelectItem value="VOUCHER">Voucher</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <TypedFormField
                                control={form.control}
                                name="discountCode"
                                render={({ field }: any) => (
                                    <FormItem>
                                        <FormLabel>Discount Code</FormLabel>
                                        <FormControl>
                                            <Input placeholder="E.g. SUMMER2024" className="h-10" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <TypedFormField
                                control={form.control}
                                name="discountType"
                                render={({ field }: any) => (
                                    <FormItem>
                                        <FormLabel>Discount Type</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="h-10 w-full">
                                                    <SelectValue placeholder="Select type" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="PERCENTAGE">Percentage (%)</SelectItem>
                                                <SelectItem value="AMOUNT">Fixed Amount (₹)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <TypedFormField
                                control={form.control}
                                name="discountValue"
                                render={({ field }: any) => (
                                    <FormItem>
                                        <FormLabel>Discount Value</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Input
                                                    type="number"
                                                    className="h-10"
                                                    {...field}
                                                    onChange={(e) => {
                                                        const nextValue = e.target.value;
                                                        field.onChange(nextValue === '' ? 0 : Number(nextValue));
                                                    }}
                                                />
                                                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-muted-foreground">
                                                    {discountType === 'PERCENTAGE' ? '%' : '₹'}
                                                </div>
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {discountType === 'PERCENTAGE' ? (
                                <TypedFormField
                                    control={form.control}
                                    name="maxDiscountValue"
                                    render={({ field }: any) => (
                                        <FormItem>
                                            <FormLabel>Max Discount Value (₹)</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    className="h-10"
                                                    {...field}
                                                    onChange={(e) => {
                                                        const nextValue = e.target.value;
                                                        field.onChange(nextValue === '' ? undefined : Number(nextValue));
                                                    }}
                                                    placeholder="E.g. 500"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            ) : null}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {isCheckingCode
                                ? 'Checking code availability...'
                                : 'The code users will enter to apply the discount.'}
                        </p>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="startDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Start Date</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="endDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>End Date</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="discountStartTime"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Discount Start Time</FormLabel>
                                        <FormControl>
                                            <Input type="time" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="discountEndTime"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Discount End Time</FormLabel>
                                        <FormControl>
                                            <Input type="time" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 border-t pt-6">
                        <Button type="button" variant="outline" asChild>
                            <Link href="/discounts">Cancel</Link>
                        </Button>
                        <Button type="submit" disabled={isCreating || isUpdating} className="gap-2">
                            {isCreating || isUpdating ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4" />
                            )}
                            {id ? 'Update Discount' : 'Create Discount'}
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
}

// @ts-ignore - fix for potential react-hook-form version mismatch in generic components
const TypedFormField = FormField as any;
