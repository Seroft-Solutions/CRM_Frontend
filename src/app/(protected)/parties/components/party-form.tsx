"use client";

import { useState, useEffect } from "react";
import * as React from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { CalendarIcon, Save, ArrowLeft, ArrowRight, Check, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
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
  useGetAllStatesInfinite,
  useSearchStatesInfinite 
} from "@/core/api/generated/spring/endpoints/state-resource/state-resource.gen";
import { 
  useGetAllDistrictsInfinite,
  useSearchDistrictsInfinite 
} from "@/core/api/generated/spring/endpoints/district-resource/district-resource.gen";
import { 
  useGetAllCitiesInfinite,
  useSearchCitiesInfinite 
} from "@/core/api/generated/spring/endpoints/city-resource/city-resource.gen";
import { 
  useGetAllProductsInfinite,
  useSearchProductsInfinite 
} from "@/core/api/generated/spring/endpoints/product-resource/product-resource.gen";
import type { PartyDTO } from "@/core/api/generated/spring/schemas/PartyDTO";

interface PartyFormProps {
  id?: number;
}

// Create Zod schema for form validation
const formSchema = z.object({
  name: z.string().min(2).max(100),
  mobile: z.string().regex(/^[+]?[0-9]{10,15}$/),
  email: z.string().max(254).regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/).optional(),
  whatsApp: z.string().regex(/^[+]?[0-9]{10,15}$/).optional(),
  contactPerson: z.string().min(2).max(100).optional(),
  address1: z.string().max(255).optional(),
  address2: z.string().max(255).optional(),
  address3: z.string().max(255).optional(),
  isActive: z.boolean(),
  remark: z.string().max(1000).optional(),
  source: z.number().optional(),
  area: z.number().optional(),
  state: z.number().optional(),
  district: z.number().optional(),
  city: z.number().optional(),
  interestedProducts: z.array(z.number()).optional(),
});

const STEPS = [{"id":"basic","title":"Basic Information","description":"Enter essential details"},{"id":"settings","title":"Settings & Files","description":"Configure options"},{"id":"geographic","title":"Location Details","description":"Select geographic information"},{"id":"business","title":"Business Relations","description":"Connect with customers and products"},{"id":"review","title":"Review","description":"Confirm your details"}];

export function PartyForm({ id }: PartyFormProps) {
  const router = useRouter();
  const isNew = !id;
  const [currentStep, setCurrentStep] = useState(0);
  const [confirmSubmission, setConfirmSubmission] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restorationAttempted, setRestorationAttempted] = useState(false);

  // Create or update mutation
  const { mutate: createEntity, isPending: isCreating } = useCreateParty({
    mutation: {
      onSuccess: (data) => {
        const returnUrl = localStorage.getItem('returnUrl');
        const relationshipInfo = localStorage.getItem('relationshipFieldInfo');
        
        if (returnUrl && relationshipInfo) {
          const entityId = data?.id || data?.id;
          if (entityId) {
            localStorage.setItem('newlyCreatedEntityId', entityId.toString());
          }
          toast.success("Party created successfully");
          router.push(returnUrl);
        } else {
          toast.success("Party created successfully");
          router.push("/parties");
        }
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
    mode: "onChange",
    defaultValues: {

      name: "",


      mobile: "",


      email: "",


      whatsApp: "",


      contactPerson: "",


      address1: "",


      address2: "",


      address3: "",


      isActive: false,


      remark: "",


      source: undefined,


      area: undefined,


      state: undefined,


      district: undefined,


      city: undefined,


      interestedProducts: [],

    },
  });

  // Handle newly created relationship entities
  const handleEntityCreated = React.useCallback((entityId: number, relationshipName: string) => {
    const currentValue = form.getValues(relationshipName as any);
    
    if (Array.isArray(currentValue)) {
      const newValue = [...currentValue, entityId];
      form.setValue(relationshipName as any, newValue);
    } else {
      form.setValue(relationshipName as any, entityId);
    }
    
    form.trigger(relationshipName as any);
  }, [form]);

  // Update form values when entity data is loaded
  useEffect(() => {
    if (entity && !isRestoring) {
      const formValues = {

        name: entity.name || "",


        mobile: entity.mobile || "",


        email: entity.email || "",


        whatsApp: entity.whatsApp || "",


        contactPerson: entity.contactPerson || "",


        address1: entity.address1 || "",


        address2: entity.address2 || "",


        address3: entity.address3 || "",


        isActive: entity.isActive || "",


        remark: entity.remark || "",


        source: entity.source?.id,


        area: entity.area?.id,


        state: entity.state?.id,


        district: entity.district?.id,


        city: entity.city?.id,


        interestedProducts: entity.interestedProducts?.map(item => item.id),

      };
      form.reset(formValues);
    }
  }, [entity, form, isRestoring]);

  // Form submission handler
  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (currentStep !== STEPS.length - 1) return;

    const entityToSave = {
      ...(!isNew && entity ? { id: entity.id } : {}),

      name: data.name === "__none__" ? undefined : data.name,


      mobile: data.mobile === "__none__" ? undefined : data.mobile,


      email: data.email === "__none__" ? undefined : data.email,


      whatsApp: data.whatsApp === "__none__" ? undefined : data.whatsApp,


      contactPerson: data.contactPerson === "__none__" ? undefined : data.contactPerson,


      address1: data.address1 === "__none__" ? undefined : data.address1,


      address2: data.address2 === "__none__" ? undefined : data.address2,


      address3: data.address3 === "__none__" ? undefined : data.address3,


      isActive: data.isActive === "__none__" ? undefined : data.isActive,


      remark: data.remark === "__none__" ? undefined : data.remark,


      source: data.source ? { id: data.source } : null,


      area: data.area ? { id: data.area } : null,


      state: data.state ? { id: data.state } : null,


      district: data.district ? { id: data.district } : null,


      city: data.city ? { id: data.city } : null,


      interestedProducts: data.interestedProducts?.map(id => ({ id: id })),

      ...(entity && !isNew ? {
        ...Object.keys(entity).reduce((acc, key) => {
          const isFormField = ['name','mobile','email','whatsApp','contactPerson','address1','address2','address3','isActive','remark','source','area','state','district','city','interestedProducts',].includes(key);
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

  // Navigation functions
  const validateStep = async () => {
    const currentStepId = STEPS[currentStep].id;
    let fieldsToValidate: string[] = [];

    switch (currentStepId) {
      case 'basic':
        fieldsToValidate = ['name','mobile','email','whatsApp','contactPerson','address1','address2','address3','remark',];
        break;
      case 'dates':
        fieldsToValidate = [];
        break;
      case 'settings':
        fieldsToValidate = ['isActive',];
        break;
      case 'geographic':
        fieldsToValidate = ['state','district','city','area',];
        break;
      case 'users':
        fieldsToValidate = [];
        break;
      case 'classification':
        fieldsToValidate = [];
        break;
      case 'business':
        fieldsToValidate = ['source','interestedProducts',];
        break;
      case 'other':
        fieldsToValidate = [];
        break;
    }

    const result = await form.trigger(fieldsToValidate);
    return result;
  };

  const nextStep = async () => {
    const isValid = await validateStep();
    if (isValid && currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      if (currentStep === STEPS.length - 1) {
        setConfirmSubmission(false);
      }
    }
  };

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  if (id && isLoadingEntity) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Progress Bar */}
      <div className="space-y-4">
        <div className="flex justify-between text-sm font-medium">
          <span>Step {currentStep + 1} of {STEPS.length}</span>
          <span>{Math.round(progress)}% Complete</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step Indicators */}
      <div className="flex justify-center">
        <div className="flex items-center space-x-2 sm:space-x-4 overflow-x-auto">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={cn(
                "flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 transition-all flex-shrink-0",
                index < currentStep 
                  ? "bg-primary border-primary text-primary-foreground" 
                  : index === currentStep 
                  ? "border-primary text-primary bg-primary/10" 
                  : "border-muted-foreground/30 text-muted-foreground"
              )}>
                {index < currentStep ? (
                  <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                ) : (
                  <span className="text-xs sm:text-sm font-medium">{index + 1}</span>
                )}
              </div>
              {index < STEPS.length - 1 && (
                <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground mx-1 sm:mx-2 flex-shrink-0" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Current Step Info */}
      <div className="text-center space-y-1">
        <h2 className="text-lg sm:text-xl font-semibold">{STEPS[currentStep].title}</h2>
        <p className="text-sm text-muted-foreground">{STEPS[currentStep].description}</p>
      </div>

      {/* Form Content */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardContent className="p-4 sm:p-6">
              {/* Step 1: Basic Information */}
              {STEPS[currentStep].id === 'basic' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                    
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Name *</FormLabel>
                          <FormControl>
                            <Input 
                              {...field}
                              
                              placeholder="Enter name"
                              className="transition-colors"
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
                          <FormLabel className="text-sm font-medium">Mobile *</FormLabel>
                          <FormControl>
                            <Input 
                              {...field}
                              
                              placeholder="Enter mobile"
                              className="transition-colors"
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
                          <FormLabel className="text-sm font-medium">Email</FormLabel>
                          <FormControl>
                            <Input 
                              {...field}
                              
                              placeholder="Enter email"
                              className="transition-colors"
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
                          <FormLabel className="text-sm font-medium">Whats App</FormLabel>
                          <FormControl>
                            <Input 
                              {...field}
                              
                              placeholder="Enter whats app"
                              className="transition-colors"
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
                          <FormLabel className="text-sm font-medium">Contact Person</FormLabel>
                          <FormControl>
                            <Input 
                              {...field}
                              
                              placeholder="Enter contact person"
                              className="transition-colors"
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
                          <FormLabel className="text-sm font-medium">Address1</FormLabel>
                          <FormControl>
                            <Input 
                              {...field}
                              
                              placeholder="Enter address1"
                              className="transition-colors"
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
                          <FormLabel className="text-sm font-medium">Address2</FormLabel>
                          <FormControl>
                            <Input 
                              {...field}
                              
                              placeholder="Enter address2"
                              className="transition-colors"
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
                          <FormLabel className="text-sm font-medium">Address3</FormLabel>
                          <FormControl>
                            <Input 
                              {...field}
                              
                              placeholder="Enter address3"
                              className="transition-colors"
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
                          <FormLabel className="text-sm font-medium">Remark</FormLabel>
                          <FormControl>
                            <Input 
                              {...field}
                              
                              placeholder="Enter remark"
                              className="transition-colors"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                        
                      )}
                    />
                    
                  </div>
                </div>
              )}

              {/* Step 2: Date & Time */}
              

              {/* Step 3: Settings & Files */}
              
              {STEPS[currentStep].id === 'settings' && (
                <div className="space-y-6">
                  
                  <div className="space-y-4">
                    <h4 className="font-medium">Settings</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      <FormField
                        control={form.control}
                        name="isActive"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base font-medium">Is Active</FormLabel>
                            </div>
                            <FormControl>
                              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                    </div>
                  </div>
                  

                  
                </div>
              )}
              

              {/* Classification Step with Intelligent Cascading */}

              {/* Geographic Step with Cascading */}
              {STEPS[currentStep].id === 'geographic' && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <h3 className="text-lg font-medium">Location Information</h3>
                    <p className="text-muted-foreground">Select location details in hierarchical order</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">
                            State
                          </FormLabel>
                          <FormControl>
                            <PaginatedRelationshipCombobox
                              value={field.value}
                              onValueChange={(value) => {
                                field.onChange(value);
                                // Clear dependent geographic selections
                                form.setValue('district', undefined);
                                form.setValue('city', undefined);
                                form.setValue('area', undefined);
                              }}
                              displayField="name"
                              placeholder="Select state"
                              multiple={false}
                              useInfiniteQueryHook={useGetAllStatesInfinite}
                              searchHook={useSearchStatesInfinite}
                              entityName="States"
                              searchField="name"
                              canCreate={true}
                              createEntityPath="/states/new"
                              createPermission="state:create"
                              onEntityCreated={(entityId) => handleEntityCreated(entityId, 'state')}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="district"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">
                            District
                          </FormLabel>
                          <FormControl>
                            <PaginatedRelationshipCombobox
                              value={field.value}
                              onValueChange={(value) => {
                                field.onChange(value);
                                // Clear dependent geographic selections
                                form.setValue('city', undefined);
                                form.setValue('area', undefined);
                              }}
                              displayField="name"
                              placeholder="Select district"
                              multiple={false}
                              useInfiniteQueryHook={useGetAllDistrictsInfinite}
                              searchHook={useSearchDistrictsInfinite}
                              entityName="Districts"
                              searchField="name"
                              canCreate={true}
                              createEntityPath="/districts/new"
                              createPermission="district:create"
                              onEntityCreated={(entityId) => handleEntityCreated(entityId, 'district')}
                              parentFilter={form.watch('state')}
                              parentField="state"
                              disabled={!form.watch('state')}
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
                          <FormLabel className="text-sm font-medium">
                            City
                          </FormLabel>
                          <FormControl>
                            <PaginatedRelationshipCombobox
                              value={field.value}
                              onValueChange={(value) => {
                                field.onChange(value);
                                // Clear dependent geographic selections
                                form.setValue('area', undefined);
                              }}
                              displayField="name"
                              placeholder="Select city"
                              multiple={false}
                              useInfiniteQueryHook={useGetAllCitiesInfinite}
                              searchHook={useSearchCitiesInfinite}
                              entityName="Cities"
                              searchField="name"
                              canCreate={true}
                              createEntityPath="/cities/new"
                              createPermission="city:create"
                              onEntityCreated={(entityId) => handleEntityCreated(entityId, 'city')}
                              parentFilter={form.watch('district')}
                              parentField="district"
                              disabled={!form.watch('district')}
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
                          <FormLabel className="text-sm font-medium">
                            Area
                          </FormLabel>
                          <FormControl>
                            <PaginatedRelationshipCombobox
                              value={field.value}
                              onValueChange={(value) => {
                                field.onChange(value);
                                // Clear dependent geographic selections
                              }}
                              displayField="name"
                              placeholder="Select area"
                              multiple={false}
                              useInfiniteQueryHook={useGetAllAreasInfinite}
                              searchHook={useSearchAreasInfinite}
                              entityName="Areas"
                              searchField="name"
                              canCreate={true}
                              createEntityPath="/areas/new"
                              createPermission="area:create"
                              onEntityCreated={(entityId) => handleEntityCreated(entityId, 'area')}
                              parentFilter={form.watch('city')}
                              parentField="city"
                              disabled={!form.watch('city')}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {/* User Assignment Step */}

              {/* Business Relations Step */}
              {STEPS[currentStep].id === 'business' && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <h3 className="text-lg font-medium">Business Relations</h3>
                    <p className="text-muted-foreground">Connect with customers, products, and sources</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <FormField
                      control={form.control}
                      name="source"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">
                            Source
                          </FormLabel>
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
                              canCreate={true}
                              createEntityPath="/sources/new"
                              createPermission="source:create"
                              onEntityCreated={(entityId) => handleEntityCreated(entityId, 'source')}
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
                          <FormLabel className="text-sm font-medium">
                            Interested Products
                          </FormLabel>
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
                              canCreate={true}
                              createEntityPath="/products/new"
                              createPermission="product:create"
                              onEntityCreated={(entityId) => handleEntityCreated(entityId, 'interestedProducts')}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {/* Other Relations Step */}

              {/* Review Step */}
              {STEPS[currentStep].id === 'review' && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="text-lg font-medium mb-2">Review Your Information</h3>
                    <p className="text-muted-foreground">Please review all the information before submitting</p>
                  </div>
                  
                  {/* Basic Fields Review */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-lg border-b pb-2">Basic Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      <div className="space-y-1">
                        <dt className="text-sm font-medium text-muted-foreground">Name</dt>
                        <dd className="text-sm">
                          {form.watch('name') || "—"}
                        </dd>
                      </div>
                      <div className="space-y-1">
                        <dt className="text-sm font-medium text-muted-foreground">Mobile</dt>
                        <dd className="text-sm">
                          {form.watch('mobile') || "—"}
                        </dd>
                      </div>
                      <div className="space-y-1">
                        <dt className="text-sm font-medium text-muted-foreground">Email</dt>
                        <dd className="text-sm">
                          {form.watch('email') || "—"}
                        </dd>
                      </div>
                      <div className="space-y-1">
                        <dt className="text-sm font-medium text-muted-foreground">Whats App</dt>
                        <dd className="text-sm">
                          {form.watch('whatsApp') || "—"}
                        </dd>
                      </div>
                      <div className="space-y-1">
                        <dt className="text-sm font-medium text-muted-foreground">Contact Person</dt>
                        <dd className="text-sm">
                          {form.watch('contactPerson') || "—"}
                        </dd>
                      </div>
                      <div className="space-y-1">
                        <dt className="text-sm font-medium text-muted-foreground">Address1</dt>
                        <dd className="text-sm">
                          {form.watch('address1') || "—"}
                        </dd>
                      </div>
                      <div className="space-y-1">
                        <dt className="text-sm font-medium text-muted-foreground">Address2</dt>
                        <dd className="text-sm">
                          {form.watch('address2') || "—"}
                        </dd>
                      </div>
                      <div className="space-y-1">
                        <dt className="text-sm font-medium text-muted-foreground">Address3</dt>
                        <dd className="text-sm">
                          {form.watch('address3') || "—"}
                        </dd>
                      </div>
                      <div className="space-y-1">
                        <dt className="text-sm font-medium text-muted-foreground">Is Active</dt>
                        <dd className="text-sm">
                          <Badge variant={form.watch('isActive') ? "default" : "secondary"}>
                            {form.watch('isActive') ? "Yes" : "No"}
                          </Badge>
                        </dd>
                      </div>
                      <div className="space-y-1">
                        <dt className="text-sm font-medium text-muted-foreground">Remark</dt>
                        <dd className="text-sm">
                          {form.watch('remark') || "—"}
                        </dd>
                      </div>
                    </div>
                  </div>

                  {/* Relationship Reviews */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-lg border-b pb-2">📍 Location Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      <div className="space-y-1">
                        <dt className="text-sm font-medium text-muted-foreground">State</dt>
                        <dd className="text-sm">
                          <Badge variant="outline">
                            {form.watch('state') ? 'Selected' : 'Not selected'}
                          </Badge>
                        </dd>
                      </div>
                      <div className="space-y-1">
                        <dt className="text-sm font-medium text-muted-foreground">District</dt>
                        <dd className="text-sm">
                          <Badge variant="outline">
                            {form.watch('district') ? 'Selected' : 'Not selected'}
                          </Badge>
                        </dd>
                      </div>
                      <div className="space-y-1">
                        <dt className="text-sm font-medium text-muted-foreground">City</dt>
                        <dd className="text-sm">
                          <Badge variant="outline">
                            {form.watch('city') ? 'Selected' : 'Not selected'}
                          </Badge>
                        </dd>
                      </div>
                      <div className="space-y-1">
                        <dt className="text-sm font-medium text-muted-foreground">Area</dt>
                        <dd className="text-sm">
                          <Badge variant="outline">
                            {form.watch('area') ? 'Selected' : 'Not selected'}
                          </Badge>
                        </dd>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-medium text-lg border-b pb-2">🏢 Business Relations</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      <div className="space-y-1">
                        <dt className="text-sm font-medium text-muted-foreground">Source</dt>
                        <dd className="text-sm">
                          <Badge variant="outline">
                            {form.watch('source') ? 'Selected' : 'Not selected'}
                          </Badge>
                        </dd>
                      </div>
                      <div className="space-y-1">
                        <dt className="text-sm font-medium text-muted-foreground">Interested Products</dt>
                        <dd className="text-sm">
                          <Badge variant="outline">
                            {Array.isArray(form.watch('interestedProducts')) ? 
                              `${form.watch('interestedProducts').length} selected` : 'None selected'}
                          </Badge>
                        </dd>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Navigation Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={currentStep === 0 ? () => router.push("/parties") : prevStep}
              className="flex items-center gap-2 justify-center"
            >
              <ArrowLeft className="h-4 w-4" />
              {currentStep === 0 ? "Cancel" : "Previous"}
            </Button>

            {currentStep === STEPS.length - 1 ? (
              !confirmSubmission ? (
                <Button 
                  type="button"
                  onClick={() => setConfirmSubmission(true)}
                  className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 justify-center"
                >
                  <Check className="h-4 w-4" />
                  Confirm {isNew ? "Create" : "Update"}
                </Button>
              ) : (
                <Button 
                  type="submit" 
                  disabled={isCreating || isUpdating}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 justify-center"
                >
                  <Save className="h-4 w-4" />
                  {isCreating || isUpdating ? "Submitting..." : `${isNew ? "Create" : "Update"} Party`}
                </Button>
              )
            ) : (
              <Button
                type="button"
                onClick={nextStep}
                className="flex items-center gap-2 justify-center"
              >
                Next Step
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
