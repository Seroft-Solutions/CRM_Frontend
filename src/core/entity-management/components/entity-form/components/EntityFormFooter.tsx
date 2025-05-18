import React, { useState, useMemo } from 'react';
import { DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, X } from 'lucide-react';
import { FormMode } from '@/features/core/tanstack-query-api';
import { useFormContext } from 'react-hook-form';

export interface EntityFormFooterProps {
  formMode: FormMode;
  isSubmitting: boolean;
  onClose: () => void;
  onEdit?: () => void;
  onSubmit: () => void;
  onDelete?: (data: any) => void;
  data?: any;
  canEdit: boolean;
  canDelete: boolean;
  renderFooter?: (props: {
    formMode: FormMode;
    isSubmitting: boolean;
    onClose: () => void;
    onEdit?: () => void;
    onSubmit: () => void;
    canEdit: boolean;
    canDelete: boolean;
  }) => React.ReactNode;
  sections?: any[];
}

export function EntityFormFooter({
  formMode,
  isSubmitting,
  onClose,
  onEdit,
  onSubmit,
  onDelete,
  data,
  canEdit,
  canDelete,
  renderFooter,
  sections = []
}: EntityFormFooterProps) {
  const isReadOnly = formMode === 'view';
  const [localSubmitting, setLocalSubmitting] = useState(false);
  
  // Access form from context to check validation state
  // Add try/catch for safety in case FormProvider is missing
  let formState = {};
  try {
    const formContext = useFormContext();
    formState = formContext?.formState || {};
  } catch (error) {
    console.warn('useFormContext failed, fallback to empty state:', error);
  }
  const hasErrors = formState?.errors ? Object.keys(formState.errors).length > 0 : false;
  
  // Fetch the form context once for the entire component
  let formContext;
  try {
    formContext = useFormContext();
  } catch (error) {
    // Form context not available
  }
  
  // Count required fields and check if they're filled
  const { requiredFieldCount, filledRequiredFieldCount } = useMemo(() => {
    let totalRequired = 0;
    let totalFilled = 0;
    
    // Don't count in view mode
    if (formMode === 'view') {
      return { requiredFieldCount: 0, filledRequiredFieldCount: 0 };
    }
    
    // Flatten fields from all sections
    const fields = [];
    if (sections && sections.length > 0) {
      sections.forEach(section => {
        if (section.fields) {
          fields.push(...section.fields);
        }
      });
    }
    
    // Count all required fields and how many are filled
    fields.forEach(field => {
      if (field.required) {
        totalRequired++;
        if (formContext?.getValues) {
          const value = formContext.getValues(field.name);
          if (value !== undefined && value !== null && value !== '') {
            totalFilled++;
          }
        }
      }
    });
    
    return { 
      requiredFieldCount: totalRequired,
      filledRequiredFieldCount: totalFilled
    };
  }, [formMode, sections, formContext]);
  
  // Check if all required fields are filled
  const allRequiredFieldsFilled = formMode === 'view' ? true : (requiredFieldCount === 0 || filledRequiredFieldCount === requiredFieldCount);
  
  // Form is valid if we're in view mode or if the form is valid and has no errors
  const isFormValid = isReadOnly || (formState?.isValid && !hasErrors);
  
  // In create mode, require the form to be dirty (touched) as well
  const isFormValidAndReady = isReadOnly ? true : 
    (formMode === 'create' 
      ? isFormValid && (formState?.isDirty || true) && allRequiredFieldsFilled 
      : isFormValid && allRequiredFieldsFilled);
  
  // Handle closing dialog/sheet properly using useCallback for hook consistency
  const handleClose = React.useCallback(() => {
    console.log('FOOTER BUTTON - Close button clicked');
    onClose();
  }, [onClose]);
  
  // Handle form submission with useCallback
  const handleSubmit = React.useCallback(async () => {
    console.log('FOOTER BUTTON - Submit button clicked', { formMode });
    
    // Only proceed if not already submitting
    if (isSubmitting || localSubmitting) {
      console.log('FOOTER BUTTON - Already submitting, ignoring click');
      return;
    }
    
    // Set local submitting state
    setLocalSubmitting(true);
    
    try {
      // Call onSubmit and wait for it to complete
      await onSubmit();
      console.log('FOOTER BUTTON - onSubmit completed successfully');
    } catch (error) {
      console.error('FOOTER BUTTON - Error during form submission:', error);
    } finally {
      setLocalSubmitting(false);
    }
  }, [formMode, isSubmitting, localSubmitting, onSubmit]);
  
  // Handle delete with useCallback
  const handleDelete = React.useCallback(() => {
    if (onDelete && data) {
      onDelete(data);
    }
  }, [onDelete, data]);
  
  // Only render footer buttons based on the display mode
  const renderDefaultFooter = () => {
    // If using custom footer from props, use that
    if (renderFooter) {
      return renderFooter({
        formMode,
        isSubmitting,
        onClose: handleClose,
        onEdit,
        onSubmit: handleSubmit,
        canEdit,
        canDelete
      });
    }
    
    // For read-only mode
    if (isReadOnly) {
      return (
        <div className="w-full flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          {/* We only need a Close button here, X in header for Sheet/Dialog */}
          <Button 
            variant="outline" 
            onClick={handleClose} 
            className="border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-md"
            size="sm"
          >
            Close
          </Button>
          
          {/* Delete button is shown in view mode only if explicitly enabled through showDeleteInViewMode prop */}
          {canDelete && onDelete && data && (
            <Button 
              onClick={handleDelete}
              variant="destructive"
              className="font-medium rounded-md"
              size="sm"
            >
              Delete
            </Button>
          )}
          
          {canEdit && (
            <Button 
              onClick={onEdit} 
              className="bg-primary hover:bg-primary/90 transition-all font-medium rounded-md shadow-sm hover:shadow text-white"
              size="sm"
            >
              Edit
            </Button>
          )}
        </div>
      );
    }
    
    // For edit/create mode
    return (
      <div className="w-full flex flex-col-reverse sm:flex-row sm:justify-between gap-2">
        {/* Always add a hidden DialogClose component */}
        <DialogClose className="hidden" />
        
        {/* Cancel button on the left on larger screens */}
        <div className="sm:flex-1">
          <Button 
            variant="outline" 
            onClick={handleClose} 
            type="button" 
            className="w-full sm:w-auto border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300"
            size="sm"
          >
            Cancel
          </Button>
        </div>
        
        {/* Submit info and button on the right */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-2">
          {/* Save button status info */}
          {!isReadOnly && (
            <span className={`text-xs text-center sm:mr-2 ${hasErrors ? 'text-red-500' : requiredFieldCount > 0 ? (filledRequiredFieldCount === requiredFieldCount ? 'text-green-500' : 'text-amber-500') : ''}`}>
              {hasErrors 
                ? 'Please fix form errors' 
                : requiredFieldCount > 0 
                  ? `${filledRequiredFieldCount}/${requiredFieldCount} required fields${filledRequiredFieldCount < requiredFieldCount ? ' need to be filled' : ' completed'}` 
                  : ''}  
            </span>
          )}
          
          {/* Submit Button - full width on mobile */}
          <Button 
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting || localSubmitting || !isFormValidAndReady} 
            className="w-full sm:w-auto bg-primary hover:bg-primary/90 transition-all font-medium rounded-md shadow-sm hover:shadow text-white"
            title={!isFormValidAndReady && !isSubmitting && !localSubmitting ? 'Please fill all required fields correctly before saving' : ''}
            size="sm"
          >
            {isSubmitting || localSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {formMode === 'create' ? 'Creating...' : 'Saving...'}
              </>
            ) : (
              formMode === 'create' ? 'Create' : 'Save Changes'
            )}
          </Button>
        </div>
      </div>
    );
  };
  
  return (
    <DialogFooter className="border-t border-gray-200 dark:border-gray-800 px-4 sm:px-6 py-4 bg-white dark:bg-gray-950 mt-auto">
      {renderDefaultFooter()}
    </DialogFooter>
  );
}