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
  useCreateMeetingParticipant,
  useUpdateMeetingParticipant,
  useGetMeetingParticipant,
} from "@/core/api/generated/spring/endpoints/meeting-participant-resource/meeting-participant-resource.gen";

import { meetingParticipantToast, handleMeetingParticipantError } from "./meeting-participant-toast";
import type { MeetingParticipantDTO } from "@/core/api/generated/spring/schemas/MeetingParticipantDTO";


// Import step components
import { MeetingParticipantStepBasic } from "./steps/meeting-participant-step-basic";
import { MeetingParticipantStepDates } from "./steps/meeting-participant-step-dates";
import { MeetingParticipantStepReview } from "./steps/meeting-participant-step-review";

// Props interface
interface MeetingParticipantFormProps {
  id?: string;
}

// Form schema
const meetingParticipantSchema = z.object({
  email: z.string().optional(),
  name: z.string().optional(),
  isRequired: z.boolean().optional(),
  hasAccepted: z.boolean().optional(),
  hasDeclined: z.boolean().optional(),
  responseDateTime: z.date().optional(),
  meeting: z.number().optional(),
});

// Step definitions
const STEPS = [{"id":"basic","title":"Basic Information","description":"Enter essential details"},{"id":"dates","title":"Date & Time","description":"Set relevant dates"},{"id":"review","title":"Review","description":"Confirm your details"}];

export function MeetingParticipantForm({ id }: MeetingParticipantFormProps) {
  const router = useRouter();
  const isNew = !id;
  const [currentStep, setCurrentStep] = useState(0);
  const [confirmSubmission, setConfirmSubmission] = useState(false);

  // Form setup
  const form = useForm<z.infer<typeof meetingParticipantSchema>>({
    resolver: zodResolver(meetingParticipantSchema),
    defaultValues: {
      email: "",
      name: "",
      isRequired: false,
      hasAccepted: false,
      hasDeclined: false,
      responseDateTime: "",
      meeting: undefined,
    },
  });

  // API hooks
  const { data: existingMeetingParticipant } = useGetMeetingParticipant(
    { id: id || "" },
    { query: { enabled: !isNew && !!id } }
  );

  const createMeetingParticipantMutation = useCreateMeetingParticipant({
    mutation: {
      onSuccess: (data) => {
        meetingParticipantToast.created(data.data);
        router.push("/meeting-participants");
      },
      onError: handleMeetingParticipantError,
    },
  });

  const updateMeetingParticipantMutation = useUpdateMeetingParticipant({
    mutation: {
      onSuccess: (data) => {
        meetingParticipantToast.updated(data.data);
        router.push("/meeting-participants");
      },
      onError: handleMeetingParticipantError,
    },
  });

  // Load existing data
  if (existingMeetingParticipant && !form.formState.isDirty) {
    const data = existingMeetingParticipant.data;
    if (data) {
      const formData: any = {};
      if (data.email !== undefined) {
        formData.email = data.email;
      }
      if (data.name !== undefined) {
        formData.name = data.name;
      }
      if (data.isRequired !== undefined) {
        formData.isRequired = data.isRequired;
      }
      if (data.hasAccepted !== undefined) {
        formData.hasAccepted = data.hasAccepted;
      }
      if (data.hasDeclined !== undefined) {
        formData.hasDeclined = data.hasDeclined;
      }
      if (data.responseDateTime) {
        formData.responseDateTime = new Date(data.responseDateTime);
      }
      if (data.meeting) {
        formData.meeting = data.meeting.id;
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
  const onSubmit = (values: z.infer<typeof meetingParticipantSchema>) => {
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
    const meetingParticipantData: MeetingParticipantDTO = {
      email: values.email,
      name: values.name,
      isRequired: values.isRequired,
      hasAccepted: values.hasAccepted,
      hasDeclined: values.hasDeclined,
      responseDateTime: values.responseDateTime?.toISOString(),
      meeting: values.meeting ? { id: values.meeting } : undefined,
    };

    if (isNew) {
      createMeetingParticipantMutation.mutate({ data: meetingParticipantData });
    } else {
      updateMeetingParticipantMutation.mutate({
        id: id!,
        data: { ...existingMeetingParticipant?.data, ...meetingParticipantData },
      });
    }
  };

  const isLoading = createMeetingParticipantMutation.isPending || updateMeetingParticipantMutation.isPending;
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
              {STEPS[currentStep].id === 'basic' && (
                <MeetingParticipantStepBasic form={form} />
              )}

              {STEPS[currentStep].id === 'dates' && (
                <MeetingParticipantStepDates form={form} handleEntityCreated={handleEntityCreated} />
              )}

              {STEPS[currentStep].id === 'review' && (
                <MeetingParticipantStepReview form={form} />
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
                {isLoading ? "Saving..." : `${isNew ? "Create" : "Update"} MeetingParticipant`}
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

export default MeetingParticipantForm;