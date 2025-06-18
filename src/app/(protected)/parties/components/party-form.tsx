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
  useCreateParty,
  useUpdateParty,
  useGetParty,
} from "@/core/api/generated/spring/endpoints/party-resource/party-resource.gen";

import { partyToast, handlePartyError } from "./party-toast";
import type { PartyDTO } from "@/core/api/generated/spring/schemas/PartyDTO";


// Import step components
import { PartyStepBasic } from "./steps/party-step-basic";
import { PartyStepGeographic } from "./steps/party-step-geographic";
import { PartyStepReview } from "./steps/party-step-review";

// Props interface
interface PartyFormProps {
  id?: string;
}

// Form schema
const partySchema = z.object({
  name: z.string().optional(),
  mobile: z.string().optional(),
  email: z.string().optional(),
  whatsApp: z.string().optional(),
  contactPerson: z.string().optional(),
  address1: z.string().optional(),
  address2: z.string().optional(),
  address3: z.string().optional(),
  remark: z.string().optional(),
  calls: z.number().optional(),
  state: z.number().optional(),
  district: z.number().optional(),
  city: z.number().optional(),
  area: z.number().optional(),
});

// Step definitions
const STEPS = [{"id":"basic","title":"Basic Information","description":"Enter essential details"},{"id":"geographic","title":"Location Details","description":"Select geographic information"},{"id":"review","title":"Review","description":"Confirm your details"}];

export function PartyForm({ id }: PartyFormProps) {
  const router = useRouter();
  const isNew = !id;
  const [currentStep, setCurrentStep] = useState(0);
  const [confirmSubmission, setConfirmSubmission] = useState(false);

  // Form setup
  const form = useForm<z.infer<typeof partySchema>>({
    resolver: zodResolver(partySchema),
    defaultValues: {
      name: "",
      mobile: "",
      email: "",
      whatsApp: "",
      contactPerson: "",
      address1: "",
      address2: "",
      address3: "",
      remark: "",
      calls: undefined,
      state: undefined,
      district: undefined,
      city: undefined,
      area: undefined,
    },
  });

  // API hooks
  const { data: existingParty } = useGetParty(
    { id: id || "" },
    { query: { enabled: !isNew && !!id } }
  );

  const createPartyMutation = useCreateParty({
    mutation: {
      onSuccess: (data) => {
        partyToast.created(data.data);
        router.push("/partys");
      },
      onError: handlePartyError,
    },
  });

  const updatePartyMutation = useUpdateParty({
    mutation: {
      onSuccess: (data) => {
        partyToast.updated(data.data);
        router.push("/partys");
      },
      onError: handlePartyError,
    },
  });

  // Load existing data
  if (existingParty && !form.formState.isDirty) {
    const data = existingParty.data;
    if (data) {
      const formData: any = {};
      if (data.name !== undefined) {
        formData.name = data.name;
      }
      if (data.mobile !== undefined) {
        formData.mobile = data.mobile;
      }
      if (data.email !== undefined) {
        formData.email = data.email;
      }
      if (data.whatsApp !== undefined) {
        formData.whatsApp = data.whatsApp;
      }
      if (data.contactPerson !== undefined) {
        formData.contactPerson = data.contactPerson;
      }
      if (data.address1 !== undefined) {
        formData.address1 = data.address1;
      }
      if (data.address2 !== undefined) {
        formData.address2 = data.address2;
      }
      if (data.address3 !== undefined) {
        formData.address3 = data.address3;
      }
      if (data.remark !== undefined) {
        formData.remark = data.remark;
      }
      if (data.calls) {
        formData.calls = data.calls.id;
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
  const onSubmit = (values: z.infer<typeof partySchema>) => {
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
    const partyData: PartyDTO = {
      name: values.name,
      mobile: values.mobile,
      email: values.email,
      whatsApp: values.whatsApp,
      contactPerson: values.contactPerson,
      address1: values.address1,
      address2: values.address2,
      address3: values.address3,
      remark: values.remark,
      calls: values.calls ? { id: values.calls } : undefined,
      state: values.state ? { id: values.state } : undefined,
      district: values.district ? { id: values.district } : undefined,
      city: values.city ? { id: values.city } : undefined,
      area: values.area ? { id: values.area } : undefined,
    };

    if (isNew) {
      createPartyMutation.mutate({ data: partyData });
    } else {
      updatePartyMutation.mutate({
        id: id!,
        data: { ...existingParty?.data, ...partyData },
      });
    }
  };

  const isLoading = createPartyMutation.isPending || updatePartyMutation.isPending;
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
                <PartyStepBasic form={form} />
              )}

              {STEPS[currentStep].id === 'geographic' && (
                <PartyStepGeographic form={form} handleEntityCreated={handleEntityCreated} />
              )}

              {STEPS[currentStep].id === 'review' && (
                <PartyStepReview form={form} />
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
                {isLoading ? "Saving..." : `${isNew ? "Create" : "Update"} Party`}
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

export default PartyForm;