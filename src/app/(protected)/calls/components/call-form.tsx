"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { Progress } from "@/components/ui/progress";

import { 
  useCreateCall,
  useUpdateCall,
  useGetCall,
} from "@/core/api/generated/spring/endpoints/call-resource/call-resource.gen";

import { callToast, handleCallError } from "./call-toast";
import type { CallDTO } from "@/core/api/generated/spring/schemas/CallDTO";


// Import step components
import { CallStepDates } from "./steps/call-step-dates";
import { CallStepGeographic } from "./steps/call-step-geographic";
import { CallStepUsers } from "./steps/call-step-users";
import { CallStepClassification } from "./steps/call-step-classification";
import { CallStepRelationships } from "./steps/call-step-relationships";
import { CallStepReview } from "./steps/call-step-review";

// Props interface
interface CallFormProps {
  id?: string;
}

// Form schema
const callSchema = z.object({
  callDateTime: z.date().optional(),
  remarks: z.number().optional(),
  meeting: z.number().optional(),
  priority: z.number().optional(),
  callType: z.number().optional(),
  subCallType: z.number().optional(),
  source: z.number().optional(),
  channelType: z.number().optional(),
  callCategory: z.number().optional(),
  callStatus: z.number().optional(),
  state: z.number().optional(),
  district: z.number().optional(),
  city: z.number().optional(),
  area: z.number().optional(),
  assignedTo: z.number().optional(),
  channelParty: z.number().optional(),
  party: z.number().optional(),
});

// Step definitions
const STEPS = [{"id":"dates","title":"Date & Time","description":"Set relevant dates"},{"id":"geographic","title":"Location Details","description":"Select geographic information"},{"id":"users","title":"People & Assignment","description":"Assign users and responsibilities"},{"id":"classification","title":"Classification","description":"Set status, categories, type, source and channel"},{"id":"business","title":"Business Relations","description":"Connect with customers and products"},{"id":"review","title":"Review","description":"Confirm your details"}];

export function CallForm({ id }: CallFormProps) {
  const router = useRouter();
  const isNew = !id;
  const [currentStep, setCurrentStep] = useState(0);
  const [confirmSubmission, setConfirmSubmission] = useState(false);

  // Form setup
  const form = useForm<z.infer<typeof callSchema>>({
    resolver: zodResolver(callSchema),
    defaultValues: {
      callDateTime: "",
      remarks: undefined,
      meeting: undefined,
      priority: undefined,
      callType: undefined,
      subCallType: undefined,
      source: undefined,
      channelType: undefined,
      callCategory: undefined,
      callStatus: undefined,
      state: undefined,
      district: undefined,
      city: undefined,
      area: undefined,
      assignedTo: undefined,
      channelParty: undefined,
      party: undefined,
    },
  });

  // API hooks
  const { data: existingCall } = useGetCall(
    { id: id || "" },
    { query: { enabled: !isNew && !!id } }
  );

  const createCallMutation = useCreateCall({
    mutation: {
      onSuccess: (data) => {
        callToast.created(data.data);
        router.push("/calls");
      },
      onError: handleCallError,
    },
  });

  const updateCallMutation = useUpdateCall({
    mutation: {
      onSuccess: (data) => {
        callToast.updated(data.data);
        router.push("/calls");
      },
      onError: handleCallError,
    },
  });

  // Load existing data
  if (existingCall && !form.formState.isDirty) {
    const data = existingCall.data;
    if (data) {
      const formData: any = {};
      if (data.callDateTime) {
        formData.callDateTime = new Date(data.callDateTime);
      }
      if (data.remarks) {
        formData.remarks = data.remarks.id;
      }
      if (data.meeting) {
        formData.meeting = data.meeting.id;
      }
      if (data.priority) {
        formData.priority = data.priority.id;
      }
      if (data.callType) {
        formData.callType = data.callType.id;
      }
      if (data.subCallType) {
        formData.subCallType = data.subCallType.id;
      }
      if (data.source) {
        formData.source = data.source.id;
      }
      if (data.channelType) {
        formData.channelType = data.channelType.id;
      }
      if (data.callCategory) {
        formData.callCategory = data.callCategory.id;
      }
      if (data.callStatus) {
        formData.callStatus = data.callStatus.id;
      }
      if (data.state) {
        formData.state = data.state.id;
      }
      if (data.district) {
        formData.district = data.district.id;
      }
      if (data.city) {
        formData.city = data.city.id;
      }
      if (data.area) {
        formData.area = data.area.id;
      }
      if (data.assignedTo) {
        formData.assignedTo = data.assignedTo.id;
      }
      if (data.channelParty) {
        formData.channelParty = data.channelParty.id;
      }
      if (data.party) {
        formData.party = data.party.id;
      }
      form.reset(formData);
    }
  }

  // Entity creation handler for relationships
  const handleEntityCreated = (entityType: string, entityData: any) => {
    // Handle newly created entities in relationships
    toast.success(`${entityType} created successfully`);
  };

  // Navigation
  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (step: number) => {
    setCurrentStep(step);
  };

  // Form submission
  const onSubmit = (values: z.infer<typeof callSchema>) => {
    // If not on review step, go to review
    if (STEPS[currentStep].id !== 'review') {
      setCurrentStep(STEPS.length - 1); // Go to review step
      return;
    }

    // If on review step but not confirmed, show confirmation
    if (!confirmSubmission) {
      setConfirmSubmission(true);
      return;
    }

    // Proceed with actual submission
    const callData: CallDTO = {
      callDateTime: values.callDateTime?.toISOString(),
      remarks: values.remarks ? { id: values.remarks } : undefined,
      meeting: values.meeting ? { id: values.meeting } : undefined,
      priority: values.priority ? { id: values.priority } : undefined,
      callType: values.callType ? { id: values.callType } : undefined,
      subCallType: values.subCallType ? { id: values.subCallType } : undefined,
      source: values.source ? { id: values.source } : undefined,
      channelType: values.channelType ? { id: values.channelType } : undefined,
      callCategory: values.callCategory ? { id: values.callCategory } : undefined,
      callStatus: values.callStatus ? { id: values.callStatus } : undefined,
      state: values.state ? { id: values.state } : undefined,
      district: values.district ? { id: values.district } : undefined,
      city: values.city ? { id: values.city } : undefined,
      area: values.area ? { id: values.area } : undefined,
      assignedTo: values.assignedTo ? { id: values.assignedTo } : undefined,
      channelParty: values.channelParty ? { id: values.channelParty } : undefined,
      party: values.party ? { id: values.party } : undefined,
    };

    if (isNew) {
      createCallMutation.mutate({ data: callData });
    } else {
      updateCallMutation.mutate({
        id: id!,
        data: { ...existingCall?.data, ...callData },
      });
    }
  };

  const isLoading = createCallMutation.isPending || updateCallMutation.isPending;
  const progress = ((currentStep + 1) / STEPS.length) * 100;

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Step {currentStep + 1} of {STEPS.length}</span>
          <span>{Math.round(progress)}% Complete</span>
        </div>
        <Progress value={progress} className="w-full" />
      </div>

      {/* Step Navigation */}
      <div className="flex flex-wrap gap-2 justify-center">
        {STEPS.map((step, index) => (
          <Button
            key={step.id}
            variant={index === currentStep ? "default" : index < currentStep ? "secondary" : "outline"}
            size="sm"
            onClick={() => goToStep(index)}
            className="text-xs"
          >
            {index < currentStep && <Check className="h-3 w-3 mr-1" />}
            {step.title}
          </Button>
        ))}
      </div>

      {/* Step Header */}
      <div className="text-center space-y-1">
        <h2 className="text-lg sm:text-xl font-semibold">{STEPS[currentStep].title}</h2>
        <p className="text-sm text-muted-foreground">{STEPS[currentStep].description}</p>
      </div>

      {/* Form Content */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardContent className="p-4 sm:p-6">
              {/* Step Content */}
              {STEPS[currentStep].id === 'dates' && (
                <CallStepDates form={form} handleEntityCreated={handleEntityCreated} />
              )}

              {STEPS[currentStep].id === 'geographic' && (
                <CallStepGeographic form={form} handleEntityCreated={handleEntityCreated} />
              )}

              {STEPS[currentStep].id === 'users' && (
                <CallStepUsers form={form} handleEntityCreated={handleEntityCreated} />
              )}

              {STEPS[currentStep].id === 'classification' && (
                <CallStepClassification form={form} handleEntityCreated={handleEntityCreated} />
              )}

              {STEPS[currentStep].id === 'business' && (
                <CallStepRelationships form={form} handleEntityCreated={handleEntityCreated} />
              )}

              {STEPS[currentStep].id === 'review' && (
                <CallStepReview form={form} />
              )}

            </CardContent>
          </Card>

          {/* Navigation Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="flex items-center gap-2 justify-center"
            >
              <ArrowLeft className="h-4 w-4" />
              Previous
            </Button>

            {STEPS[currentStep].id === 'review' && confirmSubmission ? (
              <Button
                type="submit"
                disabled={isLoading}
                className="flex items-center gap-2 justify-center"
              >
                <Check className="h-4 w-4" />
                {isLoading ? "Saving..." : `${isNew ? "Create" : "Update"} Call`}
              </Button>
            ) : STEPS[currentStep].id === 'review' ? (
              <Button
                type="submit"
                className="flex items-center gap-2 justify-center"
              >
                <Check className="h-4 w-4" />
                Confirm & {isNew ? "Create" : "Update"}
              </Button>
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

export default CallForm;