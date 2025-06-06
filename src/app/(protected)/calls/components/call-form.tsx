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
  useGetAllAreasInfinite,
  useSearchAreasInfinite 
} from "@/core/api/generated/spring/endpoints/area-resource/area-resource.gen";
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
import { 
  useGetAllProductsInfinite,
  useSearchProductsInfinite 
} from "@/core/api/generated/spring/endpoints/product-resource/product-resource.gen";
import { 
  useGetAllPartiesInfinite,
  useSearchPartiesInfinite 
} from "@/core/api/generated/spring/endpoints/party-resource/party-resource.gen";
import { 
  useGetAllPublicUsersInfinite,
  useSearchInfinite as useSearchPublicUsersInfinite 
} from "@/core/api/generated/spring/endpoints/public-user-resource/public-user-resource.gen";
import type { CallDTO } from "@/core/api/generated/spring/schemas/CallDTO";
import type { UserDTO } from "@/core/api/generated/spring/schemas/UserDTO";

interface CallFormProps {
  id?: number;
}

// Create Zod schema for form validation
const formSchema = z.object({
  callDateTime: z.date(),
  isActive: z.boolean(),
  assignedTo: z.string().optional(),
  priority: z.number().optional(),
  callType: z.number().optional(),
  subCallType: z.number().optional(),
  source: z.number().optional(),
  area: z.number().optional(),
  channelType: z.number().optional(),
  callCategory: z.number().optional(),
  callStatus: z.number().optional(),
  products: z.array(z.number()).optional(),
  party: z.number().optional(),
});

const STEPS = [{"id":"dates","title":"Date & Time","description":"Set relevant dates"},{"id":"settings","title":"Settings & Files","description":"Configure options"},{"id":"geographic","title":"Location Details","description":"Select geographic information"},{"id":"users","title":"People & Assignment","description":"Assign users and responsibilities"},{"id":"classification","title":"Classification","description":"Set priority, status, and categories"},{"id":"business","title":"Business Relations","description":"Connect with customers and products"},{"id":"review","title":"Review","description":"Confirm your details"}];

export function CallForm({ id }: CallFormProps) {
  const router = useRouter();
  const isNew = !id;
  const [currentStep, setCurrentStep] = useState(0);
  const [confirmSubmission, setConfirmSubmission] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restorationAttempted, setRestorationAttempted] = useState(false);
  
  // Geographic hierarchy state for future cascading dropdowns
  const [geographicFilters, setGeographicFilters] = useState<{[key: string]: number | null}>({});

  // Create or update mutation (IMPROVED with localStorage)
  const { mutate: createEntity, isPending: isCreating } = useCreateCall({
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
          
          toast.success("Call created successfully");
          
          // Navigate back to the original form
          console.log('Returning to original form:', returnUrl);
          router.push(returnUrl);
          
          // DON'T clean up storage here - let the destination form handle cleanup after restoration
        } else {
          // Normal flow - go to list page
          toast.success("Call created successfully");
          router.push("/calls");
        }
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

  // Form initialization with standard defaults
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {

      callDateTime: new Date(),


      isActive: false,


      assignedTo: undefined,


      priority: undefined,


      callType: undefined,


      subCallType: undefined,


      source: undefined,


      area: undefined,


      channelType: undefined,


      callCategory: undefined,


      callStatus: undefined,


      products: [],


      party: undefined,

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
      currentEntityType: 'Call',
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
          currentEntityType: 'Call',
          timestamp: parsed.timestamp,
          currentTime: Date.now(),
          timeDiff: Date.now() - parsed.timestamp,
          isRecent: Date.now() - parsed.timestamp < 1800000, // 30 minutes
          entityTypeMatch: parsed.entityType === 'Call'
        });
        
        // Check if this is the right form to restore to
        const isRecent = Date.now() - parsed.timestamp < 1800000; // 30 minutes
        const entityTypeMatch = parsed.entityType === 'Call';
        
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
            expected: 'Call'
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
        entityType: 'Call',
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

        callDateTime: entity.callDateTime ? new Date(entity.callDateTime) : undefined,


        isActive: entity.isActive || "",


        assignedTo: entity.assignedTo?.id,


        priority: entity.priority?.id,


        callType: entity.callType?.id,


        subCallType: entity.subCallType?.id,


        source: entity.source?.id,


        area: entity.area?.id,


        channelType: entity.channelType?.id,


        callCategory: entity.callCategory?.id,


        callStatus: entity.callStatus?.id,


        products: entity.products?.map(item => item.id),


        party: entity.party?.id,

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

      callDateTime: data.callDateTime === "__none__" ? undefined : data.callDateTime,


      isActive: data.isActive === "__none__" ? undefined : data.isActive,


      assignedTo: data.assignedTo ? { id: data.assignedTo } : null,


      priority: data.priority ? { id: data.priority } : null,


      callType: data.callType ? { id: data.callType } : null,


      subCallType: data.subCallType ? { id: data.subCallType } : null,


      source: data.source ? { id: data.source } : null,


      area: data.area ? { id: data.area } : null,


      channelType: data.channelType ? { id: data.channelType } : null,


      callCategory: data.callCategory ? { id: data.callCategory } : null,


      callStatus: data.callStatus ? { id: data.callStatus } : null,


      products: data.products?.map(id => ({ id: id })),


      party: data.party ? { id: data.party } : null,

      ...(entity && !isNew ? {
        ...Object.keys(entity).reduce((acc, key) => {
          const isFormField = ['callDateTime','isActive','assignedTo','priority','callType','subCallType','source','area','channelType','callCategory','callStatus','products','party',].includes(key);
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

  // Validate current step
  const validateStep = async () => {
    const currentStepId = STEPS[currentStep].id;
    let fieldsToValidate: string[] = [];

    switch (currentStepId) {
      case 'basic':
        fieldsToValidate = [];
        break;
      case 'dates':
        fieldsToValidate = ['callDateTime',];
        break;
      case 'settings':
        fieldsToValidate = ['isActive',];
        break;
      case 'geographic':
        fieldsToValidate = ['area',];
        break;
      case 'users':
        fieldsToValidate = ['assignedTo',];
        break;
      case 'classification':
        fieldsToValidate = ['priority','callType','subCallType','channelType','callCategory','callStatus',];
        break;
      case 'business':
        fieldsToValidate = ['source','products','party',];
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
          {isNew ? "Follow the steps below to create a new" : "Update the information for this"} call
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
                    
                  </div>
                </div>
              )}

              {/* Step 2: Date & Time (if exists) */}
              
              {STEPS[currentStep].id === 'dates' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    <FormField
                      control={form.control}
                      name="callDateTime"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel className="text-sm font-medium">Call Date Time *</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? format(field.value, "PPP") : <span>Select date</span>}
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
                    
                  </div>
                </div>
              )}
              

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
              

              {/* Geographic Information Step */}
              {STEPS[currentStep].id === 'geographic' && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <h3 className="text-lg font-medium">Location Information</h3>
                    <p className="text-muted-foreground">Select location details in hierarchical order</p>
                  </div>
                  <div className="grid grid-cols-1 gap-6">
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
                                // Clear dependent selections
                                setGeographicFilters(prev => ({ ...prev, area: value }));
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
              {STEPS[currentStep].id === 'users' && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <h3 className="text-lg font-medium">People & Assignment</h3>
                    <p className="text-muted-foreground">Assign users and responsibilities</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="assignedTo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">
                            Assigned To
                          </FormLabel>
                          <FormControl>
                            <PaginatedRelationshipCombobox
                              value={field.value}
                              onValueChange={field.onChange}
                              displayField="login"
                              placeholder="Select assigned to"
                              multiple={false}
                              useInfiniteQueryHook={useGetAllPublicUsersInfinite}
                              searchHook={useSearchPublicUsersInfinite}
                              entityName="PublicUsers"
                              searchField="login"
                              canCreate={false}
                              createEntityPath=""
                              createPermission=""
                              onEntityCreated={(entityId) => handleEntityCreated(entityId, 'assignedTo')}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {/* Classification Step with Cascading Logic */}
              {STEPS[currentStep].id === 'classification' && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <h3 className="text-lg font-medium">Classification</h3>
                    <p className="text-muted-foreground">Set priority, status, and categories</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">
                            Priority
                          </FormLabel>
                          <FormControl>
                            <PaginatedRelationshipCombobox
                              value={field.value}
                              onValueChange={(value) => {
                                field.onChange(value);
                              }}
                              displayField="name"
                              placeholder="Select priority"
                              multiple={false}
                              useInfiniteQueryHook={useGetAllPrioritiesInfinite}
                              searchHook={useSearchPrioritiesInfinite}
                              entityName="Priorities"
                              searchField="name"
                              canCreate={true}
                              createEntityPath="/priorities/new"
                              createPermission="priority:create"
                              onEntityCreated={(entityId) => handleEntityCreated(entityId, 'priority')}
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
                          <FormLabel className="text-sm font-medium">
                            Call Type
                          </FormLabel>
                          <FormControl>
                            <PaginatedRelationshipCombobox
                              value={field.value}
                              onValueChange={(value) => {
                                field.onChange(value);
                                form.setValue('subCallType', undefined);
                              }}
                              displayField="name"
                              placeholder="Select call type"
                              multiple={false}
                              useInfiniteQueryHook={useGetAllCallTypesInfinite}
                              searchHook={useSearchCallTypesInfinite}
                              entityName="CallTypes"
                              searchField="name"
                              canCreate={true}
                              createEntityPath="/call-types/new"
                              createPermission="callType:create"
                              onEntityCreated={(entityId) => handleEntityCreated(entityId, 'callType')}
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
                          <FormLabel className="text-sm font-medium">
                            Sub Call Type
                          </FormLabel>
                          <FormControl>
                            <PaginatedRelationshipCombobox
                              value={field.value}
                              onValueChange={(value) => {
                                field.onChange(value);
                              }}
                              displayField="name"
                              placeholder="Select sub call type"
                              multiple={false}
                              useInfiniteQueryHook={useGetAllSubCallTypesInfinite}
                              searchHook={useSearchSubCallTypesInfinite}
                              entityName="SubCallTypes"
                              searchField="name"
                              canCreate={true}
                              createEntityPath="/sub-call-types/new"
                              createPermission="subCallType:create"
                              onEntityCreated={(entityId) => handleEntityCreated(entityId, 'subCallType')}
                              parentFilter={form.watch('callType')}
                              parentField="callType"
                              disabled={!form.watch('callType')}
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
                          <FormLabel className="text-sm font-medium">
                            Channel Type
                          </FormLabel>
                          <FormControl>
                            <PaginatedRelationshipCombobox
                              value={field.value}
                              onValueChange={(value) => {
                                field.onChange(value);
                              }}
                              displayField="name"
                              placeholder="Select channel type"
                              multiple={false}
                              useInfiniteQueryHook={useGetAllChannelTypesInfinite}
                              searchHook={useSearchChannelTypesInfinite}
                              entityName="ChannelTypes"
                              searchField="name"
                              canCreate={true}
                              createEntityPath="/channel-types/new"
                              createPermission="channelType:create"
                              onEntityCreated={(entityId) => handleEntityCreated(entityId, 'channelType')}
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
                          <FormLabel className="text-sm font-medium">
                            Call Category
                          </FormLabel>
                          <FormControl>
                            <PaginatedRelationshipCombobox
                              value={field.value}
                              onValueChange={(value) => {
                                field.onChange(value);
                              }}
                              displayField="name"
                              placeholder="Select call category"
                              multiple={false}
                              useInfiniteQueryHook={useGetAllCallCategoriesInfinite}
                              searchHook={useSearchCallCategoriesInfinite}
                              entityName="CallCategories"
                              searchField="name"
                              canCreate={true}
                              createEntityPath="/call-categories/new"
                              createPermission="callCategory:create"
                              onEntityCreated={(entityId) => handleEntityCreated(entityId, 'callCategory')}
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
                          <FormLabel className="text-sm font-medium">
                            Call Status
                          </FormLabel>
                          <FormControl>
                            <PaginatedRelationshipCombobox
                              value={field.value}
                              onValueChange={(value) => {
                                field.onChange(value);
                              }}
                              displayField="name"
                              placeholder="Select call status"
                              multiple={false}
                              useInfiniteQueryHook={useGetAllCallStatusesInfinite}
                              searchHook={useSearchCallStatusesInfinite}
                              entityName="CallStatuses"
                              searchField="name"
                              canCreate={true}
                              createEntityPath="/call-statuses/new"
                              createPermission="callStatus:create"
                              onEntityCreated={(entityId) => handleEntityCreated(entityId, 'callStatus')}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {/* Business Relations Step */}
              {STEPS[currentStep].id === 'business' && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <h3 className="text-lg font-medium">Business Relations</h3>
                    <p className="text-muted-foreground">Connect with customers, products, and sources</p>
                  </div>
                  <div className="grid grid-cols-1 gap-6">
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
                      name="products"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">
                            Products
                          </FormLabel>
                          <FormControl>
                            <PaginatedRelationshipCombobox
                              value={field.value}
                              onValueChange={field.onChange}
                              displayField="name"
                              placeholder="Select products"
                              multiple={true}
                              useInfiniteQueryHook={useGetAllProductsInfinite}
                              searchHook={useSearchProductsInfinite}
                              entityName="Products"
                              searchField="name"
                              canCreate={true}
                              createEntityPath="/products/new"
                              createPermission="product:create"
                              onEntityCreated={(entityId) => handleEntityCreated(entityId, 'products')}
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
                          <FormLabel className="text-sm font-medium">
                            Party
                          </FormLabel>
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
                              canCreate={true}
                              createEntityPath="/parties/new"
                              createPermission="party:create"
                              onEntityCreated={(entityId) => handleEntityCreated(entityId, 'party')}
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

              {/* Enhanced Review Step */}
              {STEPS[currentStep].id === 'review' && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="text-lg font-medium mb-2">Review Your Information</h3>
                    <p className="text-muted-foreground">Please review all the information before submitting</p>
                  </div>
                  
                  {/* Basic Fields */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-lg border-b pb-2">Basic Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <dt className="text-sm font-medium text-muted-foreground">Call Date Time</dt>
                        <dd className="text-sm">
                          {form.watch('callDateTime') ? format(form.watch('callDateTime'), "PPP") : "—"}
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
                    </div>
                  </div>

                  {/* Geographic Relations */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-lg border-b pb-2">📍 Location Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                  {/* User Relations */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-lg border-b pb-2">👥 People & Assignment</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <dt className="text-sm font-medium text-muted-foreground">Assigned To</dt>
                        <dd className="text-sm">
                          <Badge variant="outline">
                            {form.watch('assignedTo') ? 'Assigned' : 'Not assigned'}
                          </Badge>
                        </dd>
                      </div>
                    </div>
                  </div>

                  {/* Classification Relations */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-lg border-b pb-2">🏷️ Classification</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <dt className="text-sm font-medium text-muted-foreground">Priority</dt>
                        <dd className="text-sm">
                          <Badge variant="outline">
                            {form.watch('priority') ? 'Selected' : 'Not selected'}
                          </Badge>
                        </dd>
                      </div>
                      <div className="space-y-1">
                        <dt className="text-sm font-medium text-muted-foreground">Call Type</dt>
                        <dd className="text-sm">
                          <Badge variant="outline">
                            {form.watch('callType') ? 'Selected' : 'Not selected'}
                          </Badge>
                        </dd>
                      </div>
                      <div className="space-y-1">
                        <dt className="text-sm font-medium text-muted-foreground">Sub Call Type</dt>
                        <dd className="text-sm">
                          <Badge variant="outline">
                            {form.watch('subCallType') ? 'Selected' : 'Not selected'}
                          </Badge>
                        </dd>
                      </div>
                      <div className="space-y-1">
                        <dt className="text-sm font-medium text-muted-foreground">Channel Type</dt>
                        <dd className="text-sm">
                          <Badge variant="outline">
                            {form.watch('channelType') ? 'Selected' : 'Not selected'}
                          </Badge>
                        </dd>
                      </div>
                      <div className="space-y-1">
                        <dt className="text-sm font-medium text-muted-foreground">Call Category</dt>
                        <dd className="text-sm">
                          <Badge variant="outline">
                            {form.watch('callCategory') ? 'Selected' : 'Not selected'}
                          </Badge>
                        </dd>
                      </div>
                      <div className="space-y-1">
                        <dt className="text-sm font-medium text-muted-foreground">Call Status</dt>
                        <dd className="text-sm">
                          <Badge variant="outline">
                            {form.watch('callStatus') ? 'Selected' : 'Not selected'}
                          </Badge>
                        </dd>
                      </div>
                    </div>
                  </div>

                  {/* Business Relations */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-lg border-b pb-2">🏢 Business Relations</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <dt className="text-sm font-medium text-muted-foreground">Source</dt>
                        <dd className="text-sm">
                          <Badge variant="outline">
                            {form.watch('source') ? 'Connected' : 'Not connected'}
                          </Badge>
                        </dd>
                      </div>
                      <div className="space-y-1">
                        <dt className="text-sm font-medium text-muted-foreground">Products</dt>
                        <dd className="text-sm">
                          <Badge variant="outline">
                            {Array.isArray(form.watch('products')) ? 
                              `${form.watch('products').length} selected` : 'None selected'}
                          </Badge>
                        </dd>
                      </div>
                      <div className="space-y-1">
                        <dt className="text-sm font-medium text-muted-foreground">Party</dt>
                        <dd className="text-sm">
                          <Badge variant="outline">
                            {form.watch('party') ? 'Connected' : 'Not connected'}
                          </Badge>
                        </dd>
                      </div>
                    </div>
                  </div>

                  {/* Other Relations */}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={currentStep === 0 ? () => router.push("/calls") : prevStep}
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
                  {isCreating || isUpdating ? "Submitting..." : `${isNew ? "Create" : "Update"} Call`}
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
