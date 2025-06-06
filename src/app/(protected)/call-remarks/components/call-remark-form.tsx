"use client";

import { useState, useEffect } from "react";
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
  useCreateCallRemark,
  useUpdateCallRemark,
  useGetCallRemark,
} from "@/core/api/generated/spring/endpoints/call-remark-resource/call-remark-resource.gen";
import { 
  useGetAllCallsInfinite,
  useSearchCallsInfinite 
} from "@/core/api/generated/spring/endpoints/call-resource/call-resource.gen";
import type { CallRemarkDTO } from "@/core/api/generated/spring/schemas/CallRemarkDTO";

interface CallRemarkFormProps {
  id?: number;
}

// Create Zod schema for form validation
const formSchema = z.object({
  remark: z.string().max(2000),
  dateTime: z.date(),
  call: z.number().optional(),
});

const STEPS = [{"id":"basic","title":"Basic Information","description":"Enter essential details"},{"id":"dates","title":"Date & Time","description":"Set relevant dates"},{"id":"relationships","title":"Relationships","description":"Associate with other entities"},{"id":"review","title":"Review","description":"Confirm your details"}];

export function CallRemarkForm({ id }: CallRemarkFormProps) {
  const router = useRouter();
  const isNew = !id;
  const [currentStep, setCurrentStep] = useState(0);
  const [confirmSubmission, setConfirmSubmission] = useState(false);

  // Create or update mutation
  const { mutate: createEntity, isPending: isCreating } = useCreateCallRemark({
    mutation: {
      onSuccess: () => {
        toast.success("CallRemark created successfully");
        router.push("/call-remarks");
      },
      onError: (error) => {
        toast.error(`Failed to create CallRemark: ${error}`);
      },
    },
  });

  const { mutate: updateEntity, isPending: isUpdating } = useUpdateCallRemark({
    mutation: {
      onSuccess: () => {
        toast.success("CallRemark updated successfully");
        router.push("/call-remarks");
      },
      onError: (error) => {
        toast.error(`Failed to update CallRemark: ${error}`);
      },
    },
  });

  // Fetch entity for editing
  const { data: entity, isLoading: isLoadingEntity } = useGetCallRemark(id || 0, {
    query: {
      enabled: !!id,
      queryKey: ["get-call-remark", id]
    },
  });

  // Form initialization
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {

      remark: "",


      dateTime: new Date(),


      call: undefined,

    },
  });

  // Update form values when entity data is loaded
  useEffect(() => {
    if (entity) {
      const formValues = {

        remark: entity.remark || "",


        dateTime: entity.dateTime ? new Date(entity.dateTime) : undefined,


        call: entity.call?.id,

      };
      form.reset(formValues);
    }
  }, [entity, form]);

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

      remark: data.remark === "__none__" ? undefined : data.remark,


      dateTime: data.dateTime === "__none__" ? undefined : data.dateTime,


      call: data.call ? { id: data.call } : null,

      ...(entity && !isNew ? {
        ...Object.keys(entity).reduce((acc, key) => {
          const isFormField = ['remark','dateTime','call',].includes(key);
          if (!isFormField && entity[key as keyof typeof entity] !== undefined) {
            acc[key] = entity[key as keyof typeof entity];
          }
          return acc;
        }, {} as any)
      } : {})
    } as CallRemarkDTO;

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
        fieldsToValidate = ['remark',];
        break;
      case 'dates':
        fieldsToValidate = ['dateTime',];
        break;
      case 'settings':
        fieldsToValidate = [];
        break;
      case 'relationships':
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
          {isNew ? "Follow the steps below to create a new" : "Update the information for this"} call remark
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
                      name="remark"
                      render={({ field }) => (
                        
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Remark *</FormLabel>
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
              
              {STEPS[currentStep].id === 'dates' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    <FormField
                      control={form.control}
                      name="dateTime"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel className="text-sm font-medium">Date Time *</FormLabel>
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
              

              {/* Step 4: Relationships (if exists) */}
              
              {STEPS[currentStep].id === 'relationships' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-6">
                    
                    <FormField
                      control={form.control}
                      name="call"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Call</FormLabel>
                          <FormControl>
                            <PaginatedRelationshipCombobox
                              value={field.value}
                              onValueChange={field.onChange}
                              displayField="name"
                              placeholder="Select call"
                              multiple={false}
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
                      <dt className="text-sm font-medium text-muted-foreground">Remark</dt>
                      <dd className="text-sm">
                        
                        {form.watch('remark') || "—"}
                        
                      </dd>
                    </div>
                    
                    <div className="space-y-1">
                      <dt className="text-sm font-medium text-muted-foreground">Date Time</dt>
                      <dd className="text-sm">
                        
                        {form.watch('dateTime') ? format(form.watch('dateTime'), "PPP") : "—"}
                        
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
              onClick={currentStep === 0 ? () => router.push("/call-remarks") : prevStep}
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
                  {isCreating || isUpdating ? "Submitting..." : `${isNew ? "Create" : "Update"} Call Remark`}
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
