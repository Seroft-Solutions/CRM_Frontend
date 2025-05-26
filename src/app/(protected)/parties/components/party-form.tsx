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
  useCreateParty,
  useUpdateParty,
  useGetParty,
} from "@/core/api/generated/spring/endpoints/party-resource/party-resource.gen";
import { 
  useGetAllCitiesInfinite,
  useSearchCitiesInfinite 
} from "@/core/api/generated/spring/endpoints/city-resource/city-resource.gen";
import type { PartyDTO } from "@/core/api/generated/schemas/PartyDTO";

interface PartyFormProps {
  id?: number;
}

// Create Zod schema for form validation
const formSchema = z.object({
  name: z.string(),
  mobile: z.string().optional(),
  email: z.string().optional(),
  whatsApp: z.string().optional(),
  contactPerson: z.string().optional(),
  address1: z.string().optional(),
  address2: z.string().optional(),
  address3: z.string().optional(),
  remark: z.string().optional(),
  city: z.number().optional(),
});

export function PartyForm({ id }: PartyFormProps) {
  const router = useRouter();
  const isNew = !id;

  // Create or update mutation
  const { mutate: createEntity, isPending: isCreating } = useCreateParty({
    mutation: {
      onSuccess: () => {
        toast.success("Party created successfully");
        router.push("/parties");
      },
      onError: (error) => {
        toast.error(`Failed to create Party: ${error}`);
      },
    },
  });

  const { mutate: updateEntity, isPending: isUpdating } = useUpdateParty({
    mutation: {
      onSuccess: () => {
        toast.success("Party updated successfully");
        router.push("/parties");
      },
      onError: (error) => {
        toast.error(`Failed to update Party: ${error}`);
      },
    },
  });

  // Fetch entity for editing
  const { data: entity, isLoading: isLoadingEntity } = useGetParty(id || 0, {
    query: {
      enabled: !!id,
      queryKey: ["get-party", id]
    },
  });


  // Form initialization
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {

      name: "",


      mobile: "",


      email: "",


      whatsApp: "",


      contactPerson: "",


      address1: "",


      address2: "",


      address3: "",


      remark: "",


      city: undefined,

    },
  });

  // Update form values when entity data is loaded
  useEffect(() => {
    if (entity) {
      const formValues = {

        name: entity.name,


        mobile: entity.mobile,


        email: entity.email,


        whatsApp: entity.whatsApp,


        contactPerson: entity.contactPerson,


        address1: entity.address1,


        address2: entity.address2,


        address3: entity.address3,


        remark: entity.remark,


        city: entity.city?.id,

      };
      form.reset(formValues);
    }
  }, [entity, form]);

  // Form submission handler
  const onSubmit = (data: z.infer<typeof formSchema>) => {
    const entityToSave = {
      name: data.name,
      mobile: data.mobile,
      email: data.email,
      whatsApp: data.whatsApp,
      contactPerson: data.contactPerson,
      address1: data.address1,
      address2: data.address2,
      address3: data.address3,
      remark: data.remark,

      city: data.city ? { id: data.city } : null,

    } as PartyDTO;

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
          name="mobile"
          render={({ field }) => (

            <FormItem>
              <FormLabel>Mobile</FormLabel>
              <FormControl>
                <Input 
                  {...field}
                  placeholder="Enter mobile"
                />
              </FormControl>

              <FormMessage />
            </FormItem>

          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (

            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input 
                  {...field}
                  placeholder="Enter email"
                />
              </FormControl>

              <FormMessage />
            </FormItem>

          )}
        />
        <FormField
          control={form.control}
          name="whatsApp"
          render={({ field }) => (

            <FormItem>
              <FormLabel>WhatsApp</FormLabel>
              <FormControl>
                <Input 
                  {...field}
                  placeholder="Enter whatsApp"
                />
              </FormControl>

              <FormMessage />
            </FormItem>

          )}
        />
        <FormField
          control={form.control}
          name="contactPerson"
          render={({ field }) => (

            <FormItem>
              <FormLabel>ContactPerson</FormLabel>
              <FormControl>
                <Input 
                  {...field}
                  placeholder="Enter contactPerson"
                />
              </FormControl>

              <FormMessage />
            </FormItem>

          )}
        />
        <FormField
          control={form.control}
          name="address1"
          render={({ field }) => (

            <FormItem>
              <FormLabel>Address1</FormLabel>
              <FormControl>
                <Input 
                  {...field}
                  placeholder="Enter address1"
                />
              </FormControl>

              <FormMessage />
            </FormItem>

          )}
        />
        <FormField
          control={form.control}
          name="address2"
          render={({ field }) => (

            <FormItem>
              <FormLabel>Address2</FormLabel>
              <FormControl>
                <Input 
                  {...field}
                  placeholder="Enter address2"
                />
              </FormControl>

              <FormMessage />
            </FormItem>

          )}
        />
        <FormField
          control={form.control}
          name="address3"
          render={({ field }) => (

            <FormItem>
              <FormLabel>Address3</FormLabel>
              <FormControl>
                <Input 
                  {...field}
                  placeholder="Enter address3"
                />
              </FormControl>

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
                <Textarea
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
            onClick={() => router.push("/parties")}
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
