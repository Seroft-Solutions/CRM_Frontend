"use client";

import { useState, useEffect } from "react";
import * as React from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { CalendarIcon, Save, ArrowLeft, ArrowRight, Check, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { organizationToast, handleOrganizationError } from "./organization-toast";
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

import { 
  useCreateOrganization,
  useUpdateOrganization,
  useGetOrganization,
} from "@/core/api/generated/spring/endpoints/organization-resource/organization-resource.gen";
import type { OrganizationDTO } from "@/core/api/generated/spring/schemas/OrganizationDTO";

interface OrganizationFormProps {
  id?: number;
}

// Create Zod schema for form validation
const formSchema = z.object({
  keycloakOrgId: z.string(),
  name: z.string().min(2).max(100),
  displayName: z.string().max(150).optional(),
  domain: z.string().max(100).optional(),
});

const STEPS = [{"id":"basic","title":"Basic Information","description":"Enter essential details"},{"id":"review","title":"Review","description":"Confirm your details"}];

export function OrganizationForm({ id }: OrganizationFormProps) {
  const router = useRouter();
  const isNew = !id;
  const [currentStep, setCurrentStep] = useState(0);
  const [confirmSubmission, setConfirmSubmission] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restorationAttempted, setRestorationAttempted] = useState(false);

  // Create or update mutation
  const { mutate: createEntity, isPending: isCreating } = useCreateOrganization({
    mutation: {
      onSuccess: (data) => {
        // Clear saved form state on successful submission
        localStorage.removeItem('OrganizationFormState');
        
        const returnUrl = localStorage.getItem('returnUrl');
        const relationshipInfo = localStorage.getItem('relationshipFieldInfo');
        
        if (returnUrl && relationshipInfo) {
          const entityId = data?.id || data?.id;
          if (entityId) {
            localStorage.setItem('newlyCreatedEntityId', entityId.toString());
          }
          organizationToast.created();
          router.push(returnUrl);
        } else {
          organizationToast.created();
          router.push("/organizations");
        }
      },
      onError: (error) => {
        handleOrganizationError(error);
      },
    },
  });

  const { mutate: updateEntity, isPending: isUpdating } = useUpdateOrganization({
    mutation: {
      onSuccess: () => {
        // Clear saved form state on successful submission
        localStorage.removeItem('OrganizationFormState');
        
        organizationToast.updated();
        router.push("/organizations");
      },
      onError: (error) => {
        handleOrganizationError(error);
      },
    },
  });

  // Fetch entity for editing
  const { data: entity, isLoading: isLoadingEntity } = useGetOrganization(id || 0, {
    query: {
      enabled: !!id,
      queryKey: ["get-organization", id]
    },
  });

  // Form initialization
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {

      keycloakOrgId: "",


      name: "",


      displayName: "",


      domain: "",

    },
  });

  // Form state persistence functions
  const saveFormState = React.useCallback(() => {
    const formData = form.getValues();
    const formState = {
      data: formData,
      currentStep,
      timestamp: Date.now(),
      entity: 'Organization'
    };
    
    localStorage.setItem('OrganizationFormState', JSON.stringify(formState));
    console.log('Form state saved:', formState);
  }, [form, currentStep]);

  const restoreFormState = React.useCallback(() => {
    const savedStateStr = localStorage.getItem('OrganizationFormState');
    if (savedStateStr) {
      try {
        const savedState = JSON.parse(savedStateStr);
        const isRecent = Date.now() - savedState.timestamp < 30 * 60 * 1000; // 30 minutes
        
        if (isRecent && savedState.entity === 'Organization') {
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
          localStorage.removeItem('OrganizationFormState');
          
          setTimeout(() => setIsRestoring(false), 100);
          organizationToast.formRestored();
          
          console.log('Form state restored:', savedState);
          return true;
        } else {
          localStorage.removeItem('OrganizationFormState');
        }
      } catch (error) {
        console.error('Failed to restore form state:', error);
        localStorage.removeItem('OrganizationFormState');
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

        keycloakOrgId: entity.keycloakOrgId || "",


        name: entity.name || "",


        displayName: entity.displayName || "",


        domain: entity.domain || "",

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

      keycloakOrgId: data.keycloakOrgId === "__none__" ? undefined : data.keycloakOrgId,


      name: data.name === "__none__" ? undefined : data.name,


      displayName: data.displayName === "__none__" ? undefined : data.displayName,


      domain: data.domain === "__none__" ? undefined : data.domain,

      ...(entity && !isNew ? {
        ...Object.keys(entity).reduce((acc, key) => {
          const isFormField = ['keycloakOrgId','name','displayName','domain',].includes(key);
          if (!isFormField && entity[key as keyof typeof entity] !== undefined) {
            acc[key] = entity[key as keyof typeof entity];
          }
          return acc;
        }, {} as any)
      } : {})
    } as OrganizationDTO;

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
        fieldsToValidate = ['keycloakOrgId','name','displayName','domain',];
        break;
      case 'dates':
        fieldsToValidate = [];
        break;
      case 'settings':
        fieldsToValidate = [];
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
        fieldsToValidate = [];
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
                      name="keycloakOrgId"
                      render={({ field }) => (
                        
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Keycloak Org Id *</FormLabel>
                          <FormControl>
                            <Input 
                              {...field}
                              
                              placeholder="Enter keycloak org id"
                              className="transition-colors"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                        
                      )}
                    />
                    
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
                      name="displayName"
                      render={({ field }) => (
                        
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Display Name</FormLabel>
                          <FormControl>
                            <Input 
                              {...field}
                              
                              placeholder="Enter display name"
                              className="transition-colors"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                        
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="domain"
                      render={({ field }) => (
                        
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Domain</FormLabel>
                          <FormControl>
                            <Input 
                              {...field}
                              
                              placeholder="Enter domain"
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
              

              {/* Classification Step with Intelligent Cascading */}

              {/* Geographic Step with Cascading */}

              {/* User Assignment Step */}

              {/* Business Relations Step */}

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
                        <dt className="text-sm font-medium text-muted-foreground">Keycloak Org Id</dt>
                        <dd className="text-sm">
                          {form.watch('keycloakOrgId') || "—"}
                        </dd>
                      </div>
                      <div className="space-y-1">
                        <dt className="text-sm font-medium text-muted-foreground">Name</dt>
                        <dd className="text-sm">
                          {form.watch('name') || "—"}
                        </dd>
                      </div>
                      <div className="space-y-1">
                        <dt className="text-sm font-medium text-muted-foreground">Display Name</dt>
                        <dd className="text-sm">
                          {form.watch('displayName') || "—"}
                        </dd>
                      </div>
                      <div className="space-y-1">
                        <dt className="text-sm font-medium text-muted-foreground">Domain</dt>
                        <dd className="text-sm">
                          {form.watch('domain') || "—"}
                        </dd>
                      </div>
                    </div>
                  </div>

                  {/* Relationship Reviews */}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Navigation Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={currentStep === 0 ? () => router.push("/organizations") : prevStep}
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
                  {isCreating || isUpdating ? "Submitting..." : `${isNew ? "Create" : "Update"} Organization`}
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
