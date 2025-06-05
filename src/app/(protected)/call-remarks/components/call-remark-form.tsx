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
  useCreateCallRemark,
  useUpdateCallRemark,
  useGetCallRemark,
} from "@/core/api/generated/spring/endpoints/call-remark-resource/call-remark-resource.gen";
import { 
  useGetAllCallsInfinite,
  useSearchCallsInfinite 
} from "@/core/api/generated/spring/endpoints/call-resource/call-resource.gen";
import type { CallRemarkDTO } from "@/core/api/generated/spring/schemas/CallRemarkDTO";

interface CallRemarkFormProps {
  id?: number;
}

// Create Zod schema for form validation
const formSchema = z.object({
  remark: z.string().max(2000),
  dateTime: z.date(),
  call: z.number().optional(),
});

export function CallRemarkForm({ id }: CallRemarkFormProps) {
  const router = useRouter();
  const isNew = !id;

  // Create or update mutation
  const { mutate: createEntity, isPending: isCreating } = useCreateCallRemark({
    mutation: {
      onSuccess: () => {
        toast.success("CallRemark created successfully");
        router.push("/call-remarks");
      },
      onError: (error) => {
        toast.error(`Failed to create CallRemark: ${error}`);
      },
    },
  });

  const { mutate: updateEntity, isPending: isUpdating } = useUpdateCallRemark({
    mutation: {
      onSuccess: () => {
        toast.success("CallRemark updated successfully");
        router.push("/call-remarks");
      },
      onError: (error) => {
        toast.error(`Failed to update CallRemark: ${error}`);
      },
    },
  });

  // Fetch entity for editing
  const { data: entity, isLoading: isLoadingEntity } = useGetCallRemark(id || 0, {
    query: {
      enabled: !!id,
      queryKey: ["get-call-remark", id]
    },
  });


  // Form initialization
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {

      remark: "",


      dateTime: new Date(),


      call: undefined,

    },
  });

  // Update form values when entity data is loaded
  useEffect(() => {
    if (entity) {
      const formValues = {

        remark: entity.remark || "",


        dateTime: entity.dateTime ? new Date(entity.dateTime) : undefined,


        call: entity.call?.id,

      };
      form.reset(formValues);
    }
  }, [entity, form]);

  // Form submission handler
  const onSubmit = (data: z.infer<typeof formSchema>) => {
    const entityToSave = {
      ...(!isNew && entity ? { id: entity.id } : {}),

      remark: data.remark === "__none__" ? undefined : data.remark,


      dateTime: data.dateTime === "__none__" ? undefined : data.dateTime,


      call: data.call ? { id: data.call } : null,

      // Include any existing fields not in the form to preserve required fields
      ...(entity && !isNew ? {
        // Preserve any existing required fields that aren't in the form
        ...Object.keys(entity).reduce((acc, key) => {
          const isFormField = ['remark','dateTime','call',].includes(key);
          if (!isFormField && entity[key as keyof typeof entity] !== undefined) {
            acc[key] = entity[key as keyof typeof entity];
          }
          return acc;
        }, {} as any)
      } : {})
    } as CallRemarkDTO;

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
          name="remark"
          render={({ field }) => (

            <FormItem>
              <FormLabel>Remark *</FormLabel>
              <FormControl>
                <Input 
                  {...field}
                  
                  placeholder="Enter remark"
                />
              </FormControl>

              <FormMessage />
            </FormItem>

          )}
        />
        <FormField
          control={form.control}
          name="dateTime"
          render={({ field }) => (

            <FormItem className="flex flex-col">
              <FormLabel>DateTime *</FormLabel>
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

              <FormMessage />
            </FormItem>

          )}
        />

        <FormField
          control={form.control}
          name="call"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Call</FormLabel>
              <FormControl>
                <PaginatedRelationshipCombobox
                  value={field.value}
                  onValueChange={field.onChange}
                  displayField="name"
                  placeholder="Select call"
                  multiple={false}
                  useInfiniteQueryHook={useGetAllCallsInfinite}
                  searchHook={useSearchCallsInfinite}
                  entityName="Calls"
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
            onClick={() => router.push("/call-remarks")}
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
