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
  useCreateArea,
  useUpdateArea,
  useGetArea,
} from "@/core/api/generated/spring/endpoints/area-resource/area-resource.gen";

import { areaToast, handleAreaError } from "./area-toast";
import type { AreaDTO } from "@/core/api/generated/spring/schemas/AreaDTO";


// Import step components
import { AreaStepBasic } from "./steps/area-step-basic";
import { AreaStepGeographic } from "./steps/area-step-geographic";
import { AreaStepReview } from "./steps/area-step-review";

// Props interface
interface AreaFormProps {
  id?: string;
}

// Form schema
const areaSchema = z.object({
  name: z.string().optional(),
  pincode: z.string().optional(),
  city: z.number().optional(),
});

// Step definitions
const STEPS = [{"id":"basic","title":"Basic Information","description":"Enter essential details"},{"id":"geographic","title":"Location Details","description":"Select geographic information"},{"id":"review","title":"Review","description":"Confirm your details"}];

export function AreaForm({ id }: AreaFormProps) {
  const router = useRouter();
  const isNew = !id;
  const [currentStep, setCurrentStep] = useState(0);
  const [confirmSubmission, setConfirmSubmission] = useState(false);

  // Form setup
  const form = useForm<z.infer<typeof areaSchema>>({
    resolver: zodResolver(areaSchema),
    defaultValues: {
      name: "",
      pincode: "",
      city: undefined,
    },
  });

  // API hooks
  const { data: existingArea } = useGetArea(
    { id: id || "" },
    { query: { enabled: !isNew && !!id } }
  );

  const createAreaMutation = useCreateArea({
    mutation: {
      onSuccess: (data) => {
        areaToast.created(data.data);
        router.push("/areas");
      },
      onError: handleAreaError,
    },
  });

  const updateAreaMutation = useUpdateArea({
    mutation: {
      onSuccess: (data) => {
        areaToast.updated(data.data);
        router.push("/areas");
      },
      onError: handleAreaError,
    },
  });

  // Load existing data
  if (existingArea && !form.formState.isDirty) {
    const data = existingArea.data;
    if (data) {
      const formData: any = {};
      if (data.name !== undefined) {
        formData.name = data.name;
      }
      if (data.pincode !== undefined) {
        formData.pincode = data.pincode;
      }
      if (data.city) {
        formData.city = data.city.id;
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
  const onSubmit = (values: z.infer<typeof areaSchema>) => {
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
    const areaData: AreaDTO = {
      name: values.name,
      pincode: values.pincode,
      city: values.city ? { id: values.city } : undefined,
    };

    if (isNew) {
      createAreaMutation.mutate({ data: areaData });
    } else {
      updateAreaMutation.mutate({
        id: id!,
        data: { ...existingArea?.data, ...areaData },
      });
    }
  };

  const isLoading = createAreaMutation.isPending || updateAreaMutation.isPending;
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
                <AreaStepBasic form={form} />
              )}

              {STEPS[currentStep].id === 'geographic' && (
                <AreaStepGeographic form={form} handleEntityCreated={handleEntityCreated} />
              )}

              {STEPS[currentStep].id === 'review' && (
                <AreaStepReview form={form} />
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
                {isLoading ? "Saving..." : `${isNew ? "Create" : "Update"} Area`}
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

export default AreaForm;