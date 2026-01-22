'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormDescription,
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
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useCreateDiscountMutation, useUpdateDiscountMutation, useDiscountQuery } from '../actions/discount-hooks';
import { IDiscount } from '../types/discount';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import Link from 'next/link';

const discountFormSchema = z.object({
    discountCode: z.string().min(2, 'Code must be at least 2 characters').max(20),
    discountType: z.enum(['PERCENTAGE', 'AMOUNT']),
    discountCategory: z.enum(['PROMO', 'SEASONAL', 'BUNDLE', 'VOUCHER']),
    discountValue: z.number().min(0),
    maxDiscountValue: z.number().min(0),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
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

    const form = useForm<DiscountFormValues>({
        resolver: zodResolver(discountFormSchema) as any,
        defaultValues: {
            discountCode: '',
            discountType: 'PERCENTAGE',
            discountCategory: 'PROMO',
            discountValue: 0,
            maxDiscountValue: 0,
            startDate: '',
            endDate: '',
        },
    });

    React.useEffect(() => {
        if (existingDiscount) {
            form.reset({
                discountCode: existingDiscount.discountCode || '',
                discountType: (existingDiscount.discountType as any) || 'PERCENTAGE',
                discountCategory: (existingDiscount.discountCategory as any) || 'PROMO',
                discountValue: existingDiscount.discountValue || 0,
                maxDiscountValue: existingDiscount.maxDiscountValue || 0,
                startDate: existingDiscount.startDate || '',
                endDate: existingDiscount.endDate || '',
            });
        }
    }, [existingDiscount, form]);

    function onSubmit(values: DiscountFormValues) {
        const payload: IDiscount = {
            ...values,
            startDate: values.startDate || undefined,
            endDate: values.endDate || undefined,
        };

        if (id) {
            updateDiscount(
                { id, discount: payload },
                {
                    onSuccess: () => router.push('/discounts'),
                }
            );
        } else {
            createDiscount(payload, {
                onSuccess: () => router.push('/discounts'),
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
        <div className="max-w-2xl mx-auto space-y-4">
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/discounts" className="flex items-center gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Discounts
                    </Link>
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{id ? 'Edit Discount' : 'Create New Discount'}</CardTitle>
                </CardHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit as any)}>
                        <CardContent className="space-y-4">
                            <TypedFormField
                                control={form.control}
                                name="discountCode"
                                render={({ field }: any) => (
                                    <FormItem>
                                        <FormLabel>Discount Code</FormLabel>
                                        <FormControl>
                                            <Input placeholder="E.g. SUMMER2024" {...field} />
                                        </FormControl>
                                        <FormDescription>The code users will enter to apply the discount.</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-2 gap-4">
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
                                                    <SelectTrigger>
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
                                    name="discountCategory"
                                    render={({ field }: any) => (
                                        <FormItem>
                                            <FormLabel>Discount Category</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                value={field.value}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
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
                            </div>

                            <div className="grid grid-cols-2 gap-4">
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
                                                        {...field}
                                                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                                    />
                                                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-muted-foreground">
                                                        {form.watch('discountType') === 'PERCENTAGE' ? '%' : '₹'}
                                                    </div>
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <TypedFormField
                                    control={form.control}
                                    name="maxDiscountValue"
                                    render={({ field }: any) => (
                                        <FormItem>
                                            <FormLabel>Max Discount Value (₹)</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    {...field}
                                                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                                    placeholder="E.g. 500"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
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
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-end gap-2 border-t pt-6">
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
                        </CardFooter>
                    </form>
                </Form>
            </Card>
        </div>
    );
}

// @ts-ignore - fix for potential react-hook-form version mismatch in generic components
const TypedFormField = FormField as any;
