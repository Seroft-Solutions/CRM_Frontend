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
  useGetAllProductsInfinite,
  useSearchProductsInfinite 
} from "@/core/api/generated/spring/endpoints/product-resource/product-resource.gen";
import { 
  useGetAllCitiesInfinite,
  useSearchCitiesInfinite 
} from "@/core/api/generated/spring/endpoints/city-resource/city-resource.gen";
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
  interestedProducts: z.array(z.number()).optional(),
  city: z.number().optional(),
});

const STEPS = [{"id":"basic","title":"Basic Information","description":"Enter essential details"},{"id":"settings","title":"Settings & Files","description":"Configure options"},{"id":"relationships","title":"Relationships","description":"Associate with other entities"},{"id":"review","title":"Review","description":"Confirm your details"}];

export function PartyForm({ id }: PartyFormProps) {
  const router = useRouter();
  const isNew = !id;
  const [currentStep, setCurrentStep] = useState(0);
  const [confirmSubmission, setConfirmSubmission] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restorationAttempted, setRestorationAttempted] = useState(false);

  // Create or update mutation (IMPROVED with localStorage)
  const { mutate: createEntity, isPending: isCreating } = useCreateParty({
    mutation: {
      onSuccess: (data) => {
        // Check if we're creating for a relationship and need to return
        const returnUrl = localStorage.getItem('returnUrl');
        const relationshipInfo = localStorage.getItem('relationshipFieldInfo');
        
        console.log('Entity created successfully:', { data, returnUrl, relationshipInfo });
        
        if (returnUrl && relationshipInfo) {
          // Store the newly created entity ID for auto-selection
          const entityId = data?.id || data?.id;
          if (entityId) {
            localStorage.setItem('newlyCreatedEntityId', entityId.toString());
            console.log('Stored newly created entity ID:', entityId);
          }
          
          toast.success("Party created successfully");
          
          // Navigate back to the original form
          console.log('Returning to original form:', returnUrl);
          router.push(returnUrl);
          
          // DON'T clean up storage here - let the destination form handle cleanup after restoration
        } else {
          // Normal flow - go to list page
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

  // Form initialization with standard defaults
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


      interestedProducts: [],


      city: undefined,

    },
  });

  // Restore preserved state immediately on mount
  React.useEffect(() => {
    const returnUrl = localStorage.getItem('returnUrl');
    const preserved = localStorage.getItem('preservedFormState');
    const currentUrl = window.location.href;
    
    console.log('Form mounting, checking for restoration:', { 
      returnUrl, 
      currentUrl,
      hasPreserved: !!preserved,
      isReturnDestination: currentUrl === returnUrl,
      currentEntityType: 'Party',
      restorationAttempted
    });
    
    // ONLY restore if this is the destination form (currentUrl matches returnUrl)
    if (returnUrl && preserved && !restorationAttempted && currentUrl === returnUrl) {
      setIsRestoring(true);
      setRestorationAttempted(true);
      
      try {
        const parsed = JSON.parse(preserved);
        console.log('Parsed preserved state:', {
          entityType: parsed.entityType,
          currentEntityType: 'Party',
          timestamp: parsed.timestamp,
          currentTime: Date.now(),
          timeDiff: Date.now() - parsed.timestamp,
          isRecent: Date.now() - parsed.timestamp < 1800000, // 30 minutes
          entityTypeMatch: parsed.entityType === 'Party'
        });
        
        // Check if this is the right form to restore to
        const isRecent = Date.now() - parsed.timestamp < 1800000; // 30 minutes
        const entityTypeMatch = parsed.entityType === 'Party';
        
        if (isRecent && entityTypeMatch) {
          console.log('Starting restoration process...');
          
          // Multiple restoration attempts with delays
          const attemptRestore = (attempt = 1) => {
            console.log(`Restoration attempt ${attempt}`);
            
            setTimeout(() => {
              try {
                form.reset(parsed.formData);
                setCurrentStep(parsed.currentStep);
                setConfirmSubmission(parsed.confirmSubmission);
                
                console.log('Form state restored successfully', {
                  step: parsed.currentStep,
                  formData: parsed.formData
                });
                
                // Verify restoration worked and clean up
                setTimeout(() => {
                  const currentFormData = form.getValues();
                  console.log('Verification - current form data:', currentFormData);
                  setIsRestoring(false);
                  
                  // Clean up storage after successful restoration
                  localStorage.removeItem('preservedFormState');
                  localStorage.removeItem('returnUrl');
                  localStorage.removeItem('relationshipFieldInfo');
                  console.log('Storage cleaned up after successful restoration');
                }, 100);
                
              } catch (error) {
                console.error(`Restoration attempt ${attempt} failed:`, error);
                if (attempt < 3) {
                  attemptRestore(attempt + 1);
                } else {
                  setIsRestoring(false);
                }
              }
            }, attempt * 100);
          };
          
          attemptRestore();
          
          // DON'T clean up storage immediately - let the destination form handle it
          // The destination form will clean up after successful restoration
        } else {
          console.log('Restoration rejected:', {
            reason: !isRecent ? 'expired' : 'wrong entity type',
            timeDiff: Date.now() - parsed.timestamp,
            entityType: parsed.entityType,
            expected: 'Party'
          });
          setIsRestoring(false);
        }
      } catch (error) {
        console.error('Error parsing preserved state:', error);
        setIsRestoring(false);
      }
    } else {
      console.log('No restoration needed:', {
        hasReturnUrl: !!returnUrl,
        hasPreserved: !!preserved,
        alreadyAttempted: restorationAttempted,
        isReturnDestination: currentUrl === returnUrl
      });
      setRestorationAttempted(true);
    }
  }, []); // Run once on mount

  // Handle newly created relationship entities (IMPROVED with localStorage)
  const handleEntityCreated = React.useCallback((entityId: number, relationshipName: string) => {
    console.log('Handling newly created entity:', { entityId, relationshipName });
    
    const currentValue = form.getValues(relationshipName as any);
    
    if (Array.isArray(currentValue)) {
      // Multiple relationship - add to array
      const newValue = [...currentValue, entityId];
      form.setValue(relationshipName as any, newValue);
      console.log('Updated multiple relationship:', newValue);
    } else {
      // Single relationship - set value
      form.setValue(relationshipName as any, entityId);
      console.log('Updated single relationship:', entityId);
    }
    
    // Trigger re-render to show updated selection
    form.trigger(relationshipName as any);
  }, [form]);

  // Check for newly created entity on component mount (IMPROVED with localStorage)
  React.useEffect(() => {
    const newEntityId = localStorage.getItem('newlyCreatedEntityId');
    const relationshipInfo = localStorage.getItem('relationshipFieldInfo');
    
    if (newEntityId && relationshipInfo && restorationAttempted) {
      try {
        const info = JSON.parse(relationshipInfo);
        console.log('Found newly created entity to auto-select:', { newEntityId, info });
        
        // Small delay to ensure form is ready after restoration
        setTimeout(() => {
          // Find the relationship field and update it
          // This is a simplified approach - in practice you'd need to identify the correct field
          console.log('Auto-selecting newly created entity:', newEntityId);
          
          // Clean up
          localStorage.removeItem('newlyCreatedEntityId');
        }, 500);
      } catch (error) {
        console.error('Error processing newly created entity:', error);
      }
    }
  }, [restorationAttempted]);

  // Form state persistence for relationship navigation (IMPROVED with localStorage)
  React.useEffect(() => {
    // Save form state when navigating to create related entity
    const handleSaveFormState = () => {
      const formData = form.getValues();
      const stateToSave = {
        formData,
        currentStep,
        confirmSubmission,
        entityType: 'Party',
        timestamp: Date.now()
      };
      
      console.log('Saving form state for navigation:', stateToSave);
      localStorage.setItem('preservedFormState', JSON.stringify(stateToSave));
    };

    // Add event listener
    window.addEventListener('saveFormState', handleSaveFormState);

    return () => {
      window.removeEventListener('saveFormState', handleSaveFormState);
    };
  }, [form, currentStep, confirmSubmission]);

  // Update form values when entity data is loaded (ONLY for edit mode, NOT when restoring)
  useEffect(() => {
    if (entity && !isRestoring && restorationAttempted) {
      console.log('Loading entity data for edit mode:', entity);
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


        interestedProducts: entity.interestedProducts?.map(item => item.id),


        city: entity.city?.id,

      };
      form.reset(formValues);
      console.log('Entity data loaded successfully');
    }
  }, [entity, form, isRestoring, restorationAttempted]);

  // Prevent accidental form submission
  const handleFormKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    // Prevent Enter key from submitting the form unless we're on the final step
    // and the user is explicitly focused on the submit button
    if (e.key === 'Enter' && currentStep !== STEPS.length - 1) {
      e.preventDefault();
      return;
    }
    
    // Even on the final step, only allow Enter if the target is the submit button
    if (e.key === 'Enter' && currentStep === STEPS.length - 1) {
      const target = e.target as HTMLElement;
      const isSubmitButton = target.getAttribute('type') === 'submit' || 
                           target.closest('button[type="submit"]');
      
      if (!isSubmitButton) {
        e.preventDefault();
        return;
      }
    }
  };

  // Form submission handler - only called when explicitly triggered
  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    // Double-check we're on the review step before allowing submission
    if (currentStep !== STEPS.length - 1) {
      console.warn('Form submission attempted from non-final step');
      return;
    }

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


      interestedProducts: data.interestedProducts?.map(id => ({ id: id })),


      city: data.city ? { id: data.city } : null,

      ...(entity && !isNew ? {
        ...Object.keys(entity).reduce((acc, key) => {
          const isFormField = ['name','mobile','email','whatsApp','contactPerson','address1','address2','address3','isActive','remark','source','area','interestedProducts','city',].includes(key);
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

  // Validate current step
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
      case 'relationships':
        fieldsToValidate = ['source','area','interestedProducts','city',];
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
      // Reset confirmation when leaving review step
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
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <p className="text-muted-foreground">
          {isNew ? "Follow the steps below to create a new" : "Update the information for this"} party
        </p>
      </div>

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
        <div className="flex items-center space-x-4">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={cn(
                "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all",
                index < currentStep 
                  ? "bg-primary border-primary text-primary-foreground" 
                  : index === currentStep 
                  ? "border-primary text-primary bg-primary/10" 
                  : "border-muted-foreground/30 text-muted-foreground"
              )}>
                {index < currentStep ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
              </div>
              {index < STEPS.length - 1 && (
                <ChevronRight className="w-4 h-4 text-muted-foreground mx-2" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Current Step Info */}
      <div className="text-center space-y-1">
        <h2 className="text-xl font-semibold">{STEPS[currentStep].title}</h2>
        <p className="text-muted-foreground">{STEPS[currentStep].description}</p>
      </div>

      {/* Form Content */}
      <Form {...form}>
        <form 
          onSubmit={form.handleSubmit(onSubmit)} 
          onKeyDown={handleFormKeyDown}
          className="space-y-6"
        >
          <Card>
            <CardContent className="pt-6">
              {/* Step 1: Basic Information */}
              {STEPS[currentStep].id === 'basic' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
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

              {/* Step 2: Date & Time (if exists) */}
              

              {/* Step 3: Settings & Files (if exists) */}
              
              {STEPS[currentStep].id === 'settings' && (
                <div className="space-y-6">
                  {/* Boolean Fields */}
                  
                  <div className="space-y-4">
                    <h4 className="font-medium">Settings</h4>
                    
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
                  

                  {/* Binary Fields */}
                  
                </div>
              )}
              

              {/* Step 4: Relationships (if exists) */}
              
              {STEPS[currentStep].id === 'relationships' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-6">
                    
                    <FormField
                      control={form.control}
                      name="source"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Source</FormLabel>
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
                      name="area"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Area</FormLabel>
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
                              canCreate={true}
                              createEntityPath="/areas/new"
                              createPermission="area:create"
                              onEntityCreated={(entityId) => handleEntityCreated(entityId, 'area')}
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
                          <FormLabel className="text-sm font-medium">Interested Products</FormLabel>
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
                    
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">City</FormLabel>
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
                              canCreate={true}
                              createEntityPath="/cities/new"
                              createPermission="city:create"
                              onEntityCreated={(entityId) => handleEntityCreated(entityId, 'city')}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                  </div>
                </div>
              )}
              

              {/* Step 5: Review */}
              {STEPS[currentStep].id === 'review' && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="text-lg font-medium mb-2">Review Your Information</h3>
                    <p className="text-muted-foreground">Please review all the information before submitting</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
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
              )}
            </CardContent>
          </Card>

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={currentStep === 0 ? () => router.push("/parties") : prevStep}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              {currentStep === 0 ? "Cancel" : "Previous"}
            </Button>

            {currentStep === STEPS.length - 1 ? (
              !confirmSubmission ? (
                <Button 
                  type="button"
                  onClick={() => setConfirmSubmission(true)}
                  className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700"
                >
                  <Check className="h-4 w-4" />
                  Confirm {isNew ? "Create" : "Update"}
                </Button>
              ) : (
                <Button 
                  type="submit" 
                  disabled={isCreating || isUpdating}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                >
                  <Save className="h-4 w-4" />
                  {isCreating || isUpdating ? "Submitting..." : `${isNew ? "Create" : "Update"} Party`}
                </Button>
              )
            ) : (
              <Button
                type="button"
                onClick={nextStep}
                className="flex items-center gap-2"
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
