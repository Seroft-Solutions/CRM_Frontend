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
import { PaginatedRelationshipCombobox } from "./paginated-relationship-combobox";

import { 
  useCreateArea,
  useUpdateArea,
  useGetArea,
} from "@/core/api/generated/spring/endpoints/area-resource/area-resource.gen";
import { 
  useGetAllCitiesInfinite,
  useSearchCitiesInfinite 
} from "@/core/api/generated/spring/endpoints/city-resource/city-resource.gen";
import type { AreaDTO } from "@/core/api/generated/schemas/AreaDTO";

interface AreaFormProps {
  id?: number;
}

// Create Zod schema for form validation
const formSchema = z.object({
  name: z.string(),
  pincode: z.string(),
  city: z.number().optional(),
});

export function AreaForm({ id }: AreaFormProps) {
  const router = useRouter();
  const isNew = !id;

  // Create or update mutation
  const { mutate: createEntity, isPending: isCreating } = useCreateArea({
    mutation: {
      onSuccess: () => {
        toast.success("Area created successfully");
        router.push("/areas");
      },
      onError: (error) => {
        toast.error(`Failed to create Area: ${error}`);
      },
    },
  });

  const { mutate: updateEntity, isPending: isUpdating } = useUpdateArea({
    mutation: {
      onSuccess: () => {
        toast.success("Area updated successfully");
        router.push("/areas");
      },
      onError: (error) => {
        toast.error(`Failed to update Area: ${error}`);
      },
    },
  });

  // Fetch entity for editing
  const { data: entity, isLoading: isLoadingEntity } = useGetArea(id || 0, {
    query: {
      enabled: !!id,
      queryKey: ["get-area", id]
    },
  });


  // Form initialization
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {

      name: "",


      pincode: "",


      city: undefined,

    },
  });

  // Update form values when entity data is loaded
  useEffect(() => {
    if (entity) {
      const formValues = {

        name: entity.name,


        pincode: entity.pincode,


        city: entity.city?.id,

      };
      form.reset(formValues);
    }
  }, [entity, form]);

  // Form submission handler
  const onSubmit = (data: z.infer<typeof formSchema>) => {
    const entityToSave = {
      name: data.name,
      pincode: data.pincode,

      city: data.city ? { id: data.city } : null,

    } as AreaDTO;

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
          name="pincode"
          render={({ field }) => (

            <FormItem>
              <FormLabel>Pincode *</FormLabel>
              <FormControl>
                <Input 
                  {...field}
                  placeholder="Enter pincode"
                />
              </FormControl>

              <FormMessage />
            </FormItem>

          )}
        />

        <FormField
          control={form.control}
          name="city"
          render={({ field }) => (
            <FormItem>
              <FormLabel>City</FormLabel>
              <FormControl>
                <PaginatedRelationshipCombobox
                  value={field.value}
                  onValueChange={field.onChange}
                  displayField="name"
                  placeholder="Select city"
                  multiple={false}
                  useInfiniteQueryHook={useGetAllCitiesInfinite}
                  searchHook={useSearchCitiesInfinite}
                  entityName="Cities"
                  searchField="name"
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
            onClick={() => router.push("/areas")}
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
