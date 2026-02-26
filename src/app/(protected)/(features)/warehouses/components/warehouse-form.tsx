'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

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
import { Textarea } from '@/components/ui/textarea';
import { getSelectedOrganizationId } from '@/core/api/services/shared/tenant-helper';
import { useGetAllOrganizations } from '@/core/api/generated/spring/endpoints/organization-resource/organization-resource.gen';

import {
  useCreateWarehouseMutation,
  useUpdateWarehouseMutation,
  useWarehouseQuery,
} from '../actions/warehouse-hooks';

const warehouseFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(120, 'Name cannot exceed 120 characters'),
  code: z
    .string()
    .trim()
    .min(2, 'Code must be at least 2 characters')
    .max(30, 'Code cannot exceed 30 characters')
    .regex(/^[A-Za-z0-9_-]+$/, 'Code can contain only letters, numbers, underscore, and hyphen'),
  address: z
    .string()
    .trim()
    .min(1, 'Address is required')
    .max(500, 'Address cannot exceed 500 characters')
    .refine((value) => value.length > 0, {
      message: 'Address is required',
    }),
  capacity: z
    .string()
    .optional()
    .refine((value) => value === undefined || value === '' || /^\d+$/.test(value), {
      message: 'Capacity must be a whole number',
    })
    .refine((value) => value === undefined || value === '' || Number(value) >= 0, {
      message: 'Capacity must be zero or greater',
    }),
});

type WarehouseFormValues = z.infer<typeof warehouseFormSchema>;

interface WarehouseFormProps {
  id?: number;
}

const extractErrorMessage = (error: unknown): string => {
  if (typeof error === 'object' && error !== null) {
    const maybeAxiosError = error as {
      response?: { data?: { title?: string; detail?: string; message?: string } };
      message?: string;
    };

    return (
      maybeAxiosError.response?.data?.title ||
      maybeAxiosError.response?.data?.detail ||
      maybeAxiosError.response?.data?.message ||
      maybeAxiosError.message ||
      'Unexpected error'
    );
  }

  return 'Unexpected error';
};

export function WarehouseForm({ id }: WarehouseFormProps) {
  const router = useRouter();

  const { data: existingWarehouse, isLoading: isLoadingWarehouse } = useWarehouseQuery(id);
  const { mutate: createWarehouse, isPending: isCreating } = useCreateWarehouseMutation();
  const { mutate: updateWarehouse, isPending: isUpdating } = useUpdateWarehouseMutation();

  const { data: organizations = [] } = useGetAllOrganizations(
    { page: 0, size: 1000, sort: ['name,asc'] },
    {
      query: {
        staleTime: 5 * 60 * 1000,
      },
    }
  );

  const selectableOrganizations = React.useMemo(
    () =>
      organizations.filter(
        (organization): organization is typeof organization & { id: number } =>
          typeof organization.id === 'number'
      ),
    [organizations]
  );

  const form = useForm<WarehouseFormValues>({
    resolver: zodResolver(warehouseFormSchema),
    defaultValues: {
      name: '',
      code: '',
      address: '',
      capacity: '',
    },
  });

  React.useEffect(() => {
    if (!existingWarehouse) {
      return;
    }

    form.reset({
      name: existingWarehouse.name,
      code: existingWarehouse.code,
      address: existingWarehouse.address || '',
      capacity:
        typeof existingWarehouse.capacity === 'number' ? String(existingWarehouse.capacity) : '',
    });
  }, [existingWarehouse, form]);

  const resolvedOrganizationId = React.useMemo(() => {
    const selectedOrgId = getSelectedOrganizationId();

    if (!selectedOrgId) {
      return undefined;
    }

    const numericSelectedOrgId = Number.parseInt(selectedOrgId, 10);

    if (Number.isFinite(numericSelectedOrgId)) {
      const directMatch = selectableOrganizations.find(
        (organization) => organization.id === numericSelectedOrgId
      );

      if (directMatch?.id) {
        return directMatch.id;
      }
    }

    const matchedOrganization = selectableOrganizations.find(
      (organization) =>
        String(organization.id) === selectedOrgId || organization.keycloakOrgId === selectedOrgId
    );

    return matchedOrganization?.id;
  }, [selectableOrganizations]);

  const setFieldErrorsFromServer = (error: unknown) => {
    const message = extractErrorMessage(error).toLowerCase();

    if (message.includes('code')) {
      form.setError('code', {
        type: 'server',
        message: 'This code is already in use. Please use a different code.',
      });

      return;
    }

    if (message.includes('organization')) {
      form.setError('root', {
        type: 'server',
        message:
          'Unable to determine your organization. Please re-select your organization and try again.',
      });
    }
  };

  const onSubmit = (values: WarehouseFormValues) => {
    if (!resolvedOrganizationId) {
      form.setError('root', {
        type: 'manual',
        message:
          'Unable to determine your organization. Please re-select your organization and try again.',
      });

      return;
    }

    form.clearErrors('root');

    const payload = {
      id,
      name: values.name.trim(),
      code: values.code.trim(),
      address: values.address.trim(),
      capacity: values.capacity ? Number(values.capacity) : undefined,
      status: 'ACTIVE' as const,
      organizationId: resolvedOrganizationId,
    };

    if (id) {
      updateWarehouse(
        { id, warehouse: payload },
        {
          onSuccess: () => router.push('/warehouses'),
          onError: (error) => setFieldErrorsFromServer(error),
        }
      );

      return;
    }

    createWarehouse(payload, {
      onSuccess: () => router.push('/warehouses'),
      onError: (error) => setFieldErrorsFromServer(error),
    });
  };

  if (id && isLoadingWarehouse) {
    return (
      <div className="flex h-52 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isSubmitting = isCreating || isUpdating;

  return (
    <Form {...form}>
      <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Main Warehouse" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Code</FormLabel>
                <FormControl>
                  <Input placeholder="WH-001" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="capacity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Capacity</FormLabel>
                <FormControl>
                  <Input type="number" min={0} placeholder="1000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Address</FormLabel>
                <FormControl>
                  <Textarea placeholder="Warehouse address" className="min-h-[96px]" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {form.formState.errors.root?.message && (
          <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>
        )}

        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={isSubmitting} className="min-w-[140px]">
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {id ? 'Update Warehouse' : 'Create Warehouse'}
          </Button>
          <Button asChild type="button" variant="outline">
            <Link href="/warehouses">Cancel</Link>
          </Button>
        </div>
      </form>
    </Form>
  );
}
