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
  useCreateState,
  useUpdateState,
  useGetState,
} from "@/core/api/generated/spring/endpoints/state-resource/state-resource.gen";
import type { StateDTO } from "@/core/api/generated/spring/schemas/StateDTO";

interface StateFormProps {
  id?: number;
}

// Create Zod schema for form validation
const formSchema = z.object({
  name: z.string().min(2).max(100),
  country: z.string().min(2).max(50),
});

export function StateForm({ id }: StateFormProps) {
  const router = useRouter();
  const isNew = !id;

  // Create or update mutation
  const { mutate: createEntity, isPending: isCreating } = useCreateState({
    mutation: {
      onSuccess: () => {
        toast.success("State created successfully");
        router.push("/states");
      },
      onError: (error) => {
        toast.error(`Failed to create State: ${error}`);
      },
    },
  });

  const { mutate: updateEntity, isPending: isUpdating } = useUpdateState({
    mutation: {
      onSuccess: () => {
        toast.success("State updated successfully");
        router.push("/states");
      },
      onError: (error) => {
        toast.error(`Failed to update State: ${error}`);
      },
    },
  });

  // Fetch entity for editing
  const { data: entity, isLoading: isLoadingEntity } = useGetState(id || 0, {
    query: {
      enabled: !!id,
      queryKey: ["get-state", id]
    },
  });


  // Form initialization
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {

      name: "",


      country: "",

    },
  });

  // Update form values when entity data is loaded
  useEffect(() => {
    if (entity) {
      const formValues = {

        name: entity.name || "",


        country: entity.country || "",

      };
      form.reset(formValues);
    }
  }, [entity, form]);

  // Form submission handler
  const onSubmit = (data: z.infer<typeof formSchema>) => {
    const entityToSave = {
      ...(!isNew && entity ? { id: entity.id } : {}),

      name: data.name === "__none__" ? undefined : data.name,


      country: data.country === "__none__" ? undefined : data.country,

      // Include any existing fields not in the form to preserve required fields
      ...(entity && !isNew ? {
        // Preserve any existing required fields that aren't in the form
        ...Object.keys(entity).reduce((acc, key) => {
          const isFormField = ['name','country',].includes(key);
          if (!isFormField && entity[key as keyof typeof entity] !== undefined) {
            acc[key] = entity[key as keyof typeof entity];
          }
          return acc;
        }, {} as any)
      } : {})
    } as StateDTO;

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
          name="country"
          render={({ field }) => (

            <FormItem>
              <FormLabel>Country *</FormLabel>
              <FormControl>
                <Input 
                  {...field}
                  
                  placeholder="Enter country"
                />
              </FormControl>

              <FormMessage />
            </FormItem>

          )}
        />


        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/states")}
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
