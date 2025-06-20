"use client";

import React, { useState } from "react";
import { ArrowLeft, ArrowRight, Check, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEntityForm } from "./meeting-form-provider";

interface FormNavigationProps {
  onCancel: () => void;
  onSubmit: (data: any) => Promise<void>;
  isSubmitting: boolean;
  isNew: boolean;
}

export function FormNavigation({ 
  onCancel, 
  onSubmit, 
  isSubmitting, 
  isNew 
}: FormNavigationProps) {
  const { config, state, actions, form } = useEntityForm();
  const [confirmSubmission, setConfirmSubmission] = useState(false);
  const isLastStep = state.currentStep === config.steps.length - 1;

  const handleNext = async () => {
    const success = await actions.nextStep();
    if (success && config.behavior.autoSave.enabled) {
      actions.saveFormState();
    }
  };

  const handlePrevious = () => {
    actions.prevStep();
    if (isLastStep) {
      setConfirmSubmission(false);
    }
  };

  const handleCancel = () => {
    if (config.behavior.navigation.confirmOnCancel && state.isDirty) {
      if (window.confirm('Are you sure you want to cancel? All unsaved changes will be lost.')) {
        onCancel();
      }
    } else {
      onCancel();
    }
  };

  const handleConfirmSubmit = () => {
    setConfirmSubmission(true);
  };

  const handleFinalSubmit = async () => {
    // Use the form provider's submitForm method which includes transformation
    await actions.submitForm();
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3 sm:justify-between">
      {/* Cancel/Previous Button */}
      <Button
        type="button"
        variant="outline"
        onClick={state.currentStep === 0 ? handleCancel : handlePrevious}
        className="flex items-center gap-2 justify-center"
        disabled={isSubmitting}
      >
        <ArrowLeft className="h-4 w-4" />
        {state.currentStep === 0 ? "Cancel" : "Previous"}
      </Button>

      {/* Next/Submit Button */}
      {isLastStep ? (
        !confirmSubmission ? (
          <Button 
            type="button"
            onClick={handleConfirmSubmit}
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 justify-center"
            disabled={isSubmitting}
          >
            <Check className="h-4 w-4" />
            Confirm {isNew ? "Create" : "Update"}
          </Button>
        ) : (
          <Button 
            type="button"
            onClick={handleFinalSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 justify-center"
          >
            <Save className="h-4 w-4" />
            {isSubmitting ? "Submitting..." : `${isNew ? "Create" : "Update"} Meeting`}
          </Button>
        )
      ) : (
        <Button
          type="button"
          onClick={handleNext}
          className="flex items-center gap-2 justify-center"
          disabled={isSubmitting}
        >
          Next Step
          <ArrowRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
