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
  useCreateUserAvailability,
  useUpdateUserAvailability,
  useGetUserAvailability,
} from "@/core/api/generated/spring/endpoints/user-availability-resource/user-availability-resource.gen";

import { userAvailabilityToast, handleUserAvailabilityError } from "./user-availability-toast";
import type { UserAvailabilityDTO } from "@/core/api/generated/spring/schemas/UserAvailabilityDTO";


// Import step components
import { UserAvailabilityStepBasic } from "./steps/user-availability-step-basic";
import { UserAvailabilityStepDates } from "./steps/user-availability-step-dates";
import { UserAvailabilityStepUsers } from "./steps/user-availability-step-users";
import { UserAvailabilityStepReview } from "./steps/user-availability-step-review";

// Props interface
interface UserAvailabilityFormProps {
  id?: string;
}

// Form schema
const userAvailabilitySchema = z.object({
  dayOfWeek: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  isAvailable: z.boolean().optional(),
  effectiveFrom: z.date().optional(),
  effectiveTo: z.date().optional(),
  timeZone: z.string().optional(),
  user: z.number().optional(),
});

// Step definitions
const STEPS = [{"id":"basic","title":"Basic Information","description":"Enter essential details"},{"id":"dates","title":"Date & Time","description":"Set relevant dates"},{"id":"users","title":"People & Assignment","description":"Assign users and responsibilities"},{"id":"review","title":"Review","description":"Confirm your details"}];

export function UserAvailabilityForm({ id }: UserAvailabilityFormProps) {
  const router = useRouter();
  const isNew = !id;
  const [currentStep, setCurrentStep] = useState(0);
  const [confirmSubmission, setConfirmSubmission] = useState(false);

  // Form setup
  const form = useForm<z.infer<typeof userAvailabilitySchema>>({
    resolver: zodResolver(userAvailabilitySchema),
    defaultValues: {
      dayOfWeek: "",
      startTime: "",
      endTime: "",
      isAvailable: false,
      effectiveFrom: "",
      effectiveTo: "",
      timeZone: "",
      user: undefined,
    },
  });

  // API hooks
  const { data: existingUserAvailability } = useGetUserAvailability(
    { id: id || "" },
    { query: { enabled: !isNew && !!id } }
  );

  const createUserAvailabilityMutation = useCreateUserAvailability({
    mutation: {
      onSuccess: (data) => {
        userAvailabilityToast.created(data.data);
        router.push("/user-availabilitys");
      },
      onError: handleUserAvailabilityError,
    },
  });

  const updateUserAvailabilityMutation = useUpdateUserAvailability({
    mutation: {
      onSuccess: (data) => {
        userAvailabilityToast.updated(data.data);
        router.push("/user-availabilitys");
      },
      onError: handleUserAvailabilityError,
    },
  });

  // Load existing data
  if (existingUserAvailability && !form.formState.isDirty) {
    const data = existingUserAvailability.data;
    if (data) {
      const formData: any = {};
      if (data.dayOfWeek !== undefined) {
        formData.dayOfWeek = data.dayOfWeek;
      }
      if (data.startTime !== undefined) {
        formData.startTime = data.startTime;
      }
      if (data.endTime !== undefined) {
        formData.endTime = data.endTime;
      }
      if (data.isAvailable !== undefined) {
        formData.isAvailable = data.isAvailable;
      }
      if (data.effectiveFrom) {
        formData.effectiveFrom = new Date(data.effectiveFrom);
      }
      if (data.effectiveTo) {
        formData.effectiveTo = new Date(data.effectiveTo);
      }
      if (data.timeZone !== undefined) {
        formData.timeZone = data.timeZone;
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
  const onSubmit = (values: z.infer<typeof userAvailabilitySchema>) => {
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
    const userAvailabilityData: UserAvailabilityDTO = {
      dayOfWeek: values.dayOfWeek,
      startTime: values.startTime,
      endTime: values.endTime,
      isAvailable: values.isAvailable,
      effectiveFrom: values.effectiveFrom?.toISOString(),
      effectiveTo: values.effectiveTo?.toISOString(),
      timeZone: values.timeZone,
      user: values.user ? { id: values.user } : undefined,
    };

    if (isNew) {
      createUserAvailabilityMutation.mutate({ data: userAvailabilityData });
    } else {
      updateUserAvailabilityMutation.mutate({
        id: id!,
        data: { ...existingUserAvailability?.data, ...userAvailabilityData },
      });
    }
  };

  const isLoading = createUserAvailabilityMutation.isPending || updateUserAvailabilityMutation.isPending;
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
                <UserAvailabilityStepBasic form={form} />
              )}

              {STEPS[currentStep].id === 'dates' && (
                <UserAvailabilityStepDates form={form} handleEntityCreated={handleEntityCreated} />
              )}

              {STEPS[currentStep].id === 'users' && (
                <UserAvailabilityStepUsers form={form} handleEntityCreated={handleEntityCreated} />
              )}

              {STEPS[currentStep].id === 'review' && (
                <UserAvailabilityStepReview form={form} />
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
                {isLoading ? "Saving..." : `${isNew ? "Create" : "Update"} UserAvailability`}
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

export default UserAvailabilityForm;