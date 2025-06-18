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
  useCreateMeetingReminder,
  useUpdateMeetingReminder,
  useGetMeetingReminder,
} from "@/core/api/generated/spring/endpoints/meeting-reminder-resource/meeting-reminder-resource.gen";

import { meetingReminderToast, handleMeetingReminderError } from "./meeting-reminder-toast";
import type { MeetingReminderDTO } from "@/core/api/generated/spring/schemas/MeetingReminderDTO";


// Import step components
import { MeetingReminderStepBasic } from "./steps/meeting-reminder-step-basic";
import { MeetingReminderStepDates } from "./steps/meeting-reminder-step-dates";
import { MeetingReminderStepReview } from "./steps/meeting-reminder-step-review";

// Props interface
interface MeetingReminderFormProps {
  id?: string;
}

// Form schema
const meetingReminderSchema = z.object({
  reminderType: z.string().optional(),
  reminderMinutesBefore: z.number().optional(),
  isTriggered: z.boolean().optional(),
  triggeredAt: z.date().optional(),
  failureReason: z.string().optional(),
  meeting: z.number().optional(),
});

// Step definitions
const STEPS = [{"id":"basic","title":"Basic Information","description":"Enter essential details"},{"id":"dates","title":"Date & Time","description":"Set relevant dates"},{"id":"review","title":"Review","description":"Confirm your details"}];

export function MeetingReminderForm({ id }: MeetingReminderFormProps) {
  const router = useRouter();
  const isNew = !id;
  const [currentStep, setCurrentStep] = useState(0);
  const [confirmSubmission, setConfirmSubmission] = useState(false);

  // Form setup
  const form = useForm<z.infer<typeof meetingReminderSchema>>({
    resolver: zodResolver(meetingReminderSchema),
    defaultValues: {
      reminderType: "",
      reminderMinutesBefore: undefined,
      isTriggered: false,
      triggeredAt: "",
      failureReason: "",
      meeting: undefined,
    },
  });

  // API hooks
  const { data: existingMeetingReminder } = useGetMeetingReminder(
    { id: id || "" },
    { query: { enabled: !isNew && !!id } }
  );

  const createMeetingReminderMutation = useCreateMeetingReminder({
    mutation: {
      onSuccess: (data) => {
        meetingReminderToast.created(data.data);
        router.push("/meeting-reminders");
      },
      onError: handleMeetingReminderError,
    },
  });

  const updateMeetingReminderMutation = useUpdateMeetingReminder({
    mutation: {
      onSuccess: (data) => {
        meetingReminderToast.updated(data.data);
        router.push("/meeting-reminders");
      },
      onError: handleMeetingReminderError,
    },
  });

  // Load existing data
  if (existingMeetingReminder && !form.formState.isDirty) {
    const data = existingMeetingReminder.data;
    if (data) {
      const formData: any = {};
      if (data.reminderType !== undefined) {
        formData.reminderType = data.reminderType;
      }
      if (data.reminderMinutesBefore !== undefined) {
        formData.reminderMinutesBefore = data.reminderMinutesBefore;
      }
      if (data.isTriggered !== undefined) {
        formData.isTriggered = data.isTriggered;
      }
      if (data.triggeredAt) {
        formData.triggeredAt = new Date(data.triggeredAt);
      }
      if (data.failureReason !== undefined) {
        formData.failureReason = data.failureReason;
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
  const onSubmit = (values: z.infer<typeof meetingReminderSchema>) => {
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
    const meetingReminderData: MeetingReminderDTO = {
      reminderType: values.reminderType,
      reminderMinutesBefore: values.reminderMinutesBefore,
      isTriggered: values.isTriggered,
      triggeredAt: values.triggeredAt?.toISOString(),
      failureReason: values.failureReason,
      meeting: values.meeting ? { id: values.meeting } : undefined,
    };

    if (isNew) {
      createMeetingReminderMutation.mutate({ data: meetingReminderData });
    } else {
      updateMeetingReminderMutation.mutate({
        id: id!,
        data: { ...existingMeetingReminder?.data, ...meetingReminderData },
      });
    }
  };

  const isLoading = createMeetingReminderMutation.isPending || updateMeetingReminderMutation.isPending;
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
                <MeetingReminderStepBasic form={form} />
              )}

              {STEPS[currentStep].id === 'dates' && (
                <MeetingReminderStepDates form={form} handleEntityCreated={handleEntityCreated} />
              )}

              {STEPS[currentStep].id === 'review' && (
                <MeetingReminderStepReview form={form} />
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
                {isLoading ? "Saving..." : `${isNew ? "Create" : "Update"} MeetingReminder`}
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

export default MeetingReminderForm;