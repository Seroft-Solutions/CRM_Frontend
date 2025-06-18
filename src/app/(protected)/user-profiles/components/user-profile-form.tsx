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
  useCreateUserProfile,
  useUpdateUserProfile,
  useGetUserProfile,
} from "@/core/api/generated/spring/endpoints/user-profile-resource/user-profile-resource.gen";

import { userProfileToast, handleUserProfileError } from "./user-profile-toast";
import type { UserProfileDTO } from "@/core/api/generated/spring/schemas/UserProfileDTO";


// Import step components
import { UserProfileStepBasic } from "./steps/user-profile-step-basic";
import { UserProfileStepClassification } from "./steps/user-profile-step-classification";
import { UserProfileStepRelationships } from "./steps/user-profile-step-relationships";
import { UserProfileStepReview } from "./steps/user-profile-step-review";

// Props interface
interface UserProfileFormProps {
  id?: string;
}

// Form schema
const userProfileSchema = z.object({
  keycloakId: z.string().optional(),
  email: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  availabilitySlots: z.number().optional(),
  availableTimeSlots: z.number().optional(),
  organization: z.number().optional(),
  groups: z.number().optional(),
  roles: z.number().optional(),
  channelType: z.number().optional(),
});

// Step definitions
const STEPS = [{"id":"basic","title":"Basic Information","description":"Enter essential details"},{"id":"classification","title":"Classification","description":"Set type and channel"},{"id":"business","title":"Business Relations","description":"Connect with customers and products"},{"id":"review","title":"Review","description":"Confirm your details"}];

export function UserProfileForm({ id }: UserProfileFormProps) {
  const router = useRouter();
  const isNew = !id;
  const [currentStep, setCurrentStep] = useState(0);
  const [confirmSubmission, setConfirmSubmission] = useState(false);

  // Form setup
  const form = useForm<z.infer<typeof userProfileSchema>>({
    resolver: zodResolver(userProfileSchema),
    defaultValues: {
      keycloakId: "",
      email: "",
      firstName: "",
      lastName: "",
      availabilitySlots: undefined,
      availableTimeSlots: undefined,
      organization: undefined,
      groups: undefined,
      roles: undefined,
      channelType: undefined,
    },
  });

  // API hooks
  const { data: existingUserProfile } = useGetUserProfile(
    { id: id || "" },
    { query: { enabled: !isNew && !!id } }
  );

  const createUserProfileMutation = useCreateUserProfile({
    mutation: {
      onSuccess: (data) => {
        userProfileToast.created(data.data);
        router.push("/user-profiles");
      },
      onError: handleUserProfileError,
    },
  });

  const updateUserProfileMutation = useUpdateUserProfile({
    mutation: {
      onSuccess: (data) => {
        userProfileToast.updated(data.data);
        router.push("/user-profiles");
      },
      onError: handleUserProfileError,
    },
  });

  // Load existing data
  if (existingUserProfile && !form.formState.isDirty) {
    const data = existingUserProfile.data;
    if (data) {
      const formData: any = {};
      if (data.keycloakId !== undefined) {
        formData.keycloakId = data.keycloakId;
      }
      if (data.email !== undefined) {
        formData.email = data.email;
      }
      if (data.firstName !== undefined) {
        formData.firstName = data.firstName;
      }
      if (data.lastName !== undefined) {
        formData.lastName = data.lastName;
      }
      if (data.availabilitySlots) {
        formData.availabilitySlots = data.availabilitySlots.id;
      }
      if (data.availableTimeSlots) {
        formData.availableTimeSlots = data.availableTimeSlots.id;
      }
      if (data.organization) {
        formData.organization = data.organization.id;
      }
      if (data.groups) {
        formData.groups = data.groups.id;
      }
      if (data.roles) {
        formData.roles = data.roles.id;
      }
      if (data.channelType) {
        formData.channelType = data.channelType.id;
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
  const onSubmit = (values: z.infer<typeof userProfileSchema>) => {
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
    const userProfileData: UserProfileDTO = {
      keycloakId: values.keycloakId,
      email: values.email,
      firstName: values.firstName,
      lastName: values.lastName,
      availabilitySlots: values.availabilitySlots ? { id: values.availabilitySlots } : undefined,
      availableTimeSlots: values.availableTimeSlots ? { id: values.availableTimeSlots } : undefined,
      organization: values.organization ? { id: values.organization } : undefined,
      groups: values.groups ? { id: values.groups } : undefined,
      roles: values.roles ? { id: values.roles } : undefined,
      channelType: values.channelType ? { id: values.channelType } : undefined,
    };

    if (isNew) {
      createUserProfileMutation.mutate({ data: userProfileData });
    } else {
      updateUserProfileMutation.mutate({
        id: id!,
        data: { ...existingUserProfile?.data, ...userProfileData },
      });
    }
  };

  const isLoading = createUserProfileMutation.isPending || updateUserProfileMutation.isPending;
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
                <UserProfileStepBasic form={form} />
              )}

              {STEPS[currentStep].id === 'classification' && (
                <UserProfileStepClassification form={form} handleEntityCreated={handleEntityCreated} />
              )}

              {STEPS[currentStep].id === 'business' && (
                <UserProfileStepRelationships form={form} handleEntityCreated={handleEntityCreated} />
              )}

              {STEPS[currentStep].id === 'review' && (
                <UserProfileStepReview form={form} />
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
                {isLoading ? "Saving..." : `${isNew ? "Create" : "Update"} UserProfile`}
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

export default UserProfileForm;