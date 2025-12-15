'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  useCreateSystemConfigAttributeOption,
  useGetSystemConfigAttributeOption,
  useUpdateSystemConfigAttributeOption,
} from '@/core/api/generated/spring/endpoints/system-config-attribute-option-resource/system-config-attribute-option-resource.gen';
import { useGetAllSystemConfigAttributes } from '@/core/api/generated/spring/endpoints/system-config-attribute-resource/system-config-attribute-resource.gen';
import { SystemConfigAttributeOptionDTOStatus } from '@/core/api/generated/spring/schemas/SystemConfigAttributeOptionDTOStatus';
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

const formSchema = z.object({
  code: z
    .string()
    .min(1, 'Code is required')
    .max(50, 'Code must not exceed 50 characters')
    .regex(/^[A-Za-z0-9_-]+$/, 'Code must contain only letters, numbers, hyphens, and underscores'),
  label: z
    .string()
    .min(1, 'Label is required')
    .max(100, 'Label must not exceed 100 characters'),
  sortOrder: z.number().min(0, 'Sort order must be at least 0'),
  attributeId: z.number().min(1, 'Attribute is required'),
});

type FormValues = z.infer<typeof formSchema>;

interface SystemConfigAttributeOptionFormProps {
  id?: number;
}

export function SystemConfigAttributeOptionForm({ id }: SystemConfigAttributeOptionFormProps) {
  const router = useRouter();
  const isEdit = !!id;

  const { data: existingData, isLoading: isLoadingData } = useGetSystemConfigAttributeOption(id!, {
    query: { enabled: isEdit },
  });

  const { data: attributes, isLoading: isLoadingAttributes } = useGetAllSystemConfigAttributes({
    size: 1000,
    sort: ['name,asc'],
  });

  const createMutation = useCreateSystemConfigAttributeOption();
  const updateMutation = useUpdateSystemConfigAttributeOption();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: '',
      label: '',
      sortOrder: 0,
      attributeId: 0,
    },
  });

  useEffect(() => {
    if (existingData) {
      form.reset({
        code: existingData.code,
        label: existingData.label,
        sortOrder: existingData.sortOrder,
        attributeId: existingData.attribute?.id || 0,
      });
    }
  }, [existingData, form]);

  const onSubmit = async (values: FormValues) => {
    try {
      const payload = {
        code: values.code,
        label: values.label,
        sortOrder: values.sortOrder,
        status: SystemConfigAttributeOptionDTOStatus.ACTIVE,
        attribute: { id: values.attributeId },
      };

      if (isEdit) {
        await updateMutation.mutateAsync({
          id: id!,
          data: payload as any,
        });
        toast.success('Option updated successfully');
      } else {
        await createMutation.mutateAsync({
          data: payload as any,
        });
        toast.success('Option created successfully');
      }
      router.push('/system-config-attribute-options');
    } catch (error) {
      toast.error(isEdit ? 'Failed to update option' : 'Failed to create option');
      console.error(error);
    }
  };

  if (isEdit && isLoadingData) {
    return <div>Loading...</div>;
  }

  const enumAttributes = attributes?.filter(attr => attr.attributeType === 'ENUM');

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="attributeId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Attribute *</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(parseInt(value))}
                value={field.value?.toString()}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an ENUM attribute" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {enumAttributes?.map((attr) => (
                    <SelectItem key={attr.id} value={attr.id!.toString()}>
                      {attr.label} ({attr.name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                The ENUM attribute this option belongs to (only ENUM attributes are shown)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Code *</FormLabel>
              <FormControl>
                <Input placeholder="e.g., S or SMALL" {...field} />
              </FormControl>
              <FormDescription>
                Unique code for this option (letters, numbers, hyphens, and underscores only)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="label"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Label *</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Small" {...field} />
              </FormControl>
              <FormDescription>Display label shown to users</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="sortOrder"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sort Order *</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="0"
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                />
              </FormControl>
              <FormDescription>Display order of this option (lower numbers appear first)</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center gap-4">
          <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
            {isEdit ? 'Update' : 'Create'} Option
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/system-config-attribute-options')}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
