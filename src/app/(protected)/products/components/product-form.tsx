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
  code: z.string().min(2).max(20).regex(/^[A-Za-z0-9_-]+$/),
  description: z.string().max(500).optional(),
  category: z.string().max(50).optional(),
  basePrice: z.string().refine(val => !val || Number(val) >= 0, { message: "Must be at least 0" }).refine(val => !val || Number(val) <= 999999, { message: "Must be at most 999999" }).optional(),
  minPrice: z.string().refine(val => !val || Number(val) >= 0, { message: "Must be at least 0" }).refine(val => !val || Number(val) <= 999999, { message: "Must be at most 999999" }).optional(),
  maxPrice: z.string().refine(val => !val || Number(val) >= 0, { message: "Must be at least 0" }).refine(val => !val || Number(val) <= 999999, { message: "Must be at most 999999" }).optional(),
  isActive: z.boolean(),
  remark: z.string().max(1000).optional(),
  calls: z.array(z.number()).optional(),
  interestedParties: z.array(z.number()).optional(),
});

const STEPS = [{"id":"basic","title":"Basic Information","description":"Enter essential details"},{"id":"settings","title":"Settings & Files","description":"Configure options"},{"id":"business","title":"Business Relations","description":"Connect with customers and products"},{"id":"other","title":"Additional Relations","description":"Other connections and references"},{"id":"review","title":"Review","description":"Confirm your details"}];

export function ProductForm({ id }: ProductFormProps) {
  const router = useRouter();
  const isNew = !id;
  const [currentStep, setCurrentStep] = useState(0);
  const [confirmSubmission, setConfirmSubmission] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restorationAttempted, setRestorationAttempted] = useState(false);

  // Create or update mutation
  const { mutate: createEntity, isPending: isCreating } = useCreateProduct({
    mutation: {
      onSuccess: (data) => {
        // Clear saved form state on successful submission
        localStorage.removeItem('ProductFormState');
        
        const returnUrl = localStorage.getItem('returnUrl');
        const relationshipInfo = localStorage.getItem('relationshipFieldInfo');
        
        if (returnUrl && relationshipInfo) {
          const entityId = data?.id || data?.id;
          if (entityId) {
            localStorage.setItem('newlyCreatedEntityId', entityId.toString());
          }
          toast.success("Product created successfully");
          router.push(returnUrl);
        } else {
          toast.success("Product created successfully");
          router.push("/products");
        }
      },
      onError: (error) => {
        toast.error(`Failed to create Product: ${error}`);
      },
    },
  });

  const { mutate: updateEntity, isPending: isUpdating } = useUpdateProduct({
    mutation: {
      onSuccess: () => {
        // Clear saved form state on successful submission
        localStorage.removeItem('ProductFormState');
        
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
    mode: "onChange",
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

  // Form state persistence functions
  const saveFormState = React.useCallback(() => {
    const formData = form.getValues();
    const formState = {
      data: formData,
      currentStep,
      timestamp: Date.now(),
      entity: 'Product'
    };
    
    localStorage.setItem('ProductFormState', JSON.stringify(formState));
    console.log('Form state saved:', formState);
  }, [form, currentStep]);

  const restoreFormState = React.useCallback(() => {
    const savedStateStr = localStorage.getItem('ProductFormState');
    if (savedStateStr) {
      try {
        const savedState = JSON.parse(savedStateStr);
        const isRecent = Date.now() - savedState.timestamp < 30 * 60 * 1000; // 30 minutes
        
        if (isRecent && savedState.entity === 'Product') {
          setIsRestoring(true);
          
          // Restore form values
          Object.keys(savedState.data).forEach(key => {
            const value = savedState.data[key];
            if (value !== undefined && value !== null) {
              form.setValue(key as any, value);
            }
          });
          
          // Restore current step
          setCurrentStep(savedState.currentStep || 0);
          
          // Clear saved state after restoration
          localStorage.removeItem('ProductFormState');
          
          setTimeout(() => setIsRestoring(false), 100);
          toast.success('Form data restored');
          
          console.log('Form state restored:', savedState);
          return true;
        } else {
          localStorage.removeItem('ProductFormState');
        }
      } catch (error) {
        console.error('Failed to restore form state:', error);
        localStorage.removeItem('ProductFormState');
      }
    }
    return false;
  }, [form]);

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

  // Form restoration and event listeners
  useEffect(() => {
    if (!restorationAttempted && isNew) {
      setRestorationAttempted(true);
      
      // Check for newly created entity first
      const newEntityId = localStorage.getItem('newlyCreatedEntityId');
      const relationshipInfo = localStorage.getItem('relationshipFieldInfo');
      
      if (newEntityId && relationshipInfo) {
        try {
          const info = JSON.parse(relationshipInfo);
          console.log('Found newly created entity:', { newEntityId, info });
          
          // Restore form state first, then add the new entity
          const restored = restoreFormState();
          
          setTimeout(() => {
            handleEntityCreated(parseInt(newEntityId), Object.keys(info)[0] || 'id');
            
            // Clean up
            localStorage.removeItem('newlyCreatedEntityId');
            localStorage.removeItem('relationshipFieldInfo');
            localStorage.removeItem('returnUrl');
            localStorage.removeItem('entityCreationContext');
          }, restored ? 500 : 100);
          
        } catch (error) {
          console.error('Error processing newly created entity:', error);
          restoreFormState();
        }
      } else {
        // Just restore form state
        restoreFormState();
      }
    }

    // Listen for save form state events
    const handleSaveFormState = () => {
      console.log('Save form state event received');
      saveFormState();
    };

    window.addEventListener('saveFormState', handleSaveFormState);
    
    return () => {
      window.removeEventListener('saveFormState', handleSaveFormState);
    };
  }, [restorationAttempted, isNew, restoreFormState, saveFormState, handleEntityCreated]);

  // Update form values when entity data is loaded
  useEffect(() => {
    if (entity && !isRestoring) {
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
  }, [entity, form, isRestoring]);

  // Auto-save form state on field changes (debounced)
  useEffect(() => {
    const subscription = form.watch(() => {
      if (!isRestoring && isNew) {
        const timeoutId = setTimeout(() => {
          saveFormState();
        }, 2000); // Auto-save every 2 seconds after changes
        
        return () => clearTimeout(timeoutId);
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form, isRestoring, isNew, saveFormState]);
  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (currentStep !== STEPS.length - 1) return;

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

      ...(entity && !isNew ? {
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

  // Navigation functions
  const validateStep = async () => {
    const currentStepId = STEPS[currentStep].id;
    let fieldsToValidate: string[] = [];

    switch (currentStepId) {
      case 'basic':
        fieldsToValidate = ['name','code','description','category','remark','basePrice','minPrice','maxPrice',];
        break;
      case 'dates':
        fieldsToValidate = [];
        break;
      case 'settings':
        fieldsToValidate = ['isActive',];
        break;
      case 'geographic':
        fieldsToValidate = [];
        break;
      case 'users':
        fieldsToValidate = [];
        break;
      case 'classification':
        fieldsToValidate = [];
        break;
      case 'business':
        fieldsToValidate = ['interestedParties',];
        break;
      case 'other':
        fieldsToValidate = ['calls',];
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
                      name="code"
                      render={({ field }) => (
                        
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Code *</FormLabel>
                          <FormControl>
                            <Input 
                              {...field}
                              
                              placeholder="Enter code"
                              className="transition-colors"
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
                          <FormLabel className="text-sm font-medium">Description</FormLabel>
                          <FormControl>
                            <Input 
                              {...field}
                              
                              placeholder="Enter description"
                              className="transition-colors"
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
                          <FormLabel className="text-sm font-medium">Category</FormLabel>
                          <FormControl>
                            <Input 
                              {...field}
                              
                              placeholder="Enter category"
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
                    
                    <FormField
                      control={form.control}
                      name="basePrice"
                      render={({ field }) => (
                        
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Base Price</FormLabel>
                          <FormControl>
                            <Input 
                              {...field}
                              type="number"
                              placeholder="Enter base price"
                              className="transition-colors"
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
                          <FormLabel className="text-sm font-medium">Min Price</FormLabel>
                          <FormControl>
                            <Input 
                              {...field}
                              type="number"
                              placeholder="Enter min price"
                              className="transition-colors"
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
                          <FormLabel className="text-sm font-medium">Max Price</FormLabel>
                          <FormControl>
                            <Input 
                              {...field}
                              type="number"
                              placeholder="Enter max price"
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
                      name="interestedParties"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">
                            Interested Parties
                          </FormLabel>
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
                              canCreate={true}
                              createEntityPath="/parties/new"
                              createPermission="party:create"
                              onEntityCreated={(entityId) => handleEntityCreated(entityId, 'interestedParties')}
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
              {STEPS[currentStep].id === 'other' && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <h3 className="text-lg font-medium">Additional Relations</h3>
                    <p className="text-muted-foreground">Other connections and references</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <FormField
                      control={form.control}
                      name="calls"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">
                            Calls
                          </FormLabel>
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
                              canCreate={true}
                              createEntityPath="/calls/new"
                              createPermission="call:create"
                              onEntityCreated={(entityId) => handleEntityCreated(entityId, 'calls')}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

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
                        <dt className="text-sm font-medium text-muted-foreground">Code</dt>
                        <dd className="text-sm">
                          {form.watch('code') || "—"}
                        </dd>
                      </div>
                      <div className="space-y-1">
                        <dt className="text-sm font-medium text-muted-foreground">Description</dt>
                        <dd className="text-sm">
                          {form.watch('description') || "—"}
                        </dd>
                      </div>
                      <div className="space-y-1">
                        <dt className="text-sm font-medium text-muted-foreground">Category</dt>
                        <dd className="text-sm">
                          {form.watch('category') || "—"}
                        </dd>
                      </div>
                      <div className="space-y-1">
                        <dt className="text-sm font-medium text-muted-foreground">Base Price</dt>
                        <dd className="text-sm">
                          {form.watch('basePrice') || "—"}
                        </dd>
                      </div>
                      <div className="space-y-1">
                        <dt className="text-sm font-medium text-muted-foreground">Min Price</dt>
                        <dd className="text-sm">
                          {form.watch('minPrice') || "—"}
                        </dd>
                      </div>
                      <div className="space-y-1">
                        <dt className="text-sm font-medium text-muted-foreground">Max Price</dt>
                        <dd className="text-sm">
                          {form.watch('maxPrice') || "—"}
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
                    <h4 className="font-medium text-lg border-b pb-2">🏢 Business Relations</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      <div className="space-y-1">
                        <dt className="text-sm font-medium text-muted-foreground">Interested Parties</dt>
                        <dd className="text-sm">
                          <Badge variant="outline">
                            {Array.isArray(form.watch('interestedParties')) ? 
                              `${form.watch('interestedParties').length} selected` : 'None selected'}
                          </Badge>
                        </dd>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-medium text-lg border-b pb-2">🔗 Additional Relations</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      <div className="space-y-1">
                        <dt className="text-sm font-medium text-muted-foreground">Calls</dt>
                        <dd className="text-sm">
                          <Badge variant="outline">
                            {Array.isArray(form.watch('calls')) ? 
                              `${form.watch('calls').length} selected` : 'None selected'}
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
              onClick={currentStep === 0 ? () => router.push("/products") : prevStep}
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
                  {isCreating || isUpdating ? "Submitting..." : `${isNew ? "Create" : "Update"} Product`}
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
