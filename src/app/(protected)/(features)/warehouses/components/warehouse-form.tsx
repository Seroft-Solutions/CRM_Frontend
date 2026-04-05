'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Plus, Save, Trash2 } from 'lucide-react';
import { useFieldArray, useForm, type Control, type UseFormReturn } from 'react-hook-form';
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

import {
  useCreateWarehouseMutation,
  useUpdateWarehouseMutation,
  useWarehouseQuery,
} from '../actions/warehouse-hooks';
import type { IWarehouseArea, IWarehouseShelf } from '../types/warehouse';
import type { AreaDTO } from '@/core/api/generated/spring/schemas/AreaDTO';
import { IntelligentLocationField } from '../../customers/components/intelligent-location-field';

const warehouseShelfSchema = z.object({
  id: z.number().optional(),
  name: z
    .string()
    .trim()
    .min(1, 'Shelf name is required')
    .max(120, 'Shelf name cannot exceed 120 characters'),
  capacity: z
    .string()
    .min(1, 'Shelf capacity is required')
    .refine((value) => /^\d+$/.test(value), {
      message: 'Shelf capacity must be a whole number',
    })
    .refine((value) => Number(value) >= 0, {
      message: 'Shelf capacity must be zero or greater',
    }),
});

const warehouseAreaSchema = z.object({
  id: z.number().optional(),
  name: z
    .string()
    .trim()
    .min(1, 'Area name is required')
    .max(120, 'Area name cannot exceed 120 characters'),
  shelves: z.array(warehouseShelfSchema).min(1, 'At least one shelf is required for each area'),
});

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
    .max(5, 'Code cannot exceed 5 characters')
    .regex(/^[A-Za-z0-9_-]+$/, 'Code can contain only letters, numbers, underscore, and hyphen'),
  address: z
    .string()
    .trim()
    .min(1, 'Address is required')
    .max(500, 'Address cannot exceed 500 characters')
    .refine((value) => value.length > 0, {
      message: 'Address is required',
    }),
  area: z.custom<AreaDTO>(
    (value) =>
      typeof value === 'object' && value !== null && typeof (value as AreaDTO).id === 'number',
    { message: 'Please select a location' }
  ),
  areas: z.array(warehouseAreaSchema),
});

type WarehouseFormValues = z.infer<typeof warehouseFormSchema>;

interface WarehouseFormProps {
  id?: number;
}

interface AreaShelvesProps {
  areaIndex: number;
  form: UseFormReturn<WarehouseFormValues>;
  control: Control<WarehouseFormValues>;
  onRemoveArea: () => void;
}

const createEmptyShelf = () => ({ name: '', capacity: '' });

const AreaShelvesFields = ({ areaIndex, form, control, onRemoveArea }: AreaShelvesProps) => {
  const {
    fields: shelfFields,
    append: appendShelf,
    remove: removeShelf,
  } = useFieldArray({
    control,
    name: `areas.${areaIndex}.shelves`,
    keyName: 'fieldId',
  });

  const areaShelfError = form.formState.errors.areas?.[areaIndex]?.shelves;

  return (
    <div className="space-y-3 rounded-md border p-3">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-sm font-medium">Area {areaIndex + 1}</h4>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-destructive hover:text-destructive"
          onClick={onRemoveArea}
          aria-label={`Remove area ${areaIndex + 1}`}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <FormField
        control={control}
        name={`areas.${areaIndex}.name` as const}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Area Name</FormLabel>
            <FormControl>
              <Input placeholder="First Floor" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h5 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Shelves
          </h5>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => appendShelf(createEmptyShelf())}
          >
            <Plus className="mr-1 h-4 w-4" />
            Add Shelf
          </Button>
        </div>

        {shelfFields.length === 0 ? (
          <p className="text-sm text-muted-foreground">No shelves added yet.</p>
        ) : (
          <div className="space-y-2">
            {shelfFields.map((shelfField, shelfIndex) => (
              <div
                key={shelfField.fieldId}
                className="grid grid-cols-1 gap-3 rounded-md border p-3 md:grid-cols-6"
              >
                <FormField
                  control={control}
                  name={`areas.${areaIndex}.shelves.${shelfIndex}.name` as const}
                  render={({ field }) => (
                    <FormItem className="md:col-span-3">
                      <FormLabel>Shelf Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Shelf A1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name={`areas.${areaIndex}.shelves.${shelfIndex}.capacity` as const}
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Shelf Capacity</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} placeholder="250" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-end md:col-span-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => removeShelf(shelfIndex)}
                    aria-label={`Remove shelf ${shelfIndex + 1}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {typeof areaShelfError?.message === 'string' && (
          <p className="text-sm text-destructive">{areaShelfError.message}</p>
        )}
      </div>
    </div>
  );
};

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

  const form = useForm<WarehouseFormValues>({
    resolver: zodResolver(warehouseFormSchema),
    defaultValues: {
      name: '',
      code: '',
      address: '',
      area: undefined,
      areas: [],
    },
  });

  const {
    fields: areaFields,
    append: appendArea,
    remove: removeArea,
  } = useFieldArray({
    control: form.control,
    name: 'areas',
    keyName: 'fieldId',
  });

  React.useEffect(() => {
    if (!existingWarehouse) {
      return;
    }

    form.reset({
      name: existingWarehouse.name,
      code: existingWarehouse.code,
      address: existingWarehouse.address || '',
      area:
        existingWarehouse.area && typeof existingWarehouse.area.id === 'number'
          ? (existingWarehouse.area as AreaDTO)
          : undefined,
      areas: (existingWarehouse.areas || []).map((area) => {
        const legacyArea = area as IWarehouseArea & { capacity?: number };
        const mappedShelves = (area.shelves || []).map((shelf) => ({
          id: shelf.id,
          name: shelf.name || '',
          capacity: typeof shelf.capacity === 'number' ? String(shelf.capacity) : '',
        }));

        if (mappedShelves.length === 0 && typeof legacyArea.capacity === 'number') {
          mappedShelves.push({
            name: 'Shelf 1',
            capacity: String(legacyArea.capacity),
          });
        }

        if (mappedShelves.length === 0) {
          mappedShelves.push(createEmptyShelf());
        }

        return {
          id: area.id,
          name: area.name || '',
          shelves: mappedShelves,
        };
      }),
    });
  }, [existingWarehouse, form]);

  const setFieldErrorsFromServer = (error: unknown) => {
    const message = extractErrorMessage(error).toLowerCase();

    if (message.includes('code')) {
      form.setError('code', {
        type: 'server',
        message: 'This code is already in use. Please use a different code.',
      });

      return;
    }
  };

  const onSubmit = (values: WarehouseFormValues) => {
    form.clearErrors('root');

    const areas: IWarehouseArea[] = values.areas.map((area) => ({
      ...(typeof area.id === 'number' ? { id: area.id } : {}),
      name: area.name.trim(),
      shelves: area.shelves.map(
        (shelf): IWarehouseShelf => ({
          ...(typeof shelf.id === 'number' ? { id: shelf.id } : {}),
          name: shelf.name.trim(),
          capacity: Number(shelf.capacity),
        })
      ),
    }));

    const payload = {
      id,
      name: values.name.trim(),
      code: values.code.trim(),
      address: values.address.trim(),
      area: values.area?.id ? { id: values.area.id } : undefined,
      areas,
      status: 'ACTIVE' as const,
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
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
                  <Input placeholder="WH001" maxLength={5} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address</FormLabel>
                <FormControl>
                  <Input placeholder="Warehouse address" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="rounded-lg border p-4">
          <div className="mb-4">
            <h3 className="text-sm font-medium">Location</h3>
            <p className="text-xs text-muted-foreground">
              Search by state, city, or zipcode to attach the warehouse geography hierarchy.
            </p>
          </div>

          <FormField
            control={form.control}
            name="area"
            render={({ field }) => (
              <FormItem>
                <FormLabel>City and Zipcode</FormLabel>
                <FormControl>
                  <IntelligentLocationField
                    value={field.value ?? null}
                    onChange={(value) => {
                      field.onChange(value);
                      form.clearErrors('area');
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4 rounded-lg border p-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-medium">Areas</h3>
              <p className="text-xs text-muted-foreground">
                Define warehouse areas and shelf capacities.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => appendArea({ name: '', shelves: [createEmptyShelf()] })}
            >
              <Plus className="mr-1 h-4 w-4" />
              Add Area
            </Button>
          </div>

          {areaFields.length === 0 ? (
            <p className="text-sm text-muted-foreground">No areas added yet.</p>
          ) : (
            <div className="space-y-3">
              {areaFields.map((areaField, index) => (
                <AreaShelvesFields
                  key={areaField.fieldId}
                  areaIndex={index}
                  form={form}
                  control={form.control}
                  onRemoveArea={() => removeArea(index)}
                />
              ))}
            </div>
          )}
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
