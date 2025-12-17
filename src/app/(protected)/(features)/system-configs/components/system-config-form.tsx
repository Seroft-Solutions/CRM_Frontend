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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import type { SystemConfigDTO } from '@/core/api/generated/spring/schemas';
import { SystemConfigDTOSystemConfigType } from '@/core/api/generated/spring/schemas/SystemConfigDTOSystemConfigType';
import { SystemConfigDTOStatus } from '@/core/api/generated/spring/schemas/SystemConfigDTOStatus';
import {
  useCreateSystemConfig,
  useGetSystemConfig,
  useUpdateSystemConfig,
} from '@/core/api/generated/spring/endpoints/system-config-resource/system-config-resource.gen';

const systemConfigSchema = z.object({
  configKey: z
    .string()
    .min(2, 'Config key must be at least 2 characters')
    .max(100, 'Config key must not exceed 100 characters')
    .regex(/^[A-Za-z0-9_.:-]+$/, 'Config key can only contain letters, numbers, and _.:-'),
  systemConfigType: z.nativeEnum(SystemConfigDTOSystemConfigType),
  description: z.string().max(255, 'Description must not exceed 255 characters').optional(),
  status: z.nativeEnum(SystemConfigDTOStatus),
});

type SystemConfigFormValues = z.infer<typeof systemConfigSchema>;

interface SystemConfigFormProps {
  id?: number;
}

export function SystemConfigForm({ id }: SystemConfigFormProps) {
  const router = useRouter();
  const isEditMode = !!id;

  // Fetch existing data if editing
  const { data: existingConfig, isLoading: isLoadingConfig } = useGetSystemConfig(id!, {
    query: {
      enabled: isEditMode,
    },
  });

  // Mutations
  const createMutation = useCreateSystemConfig();
  const updateMutation = useUpdateSystemConfig();

  const form = useForm<SystemConfigFormValues>({
    resolver: zodResolver(systemConfigSchema),
    defaultValues: {
      configKey: '',
      systemConfigType: SystemConfigDTOSystemConfigType.CUSTOM,
      description: '',
      status: SystemConfigDTOStatus.ACTIVE,
    },
    values: existingConfig
      ? {
          configKey: existingConfig.configKey,
          systemConfigType: existingConfig.systemConfigType,
          description: existingConfig.description || '',
          status: existingConfig.status,
        }
      : undefined,
  });

  const onSubmit = async (values: SystemConfigFormValues) => {
    try {
      if (isEditMode) {
        await updateMutation.mutateAsync({
          id: id,
          data: values as SystemConfigDTO,
        });
        toast.success('System config updated successfully');
      } else {
        await createMutation.mutateAsync({
          data: values as SystemConfigDTO,
        });
        toast.success('System config created successfully');
      }
      router.push('/system-configs');
      router.refresh();
    } catch (error) {
      toast.error(isEditMode ? 'Failed to update system config' : 'Failed to create system config');
      console.error(error);
    }
  };

  const onCancel = () => {
    router.push('/system-configs');
  };

  if (isEditMode && isLoadingConfig) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[oklch(0.45_0.06_243)] mx-auto"></div>
          <p className="mt-4 text-sm text-gray-600">Loading system config...</p>
        </div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="configKey"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Config Key <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., app.feature.enabled"
                  {...field}
                  disabled={isEditMode} // Config key cannot be changed after creation
                />
              </FormControl>
              <FormDescription>
                Unique identifier for this configuration. Use letters, numbers, and _.:-
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="systemConfigType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Config Type <span className="text-red-500">*</span>
              </FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a config type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={SystemConfigDTOSystemConfigType.PRODUCT}>Product</SelectItem>
                  <SelectItem value={SystemConfigDTOSystemConfigType.INVENTORY}>
                    Inventory
                  </SelectItem>
                  <SelectItem value={SystemConfigDTOSystemConfigType.USER}>User</SelectItem>
                  <SelectItem value={SystemConfigDTOSystemConfigType.CUSTOM}>Custom</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>Category of this system configuration</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe what this configuration controls..."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>Optional description of this configuration</FormDescription>
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
                  <SelectItem value={SystemConfigDTOStatus.ACTIVE}>Active</SelectItem>
                  <SelectItem value={SystemConfigDTOStatus.INACTIVE}>Inactive</SelectItem>
                  <SelectItem value={SystemConfigDTOStatus.ARCHIVED}>Archived</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>Current status of this configuration</FormDescription>
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
              <>{isEditMode ? 'Update System Config' : 'Create System Config'}</>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
