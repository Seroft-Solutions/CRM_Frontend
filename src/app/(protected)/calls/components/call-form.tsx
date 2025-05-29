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
  useCreateCall,
  useUpdateCall,
  useGetCall,
} from "@/core/api/generated/spring/endpoints/call-resource/call-resource.gen";
import { 
  useGetAllPrioritiesInfinite,
  useSearchPrioritiesInfinite 
} from "@/core/api/generated/spring/endpoints/priority-resource/priority-resource.gen";
import { 
  useGetAllCallTypesInfinite,
  useSearchCallTypesInfinite 
} from "@/core/api/generated/spring/endpoints/call-type-resource/call-type-resource.gen";
import { 
  useGetAllSubCallTypesInfinite,
  useSearchSubCallTypesInfinite 
} from "@/core/api/generated/spring/endpoints/sub-call-type-resource/sub-call-type-resource.gen";
import { 
  useGetAllSourcesInfinite,
  useSearchSourcesInfinite 
} from "@/core/api/generated/spring/endpoints/source-resource/source-resource.gen";
import { 
  useGetAllCitiesInfinite,
  useSearchCitiesInfinite 
} from "@/core/api/generated/spring/endpoints/city-resource/city-resource.gen";
import { 
  useGetAllPartiesInfinite,
  useSearchPartiesInfinite 
} from "@/core/api/generated/spring/endpoints/party-resource/party-resource.gen";
import { 
  useGetAllProductsInfinite,
  useSearchProductsInfinite 
} from "@/core/api/generated/spring/endpoints/product-resource/product-resource.gen";
import { 
  useGetAllChannelTypesInfinite,
  useSearchChannelTypesInfinite 
} from "@/core/api/generated/spring/endpoints/channel-type-resource/channel-type-resource.gen";
import { 
  useGetAllCallCategoriesInfinite,
  useSearchCallCategoriesInfinite 
} from "@/core/api/generated/spring/endpoints/call-category-resource/call-category-resource.gen";
import { 
  useGetAllCallStatusesInfinite,
  useSearchCallStatusesInfinite 
} from "@/core/api/generated/spring/endpoints/call-status-resource/call-status-resource.gen";
import type { CallDTO } from "@/core/api/generated/spring/schemas/CallDTO";
import type { UserDTO } from "@/core/api/generated/spring/schemas/UserDTO";

interface CallFormProps {
  id?: number;
}

// Create Zod schema for form validation
const formSchema = z.object({
  status: z.string().optional(),
  assignedTo: z.string().optional(),
  channelParty: z.string().optional(),
  priority: z.number().optional(),
  callType: z.number().optional(),
  subCallType: z.number().optional(),
  source: z.number().optional(),
  area: z.number().optional(),
  party: z.number().optional(),
  product: z.number().optional(),
  channelType: z.number().optional(),
  callCategory: z.number().optional(),
  callStatus: z.number().optional(),
});

export function CallForm({ id }: CallFormProps) {
  const router = useRouter();
  const isNew = !id;

  // Create or update mutation
  const { mutate: createEntity, isPending: isCreating } = useCreateCall({
    mutation: {
      onSuccess: () => {
        toast.success("Call created successfully");
        router.push("/calls");
      },
      onError: (error) => {
        toast.error(`Failed to create Call: ${error}`);
      },
    },
  });

  const { mutate: updateEntity, isPending: isUpdating } = useUpdateCall({
    mutation: {
      onSuccess: () => {
        toast.success("Call updated successfully");
        router.push("/calls");
      },
      onError: (error) => {
        toast.error(`Failed to update Call: ${error}`);
      },
    },
  });

  // Fetch entity for editing
  const { data: entity, isLoading: isLoadingEntity } = useGetCall(id || 0, {
    query: {
      enabled: !!id,
      queryKey: ["get-call", id]
    },
  });

  // For user relationships, you'll need to implement user fetching based on your user management setup
  // This is a placeholder - replace with your actual user management API call
  const users: UserDTO[] = []; // TODO: Implement user fetching
  
  // Example: If you have a user management hook, use it like:
  // const { data: usersData } = useGetUsers();
  // const users = usersData || [];

  // Form initialization
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {

      status: "",


      assignedTo: undefined,


      channelParty: undefined,


      priority: undefined,


      callType: undefined,


      subCallType: undefined,


      source: undefined,


      area: undefined,


      party: undefined,


      product: undefined,


      channelType: undefined,


      callCategory: undefined,


      callStatus: undefined,

    },
  });

  // Update form values when entity data is loaded
  useEffect(() => {
    if (entity) {
      const formValues = {

        status: entity.status || "",


        assignedTo: entity.assignedTo?.id,


        channelParty: entity.channelParty?.id,


        priority: entity.priority?.id,


        callType: entity.callType?.id,


        subCallType: entity.subCallType?.id,


        source: entity.source?.id,


        area: entity.area?.id,


        party: entity.party?.id,


        product: entity.product?.id,


        channelType: entity.channelType?.id,


        callCategory: entity.callCategory?.id,


        callStatus: entity.callStatus?.id,

      };
      form.reset(formValues);
    }
  }, [entity, form]);

  // Form submission handler
  const onSubmit = (data: z.infer<typeof formSchema>) => {
    const entityToSave = {
      ...(!isNew && entity ? { id: entity.id } : {}),

      status: data.status,


      assignedTo: data.assignedTo ? { id: data.assignedTo } : null,


      channelParty: data.channelParty ? { id: data.channelParty } : null,


      priority: data.priority ? { id: data.priority } : null,


      callType: data.callType ? { id: data.callType } : null,


      subCallType: data.subCallType ? { id: data.subCallType } : null,


      source: data.source ? { id: data.source } : null,


      area: data.area ? { id: data.area } : null,


      party: data.party ? { id: data.party } : null,


      product: data.product ? { id: data.product } : null,


      channelType: data.channelType ? { id: data.channelType } : null,


      callCategory: data.callCategory ? { id: data.callCategory } : null,


      callStatus: data.callStatus ? { id: data.callStatus } : null,

      // Include any existing fields not in the form to preserve required fields
      ...(entity && !isNew ? {
        // Preserve any existing required fields that aren't in the form
        ...Object.keys(entity).reduce((acc, key) => {
          const isFormField = ['status','assignedTo','channelParty','priority','callType','subCallType','source','area','party','product','channelType','callCategory','callStatus',].includes(key);
          if (!isFormField && entity[key as keyof typeof entity] !== undefined) {
            acc[key] = entity[key as keyof typeof entity];
          }
          return acc;
        }, {} as any)
      } : {})
    } as CallDTO;

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
          name="status"
          render={({ field }) => (

            <FormItem>
              <FormLabel>Status</FormLabel>
              <FormControl>
                <Input 
                  {...field}
                  
                  placeholder="Enter status"
                />
              </FormControl>

              <FormMessage />
            </FormItem>

          )}
        />

        <FormField
          control={form.control}
          name="assignedTo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Assigned To</FormLabel>
              <FormControl>
                {/* TODO: Implement user relationships with appropriate infinite query hook */}
                <div className="p-2 text-muted-foreground border rounded">
                  User relationship support - Please implement user infinite query hook
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="channelParty"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Channel Party</FormLabel>
              <FormControl>
                {/* TODO: Implement user relationships with appropriate infinite query hook */}
                <div className="p-2 text-muted-foreground border rounded">
                  User relationship support - Please implement user infinite query hook
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="priority"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Priority</FormLabel>
              <FormControl>
                <PaginatedRelationshipCombobox
                  value={field.value}
                  onValueChange={field.onChange}
                  displayField="name"
                  placeholder="Select priority"
                  multiple={false}
                  useInfiniteQueryHook={useGetAllPrioritiesInfinite}
                  searchHook={useSearchPrioritiesInfinite}
                  entityName="Priorities"
                  searchField="name"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="callType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Call Type</FormLabel>
              <FormControl>
                <PaginatedRelationshipCombobox
                  value={field.value}
                  onValueChange={field.onChange}
                  displayField="name"
                  placeholder="Select call type"
                  multiple={false}
                  useInfiniteQueryHook={useGetAllCallTypesInfinite}
                  searchHook={useSearchCallTypesInfinite}
                  entityName="CallTypes"
                  searchField="name"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="subCallType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sub Call Type</FormLabel>
              <FormControl>
                <PaginatedRelationshipCombobox
                  value={field.value}
                  onValueChange={field.onChange}
                  displayField="name"
                  placeholder="Select sub call type"
                  multiple={false}
                  useInfiniteQueryHook={useGetAllSubCallTypesInfinite}
                  searchHook={useSearchSubCallTypesInfinite}
                  entityName="SubCallTypes"
                  searchField="name"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="source"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Source</FormLabel>
              <FormControl>
                <PaginatedRelationshipCombobox
                  value={field.value}
                  onValueChange={field.onChange}
                  displayField="name"
                  placeholder="Select source"
                  multiple={false}
                  useInfiniteQueryHook={useGetAllSourcesInfinite}
                  searchHook={useSearchSourcesInfinite}
                  entityName="Sources"
                  searchField="name"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="area"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Area</FormLabel>
              <FormControl>
                <PaginatedRelationshipCombobox
                  value={field.value}
                  onValueChange={field.onChange}
                  displayField="name"
                  placeholder="Select area"
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
        <FormField
          control={form.control}
          name="party"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Party</FormLabel>
              <FormControl>
                <PaginatedRelationshipCombobox
                  value={field.value}
                  onValueChange={field.onChange}
                  displayField="name"
                  placeholder="Select party"
                  multiple={false}
                  useInfiniteQueryHook={useGetAllPartiesInfinite}
                  searchHook={useSearchPartiesInfinite}
                  entityName="Parties"
                  searchField="name"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="product"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product</FormLabel>
              <FormControl>
                <PaginatedRelationshipCombobox
                  value={field.value}
                  onValueChange={field.onChange}
                  displayField="name"
                  placeholder="Select product"
                  multiple={false}
                  useInfiniteQueryHook={useGetAllProductsInfinite}
                  searchHook={useSearchProductsInfinite}
                  entityName="Products"
                  searchField="name"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="channelType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Channel Type</FormLabel>
              <FormControl>
                <PaginatedRelationshipCombobox
                  value={field.value}
                  onValueChange={field.onChange}
                  displayField="name"
                  placeholder="Select channel type"
                  multiple={false}
                  useInfiniteQueryHook={useGetAllChannelTypesInfinite}
                  searchHook={useSearchChannelTypesInfinite}
                  entityName="ChannelTypes"
                  searchField="name"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="callCategory"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Call Category</FormLabel>
              <FormControl>
                <PaginatedRelationshipCombobox
                  value={field.value}
                  onValueChange={field.onChange}
                  displayField="name"
                  placeholder="Select call category"
                  multiple={false}
                  useInfiniteQueryHook={useGetAllCallCategoriesInfinite}
                  searchHook={useSearchCallCategoriesInfinite}
                  entityName="CallCategories"
                  searchField="name"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="callStatus"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Call Status</FormLabel>
              <FormControl>
                <PaginatedRelationshipCombobox
                  value={field.value}
                  onValueChange={field.onChange}
                  displayField="name"
                  placeholder="Select call status"
                  multiple={false}
                  useInfiniteQueryHook={useGetAllCallStatusesInfinite}
                  searchHook={useSearchCallStatusesInfinite}
                  entityName="CallStatuses"
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
            onClick={() => router.push("/calls")}
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
