// ===============================================================
// 🛑 AUTO-GENERATED FILE – DO NOT EDIT DIRECTLY 🛑
// - Source: code generation pipeline
// - To customize: use ./overrides/[filename].ts or feature-level
//   extensions (e.g., ./src/features/.../extensions/)
// - Direct edits will be overwritten on regeneration
// ===============================================================
"use client";

import React, { useState } from "react";
import { ArrowLeft, ArrowRight, Check, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEntityForm } from "./user-draft-form-provider";

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
  const isLastStep = state.currentStep === config.steps.length - 1;
  
  // Use the state from form provider which includes proper submission state
  const isFormSubmitting = state.isSubmitting || isSubmitting;

  const handleNext = async () => {
    const success = await actions.nextStep();
    if (success && config.behavior.autoSave.enabled) {
      actions.saveFormState();
    }
  };

  const handlePrevious = () => {
    actions.prevStep();
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

  const handleSubmit = async () => {
    // Use the form provider's submitForm method which includes transformation
    await actions.submitForm();
  };

  return (
    <div className="space-y-4">
      {/* Required fields indicator - hide on review step */}
      {!isLastStep && (
        <div className="text-xs text-muted-foreground text-center">
          <span className="text-red-500">*</span> means required fields - please fill these out
        </div>
      )}
      
      <div className="flex flex-col sm:flex-row gap-3 sm:justify-between">
      {/* Cancel/Previous Button */}
      <Button
        type="button"
        variant="outline"
        onClick={state.currentStep === 0 ? handleCancel : handlePrevious}
        className="flex items-center gap-2 justify-center"
        disabled={isFormSubmitting}
      >
        <ArrowLeft className="h-4 w-4" />
        {state.currentStep === 0 ? "Cancel" : "Previous"}
      </Button>

      {/* Next/Submit Button */}
      {isLastStep ? (
        <Button 
          type="button"
          onClick={handleSubmit}
          disabled={isFormSubmitting}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 justify-center"
        >
          <Save className="h-4 w-4" />
          {isFormSubmitting ? "Submitting..." : `${isNew ? "Create" : "Update"} User Draft`}
        </Button>
      ) : (
        <Button
          type="button"
          onClick={handleNext}
          className="flex items-center gap-2 justify-center"
          disabled={isFormSubmitting}
        >
          Next Step
          <ArrowRight className="h-4 w-4" />
        </Button>
      )}
    </div>
    </div>
  );
}
