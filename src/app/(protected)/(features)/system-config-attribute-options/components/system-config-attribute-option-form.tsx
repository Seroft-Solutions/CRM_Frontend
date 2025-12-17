'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

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

import type { SystemConfigAttributeOptionDTO } from '@/core/api/generated/spring/schemas';
import { SystemConfigAttributeOptionDTOStatus } from '@/core/api/generated/spring/schemas/SystemConfigAttributeOptionDTOStatus';
import {
  useCreateSystemConfigAttributeOption,
  useGetSystemConfigAttributeOption,
  useUpdateSystemConfigAttributeOption,
} from '@/core/api/generated/spring/endpoints/system-config-attribute-option-resource/system-config-attribute-option-resource.gen';
import { useGetAllSystemConfigAttributes } from '@/core/api/generated/spring/endpoints/system-config-attribute-resource/system-config-attribute-resource.gen';

const systemConfigAttributeOptionSchema = z.object({
  code: z
    .string()
    .min(1, 'Code is required')
    .max(50, 'Code must not exceed 50 characters')
    .regex(/^[A-Za-z0-9_-]+$/, 'Code can only contain letters, numbers, underscores, and hyphens'),
  label: z
    .string()
    .min(1, 'Label is required')
    .max(100, 'Label must not exceed 100 characters'),
  sortOrder: z.number().min(0, 'Sort order must be 0 or greater'),
  status: z.nativeEnum(SystemConfigAttributeOptionDTOStatus),
  attributeId: z.number({ required_error: 'Attribute is required' }),
});

type SystemConfigAttributeOptionFormValues = z.infer<typeof systemConfigAttributeOptionSchema>;

interface SystemConfigAttributeOptionFormProps {
  id?: number;
}

export function SystemConfigAttributeOptionForm({ id }: SystemConfigAttributeOptionFormProps) {
  const router = useRouter();
  const isEditMode = !!id;

  // Fetch existing data if editing
  const { data: existingOption, isLoading: isLoadingOption } = useGetSystemConfigAttributeOption(id!, {
    query: {
      enabled: isEditMode,
    },
  });

  // Fetch attributes for dropdown
  const { data: attributesResponse, isLoading: isLoadingAttributes } = useGetAllSystemConfigAttributes({
    page: 0,
    size: 1000,
  });

  // Mutations
  const createMutation = useCreateSystemConfigAttributeOption();
  const updateMutation = useUpdateSystemConfigAttributeOption();

  const form = useForm<SystemConfigAttributeOptionFormValues>({
    resolver: zodResolver(systemConfigAttributeOptionSchema),
    defaultValues: {
      code: '',
      label: '',
      sortOrder: 0,
      status: SystemConfigAttributeOptionDTOStatus.ACTIVE,
      attributeId: undefined,
    },
    values: existingOption
      ? {
          code: existingOption.code,
          label: existingOption.label,
          sortOrder: existingOption.sortOrder,
          status: existingOption.status,
          attributeId: existingOption.attribute?.id!,
        }
      : undefined,
  });

  const onSubmit = async (values: SystemConfigAttributeOptionFormValues) => {
    try {
      const payload: SystemConfigAttributeOptionDTO = {
        code: values.code,
        label: values.label,
        sortOrder: values.sortOrder,
        status: values.status,
        attribute: { id: values.attributeId } as any,
      };

      if (isEditMode) {
        await updateMutation.mutateAsync({
          id: id,
          data: payload,
        });
        toast.success('Attribute option updated successfully');
      } else {
        await createMutation.mutateAsync({
          data: payload,
        });
        toast.success('Attribute option created successfully');
      }
      router.push('/system-config-attribute-options');
      router.refresh();
    } catch (error) {
      toast.error(isEditMode ? 'Failed to update option' : 'Failed to create option');
      console.error(error);
    }
  };

  const onCancel = () => {
    router.push('/system-config-attribute-options');
  };

  if (isEditMode && isLoadingOption) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[oklch(0.45_0.06_243)] mx-auto"></div>
          <p className="mt-4 text-sm text-gray-600">Loading option...</p>
        </div>
      </div>
    );
  }

  const attributes = attributesResponse?.content || [];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="attributeId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Attribute <span className="text-red-500">*</span>
              </FormLabel>
              <Select
                onValueChange={(value) => field.onChange(parseInt(value))}
                value={field.value?.toString()}
                disabled={isEditMode || isLoadingAttributes}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an attribute" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {attributes.map((attr) => (
                    <SelectItem key={attr.id} value={attr.id!.toString()}>
                      {attr.label} ({attr.name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>Parent attribute for this option</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Code <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., OPTION_A"
                  {...field}
                  disabled={isEditMode}
                />
              </FormControl>
              <FormDescription>
                Unique code for this option (letters, numbers, -, _). Cannot be changed after creation.
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
              <FormLabel>
                Label <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Input placeholder="e.g., Option A" {...field} />
              </FormControl>
              <FormDescription>Display label for this option</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="sortOrder"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Sort Order <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="0"
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                />
              </FormControl>
              <FormDescription>Display order (lower numbers appear first)</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Status <span className="text-red-500">*</span>
              </FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={SystemConfigAttributeOptionDTOStatus.DRAFT}>Draft</SelectItem>
                  <SelectItem value={SystemConfigAttributeOptionDTOStatus.ACTIVE}>Active</SelectItem>
                  <SelectItem value={SystemConfigAttributeOptionDTOStatus.INACTIVE}>Inactive</SelectItem>
                  <SelectItem value={SystemConfigAttributeOptionDTOStatus.ARCHIVED}>Archived</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>Current status of this option</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-4 justify-end pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={form.formState.isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="bg-[oklch(0.45_0.06_243)] hover:bg-[oklch(0.40_0.06_243)]"
          >
            {form.formState.isSubmitting ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                {isEditMode ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>{isEditMode ? 'Update Option' : 'Create Option'}</>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
