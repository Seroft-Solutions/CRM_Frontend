"use client";

import { useState, useEffect } from "react";
import * as React from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { CalendarIcon, Save, ArrowLeft, ArrowRight, Check, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { meetingReminderToast, handleMeetingReminderError } from "./meeting-reminder-toast";
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
  useCreateMeetingReminder,
  useUpdateMeetingReminder,
  useGetMeetingReminder,
} from "@/core/api/generated/spring/endpoints/meeting-reminder-resource/meeting-reminder-resource.gen";
import { 
  useGetAllMeetings,
  useSearchMeetings,
  useCountMeetings
} from "@/core/api/generated/spring/endpoints/meeting-resource/meeting-resource.gen";
import type { MeetingReminderDTO } from "@/core/api/generated/spring/schemas/MeetingReminderDTO";

interface MeetingReminderFormProps {
  id?: number;
}

// Create Zod schema for form validation
const formSchema = z.object({
  reminderType: z.string(),
  reminderMinutesBefore: z.string().refine(val => !val || Number(val) >= 5, { message: "Must be at least 5" }).refine(val => !val || Number(val) <= 43200, { message: "Must be at most 43200" }),
  isTriggered: z.boolean().optional(),
  triggeredAt: z.date().optional(),
  failureReason: z.string().max(500).optional(),
  meeting: z.number().optional(),
});

const STEPS = [{"id":"basic","title":"Basic Information","description":"Enter essential details"},{"id":"dates","title":"Date & Time","description":"Set relevant dates"},{"id":"settings","title":"Settings & Files","description":"Configure options"},{"id":"other","title":"Additional Relations","description":"Other connections and references"},{"id":"review","title":"Review","description":"Confirm your details"}];

export function MeetingReminderForm({ id }: MeetingReminderFormProps) {
  const router = useRouter();
  const isNew = !id;
  const [currentStep, setCurrentStep] = useState(0);
  const [confirmSubmission, setConfirmSubmission] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restorationAttempted, setRestorationAttempted] = useState(false);
  const [formSessionId] = useState(() => {
    // Generate unique session ID for this form instance
    const existingSession = sessionStorage.getItem('MeetingReminder_FormSession');
    if (existingSession && isNew) {
      return existingSession;
    }
    const newSessionId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    if (isNew) {
      sessionStorage.setItem('MeetingReminder_FormSession', newSessionId);
    }
    return newSessionId;
  });

  // Create or update mutation
  const { mutate: createEntity, isPending: isCreating } = useCreateMeetingReminder({
    mutation: {
      onSuccess: (data) => {
        // Clean up form state completely
        cleanupFormState();
        
        const returnUrl = localStorage.getItem('returnUrl');
        const relationshipInfo = localStorage.getItem('relationshipFieldInfo');
        
        if (returnUrl && relationshipInfo) {
          const entityId = data?.id || data?.id;
          if (entityId) {
            localStorage.setItem('newlyCreatedEntityId', entityId.toString());
          }
          meetingReminderToast.created();
          router.push(returnUrl);
        } else {
          meetingReminderToast.created();
          router.push("/meeting-reminders");
        }
      },
      onError: (error) => {
        handleMeetingReminderError(error);
      },
    },
  });

  const { mutate: updateEntity, isPending: isUpdating } = useUpdateMeetingReminder({
    mutation: {
      onSuccess: () => {
        // Clean up form state completely
        cleanupFormState();
        
        meetingReminderToast.updated();
        router.push("/meeting-reminders");
      },
      onError: (error) => {
        handleMeetingReminderError(error);
      },
    },
  });

  // Fetch entity for editing
  const { data: entity, isLoading: isLoadingEntity } = useGetMeetingReminder(id || 0, {
    query: {
      enabled: !!id,
      queryKey: ["get-meeting-reminder", id]
    },
  });

  // Form initialization
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {

      reminderType: "",


      reminderMinutesBefore: "",


      isTriggered: false,


      triggeredAt: new Date(),


      failureReason: "",


      meeting: undefined,

    },
  });

  // Form state persistence functions
  const saveFormState = React.useCallback(() => {
    if (!isNew) return; // Don't save state for edit forms
    
    const formData = form.getValues();
    const formState = {
      data: formData,
      currentStep,
      timestamp: Date.now(),
      entity: 'MeetingReminder',
      sessionId: formSessionId
    };
    
    const storageKey = `MeetingReminderFormState_${formSessionId}`;
    localStorage.setItem(storageKey, JSON.stringify(formState));
    console.log('Form state saved with session:', { storageKey, sessionId: formSessionId });
  }, [form, currentStep, isNew, formSessionId]);

  const restoreFormState = React.useCallback(() => {
    if (!isNew) return false; // Don't restore for edit forms
    
    // Check if this is a cross-entity creation (coming from another form)
    const entityCreationContext = localStorage.getItem('entityCreationContext');
    if (entityCreationContext) {
      try {
        const context = JSON.parse(entityCreationContext);
        // If we're creating this entity from another entity's form, don't restore
        if (context.sourceEntity && context.sourceEntity !== 'MeetingReminder') {
          console.log('Cross-entity creation detected, skipping restoration');
          return false;
        }
      } catch (error) {
        console.error('Error parsing entity creation context:', error);
      }
    }
    
    const currentSessionId = sessionStorage.getItem('MeetingReminder_FormSession');
    if (!currentSessionId || currentSessionId !== formSessionId) {
      console.log('Session mismatch, skipping restoration');
      return false;
    }
    
    const storageKey = `MeetingReminderFormState_${formSessionId}`;
    const savedStateStr = localStorage.getItem(storageKey);
    
    if (savedStateStr) {
      try {
        const savedState = JSON.parse(savedStateStr);
        const isRecent = Date.now() - savedState.timestamp < 30 * 60 * 1000; // 30 minutes
        const isSameSession = savedState.sessionId === formSessionId;
        const isSameEntity = savedState.entity === 'MeetingReminder';
        
        if (isRecent && isSameSession && isSameEntity) {
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
          
          // Don't clear saved state immediately, let it be cleared on submission
          setTimeout(() => setIsRestoring(false), 100);
          meetingReminderToast.formRestored();
          
          console.log('Form state restored for session:', formSessionId);
          return true;
        } else {
          console.log('Restoration conditions not met:', { isRecent, isSameSession, isSameEntity });
          localStorage.removeItem(storageKey);
        }
      } catch (error) {
        console.error('Failed to restore form state:', error);
        localStorage.removeItem(storageKey);
      }
    }
    return false;
  }, [form, isNew, formSessionId]);

  // Clear old form states for this entity type
  const clearOldFormStates = React.useCallback(() => {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('MeetingReminderFormState_') && !key.endsWith(formSessionId)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log('Cleared old form states:', keysToRemove);
  }, [formSessionId]);

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
      
      // Clear old form states first
      clearOldFormStates();
      
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
      if (isNew) {
        console.log('Save form state event received');
        saveFormState();
      }
    };

    window.addEventListener('saveFormState', handleSaveFormState);
    
    return () => {
      window.removeEventListener('saveFormState', handleSaveFormState);
    };
  }, [restorationAttempted, isNew, restoreFormState, saveFormState, handleEntityCreated, clearOldFormStates]);

  // Update form values when entity data is loaded
  useEffect(() => {
    if (entity && !isRestoring) {
      const formValues = {

        reminderType: entity.reminderType || "",


        reminderMinutesBefore: entity.reminderMinutesBefore != null ? String(entity.reminderMinutesBefore) : "",


        isTriggered: entity.isTriggered || "",


        triggeredAt: entity.triggeredAt ? new Date(entity.triggeredAt) : undefined,


        failureReason: entity.failureReason || "",


        meeting: entity.meeting?.id,

      };
      form.reset(formValues);
    }
  }, [entity, form, isRestoring]);

  // Auto-save form state on field changes (debounced)
  useEffect(() => {
    if (!isNew || isRestoring) return;
    
    const subscription = form.watch(() => {
      const timeoutId = setTimeout(() => {
        saveFormState();
      }, 2000); // Auto-save every 2 seconds after changes
      
      return () => clearTimeout(timeoutId);
    });
    
    return () => subscription.unsubscribe();
  }, [form, isRestoring, isNew, saveFormState]);
  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (currentStep !== STEPS.length - 1) return;

    const entityToSave = {
      ...(!isNew && entity ? { id: entity.id } : {}),

      reminderType: data.reminderType === "__none__" ? undefined : data.reminderType,


      reminderMinutesBefore: data.reminderMinutesBefore ? Number(data.reminderMinutesBefore) : undefined,


      isTriggered: data.isTriggered === "__none__" ? undefined : data.isTriggered,


      triggeredAt: data.triggeredAt === "__none__" ? undefined : data.triggeredAt,


      failureReason: data.failureReason === "__none__" ? undefined : data.failureReason,


      meeting: data.meeting ? { id: data.meeting } : null,

      ...(entity && !isNew ? {
        ...Object.keys(entity).reduce((acc, key) => {
          const isFormField = ['reminderType','reminderMinutesBefore','isTriggered','triggeredAt','failureReason','meeting',].includes(key);
          if (!isFormField && entity[key as keyof typeof entity] !== undefined) {
            acc[key] = entity[key as keyof typeof entity];
          }
          return acc;
        }, {} as any)
      } : {})
    } as MeetingReminderDTO;

    if (isNew) {
      createEntity({ data: entityToSave });
    } else if (id) {
      updateEntity({ id, data: entityToSave });
    }
  };

  // Form cleanup function
  const cleanupFormState = React.useCallback(() => {
    const storageKey = `MeetingReminderFormState_${formSessionId}`;
    localStorage.removeItem(storageKey);
    sessionStorage.removeItem('MeetingReminder_FormSession');
    
    // Clear all old form states for this entity type
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('MeetingReminderFormState_')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // Reset form to default values
    form.reset();
    setCurrentStep(0);
    setConfirmSubmission(false);
    
    console.log('Form state cleaned up completely');
  }, [formSessionId, form]);

  // Navigation functions
  const handleCancel = () => {
    cleanupFormState();
    
    const returnUrl = localStorage.getItem('returnUrl');
    const backRoute = returnUrl || "/meeting-reminders";
    
    // Clean up navigation localStorage
    localStorage.removeItem('entityCreationContext');
    localStorage.removeItem('referrerInfo');
    localStorage.removeItem('returnUrl');
    
    router.push(backRoute);
  };

  const validateStep = async () => {
    const currentStepId = STEPS[currentStep].id;
    let fieldsToValidate: string[] = [];

    switch (currentStepId) {
      case 'basic':
        fieldsToValidate = ['reminderType','failureReason','reminderMinutesBefore',];
        break;
      case 'dates':
        fieldsToValidate = ['triggeredAt',];
        break;
      case 'settings':
        fieldsToValidate = ['isTriggered',];
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
        fieldsToValidate = ['meeting',];
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
                      name="reminderType"
                      render={({ field }) => (
                        
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Reminder Type *</FormLabel>
                          <FormControl>
                            <Input 
                              {...field}
                              
                              placeholder="Enter reminder type"
                              className="transition-colors"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                        
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="failureReason"
                      render={({ field }) => (
                        
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Failure Reason</FormLabel>
                          <FormControl>
                            <Input 
                              {...field}
                              
                              placeholder="Enter failure reason"
                              className="transition-colors"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                        
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="reminderMinutesBefore"
                      render={({ field }) => (
                        
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Reminder Minutes Before *</FormLabel>
                          <FormControl>
                            <Input 
                              {...field}
                              type="number"
                              placeholder="Enter reminder minutes before"
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
              
              {STEPS[currentStep].id === 'dates' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                    
                    <FormField
                      control={form.control}
                      name="triggeredAt"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel className="text-sm font-medium">Triggered At</FormLabel>
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
              

              {/* Step 3: Settings & Files */}
              
              {STEPS[currentStep].id === 'settings' && (
                <div className="space-y-6">
                  
                  <div className="space-y-4">
                    <h4 className="font-medium">Settings</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      <FormField
                        control={form.control}
                        name="isTriggered"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base font-medium">Is Triggered</FormLabel>
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
                      name="meeting"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">
                            Meeting
                          </FormLabel>
                          <FormControl>
                            <PaginatedRelationshipCombobox
                              value={field.value}
                              onValueChange={field.onChange}
                              displayField="name"
                              placeholder="Select meeting"
                              multiple={false}
                              useGetAllHook={useGetAllMeetings}
                              useSearchHook={useSearchMeetings}
                              useCountHook={useCountMeetings}
                              entityName="Meetings"
                              searchField="name"
                              canCreate={true}
                              createEntityPath="/meetings/new"
                              createPermission="meeting:create"
                              onEntityCreated={(entityId) => handleEntityCreated(entityId, 'meeting')}
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
                        <dt className="text-sm font-medium text-muted-foreground">Reminder Type</dt>
                        <dd className="text-sm">
                          {form.watch('reminderType') || "—"}
                        </dd>
                      </div>
                      <div className="space-y-1">
                        <dt className="text-sm font-medium text-muted-foreground">Reminder Minutes Before</dt>
                        <dd className="text-sm">
                          {form.watch('reminderMinutesBefore') || "—"}
                        </dd>
                      </div>
                      <div className="space-y-1">
                        <dt className="text-sm font-medium text-muted-foreground">Is Triggered</dt>
                        <dd className="text-sm">
                          <Badge variant={form.watch('isTriggered') ? "default" : "secondary"}>
                            {form.watch('isTriggered') ? "Yes" : "No"}
                          </Badge>
                        </dd>
                      </div>
                      <div className="space-y-1">
                        <dt className="text-sm font-medium text-muted-foreground">Triggered At</dt>
                        <dd className="text-sm">
                          {form.watch('triggeredAt') ? format(form.watch('triggeredAt'), "PPP") : "—"}
                        </dd>
                      </div>
                      <div className="space-y-1">
                        <dt className="text-sm font-medium text-muted-foreground">Failure Reason</dt>
                        <dd className="text-sm">
                          {form.watch('failureReason') || "—"}
                        </dd>
                      </div>
                    </div>
                  </div>

                  {/* Relationship Reviews */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-lg border-b pb-2">🔗 Additional Relations</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      <div className="space-y-1">
                        <dt className="text-sm font-medium text-muted-foreground">Meeting</dt>
                        <dd className="text-sm">
                          <Badge variant="outline">
                            {form.watch('meeting') ? 'Selected' : 'Not selected'}
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
              onClick={currentStep === 0 ? handleCancel : prevStep}
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
                  {isCreating || isUpdating ? "Submitting..." : `${isNew ? "Create" : "Update"} Meeting Reminder`}
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