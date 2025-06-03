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
  useGetAllSourcesInfinite,
  useSearchSourcesInfinite 
} from "@/core/api/generated/spring/endpoints/source-resource/source-resource.gen";
import { 
  useGetAllAreasInfinite,
  useSearchAreasInfinite 
} from "@/core/api/generated/spring/endpoints/area-resource/area-resource.gen";
import { 
  useGetAllProductsInfinite,
  useSearchProductsInfinite 
} from "@/core/api/generated/spring/endpoints/product-resource/product-resource.gen";
import { 
  useGetAllCitiesInfinite,
  useSearchCitiesInfinite 
} from "@/core/api/generated/spring/endpoints/city-resource/city-resource.gen";
import type { PartyDTO } from "@/core/api/generated/spring/schemas/PartyDTO";
import type { UserDTO } from "@/core/api/generated/spring/schemas/UserDTO";

interface PartyFormProps {
  id?: number;
}

// Create Zod schema for form validation
const formSchema = z.object({
  name: z.string().min(2).max(100),
  mobile: z.string().regex(/^[+]?[0-9]{10,15}$/),
  email: z.string().max(254).regex(/^[^@\s]+@[^@\s]+\.[^@\s]+$/).optional(),
  whatsApp: z.string().regex(/^[+]?[0-9]{10,15}$/).optional(),
  contactPerson: z.string().min(2).max(100).optional(),
  address1: z.string().max(255).optional(),
  address2: z.string().max(255).optional(),
  address3: z.string().max(255).optional(),
  website: z.string().max(255).regex(/^https?:\/\/[^\s]+$/).optional(),
  partyType: z.string().max(20),
  leadStatus: z.string(),
  leadScore: z.string().refine(val => !val || Number(val) >= 0, { message: "Must be at least 0" }).refine(val => !val || Number(val) <= 100, { message: "Must be at most 100" }).optional(),
  annualRevenue: z.string().refine(val => !val || Number(val) >= 0, { message: "Must be at least 0" }).optional(),
  employeeCount: z.string().refine(val => !val || Number(val) >= 0, { message: "Must be at least 0" }).optional(),
  isActive: z.boolean(),
  registrationDate: z.date(),
  lastContactDate: z.date().optional(),
  nextFollowUpDate: z.date().optional(),
  remark: z.string().max(1000).optional(),
  createdDate: z.date(),
  lastModifiedDate: z.date().optional(),
  assignedTo: z.string().optional(),
  createdBy: z.string().optional(),
  source: z.number().optional(),
  area: z.number().optional(),
  interestedProducts: z.array(z.number()).optional(),
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

      name: "",


      mobile: "",


      email: "",


      whatsApp: "",


      contactPerson: "",


      address1: "",


      address2: "",


      address3: "",


      website: "",


      partyType: "",


      leadStatus: "",


      leadScore: "",


      annualRevenue: "",


      employeeCount: "",


      isActive: false,


      registrationDate: new Date(),


      lastContactDate: new Date(),


      nextFollowUpDate: new Date(),


      remark: "",


      createdDate: new Date(),


      lastModifiedDate: new Date(),


      assignedTo: undefined,


      createdBy: undefined,


      source: undefined,


      area: undefined,


      interestedProducts: [],


      city: undefined,

    },
  });

  // Update form values when entity data is loaded
  useEffect(() => {
    if (entity) {
      const formValues = {

        name: entity.name || "",


        mobile: entity.mobile || "",


        email: entity.email || "",


        whatsApp: entity.whatsApp || "",


        contactPerson: entity.contactPerson || "",


        address1: entity.address1 || "",


        address2: entity.address2 || "",


        address3: entity.address3 || "",


        website: entity.website || "",


        partyType: entity.partyType || "",


        leadStatus: entity.leadStatus || "",


        leadScore: entity.leadScore != null ? String(entity.leadScore) : "",


        annualRevenue: entity.annualRevenue != null ? String(entity.annualRevenue) : "",


        employeeCount: entity.employeeCount != null ? String(entity.employeeCount) : "",


        isActive: entity.isActive || "",


        registrationDate: entity.registrationDate ? new Date(entity.registrationDate) : undefined,


        lastContactDate: entity.lastContactDate ? new Date(entity.lastContactDate) : undefined,


        nextFollowUpDate: entity.nextFollowUpDate ? new Date(entity.nextFollowUpDate) : undefined,


        remark: entity.remark || "",


        createdDate: entity.createdDate ? new Date(entity.createdDate) : undefined,


        lastModifiedDate: entity.lastModifiedDate ? new Date(entity.lastModifiedDate) : undefined,


        assignedTo: entity.assignedTo?.id,


        createdBy: entity.createdBy?.id,


        source: entity.source?.id,


        area: entity.area?.id,


        interestedProducts: entity.interestedProducts?.map(item => item.id),


        city: entity.city?.id,

      };
      form.reset(formValues);
    }
  }, [entity, form]);

  // Form submission handler
  const onSubmit = (data: z.infer<typeof formSchema>) => {
    const entityToSave = {
      ...(!isNew && entity ? { id: entity.id } : {}),

      name: data.name,


      mobile: data.mobile,


      email: data.email,


      whatsApp: data.whatsApp,


      contactPerson: data.contactPerson,


      address1: data.address1,


      address2: data.address2,


      address3: data.address3,


      website: data.website,


      partyType: data.partyType,


      leadStatus: data.leadStatus,


      leadScore: data.leadScore ? Number(data.leadScore) : undefined,


      annualRevenue: data.annualRevenue ? Number(data.annualRevenue) : undefined,


      employeeCount: data.employeeCount ? Number(data.employeeCount) : undefined,


      isActive: data.isActive,


      registrationDate: data.registrationDate,


      lastContactDate: data.lastContactDate,


      nextFollowUpDate: data.nextFollowUpDate,


      remark: data.remark,


      createdDate: data.createdDate,


      lastModifiedDate: data.lastModifiedDate,


      assignedTo: data.assignedTo ? { id: data.assignedTo } : null,


      createdBy: data.createdBy ? { id: data.createdBy } : null,


      source: data.source ? { id: data.source } : null,


      area: data.area ? { id: data.area } : null,


      interestedProducts: data.interestedProducts?.map(id => ({ id: id })),


      city: data.city ? { id: data.city } : null,

      // Include any existing fields not in the form to preserve required fields
      ...(entity && !isNew ? {
        // Preserve any existing required fields that aren't in the form
        ...Object.keys(entity).reduce((acc, key) => {
          const isFormField = ['name','mobile','email','whatsApp','contactPerson','address1','address2','address3','website','partyType','leadStatus','leadScore','annualRevenue','employeeCount','isActive','registrationDate','lastContactDate','nextFollowUpDate','remark','createdDate','lastModifiedDate','assignedTo','createdBy','source','area','interestedProducts','city',].includes(key);
          if (!isFormField && entity[key as keyof typeof entity] !== undefined) {
            acc[key] = entity[key as keyof typeof entity];
          }
          return acc;
        }, {} as any)
      } : {})
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

              <FormDescription>
                Party name/company name
              </FormDescription>

              <FormMessage />
            </FormItem>

          )}
        />
        <FormField
          control={form.control}
          name="mobile"
          render={({ field }) => (

            <FormItem>
              <FormLabel>Mobile *</FormLabel>
              <FormControl>
                <Input 
                  {...field}
                  
                  placeholder="Enter mobile"
                />
              </FormControl>

              <FormDescription>
                Mobile number
              </FormDescription>

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

              <FormDescription>
                Email address
              </FormDescription>

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

              <FormDescription>
                WhatsApp number
              </FormDescription>

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

              <FormDescription>
                Contact person name
              </FormDescription>

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

              <FormDescription>
                Address line 1
              </FormDescription>

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

              <FormDescription>
                Address line 2
              </FormDescription>

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

              <FormDescription>
                Address line 3
              </FormDescription>

              <FormMessage />
            </FormItem>

          )}
        />
        <FormField
          control={form.control}
          name="website"
          render={({ field }) => (

            <FormItem>
              <FormLabel>Website</FormLabel>
              <FormControl>
                <Input 
                  {...field}
                  
                  placeholder="Enter website"
                />
              </FormControl>

              <FormDescription>
                Website URL
              </FormDescription>

              <FormMessage />
            </FormItem>

          )}
        />
        <FormField
          control={form.control}
          name="partyType"
          render={({ field }) => (

            <FormItem>
              <FormLabel>PartyType *</FormLabel>
              <FormControl>
                <Input 
                  {...field}
                  
                  placeholder="Enter partyType"
                />
              </FormControl>

              <FormDescription>
                Company/individual type
              </FormDescription>

              <FormMessage />
            </FormItem>

          )}
        />
        <FormField
          control={form.control}
          name="leadStatus"
          render={({ field }) => (

            <FormItem>
              <FormLabel>LeadStatus *</FormLabel>
              <FormControl>
                <Input 
                  {...field}
                  
                  placeholder="Enter leadStatus"
                />
              </FormControl>

              <FormDescription>
                Lead status
              </FormDescription>

              <FormMessage />
            </FormItem>

          )}
        />
        <FormField
          control={form.control}
          name="leadScore"
          render={({ field }) => (

            <FormItem>
              <FormLabel>LeadScore</FormLabel>
              <FormControl>
                <Input 
                  {...field}
                  type="number"
                  placeholder="Enter leadScore"
                />
              </FormControl>

              <FormDescription>
                Lead score (0-100)
              </FormDescription>

              <FormMessage />
            </FormItem>

          )}
        />
        <FormField
          control={form.control}
          name="annualRevenue"
          render={({ field }) => (

            <FormItem>
              <FormLabel>AnnualRevenue</FormLabel>
              <FormControl>
                <Input 
                  {...field}
                  type="number"
                  placeholder="Enter annualRevenue"
                />
              </FormControl>

              <FormDescription>
                Annual revenue
              </FormDescription>

              <FormMessage />
            </FormItem>

          )}
        />
        <FormField
          control={form.control}
          name="employeeCount"
          render={({ field }) => (

            <FormItem>
              <FormLabel>EmployeeCount</FormLabel>
              <FormControl>
                <Input 
                  {...field}
                  type="number"
                  placeholder="Enter employeeCount"
                />
              </FormControl>

              <FormDescription>
                Number of employees
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
                  Is this party active
                </FormDescription>

              </div>
              <FormMessage />
            </FormItem>

          )}
        />
        <FormField
          control={form.control}
          name="registrationDate"
          render={({ field }) => (

            <FormItem className="flex flex-col">
              <FormLabel>RegistrationDate *</FormLabel>
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
                Registration date
              </FormDescription>

              <FormMessage />
            </FormItem>

          )}
        />
        <FormField
          control={form.control}
          name="lastContactDate"
          render={({ field }) => (

            <FormItem className="flex flex-col">
              <FormLabel>LastContactDate</FormLabel>
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
                Last contact date
              </FormDescription>

              <FormMessage />
            </FormItem>

          )}
        />
        <FormField
          control={form.control}
          name="nextFollowUpDate"
          render={({ field }) => (

            <FormItem className="flex flex-col">
              <FormLabel>NextFollowUpDate</FormLabel>
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
                Next follow up date
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
          name="createdBy"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Created By</FormLabel>
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
                  useInfiniteQueryHook={useGetAllAreasInfinite}
                  searchHook={useSearchAreasInfinite}
                  entityName="Areas"
                  searchField="name"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="interestedProducts"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Interested Products</FormLabel>
              <FormControl>
                <PaginatedRelationshipCombobox
                  value={field.value}
                  onValueChange={field.onChange}
                  displayField="name"
                  placeholder="Select interested products"
                  multiple={true}
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
