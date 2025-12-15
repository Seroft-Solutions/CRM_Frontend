'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  useCreateSystemConfigAttribute,
  useGetSystemConfigAttribute,
  useUpdateSystemConfigAttribute,
} from '@/core/api/generated/spring/endpoints/system-config-attribute-resource/system-config-attribute-resource.gen';
import { useGetAllSystemConfigs } from '@/core/api/generated/spring/endpoints/system-config-resource/system-config-resource.gen';
import { SystemConfigAttributeDTOStatus } from '@/core/api/generated/spring/schemas/SystemConfigAttributeDTOStatus';
import { SystemConfigAttributeDTOAttributeType } from '@/core/api/generated/spring/schemas/SystemConfigAttributeDTOAttributeType';
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

const formSchema = z.object({
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
  sortOrder: z.number().min(0, 'Sort order must be at least 0'),
  systemConfigId: z.number().min(1, 'System config is required'),
});

type FormValues = z.infer<typeof formSchema>;

interface SystemConfigAttributeFormProps {
  id?: number;
}

export function SystemConfigAttributeForm({ id }: SystemConfigAttributeFormProps) {
  const router = useRouter();
  const isEdit = !!id;

  const { data: existingData, isLoading: isLoadingData } = useGetSystemConfigAttribute(id!, {
    query: { enabled: isEdit },
  });

  const { data: systemConfigs, isLoading: isLoadingSystemConfigs } = useGetAllSystemConfigs({
    size: 1000,
    sort: ['configKey,asc'],
  });

  const createMutation = useCreateSystemConfigAttribute();
  const updateMutation = useUpdateSystemConfigAttribute();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      label: '',
      attributeType: SystemConfigAttributeDTOAttributeType.ENUM,
      isRequired: false,
      sortOrder: 0,
      systemConfigId: 0,
    },
  });

  useEffect(() => {
    if (existingData) {
      form.reset({
        name: existingData.name,
        label: existingData.label,
        attributeType: existingData.attributeType,
        isRequired: existingData.isRequired,
        sortOrder: existingData.sortOrder,
        systemConfigId: existingData.systemConfig?.id || 0,
      });
    }
  }, [existingData, form]);

  const onSubmit = async (values: FormValues) => {
    try {
      const payload = {
        name: values.name,
        label: values.label,
        attributeType: values.attributeType,
        isRequired: values.isRequired,
        sortOrder: values.sortOrder,
        status: SystemConfigAttributeDTOStatus.ACTIVE,
        systemConfig: { id: values.systemConfigId },
      };

      if (isEdit) {
        await updateMutation.mutateAsync({
          id: id!,
          data: payload as any,
        });
        toast.success('Attribute updated successfully');
      } else {
        await createMutation.mutateAsync({
          data: payload as any,
        });
        toast.success('Attribute created successfully');
      }
      router.push('/system-config-attributes');
    } catch (error) {
      toast.error(isEdit ? 'Failed to update attribute' : 'Failed to create attribute');
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
          name="systemConfigId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>System Config *</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(parseInt(value))}
                value={field.value?.toString()}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a system config" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {systemConfigs?.map((config) => (
                    <SelectItem key={config.id} value={config.id!.toString()}>
                      {config.configKey}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>The system config this attribute belongs to</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name *</FormLabel>
              <FormControl>
                <Input placeholder="e.g., size" {...field} />
              </FormControl>
              <FormDescription>
                Attribute name (lowercase letters, numbers, and underscores only)
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
                <Input placeholder="e.g., Size" {...field} />
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
              <FormLabel>Attribute Type *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select attribute type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={SystemConfigAttributeDTOAttributeType.ENUM}>Enum</SelectItem>
                  <SelectItem value={SystemConfigAttributeDTOAttributeType.STRING}>String</SelectItem>
                  <SelectItem value={SystemConfigAttributeDTOAttributeType.NUMBER}>Number</SelectItem>
                  <SelectItem value={SystemConfigAttributeDTOAttributeType.BOOLEAN}>Boolean</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                {field.value === SystemConfigAttributeDTOAttributeType.ENUM
                  ? 'ENUM: Select from predefined options (configure options after creating attribute)'
                  : field.value === SystemConfigAttributeDTOAttributeType.STRING
                    ? 'STRING: Free text input'
                    : field.value === SystemConfigAttributeDTOAttributeType.NUMBER
                      ? 'NUMBER: Numeric values only'
                      : 'BOOLEAN: True/False values'}
              </FormDescription>
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
                <FormLabel>Required</FormLabel>
                <FormDescription>Is this attribute required when creating product variants?</FormDescription>
              </div>
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
              <FormDescription>Display order of this attribute (lower numbers appear first)</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center gap-4">
          <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
            {isEdit ? 'Update' : 'Create'} Attribute
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/system-config-attributes')}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
