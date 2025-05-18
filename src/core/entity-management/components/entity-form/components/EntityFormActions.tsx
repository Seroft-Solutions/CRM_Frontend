import React, { useMemo } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormMode } from '@/features/core/tanstack-query-api';
import { Button } from '@/components/ui/button';
import { SectionConfig } from '../../../types/entity-form';
import { AlertCircle, Save, X } from 'lucide-react';

interface EntityFormActionsProps {
  formMode: FormMode;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: () => void;
  form: UseFormReturn<any>;
  sections: SectionConfig[];
}

export function EntityFormActions({
  formMode,
  isSubmitting,
  onCancel,
  onSubmit,
  form,
  sections
}: EntityFormActionsProps) {
  // Count form errors
  const errorCount = useMemo(() => {
    if (formMode === 'view') return 0;
    return Object.keys(form.formState.errors).length;
  }, [form.formState.errors, formMode]);
  
  // Count required fields
  const { requiredFieldCount, filledRequiredFieldCount } = useMemo(() => {
    let totalRequired = 0;
    let totalFilled = 0;
    
    // Don't count in view mode
    if (formMode === 'view') {
      return { requiredFieldCount: 0, filledRequiredFieldCount: 0 };
    }
    
    // Count all required fields and how many are filled
    sections.forEach(section => {
      section.fields.forEach(field => {
        if (field.required) {
          totalRequired++;
          const value = form.getValues(field.name);
          if (value) {
            totalFilled++;
          }
        }
      });
    });
    
    return { 
      requiredFieldCount: totalRequired,
      filledRequiredFieldCount: totalFilled
    };
  }, [sections, form, formMode]);
  
  // Determine if the form is valid
  const { formState } = form;
  const isFormValid = formMode === 'view' || (formState.isValid && errorCount === 0);
  
  // Check if all required fields are filled
  const allRequiredFieldsFilled = formMode === 'view' ? true : (requiredFieldCount === 0 || filledRequiredFieldCount === requiredFieldCount);
  
  // In create mode, we should only check if the form is valid and all required fields are filled
  // Temporarily removing the isDirty check that's causing issues
  const isFormValidAndReady = formMode === 'view' ? true : 
    (isFormValid && allRequiredFieldsFilled);
  
  // Log form state information for debugging
  console.log('Form state:', {
    formMode,
    isFormValid,
    isDirty: formState.isDirty,
    allRequiredFieldsFilled,
    requiredFieldCount,
    filledRequiredFieldCount,
    isFormValidAndReady,
  });
  
  // Handle closing - wrapped in useCallback to maintain consistent hooks
  const handleCancel = React.useCallback(() => {
    console.log('ACTIONS BUTTON - Cancel button clicked');
    
    // Call the onCancel callback immediately
    onCancel();
    
    // Avoid additional processing that might cause hook inconsistencies
  }, [onCancel]);

  // Handle submission - wrapped in useCallback for consistent hooks
  const handleSubmit = React.useCallback(async () => {
    console.log('ACTIONS BUTTON - Submit button clicked');
    
    // Only proceed if not already submitting
    if (isSubmitting) {
      console.log('ACTIONS BUTTON - Already submitting, ignoring click');
      return;
    }
    
    try {
      // Call onSubmit and wait for it to complete
      await onSubmit();
      console.log('ACTIONS BUTTON - onSubmit completed successfully');
    } catch (error) {
      console.error('ACTIONS BUTTON - Error during form submission:', error);
    }
  }, [isSubmitting, onSubmit]);
  
  return (
    <div className="border-t border-gray-200 dark:border-gray-800 p-4 flex justify-between items-center">
      {/* Restore Cancel button */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleCancel}
      >
        <X size={16} className="mr-1" />
        Cancel
      </Button>
      
      {formMode !== 'view' && (
        <div className="flex items-center gap-3">
          {/* Field completion status */}
          {requiredFieldCount > 0 && (
            <span className={`text-xs ${isFormValidAndReady 
              ? 'text-green-500' 
              : errorCount > 0 ? 'text-red-500' : 'text-amber-500'}`}>
              {filledRequiredFieldCount}/{requiredFieldCount} required fields
              {errorCount > 0 && ' have errors'}
            </span>
          )}
          
          {/* Save button */}
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !isFormValidAndReady}
            size="sm"
            className="relative"
            title={!isFormValidAndReady && !isSubmitting ? 'Please fill all required fields correctly before saving' : ''}
          >
            {isSubmitting ? (
              <>
                <span className="mr-1 h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent"></span>
                Saving...
              </>
            ) : (
              <>
                <Save size={16} className="mr-1" />
                Save
              </>
            )}
            
            {/* Error Count Badge */}
            {errorCount > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center bg-red-500 text-white text-xs rounded-full">
                {errorCount}
              </span>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}