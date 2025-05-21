// prettier-ignore
'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

// API and types
import type { [[dto]] } from '@/core/api/generated/schemas';
import { [[hooks.create]], [[hooks.update]] } from '[[endpointImport]]';
[[#fields]]
[[#isEnum]]import { [[pascalCase name]]Values } from './enums';[[/isEnum]]
[[/fields]]

// UI Components
import { Button } from '@/components/ui/button';
import { 
  FormField, FormItem, FormLabel, FormMessage, 
  DateTimeField, SelectField, TextField, CheckboxField 
} from '@/components/forms';
import { Form } from '@/components/ui/form';
import { RelationshipField } from './relationship-field';
[[#relationships]]
import { [[useSearch]] } from '@/core/api/generated/endpoints/[[kebab]]-resource/[[targetKebab]]-resource.gen';
[[/relationships]]

// Validation schema built from JHipster metadata
const schema = z.object({
[[#fields]]
  [[name]]: [[^isEnum]][[#isString]]z.string()[[^isRequired]].optional()[[/isRequired]][[#isRequired]].nonempty({ message: "[[label]] is required" })[[/isRequired]][[/isString]][[#isNumber]]z.number()[[^isRequired]].optional()[[/isRequired]][[#isRequired]].min(0, { message: "[[label]] is required" })[[/isRequired]][[/isNumber]][[#isBoolean]]z.boolean().optional()[[/isBoolean]][[#isDate]]z.date()[[^isRequired]].optional()[[/isRequired]][[#isRequired]].refine(val => !!val, { message: "[[label]] is required" })[[/isRequired]][[/isDate]][[/isEnum]][[#isEnum]]z.enum([[pascalCase name]]Values)[[^isRequired]].optional()[[/isRequired]][[/isEnum]],
[[/fields]]
[[#relationships]]
  [[#isCollection]]
  [[name]]: z.array(
    z.object({
      id: z.number(),
      [[displayField]]: z.string()
    })
  )[[^required]].optional()[[/required]],
  [[/isCollection]]
  [[^isCollection]]
  [[name]]: z.object({
    id: z.number(),
    [[displayField]]: z.string()
  })[[^required]].optional()[[/required]],
  [[/isCollection]]
[[/relationships]]
});

type FormValues = z.infer<typeof schema>;

interface Props { 
  defaultValues?: Partial<[[dto]]>
}

export default function [[entity]]Form({ defaultValues }: Props) {
  const router = useRouter();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues as any || {},
  });

  // Get mutations
  const createMutation = [[hooks.create]]();
  const updateMutation = [[hooks.update]]();
  const isLoading = createMutation.isPending || updateMutation.isPending;

  const onSubmit = async (values: FormValues) => {
    try {
      if (defaultValues?.id) {
        // For update mutations
        await updateMutation.mutateAsync({ 
          id: defaultValues.id, 
          data: {
            ...values,
            id: defaultValues.id // Ensure ID is included in payload
          } as [[dto]]
        });
        toast.success('[[entity]] updated successfully');
        router.refresh();
        router.back();
      } else {
        // For create mutations
        await createMutation.mutateAsync({ data: values as [[dto]] });
        toast.success('[[entity]] created successfully');
        router.refresh();
        router.back();
      }
    } catch (error: any) {
      toast.error(`Failed to ${defaultValues?.id ? 'update' : 'create'}: ${error?.message || 'Unknown error'}`);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
[[#fields]]
        [[#isString]]
        <TextField 
          form={form}
          name="[[name]]"
          label="[[label]]"
          placeholder="Enter [[label]]"
          required={[[isRequired]]}
        />
        [[/isString]]
        [[#isNumber]]
        <TextField 
          form={form}
          name="[[name]]"
          label="[[label]]"
          type="number"
          placeholder="Enter [[label]]"
          required={[[isRequired]]}
        />
        [[/isNumber]]
        [[#isBoolean]]
        <CheckboxField
          form={form}
          name="[[name]]"
          label="[[label]]"
        />
        [[/isBoolean]]
        [[#isDate]]
        <DateTimeField
          form={form}
          name="[[name]]"
          label="[[label]]"
          required={[[isRequired]]}
        />
        [[/isDate]]
        [[#isEnum]]
        <SelectField
          form={form}
          name="[[name]]"
          label="[[label]]"
          options={[[pascalCase name]]Values.map(value => ({ 
            label: value, 
            value 
          }))}
          placeholder="Select [[label]]"
          required={[[isRequired]]}
        />
        [[/isEnum]]
[[/fields]]

[[#relationships]]
        <RelationshipField 
          form={form}
          name="[[name]]"
          label="[[label]]"
          useSearch={[[useSearch]]}
          displayField="[[displayField]]"
          required={[[required]]}
          relationshipType="[[type]]"
          [[#helperText]]helperText="[[helperText]]"[[/helperText]]
        />
[[/relationships]]

        <div className="flex justify-end space-x-4">
          <Button 
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={!form.formState.isDirty || isLoading}
          >
            {isLoading ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
