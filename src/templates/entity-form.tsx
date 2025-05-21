'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { 
  Form, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Spinner } from '@/components/ui/spinner';

import RelationshipField from './relationship-field';

// This is a generic entity form template
// It should be customized for each entity type

interface EntityFormProps<T, U> {
  // Schema and hooks
  schema: z.ZodSchema<any>;
  useCreateEntity: any;
  useUpdateEntity: any;
  
  // Entity data
  defaultValues?: Partial<T>;
  dtoType: string;
  
  // UI props
  title: string;
  basePath: string;
  
  // Field definitions
  fields: Array<{
    name: string;
    label: string;
    type: 'string' | 'number' | 'boolean' | 'date' | 'enum';
    isRequired: boolean;
    component: React.FC<any>;
    props?: Record<string, any>;
    isEnum?: boolean;
    enumValues?: string[];
  }>;
  
  // Relationship definitions
  relationships: Array<{
    name: string;
    label: string;
    type: 'many-to-one' | 'one-to-many' | 'many-to-many' | 'one-to-one';
    required: boolean;
    useSearch: any;
    displayField: string;
  }>;
  
  // Optional callbacks
  onSuccess?: (data: U) => void;
  onCancel?: () => void;
}

export default function EntityForm<T, U>({
  schema,
  useCreateEntity,
  useUpdateEntity,
  defaultValues,
  dtoType,
  title,
  basePath,
  fields,
  relationships,
  onSuccess,
  onCancel
}: EntityFormProps<T, U>) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Initialize form with schema and default values
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues as any || {},
  });
  
  // Get mutations
  const createMutation = useCreateEntity();
  const updateMutation = useUpdateEntity();
  
  // Check if we're in edit mode (has an ID)
  const isEditMode = !!defaultValues && 'id' in defaultValues && defaultValues.id !== undefined;
  
  // Handle form submission
  const onSubmit = async (values: z.infer<typeof schema>) => {
    setIsSubmitting(true);
    
    try {
      let result;
      
      if (isEditMode && 'id' in defaultValues) {
        // For update mutations
        result = await updateMutation.mutateAsync({ 
          id: (defaultValues as any).id, 
          data: {
            ...values,
            id: (defaultValues as any).id // Ensure ID is included in payload
          } as any
        });
        
        toast.success(`${title} updated successfully`);
      } else {
        // For create mutations
        result = await createMutation.mutateAsync({ data: values as any });
        toast.success(`${title} created successfully`);
      }
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess(result as U);
      } else {
        // Default navigation
        router.refresh();
        router.push(basePath);
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'Unknown error';
      toast.error(`Failed to ${isEditMode ? 'update' : 'create'}: ${errorMessage}`);
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle cancel
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      // Default navigation
      router.back();
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Render field components */}
        {fields.map((field) => (
          <field.component
            key={field.name}
            form={form}
            name={field.name}
            label={field.label}
            required={field.isRequired}
            {...(field.isEnum ? { options: field.enumValues?.map(value => ({ value, label: value })) } : {})}
            {...(field.props || {})}
          />
        ))}
        
        {/* Render relationship fields */}
        {relationships.map((relationship) => (
          <RelationshipField
            key={relationship.name}
            form={form}
            name={relationship.name}
            label={relationship.label}
            useSearch={relationship.useSearch}
            displayField={relationship.displayField}
            required={relationship.required}
            relationshipType={relationship.type}
          />
        ))}
        
        {/* Form actions */}
        <div className="flex justify-end space-x-4">
          <Button 
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={!form.formState.isDirty || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                {isEditMode ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              isEditMode ? 'Update' : 'Create'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
