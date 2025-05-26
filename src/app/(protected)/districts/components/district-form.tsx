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
  useCreateDistrict,
  useUpdateDistrict,
  useGetDistrict,
} from "@/core/api/generated/spring/endpoints/district-resource/district-resource.gen";
import { 
  useGetAllStatesInfinite,
  useSearchStatesInfinite 
} from "@/core/api/generated/spring/endpoints/state-resource/state-resource.gen";
import type { DistrictDTO } from "@/core/api/generated/schemas/DistrictDTO";

interface DistrictFormProps {
  id?: number;
}

// Create Zod schema for form validation
const formSchema = z.object({
  name: z.string(),
  state: z.number().optional(),
});

export function DistrictForm({ id }: DistrictFormProps) {
  const router = useRouter();
  const isNew = !id;

  // Create or update mutation
  const { mutate: createEntity, isPending: isCreating } = useCreateDistrict({
    mutation: {
      onSuccess: () => {
        toast.success("District created successfully");
        router.push("/districts");
      },
      onError: (error) => {
        toast.error(`Failed to create District: ${error}`);
      },
    },
  });

  const { mutate: updateEntity, isPending: isUpdating } = useUpdateDistrict({
    mutation: {
      onSuccess: () => {
        toast.success("District updated successfully");
        router.push("/districts");
      },
      onError: (error) => {
        toast.error(`Failed to update District: ${error}`);
      },
    },
  });

  // Fetch entity for editing
  const { data: entity, isLoading: isLoadingEntity } = useGetDistrict(id || 0, {
    query: {
      enabled: !!id,
      queryKey: ["get-district", id]
    },
  });


  // Form initialization
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {

      name: "",


      state: undefined,

    },
  });

  // Update form values when entity data is loaded
  useEffect(() => {
    if (entity) {
      const formValues = {

        name: entity.name,


        state: entity.state?.id,

      };
      form.reset(formValues);
    }
  }, [entity, form]);

  // Form submission handler
  const onSubmit = (data: z.infer<typeof formSchema>) => {
    const entityToSave = {
      name: data.name,

      state: data.state ? { id: data.state } : null,

    } as DistrictDTO;

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
          name="state"
          render={({ field }) => (
            <FormItem>
              <FormLabel>State</FormLabel>
              <FormControl>
                <PaginatedRelationshipCombobox
                  value={field.value}
                  onValueChange={field.onChange}
                  displayField="name"
                  placeholder="Select state"
                  multiple={false}
                  useInfiniteQueryHook={useGetAllStatesInfinite}
                  searchHook={useSearchStatesInfinite}
                  entityName="States"
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
            onClick={() => router.push("/districts")}
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
