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
  useCreateProduct,
  useUpdateProduct,
  useGetProduct,
} from "@/core/api/generated/spring/endpoints/product-resource/product-resource.gen";
import { 
  useGetAllCallsInfinite,
  useSearchCallsInfinite 
} from "@/core/api/generated/spring/endpoints/call-resource/call-resource.gen";
import { 
  useGetAllPartiesInfinite,
  useSearchPartiesInfinite 
} from "@/core/api/generated/spring/endpoints/party-resource/party-resource.gen";
import type { ProductDTO } from "@/core/api/generated/spring/schemas/ProductDTO";

interface ProductFormProps {
  id?: number;
}

// Create Zod schema for form validation
const formSchema = z.object({
  name: z.string().min(2).max(100),
  code: z.string().min(2).max(20).regex(/^[A-Z0-9_-]+$/),
  description: z.string().max(500).optional(),
  category: z.string().max(50).optional(),
  basePrice: z.string().refine(val => !val || Number(val) >= 0, { message: "Must be at least 0" }).optional(),
  minPrice: z.string().refine(val => !val || Number(val) >= 0, { message: "Must be at least 0" }).optional(),
  maxPrice: z.string().refine(val => !val || Number(val) >= 0, { message: "Must be at least 0" }).optional(),
  isActive: z.boolean(),
  remark: z.string().max(1000).optional(),
  calls: z.array(z.number()).optional(),
  interestedParties: z.array(z.number()).optional(),
});

export function ProductForm({ id }: ProductFormProps) {
  const router = useRouter();
  const isNew = !id;

  // Create or update mutation
  const { mutate: createEntity, isPending: isCreating } = useCreateProduct({
    mutation: {
      onSuccess: () => {
        toast.success("Product created successfully");
        router.push("/products");
      },
      onError: (error) => {
        toast.error(`Failed to create Product: ${error}`);
      },
    },
  });

  const { mutate: updateEntity, isPending: isUpdating } = useUpdateProduct({
    mutation: {
      onSuccess: () => {
        toast.success("Product updated successfully");
        router.push("/products");
      },
      onError: (error) => {
        toast.error(`Failed to update Product: ${error}`);
      },
    },
  });

  // Fetch entity for editing
  const { data: entity, isLoading: isLoadingEntity } = useGetProduct(id || 0, {
    query: {
      enabled: !!id,
      queryKey: ["get-product", id]
    },
  });


  // Form initialization
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {

      name: "",


      code: "",


      description: "",


      category: "",


      basePrice: "",


      minPrice: "",


      maxPrice: "",


      isActive: false,


      remark: "",


      calls: [],


      interestedParties: [],

    },
  });

  // Update form values when entity data is loaded
  useEffect(() => {
    if (entity) {
      const formValues = {

        name: entity.name || "",


        code: entity.code || "",


        description: entity.description || "",


        category: entity.category || "",


        basePrice: entity.basePrice != null ? String(entity.basePrice) : "",


        minPrice: entity.minPrice != null ? String(entity.minPrice) : "",


        maxPrice: entity.maxPrice != null ? String(entity.maxPrice) : "",


        isActive: entity.isActive || "",


        remark: entity.remark || "",


        calls: entity.calls?.map(item => item.id),


        interestedParties: entity.interestedParties?.map(item => item.id),

      };
      form.reset(formValues);
    }
  }, [entity, form]);

  // Form submission handler
  const onSubmit = (data: z.infer<typeof formSchema>) => {
    const entityToSave = {
      ...(!isNew && entity ? { id: entity.id } : {}),

      name: data.name === "__none__" ? undefined : data.name,


      code: data.code === "__none__" ? undefined : data.code,


      description: data.description === "__none__" ? undefined : data.description,


      category: data.category === "__none__" ? undefined : data.category,


      basePrice: data.basePrice ? Number(data.basePrice) : undefined,


      minPrice: data.minPrice ? Number(data.minPrice) : undefined,


      maxPrice: data.maxPrice ? Number(data.maxPrice) : undefined,


      isActive: data.isActive === "__none__" ? undefined : data.isActive,


      remark: data.remark === "__none__" ? undefined : data.remark,


      calls: data.calls?.map(id => ({ id: id })),


      interestedParties: data.interestedParties?.map(id => ({ id: id })),

      // Include any existing fields not in the form to preserve required fields
      ...(entity && !isNew ? {
        // Preserve any existing required fields that aren't in the form
        ...Object.keys(entity).reduce((acc, key) => {
          const isFormField = ['name','code','description','category','basePrice','minPrice','maxPrice','isActive','remark','calls','interestedParties',].includes(key);
          if (!isFormField && entity[key as keyof typeof entity] !== undefined) {
            acc[key] = entity[key as keyof typeof entity];
          }
          return acc;
        }, {} as any)
      } : {})
    } as ProductDTO;

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
          name="category"
          render={({ field }) => (

            <FormItem>
              <FormLabel>Category</FormLabel>
              <FormControl>
                <Input 
                  {...field}
                  
                  placeholder="Enter category"
                />
              </FormControl>

              <FormMessage />
            </FormItem>

          )}
        />
        <FormField
          control={form.control}
          name="basePrice"
          render={({ field }) => (

            <FormItem>
              <FormLabel>BasePrice</FormLabel>
              <FormControl>
                <Input 
                  {...field}
                  type="number"
                  placeholder="Enter basePrice"
                />
              </FormControl>

              <FormMessage />
            </FormItem>

          )}
        />
        <FormField
          control={form.control}
          name="minPrice"
          render={({ field }) => (

            <FormItem>
              <FormLabel>MinPrice</FormLabel>
              <FormControl>
                <Input 
                  {...field}
                  type="number"
                  placeholder="Enter minPrice"
                />
              </FormControl>

              <FormMessage />
            </FormItem>

          )}
        />
        <FormField
          control={form.control}
          name="maxPrice"
          render={({ field }) => (

            <FormItem>
              <FormLabel>MaxPrice</FormLabel>
              <FormControl>
                <Input 
                  {...field}
                  type="number"
                  placeholder="Enter maxPrice"
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

              <FormMessage />
            </FormItem>

          )}
        />

        <FormField
          control={form.control}
          name="calls"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Calls</FormLabel>
              <FormControl>
                <PaginatedRelationshipCombobox
                  value={field.value}
                  onValueChange={field.onChange}
                  displayField="name"
                  placeholder="Select calls"
                  multiple={true}
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
        <FormField
          control={form.control}
          name="interestedParties"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Interested Parties</FormLabel>
              <FormControl>
                <PaginatedRelationshipCombobox
                  value={field.value}
                  onValueChange={field.onChange}
                  displayField="name"
                  placeholder="Select interested parties"
                  multiple={true}
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

        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/products")}
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
