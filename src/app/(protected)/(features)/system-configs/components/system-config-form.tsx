'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  useCreateSystemConfig,
  useGetSystemConfig,
  useUpdateSystemConfig,
} from '@/core/api/generated/spring/endpoints/system-config-resource/system-config-resource.gen';
import { SystemConfigDTOStatus } from '@/core/api/generated/spring/schemas/SystemConfigDTOStatus';
import { SystemConfigDTOSystemConfigType } from '@/core/api/generated/spring/schemas/SystemConfigDTOSystemConfigType';
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

const formSchema = z.object({
  configKey: z
    .string()
    .min(2, 'Config key must be at least 2 characters')
    .max(100, 'Config key must not exceed 100 characters')
    .regex(/^[A-Za-z0-9_.:-]+$/, 'Config key must contain only letters, numbers, and _.:-'),
  systemConfigType: z.nativeEnum(SystemConfigDTOSystemConfigType),
  description: z.string().max(255, 'Description must not exceed 255 characters').optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface SystemConfigFormProps {
  id?: number;
}

export function SystemConfigForm({ id }: SystemConfigFormProps) {
  const router = useRouter();
  const isEdit = !!id;

  const { data: existingData, isLoading: isLoadingData } = useGetSystemConfig(id!, {
    query: { enabled: isEdit },
  });

  const createMutation = useCreateSystemConfig();
  const updateMutation = useUpdateSystemConfig();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      configKey: '',
      systemConfigType: SystemConfigDTOSystemConfigType.PRODUCT,
      description: '',
    },
  });

  useEffect(() => {
    if (existingData) {
      form.reset({
        configKey: existingData.configKey,
        systemConfigType: existingData.systemConfigType,
        description: existingData.description || '',
      });
    }
  }, [existingData, form]);

  const onSubmit = async (values: FormValues) => {
    try {
      const payload = {
        ...values,
        status: SystemConfigDTOStatus.ACTIVE,
      };

      if (isEdit) {
        await updateMutation.mutateAsync({
          id: id!,
          data: payload,
        });
        toast.success('System config updated successfully');
      } else {
        await createMutation.mutateAsync({
          data: payload,
        });
        toast.success('System config created successfully');
      }
      router.push('/system-configs');
    } catch (error) {
      toast.error(isEdit ? 'Failed to update system config' : 'Failed to create system config');
      console.error(error);
    }
  };

  if (isEdit && isLoadingData) {
    return <div>Loading...</div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="configKey"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Config Key *</FormLabel>
              <FormControl>
                <Input placeholder="e.g., product.variant.clothing" {...field} />
              </FormControl>
              <FormDescription>
                Unique identifier for this configuration (letters, numbers, and _.:-  only)
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
              <FormLabel>Config Type *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                  placeholder="Enter a description for this configuration"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>Optional description of this configuration</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center gap-4">
          <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
            {isEdit ? 'Update' : 'Create'} System Config
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/system-configs')}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
