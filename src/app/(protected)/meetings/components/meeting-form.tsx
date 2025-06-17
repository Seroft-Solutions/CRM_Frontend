"use client";

import { useState, useEffect } from "react";
import * as React from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { CalendarIcon, Save, ArrowLeft, ArrowRight, Check, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { meetingToast, handleMeetingError } from "./meeting-toast";
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
  useCreateMeeting,
  useUpdateMeeting,
  useGetMeeting,
} from "@/core/api/generated/spring/endpoints/meeting-resource/meeting-resource.gen";
import { 
  useGetAllUserProfiles,
  useSearchUserProfiles,
  useCountUserProfiles
} from "@/core/api/generated/spring/endpoints/user-profile-resource/user-profile-resource.gen";
import { 
  useGetAllParties,
  useSearchParties,
  useCountParties
} from "@/core/api/generated/spring/endpoints/party-resource/party-resource.gen";
import { 
  useGetAllCalls,
  useSearchCalls,
  useCountCalls
} from "@/core/api/generated/spring/endpoints/call-resource/call-resource.gen";
import type { MeetingDTO } from "@/core/api/generated/spring/schemas/MeetingDTO";
import type { UserDTO } from "@/core/api/generated/spring/schemas/UserDTO";

interface MeetingFormProps {
  id?: number;
}

// Create Zod schema for form validation
const formSchema = z.object({
  meetingDateTime: z.date(),
  duration: z.string().refine(val => !val || Number(val) >= 15, { message: "Must be at least 15" }).refine(val => !val || Number(val) <= 480, { message: "Must be at most 480" }),
  title: z.string().min(2).max(200),
  description: z.string().max(1000).optional(),
  meetingUrl: z.string().max(500).optional(),
  googleCalendarEventId: z.string().max(100).optional(),
  notes: z.string().max(2000).optional(),
  isRecurring: z.boolean().optional(),
  timeZone: z.string().max(50).optional(),
  meetingStatus: z.string(),
  meetingType: z.string(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  organizer: z.number().optional(),
  assignedParty: z.number().optional(),
  call: z.number().optional(),
});

const STEPS = [{"id":"basic","title":"Basic Information","description":"Enter essential details"},{"id":"dates","title":"Date & Time","description":"Set relevant dates"},{"id":"settings","title":"Settings & Files","description":"Configure options"},{"id":"users","title":"People & Assignment","description":"Assign users and responsibilities"},{"id":"business","title":"Business Relations","description":"Connect with customers and products"},{"id":"other","title":"Additional Relations","description":"Other connections and references"},{"id":"review","title":"Review","description":"Confirm your details"}];

export function MeetingForm({ id }: MeetingFormProps) {
  const router = useRouter();
  const isNew = !id;
  const [currentStep, setCurrentStep] = useState(0);
  const [confirmSubmission, setConfirmSubmission] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restorationAttempted, setRestorationAttempted] = useState(false);
  const [formSessionId] = useState(() => {
    // Generate unique session ID for this form instance
    const existingSession = sessionStorage.getItem('Meeting_FormSession');
    if (existingSession && isNew) {
      return existingSession;
    }
    const newSessionId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    if (isNew) {
      sessionStorage.setItem('Meeting_FormSession', newSessionId);
    }
    return newSessionId;
  });

  // Create or update mutation
  const { mutate: createEntity, isPending: isCreating } = useCreateMeeting({
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
          meetingToast.created();
          router.push(returnUrl);
        } else {
          meetingToast.created();
          router.push("/meetings");
        }
      },
      onError: (error) => {
        handleMeetingError(error);
      },
    },
  });

  const { mutate: updateEntity, isPending: isUpdating } = useUpdateMeeting({
    mutation: {
      onSuccess: () => {
        // Clean up form state completely
        cleanupFormState();
        
        meetingToast.updated();
        router.push("/meetings");
      },
      onError: (error) => {
        handleMeetingError(error);
      },
    },
  });

  // Fetch entity for editing
  const { data: entity, isLoading: isLoadingEntity } = useGetMeeting(id || 0, {
    query: {
      enabled: !!id,
      queryKey: ["get-meeting", id]
    },
  });

  // Form initialization
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {

      meetingDateTime: new Date(),


      duration: "",


      title: "",


      description: "",


      meetingUrl: "",


      googleCalendarEventId: "",


      notes: "",


      isRecurring: false,


      timeZone: "",


      meetingStatus: "",


      meetingType: "",


      createdAt: new Date(),


      updatedAt: new Date(),


      organizer: undefined,


      assignedParty: undefined,


      call: undefined,

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
      entity: 'Meeting',
      sessionId: formSessionId
    };
    
    const storageKey = `MeetingFormState_${formSessionId}`;
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
        if (context.sourceEntity && context.sourceEntity !== 'Meeting') {
          console.log('Cross-entity creation detected, skipping restoration');
          return false;
        }
      } catch (error) {
        console.error('Error parsing entity creation context:', error);
      }
    }
    
    const currentSessionId = sessionStorage.getItem('Meeting_FormSession');
    if (!currentSessionId || currentSessionId !== formSessionId) {
      console.log('Session mismatch, skipping restoration');
      return false;
    }
    
    const storageKey = `MeetingFormState_${formSessionId}`;
    const savedStateStr = localStorage.getItem(storageKey);
    
    if (savedStateStr) {
      try {
        const savedState = JSON.parse(savedStateStr);
        const isRecent = Date.now() - savedState.timestamp < 30 * 60 * 1000; // 30 minutes
        const isSameSession = savedState.sessionId === formSessionId;
        const isSameEntity = savedState.entity === 'Meeting';
        
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
          meetingToast.formRestored();
          
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
      if (key?.startsWith('MeetingFormState_') && !key.endsWith(formSessionId)) {
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

        meetingDateTime: entity.meetingDateTime ? new Date(entity.meetingDateTime) : undefined,


        duration: entity.duration != null ? String(entity.duration) : "",


        title: entity.title || "",


        description: entity.description || "",


        meetingUrl: entity.meetingUrl || "",


        googleCalendarEventId: entity.googleCalendarEventId || "",


        notes: entity.notes || "",


        isRecurring: entity.isRecurring || "",


        timeZone: entity.timeZone || "",


        meetingStatus: entity.meetingStatus || "",


        meetingType: entity.meetingType || "",


        createdAt: entity.createdAt ? new Date(entity.createdAt) : undefined,


        updatedAt: entity.updatedAt ? new Date(entity.updatedAt) : undefined,


        organizer: entity.organizer?.id,


        assignedParty: entity.assignedParty?.id,


        call: entity.call?.id,

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

      meetingDateTime: data.meetingDateTime === "__none__" ? undefined : data.meetingDateTime,


      duration: data.duration ? Number(data.duration) : undefined,


      title: data.title === "__none__" ? undefined : data.title,


      description: data.description === "__none__" ? undefined : data.description,


      meetingUrl: data.meetingUrl === "__none__" ? undefined : data.meetingUrl,


      googleCalendarEventId: data.googleCalendarEventId === "__none__" ? undefined : data.googleCalendarEventId,


      notes: data.notes === "__none__" ? undefined : data.notes,


      isRecurring: data.isRecurring === "__none__" ? undefined : data.isRecurring,


      timeZone: data.timeZone === "__none__" ? undefined : data.timeZone,


      meetingStatus: data.meetingStatus === "__none__" ? undefined : data.meetingStatus,


      meetingType: data.meetingType === "__none__" ? undefined : data.meetingType,


      createdAt: data.createdAt === "__none__" ? undefined : data.createdAt,


      updatedAt: data.updatedAt === "__none__" ? undefined : data.updatedAt,


      organizer: data.organizer ? { id: data.organizer } : null,


      assignedParty: data.assignedParty ? { id: data.assignedParty } : null,


      call: data.call ? { id: data.call } : null,

      ...(entity && !isNew ? {
        ...Object.keys(entity).reduce((acc, key) => {
          const isFormField = ['meetingDateTime','duration','title','description','meetingUrl','googleCalendarEventId','notes','isRecurring','timeZone','meetingStatus','meetingType','createdAt','updatedAt','organizer','assignedParty','call',].includes(key);
          if (!isFormField && entity[key as keyof typeof entity] !== undefined) {
            acc[key] = entity[key as keyof typeof entity];
          }
          return acc;
        }, {} as any)
      } : {})
    } as MeetingDTO;

    if (isNew) {
      createEntity({ data: entityToSave });
    } else if (id) {
      updateEntity({ id, data: entityToSave });
    }
  };

  // Form cleanup function
  const cleanupFormState = React.useCallback(() => {
    const storageKey = `MeetingFormState_${formSessionId}`;
    localStorage.removeItem(storageKey);
    sessionStorage.removeItem('Meeting_FormSession');
    
    // Clear all old form states for this entity type
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('MeetingFormState_')) {
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
    const backRoute = returnUrl || "/meetings";
    
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
        fieldsToValidate = ['title','description','meetingUrl','googleCalendarEventId','notes','timeZone','meetingStatus','meetingType','duration',];
        break;
      case 'dates':
        fieldsToValidate = ['meetingDateTime','createdAt','updatedAt',];
        break;
      case 'settings':
        fieldsToValidate = ['isRecurring',];
        break;
      case 'geographic':
        fieldsToValidate = [];
        break;
      case 'users':
        fieldsToValidate = ['organizer',];
        break;
      case 'classification':
        fieldsToValidate = [];
        break;
      case 'business':
        fieldsToValidate = ['assignedParty',];
        break;
      case 'other':
        fieldsToValidate = ['call',];
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
                      name="title"
                      render={({ field }) => (
                        
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Title *</FormLabel>
                          <FormControl>
                            <Input 
                              {...field}
                              
                              placeholder="Enter title"
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
                      name="meetingUrl"
                      render={({ field }) => (
                        
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Meeting Url</FormLabel>
                          <FormControl>
                            <Input 
                              {...field}
                              
                              placeholder="Enter meeting url"
                              className="transition-colors"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                        
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="googleCalendarEventId"
                      render={({ field }) => (
                        
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Google Calendar Event Id</FormLabel>
                          <FormControl>
                            <Input 
                              {...field}
                              
                              placeholder="Enter google calendar event id"
                              className="transition-colors"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                        
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Notes</FormLabel>
                          <FormControl>
                            <Input 
                              {...field}
                              
                              placeholder="Enter notes"
                              className="transition-colors"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                        
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="timeZone"
                      render={({ field }) => (
                        
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Time Zone</FormLabel>
                          <FormControl>
                            <Input 
                              {...field}
                              
                              placeholder="Enter time zone"
                              className="transition-colors"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                        
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="meetingStatus"
                      render={({ field }) => (
                        
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Meeting Status *</FormLabel>
                          <FormControl>
                            <Input 
                              {...field}
                              
                              placeholder="Enter meeting status"
                              className="transition-colors"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                        
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="meetingType"
                      render={({ field }) => (
                        
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Meeting Type *</FormLabel>
                          <FormControl>
                            <Input 
                              {...field}
                              
                              placeholder="Enter meeting type"
                              className="transition-colors"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                        
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="duration"
                      render={({ field }) => (
                        
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Duration *</FormLabel>
                          <FormControl>
                            <Input 
                              {...field}
                              type="number"
                              placeholder="Enter duration"
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
                      name="meetingDateTime"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel className="text-sm font-medium">Meeting Date Time *</FormLabel>
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
                    
                    <FormField
                      control={form.control}
                      name="createdAt"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel className="text-sm font-medium">Created At</FormLabel>
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
                    
                    <FormField
                      control={form.control}
                      name="updatedAt"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel className="text-sm font-medium">Updated At</FormLabel>
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
                        name="isRecurring"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base font-medium">Is Recurring</FormLabel>
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
              {STEPS[currentStep].id === 'users' && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <h3 className="text-lg font-medium">People & Assignment</h3>
                    <p className="text-muted-foreground">Assign users and responsibilities</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                    <FormField
                      control={form.control}
                      name="organizer"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">
                            Organizer
                          </FormLabel>
                          <FormControl>
                            <PaginatedRelationshipCombobox
                              value={field.value}
                              onValueChange={field.onChange}
                              displayField="email"
                              placeholder="Select organizer"
                              multiple={false}
                              useGetAllHook={useGetAllUserProfiles}
                              useSearchHook={useSearchUserProfiles}
                              useCountHook={useCountUserProfiles}
                              entityName="UserProfiles"
                              searchField="email"
                              canCreate={true}
                              createEntityPath="/user-profiles/new"
                              createPermission="userProfile:create"
                              onEntityCreated={(entityId) => handleEntityCreated(entityId, 'organizer')}
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <FormField
                      control={form.control}
                      name="assignedParty"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">
                            Assigned Party
                          </FormLabel>
                          <FormControl>
                            <PaginatedRelationshipCombobox
                              value={field.value}
                              onValueChange={field.onChange}
                              displayField="name"
                              placeholder="Select assigned party"
                              multiple={false}
                              useGetAllHook={useGetAllParties}
                              useSearchHook={useSearchParties}
                              useCountHook={useCountParties}
                              entityName="Parties"
                              searchField="name"
                              canCreate={true}
                              createEntityPath="/parties/new"
                              createPermission="party:create"
                              onEntityCreated={(entityId) => handleEntityCreated(entityId, 'assignedParty')}
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
                      name="call"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">
                            Call
                          </FormLabel>
                          <FormControl>
                            <PaginatedRelationshipCombobox
                              value={field.value}
                              onValueChange={field.onChange}
                              displayField="name"
                              placeholder="Select call"
                              multiple={false}
                              useGetAllHook={useGetAllCalls}
                              useSearchHook={useSearchCalls}
                              useCountHook={useCountCalls}
                              entityName="Calls"
                              searchField="name"
                              canCreate={true}
                              createEntityPath="/calls/new"
                              createPermission="call:create"
                              onEntityCreated={(entityId) => handleEntityCreated(entityId, 'call')}
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
                        <dt className="text-sm font-medium text-muted-foreground">Meeting Date Time</dt>
                        <dd className="text-sm">
                          {form.watch('meetingDateTime') ? format(form.watch('meetingDateTime'), "PPP") : "—"}
                        </dd>
                      </div>
                      <div className="space-y-1">
                        <dt className="text-sm font-medium text-muted-foreground">Duration</dt>
                        <dd className="text-sm">
                          {form.watch('duration') || "—"}
                        </dd>
                      </div>
                      <div className="space-y-1">
                        <dt className="text-sm font-medium text-muted-foreground">Title</dt>
                        <dd className="text-sm">
                          {form.watch('title') || "—"}
                        </dd>
                      </div>
                      <div className="space-y-1">
                        <dt className="text-sm font-medium text-muted-foreground">Description</dt>
                        <dd className="text-sm">
                          {form.watch('description') || "—"}
                        </dd>
                      </div>
                      <div className="space-y-1">
                        <dt className="text-sm font-medium text-muted-foreground">Meeting Url</dt>
                        <dd className="text-sm">
                          {form.watch('meetingUrl') || "—"}
                        </dd>
                      </div>
                      <div className="space-y-1">
                        <dt className="text-sm font-medium text-muted-foreground">Google Calendar Event Id</dt>
                        <dd className="text-sm">
                          {form.watch('googleCalendarEventId') || "—"}
                        </dd>
                      </div>
                      <div className="space-y-1">
                        <dt className="text-sm font-medium text-muted-foreground">Notes</dt>
                        <dd className="text-sm">
                          {form.watch('notes') || "—"}
                        </dd>
                      </div>
                      <div className="space-y-1">
                        <dt className="text-sm font-medium text-muted-foreground">Is Recurring</dt>
                        <dd className="text-sm">
                          <Badge variant={form.watch('isRecurring') ? "default" : "secondary"}>
                            {form.watch('isRecurring') ? "Yes" : "No"}
                          </Badge>
                        </dd>
                      </div>
                      <div className="space-y-1">
                        <dt className="text-sm font-medium text-muted-foreground">Time Zone</dt>
                        <dd className="text-sm">
                          {form.watch('timeZone') || "—"}
                        </dd>
                      </div>
                      <div className="space-y-1">
                        <dt className="text-sm font-medium text-muted-foreground">Meeting Status</dt>
                        <dd className="text-sm">
                          {form.watch('meetingStatus') || "—"}
                        </dd>
                      </div>
                      <div className="space-y-1">
                        <dt className="text-sm font-medium text-muted-foreground">Meeting Type</dt>
                        <dd className="text-sm">
                          {form.watch('meetingType') || "—"}
                        </dd>
                      </div>
                      <div className="space-y-1">
                        <dt className="text-sm font-medium text-muted-foreground">Created At</dt>
                        <dd className="text-sm">
                          {form.watch('createdAt') ? format(form.watch('createdAt'), "PPP") : "—"}
                        </dd>
                      </div>
                      <div className="space-y-1">
                        <dt className="text-sm font-medium text-muted-foreground">Updated At</dt>
                        <dd className="text-sm">
                          {form.watch('updatedAt') ? format(form.watch('updatedAt'), "PPP") : "—"}
                        </dd>
                      </div>
                    </div>
                  </div>

                  {/* Relationship Reviews */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-lg border-b pb-2">👥 People & Assignment</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      <div className="space-y-1">
                        <dt className="text-sm font-medium text-muted-foreground">Organizer</dt>
                        <dd className="text-sm">
                          <Badge variant="outline">
                            {form.watch('organizer') ? 'Selected' : 'Not selected'}
                          </Badge>
                        </dd>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-medium text-lg border-b pb-2">🏢 Business Relations</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      <div className="space-y-1">
                        <dt className="text-sm font-medium text-muted-foreground">Assigned Party</dt>
                        <dd className="text-sm">
                          <Badge variant="outline">
                            {form.watch('assignedParty') ? 'Selected' : 'Not selected'}
                          </Badge>
                        </dd>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-medium text-lg border-b pb-2">🔗 Additional Relations</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      <div className="space-y-1">
                        <dt className="text-sm font-medium text-muted-foreground">Call</dt>
                        <dd className="text-sm">
                          <Badge variant="outline">
                            {form.watch('call') ? 'Selected' : 'Not selected'}
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
                  {isCreating || isUpdating ? "Submitting..." : `${isNew ? "Create" : "Update"} Meeting`}
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