"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { CalendarIcon, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format, parse } from "date-fns";

import { 
  useCreateCallCategory,
  useUpdateCallCategory,
  useGetCallCategory,
} from "@/core/api/generated/spring/endpoints/call-category-resource/call-category-resource.gen";
import type { CallCategoryDTO } from "@/core/api/generated/spring/schemas/CallCategoryDTO";

interface CallCategoryFormProps {
  id?: number;
}

// Create Zod schema for form validation
const formSchema = z.object({
  name: z.string().min(2).max(50),
  code: z.string().min(2).max(10).regex(/^[A-Z0-9_]+$/),
  description: z.string().max(255).optional(),
  isActive: z.boolean(),
  sortOrder: z.string().refine(val => !val || Number(val) >= 0, { message: "Must be at least 0" }).optional(),
  remark: z.string().max(1000).optional(),
  createdDate: z.date(),
  lastModifiedDate: z.date().optional(),
});

export function CallCategoryForm({ id }: CallCategoryFormProps) {
  const router = useRouter();
  const isNew = !id;

  // Create or update mutation
  const { mutate: createEntity, isPending: isCreating } = useCreateCallCategory({
    mutation: {
      onSuccess: () => {
        toast.success("CallCategory created successfully");
        router.push("/call-categories");
      },
      onError: (error) => {
        toast.error(`Failed to create CallCategory: ${error}`);
      },
    },
  });

  const { mutate: updateEntity, isPending: isUpdating } = useUpdateCallCategory({
    mutation: {
      onSuccess: () => {
        toast.success("CallCategory updated successfully");
        router.push("/call-categories");
      },
      onError: (error) => {
        toast.error(`Failed to update CallCategory: ${error}`);
      },
    },
  });

  // Fetch entity for editing
  const { data: entity, isLoading: isLoadingEntity } = useGetCallCategory(id || 0, {
    query: {
      enabled: !!id,
      queryKey: ["get-call-category", id]
    },
  });


  // Form initialization
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {

      name: "",


      code: "",


      description: "",


      isActive: false,


      sortOrder: "",


      remark: "",


      createdDate: new Date(),


      lastModifiedDate: new Date(),

    },
  });

  // Update form values when entity data is loaded
  useEffect(() => {
    if (entity) {
      const formValues = {

        name: entity.name || "",


        code: entity.code || "",


        description: entity.description || "",


        isActive: entity.isActive || "",


        sortOrder: entity.sortOrder != null ? String(entity.sortOrder) : "",


        remark: entity.remark || "",


        createdDate: entity.createdDate ? new Date(entity.createdDate) : undefined,


        lastModifiedDate: entity.lastModifiedDate ? new Date(entity.lastModifiedDate) : undefined,

      };
      form.reset(formValues);
    }
  }, [entity, form]);

  // Form submission handler
  const onSubmit = (data: z.infer<typeof formSchema>) => {
    const entityToSave = {
      ...(!isNew && entity ? { id: entity.id } : {}),

      name: data.name,


      code: data.code,


      description: data.description,


      isActive: data.isActive,


      sortOrder: data.sortOrder ? Number(data.sortOrder) : undefined,


      remark: data.remark,


      createdDate: data.createdDate,


      lastModifiedDate: data.lastModifiedDate,

      // Include any existing fields not in the form to preserve required fields
      ...(entity && !isNew ? {
        // Preserve any existing required fields that aren't in the form
        ...Object.keys(entity).reduce((acc, key) => {
          const isFormField = ['name','code','description','isActive','sortOrder','remark','createdDate','lastModifiedDate',].includes(key);
          if (!isFormField && entity[key as keyof typeof entity] !== undefined) {
            acc[key] = entity[key as keyof typeof entity];
          }
          return acc;
        }, {} as any)
      } : {})
    } as CallCategoryDTO;

    if (isNew) {
      createEntity({ data: entityToSave });
    } else if (id) {
      updateEntity({ id, data: entityToSave });
    }
  };

  if (id && isLoadingEntity) {
    return <div>Loading...</div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (

            <FormItem>
              <FormLabel>Name *</FormLabel>
              <FormControl>
                <Input 
                  {...field}
                  
                  placeholder="Enter name"
                />
              </FormControl>

              <FormDescription>
                Category name
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
                <Input 
                  {...field}
                  
                  placeholder="Enter code"
                />
              </FormControl>

              <FormDescription>
                Category code
              </FormDescription>

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
                <Input 
                  {...field}
                  
                  placeholder="Enter description"
                />
              </FormControl>

              <FormDescription>
                Category description
              </FormDescription>

              <FormMessage />
            </FormItem>

          )}
        />
        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (

            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>IsActive</FormLabel>

                <FormDescription>
                  Is this category active
                </FormDescription>

              </div>
              <FormMessage />
            </FormItem>

          )}
        />
        <FormField
          control={form.control}
          name="sortOrder"
          render={({ field }) => (

            <FormItem>
              <FormLabel>SortOrder</FormLabel>
              <FormControl>
                <Input 
                  {...field}
                  type="number"
                  placeholder="Enter sortOrder"
                />
              </FormControl>

              <FormDescription>
                Sort order for display
              </FormDescription>

              <FormMessage />
            </FormItem>

          )}
        />
        <FormField
          control={form.control}
          name="remark"
          render={({ field }) => (

            <FormItem>
              <FormLabel>Remark</FormLabel>
              <FormControl>
                <Input 
                  {...field}
                  
                  placeholder="Enter remark"
                />
              </FormControl>

              <FormDescription>
                Additional remarks
              </FormDescription>

              <FormMessage />
            </FormItem>

          )}
        />
        <FormField
          control={form.control}
          name="createdDate"
          render={({ field }) => (

            <FormItem className="flex flex-col">
              <FormLabel>CreatedDate *</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={`w-full pl-3 text-left font-normal ${
                        !field.value && "text-muted-foreground"
                      }`}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Select a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <FormDescription>
                Created timestamp
              </FormDescription>

              <FormMessage />
            </FormItem>

          )}
        />
        <FormField
          control={form.control}
          name="lastModifiedDate"
          render={({ field }) => (

            <FormItem className="flex flex-col">
              <FormLabel>LastModifiedDate</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={`w-full pl-3 text-left font-normal ${
                        !field.value && "text-muted-foreground"
                      }`}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Select a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <FormDescription>
                Last modified timestamp
              </FormDescription>

              <FormMessage />
            </FormItem>

          )}
        />


        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/call-categories")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isCreating || isUpdating}>
            <Save className="mr-2 h-4 w-4" />
            Save
          </Button>
        </div>
      </form>
    </Form>
  );
}
