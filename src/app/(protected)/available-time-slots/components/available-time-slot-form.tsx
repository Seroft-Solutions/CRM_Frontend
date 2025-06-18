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
  useCreateAvailableTimeSlot,
  useUpdateAvailableTimeSlot,
  useGetAvailableTimeSlot,
} from "@/core/api/generated/spring/endpoints/available-time-slot-resource/available-time-slot-resource.gen";

import { availableTimeSlotToast, handleAvailableTimeSlotError } from "./available-time-slot-toast";
import type { AvailableTimeSlotDTO } from "@/core/api/generated/spring/schemas/AvailableTimeSlotDTO";


// Import step components
import { AvailableTimeSlotStepBasic } from "./steps/available-time-slot-step-basic";
import { AvailableTimeSlotStepDates } from "./steps/available-time-slot-step-dates";
import { AvailableTimeSlotStepUsers } from "./steps/available-time-slot-step-users";
import { AvailableTimeSlotStepReview } from "./steps/available-time-slot-step-review";

// Props interface
interface AvailableTimeSlotFormProps {
  id?: string;
}

// Form schema
const availableTimeSlotSchema = z.object({
  slotDateTime: z.date().optional(),
  duration: z.number().optional(),
  isBooked: z.boolean().optional(),
  bookedAt: z.date().optional(),
  user: z.number().optional(),
});

// Step definitions
const STEPS = [{"id":"basic","title":"Basic Information","description":"Enter essential details"},{"id":"dates","title":"Date & Time","description":"Set relevant dates"},{"id":"users","title":"People & Assignment","description":"Assign users and responsibilities"},{"id":"review","title":"Review","description":"Confirm your details"}];

export function AvailableTimeSlotForm({ id }: AvailableTimeSlotFormProps) {
  const router = useRouter();
  const isNew = !id;
  const [currentStep, setCurrentStep] = useState(0);
  const [confirmSubmission, setConfirmSubmission] = useState(false);

  // Form setup
  const form = useForm<z.infer<typeof availableTimeSlotSchema>>({
    resolver: zodResolver(availableTimeSlotSchema),
    defaultValues: {
      slotDateTime: "",
      duration: undefined,
      isBooked: false,
      bookedAt: "",
      user: undefined,
    },
  });

  // API hooks
  const { data: existingAvailableTimeSlot } = useGetAvailableTimeSlot(
    { id: id || "" },
    { query: { enabled: !isNew && !!id } }
  );

  const createAvailableTimeSlotMutation = useCreateAvailableTimeSlot({
    mutation: {
      onSuccess: (data) => {
        availableTimeSlotToast.created(data.data);
        router.push("/available-time-slots");
      },
      onError: handleAvailableTimeSlotError,
    },
  });

  const updateAvailableTimeSlotMutation = useUpdateAvailableTimeSlot({
    mutation: {
      onSuccess: (data) => {
        availableTimeSlotToast.updated(data.data);
        router.push("/available-time-slots");
      },
      onError: handleAvailableTimeSlotError,
    },
  });

  // Load existing data
  if (existingAvailableTimeSlot && !form.formState.isDirty) {
    const data = existingAvailableTimeSlot.data;
    if (data) {
      const formData: any = {};
      if (data.slotDateTime) {
        formData.slotDateTime = new Date(data.slotDateTime);
      }
      if (data.duration !== undefined) {
        formData.duration = data.duration;
      }
      if (data.isBooked !== undefined) {
        formData.isBooked = data.isBooked;
      }
      if (data.bookedAt) {
        formData.bookedAt = new Date(data.bookedAt);
      }
      if (data.user) {
        formData.user = data.user.id;
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
  const onSubmit = (values: z.infer<typeof availableTimeSlotSchema>) => {
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
    const availableTimeSlotData: AvailableTimeSlotDTO = {
      slotDateTime: values.slotDateTime?.toISOString(),
      duration: values.duration,
      isBooked: values.isBooked,
      bookedAt: values.bookedAt?.toISOString(),
      user: values.user ? { id: values.user } : undefined,
    };

    if (isNew) {
      createAvailableTimeSlotMutation.mutate({ data: availableTimeSlotData });
    } else {
      updateAvailableTimeSlotMutation.mutate({
        id: id!,
        data: { ...existingAvailableTimeSlot?.data, ...availableTimeSlotData },
      });
    }
  };

  const isLoading = createAvailableTimeSlotMutation.isPending || updateAvailableTimeSlotMutation.isPending;
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
                <AvailableTimeSlotStepBasic form={form} />
              )}

              {STEPS[currentStep].id === 'dates' && (
                <AvailableTimeSlotStepDates form={form} handleEntityCreated={handleEntityCreated} />
              )}

              {STEPS[currentStep].id === 'users' && (
                <AvailableTimeSlotStepUsers form={form} handleEntityCreated={handleEntityCreated} />
              )}

              {STEPS[currentStep].id === 'review' && (
                <AvailableTimeSlotStepReview form={form} />
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
                {isLoading ? "Saving..." : `${isNew ? "Create" : "Update"} AvailableTimeSlot`}
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

export default AvailableTimeSlotForm;