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
  useCreateMeeting,
  useUpdateMeeting,
  useGetMeeting,
} from "@/core/api/generated/spring/endpoints/meeting-resource/meeting-resource.gen";

import { meetingToast, handleMeetingError } from "./meeting-toast";
import type { MeetingDTO } from "@/core/api/generated/spring/schemas/MeetingDTO";


// Import step components
import { MeetingStepBasic } from "./steps/meeting-step-basic";
import { MeetingStepDates } from "./steps/meeting-step-dates";
import { MeetingStepUsers } from "./steps/meeting-step-users";
import { MeetingStepRelationships } from "./steps/meeting-step-relationships";
import { MeetingStepReview } from "./steps/meeting-step-review";

// Props interface
interface MeetingFormProps {
  id?: string;
}

// Form schema
const meetingSchema = z.object({
  meetingDateTime: z.date().optional(),
  duration: z.number().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  meetingUrl: z.string().optional(),
  googleCalendarEventId: z.string().optional(),
  notes: z.string().optional(),
  isRecurring: z.boolean().optional(),
  timeZone: z.string().optional(),
  meetingStatus: z.string().optional(),
  meetingType: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  reminders: z.number().optional(),
  participants: z.number().optional(),
  organizer: z.number().optional(),
  assignedParty: z.number().optional(),
  call: z.number().optional(),
});

// Step definitions
const STEPS = [{"id":"basic","title":"Basic Information","description":"Enter essential details"},{"id":"dates","title":"Date & Time","description":"Set relevant dates"},{"id":"users","title":"People & Assignment","description":"Assign users and responsibilities"},{"id":"business","title":"Business Relations","description":"Connect with customers and products"},{"id":"review","title":"Review","description":"Confirm your details"}];

export function MeetingForm({ id }: MeetingFormProps) {
  const router = useRouter();
  const isNew = !id;
  const [currentStep, setCurrentStep] = useState(0);
  const [confirmSubmission, setConfirmSubmission] = useState(false);

  // Form setup
  const form = useForm<z.infer<typeof meetingSchema>>({
    resolver: zodResolver(meetingSchema),
    defaultValues: {
      meetingDateTime: "",
      duration: undefined,
      title: "",
      description: "",
      meetingUrl: "",
      googleCalendarEventId: "",
      notes: "",
      isRecurring: false,
      timeZone: "",
      meetingStatus: "",
      meetingType: "",
      createdAt: "",
      updatedAt: "",
      reminders: undefined,
      participants: undefined,
      organizer: undefined,
      assignedParty: undefined,
      call: undefined,
    },
  });

  // API hooks
  const { data: existingMeeting } = useGetMeeting(
    { id: id || "" },
    { query: { enabled: !isNew && !!id } }
  );

  const createMeetingMutation = useCreateMeeting({
    mutation: {
      onSuccess: (data) => {
        meetingToast.created(data.data);
        router.push("/meetings");
      },
      onError: handleMeetingError,
    },
  });

  const updateMeetingMutation = useUpdateMeeting({
    mutation: {
      onSuccess: (data) => {
        meetingToast.updated(data.data);
        router.push("/meetings");
      },
      onError: handleMeetingError,
    },
  });

  // Load existing data
  if (existingMeeting && !form.formState.isDirty) {
    const data = existingMeeting.data;
    if (data) {
      const formData: any = {};
      if (data.meetingDateTime) {
        formData.meetingDateTime = new Date(data.meetingDateTime);
      }
      if (data.duration !== undefined) {
        formData.duration = data.duration;
      }
      if (data.title !== undefined) {
        formData.title = data.title;
      }
      if (data.description !== undefined) {
        formData.description = data.description;
      }
      if (data.meetingUrl !== undefined) {
        formData.meetingUrl = data.meetingUrl;
      }
      if (data.googleCalendarEventId !== undefined) {
        formData.googleCalendarEventId = data.googleCalendarEventId;
      }
      if (data.notes !== undefined) {
        formData.notes = data.notes;
      }
      if (data.isRecurring !== undefined) {
        formData.isRecurring = data.isRecurring;
      }
      if (data.timeZone !== undefined) {
        formData.timeZone = data.timeZone;
      }
      if (data.meetingStatus !== undefined) {
        formData.meetingStatus = data.meetingStatus;
      }
      if (data.meetingType !== undefined) {
        formData.meetingType = data.meetingType;
      }
      if (data.createdAt) {
        formData.createdAt = new Date(data.createdAt);
      }
      if (data.updatedAt) {
        formData.updatedAt = new Date(data.updatedAt);
      }
      if (data.reminders) {
        formData.reminders = data.reminders.id;
      }
      if (data.participants) {
        formData.participants = data.participants.id;
      }
      if (data.organizer) {
        formData.organizer = data.organizer.id;
      }
      if (data.assignedParty) {
        formData.assignedParty = data.assignedParty.id;
      }
      if (data.call) {
        formData.call = data.call.id;
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
  const onSubmit = (values: z.infer<typeof meetingSchema>) => {
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
    const meetingData: MeetingDTO = {
      meetingDateTime: values.meetingDateTime?.toISOString(),
      duration: values.duration,
      title: values.title,
      description: values.description,
      meetingUrl: values.meetingUrl,
      googleCalendarEventId: values.googleCalendarEventId,
      notes: values.notes,
      isRecurring: values.isRecurring,
      timeZone: values.timeZone,
      meetingStatus: values.meetingStatus,
      meetingType: values.meetingType,
      createdAt: values.createdAt?.toISOString(),
      updatedAt: values.updatedAt?.toISOString(),
      reminders: values.reminders ? { id: values.reminders } : undefined,
      participants: values.participants ? { id: values.participants } : undefined,
      organizer: values.organizer ? { id: values.organizer } : undefined,
      assignedParty: values.assignedParty ? { id: values.assignedParty } : undefined,
      call: values.call ? { id: values.call } : undefined,
    };

    if (isNew) {
      createMeetingMutation.mutate({ data: meetingData });
    } else {
      updateMeetingMutation.mutate({
        id: id!,
        data: { ...existingMeeting?.data, ...meetingData },
      });
    }
  };

  const isLoading = createMeetingMutation.isPending || updateMeetingMutation.isPending;
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
                <MeetingStepBasic form={form} />
              )}

              {STEPS[currentStep].id === 'dates' && (
                <MeetingStepDates form={form} handleEntityCreated={handleEntityCreated} />
              )}

              {STEPS[currentStep].id === 'users' && (
                <MeetingStepUsers form={form} handleEntityCreated={handleEntityCreated} />
              )}

              {STEPS[currentStep].id === 'business' && (
                <MeetingStepRelationships form={form} handleEntityCreated={handleEntityCreated} />
              )}

              {STEPS[currentStep].id === 'review' && (
                <MeetingStepReview form={form} />
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
                {isLoading ? "Saving..." : `${isNew ? "Create" : "Update"} Meeting`}
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

export default MeetingForm;