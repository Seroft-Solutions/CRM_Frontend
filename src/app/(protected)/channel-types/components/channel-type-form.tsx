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
  useCreateChannelType,
  useUpdateChannelType,
  useGetChannelType,
} from "@/core/api/generated/spring/endpoints/channel-type-resource/channel-type-resource.gen";
import type { ChannelTypeDTO } from "@/core/api/generated/spring/schemas/ChannelTypeDTO";

interface ChannelTypeFormProps {
  id?: number;
}

// Create Zod schema for form validation
const formSchema = z.object({
  name: z.string().min(2).max(50),
  description: z.string().max(255).optional(),
  commissionRate: z.string().refine(val => !val || Number(val) >= 0, { message: "Must be at least 0" }).refine(val => !val || Number(val) <= 100, { message: "Must be at most 100" }).optional(),
  isActive: z.boolean(),
});

export function ChannelTypeForm({ id }: ChannelTypeFormProps) {
  const router = useRouter();
  const isNew = !id;

  // Create or update mutation
  const { mutate: createEntity, isPending: isCreating } = useCreateChannelType({
    mutation: {
      onSuccess: () => {
        toast.success("ChannelType created successfully");
        router.push("/channel-types");
      },
      onError: (error) => {
        toast.error(`Failed to create ChannelType: ${error}`);
      },
    },
  });

  const { mutate: updateEntity, isPending: isUpdating } = useUpdateChannelType({
    mutation: {
      onSuccess: () => {
        toast.success("ChannelType updated successfully");
        router.push("/channel-types");
      },
      onError: (error) => {
        toast.error(`Failed to update ChannelType: ${error}`);
      },
    },
  });

  // Fetch entity for editing
  const { data: entity, isLoading: isLoadingEntity } = useGetChannelType(id || 0, {
    query: {
      enabled: !!id,
      queryKey: ["get-channel-type", id]
    },
  });


  // Form initialization
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {

      name: "",


      description: "",


      commissionRate: "",


      isActive: false,

    },
  });

  // Update form values when entity data is loaded
  useEffect(() => {
    if (entity) {
      const formValues = {

        name: entity.name || "",


        description: entity.description || "",


        commissionRate: entity.commissionRate != null ? String(entity.commissionRate) : "",


        isActive: entity.isActive || "",

      };
      form.reset(formValues);
    }
  }, [entity, form]);

  // Form submission handler
  const onSubmit = (data: z.infer<typeof formSchema>) => {
    const entityToSave = {
      ...(!isNew && entity ? { id: entity.id } : {}),

      name: data.name === "__none__" ? undefined : data.name,


      description: data.description === "__none__" ? undefined : data.description,


      commissionRate: data.commissionRate ? Number(data.commissionRate) : undefined,


      isActive: data.isActive === "__none__" ? undefined : data.isActive,

      // Include any existing fields not in the form to preserve required fields
      ...(entity && !isNew ? {
        // Preserve any existing required fields that aren't in the form
        ...Object.keys(entity).reduce((acc, key) => {
          const isFormField = ['name','description','commissionRate','isActive',].includes(key);
          if (!isFormField && entity[key as keyof typeof entity] !== undefined) {
            acc[key] = entity[key as keyof typeof entity];
          }
          return acc;
        }, {} as any)
      } : {})
    } as ChannelTypeDTO;

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

              <FormMessage />
            </FormItem>

          )}
        />
        <FormField
          control={form.control}
          name="commissionRate"
          render={({ field }) => (

            <FormItem>
              <FormLabel>CommissionRate</FormLabel>
              <FormControl>
                <Input 
                  {...field}
                  type="number"
                  placeholder="Enter commissionRate"
                />
              </FormControl>

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

              </div>
              <FormMessage />
            </FormItem>

          )}
        />


        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/channel-types")}
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
