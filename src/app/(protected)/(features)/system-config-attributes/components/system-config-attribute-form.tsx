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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import type { SystemConfigAttributeDTO } from '@/core/api/generated/spring/schemas';
import { SystemConfigAttributeDTOAttributeType } from '@/core/api/generated/spring/schemas/SystemConfigAttributeDTOAttributeType';
import { SystemConfigAttributeDTOStatus } from '@/core/api/generated/spring/schemas/SystemConfigAttributeDTOStatus';
import {
  useCreateSystemConfigAttribute,
  useGetSystemConfigAttribute,
  useUpdateSystemConfigAttribute,
  useGetAllSystemConfigAttributes,
} from '@/core/api/generated/spring/endpoints/system-config-attribute-resource/system-config-attribute-resource.gen';
import { useGetAllSystemConfigs } from '@/core/api/generated/spring/endpoints/system-config-resource/system-config-resource.gen';

const systemConfigAttributeSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(50, 'Name must not exceed 50 characters')
    .regex(/^[a-z][a-z0-9_]*$/, 'Name must start with lowercase letter and contain only lowercase letters, numbers, and underscores'),
  label: z
    .string()
    .min(1, 'Label is required')
    .max(100, 'Label must not exceed 100 characters'),
  attributeType: z.nativeEnum(SystemConfigAttributeDTOAttributeType),
  isRequired: z.boolean(),
  sortOrder: z.number().min(0, 'Sort order must be 0 or greater'),
  status: z.nativeEnum(SystemConfigAttributeDTOStatus),
  systemConfigId: z.number({ required_error: 'System config is required' }),
});

type SystemConfigAttributeFormValues = z.infer<typeof systemConfigAttributeSchema>;

interface SystemConfigAttributeFormProps {
  id?: number;
}

export function SystemConfigAttributeForm({ id }: SystemConfigAttributeFormProps) {
  const router = useRouter();
  const isEditMode = !!id;

  // Fetch existing data if editing
  const { data: existingAttribute, isLoading: isLoadingAttribute } = useGetSystemConfigAttribute(id!, {
    query: {
      enabled: isEditMode,
    },
  });

  // Fetch system configs for dropdown
  const { data: systemConfigsResponse, isLoading: isLoadingConfigs } = useGetAllSystemConfigs({
    page: 0,
    size: 1000,
  });

  // Mutations
  const createMutation = useCreateSystemConfigAttribute();
  const updateMutation = useUpdateSystemConfigAttribute();

  const form = useForm<SystemConfigAttributeFormValues>({
    resolver: zodResolver(systemConfigAttributeSchema),
    defaultValues: {
      name: '',
      label: '',
      attributeType: SystemConfigAttributeDTOAttributeType.STRING,
      isRequired: false,
      sortOrder: 0,
      status: SystemConfigAttributeDTOStatus.ACTIVE,
      systemConfigId: undefined,
    },
    values: existingAttribute
      ? {
          name: existingAttribute.name,
          label: existingAttribute.label,
          attributeType: existingAttribute.attributeType,
          isRequired: existingAttribute.isRequired,
          sortOrder: existingAttribute.sortOrder,
          status: existingAttribute.status,
          systemConfigId: existingAttribute.systemConfig?.id!,
        }
      : undefined,
  });

  const onSubmit = async (values: SystemConfigAttributeFormValues) => {
    try {
      const payload: SystemConfigAttributeDTO = {
        name: values.name,
        label: values.label,
        attributeType: values.attributeType,
        isRequired: values.isRequired,
        sortOrder: values.sortOrder,
        status: values.status,
        systemConfig: { id: values.systemConfigId } as any,
      };

      if (isEditMode) {
        await updateMutation.mutateAsync({
          id: id,
          data: payload,
        });
        toast.success('System config attribute updated successfully');
      } else {
        await createMutation.mutateAsync({
          data: payload,
        });
        toast.success('System config attribute created successfully');
      }
      router.push('/system-config-attributes');
      router.refresh();
    } catch (error) {
      toast.error(isEditMode ? 'Failed to update attribute' : 'Failed to create attribute');
      console.error(error);
    }
  };

  const onCancel = () => {
    router.push('/system-config-attributes');
  };

  if (isEditMode && isLoadingAttribute) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[oklch(0.45_0.06_243)] mx-auto"></div>
          <p className="mt-4 text-sm text-gray-600">Loading attribute...</p>
        </div>
      </div>
    );
  }

  const systemConfigs = systemConfigsResponse?.content || [];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="systemConfigId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                System Config <span className="text-red-500">*</span>
              </FormLabel>
              <Select
                onValueChange={(value) => field.onChange(parseInt(value))}
                value={field.value?.toString()}
                disabled={isEditMode || isLoadingConfigs}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a system config" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {systemConfigs.map((config) => (
                    <SelectItem key={config.id} value={config.id!.toString()}>
                      {config.configKey}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>Parent system configuration</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Name <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., max_items"
                  {...field}
                  disabled={isEditMode}
                />
              </FormControl>
              <FormDescription>
                Internal name (lowercase, underscores allowed). Cannot be changed after creation.
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
                <Input placeholder="e.g., Maximum Items" {...field} />
              </FormControl>
              <FormDescription>Display label for this attribute</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="attributeType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Attribute Type <span className="text-red-500">*</span>
              </FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select attribute type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={SystemConfigAttributeDTOAttributeType.STRING}>String</SelectItem>
                  <SelectItem value={SystemConfigAttributeDTOAttributeType.NUMBER}>Number</SelectItem>
                  <SelectItem value={SystemConfigAttributeDTOAttributeType.BOOLEAN}>Boolean</SelectItem>
                  <SelectItem value={SystemConfigAttributeDTOAttributeType.ENUM}>Enum</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>Data type of this attribute</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isRequired"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Required Attribute</FormLabel>
                <FormDescription>
                  Check if this attribute must have a value
                </FormDescription>
              </div>
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
                  <SelectItem value={SystemConfigAttributeDTOStatus.DRAFT}>Draft</SelectItem>
                  <SelectItem value={SystemConfigAttributeDTOStatus.ACTIVE}>Active</SelectItem>
                  <SelectItem value={SystemConfigAttributeDTOStatus.INACTIVE}>Inactive</SelectItem>
                  <SelectItem value={SystemConfigAttributeDTOStatus.ARCHIVED}>Archived</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>Current status of this attribute</FormDescription>
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
              <>{isEditMode ? 'Update Attribute' : 'Create Attribute'}</>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
