import React from 'react';
import { Button } from '@/components/ui/button';
import { FormMode } from '@/features/core/tanstack-query-api';
import { SectionConfig } from '../../../types/entity-form';
import { UseFormReturn } from 'react-hook-form';
import { EntityFormSectionSummary } from './EntityFormSectionSummary';

interface EntityFormStickyProps {
  formMode: FormMode;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: () => void;
  onEdit?: () => void;
  sections: SectionConfig[];
  form: UseFormReturn<any>;
  showSummary?: boolean;
}

export function EntityFormSticky({
  formMode,
  isSubmitting,
  onClose,
  onSubmit,
  onEdit,
  sections,
  form,
  showSummary = true
}: EntityFormStickyProps) {
  // Get the error count to show on the submit button
  const { errors } = form.formState;
  const errorCount = Object.keys(errors).length;
  
  return (
    <div className="sticky bottom-0 left-0 right-0 pt-2 pb-4 px-4 bg-background border-t border-gray-200 dark:border-gray-800 shadow-md z-10">
      <div className="flex flex-col gap-4">
        {showSummary && formMode !== 'view' && (
          <div className="w-full">
            <EntityFormSectionSummary 
              sections={sections} 
              form={form} 
            />
          </div>
        )}
        
        <div className="flex justify-between items-center">
          <Button 
            type="button" 
            variant="ghost" 
            onClick={onClose}
          >
            Cancel
          </Button>
          
          <div className="flex gap-2">
            {formMode === 'view' && onEdit && (
              <Button 
                type="button" 
                onClick={onEdit}
              >
                Edit
              </Button>
            )}
            
            {formMode !== 'view' && (
              <Button 
                type="button" 
                onClick={onSubmit}
                disabled={isSubmitting}
                className="relative"
              >
                {isSubmitting ? 'Saving...' : 'Save'}
                
                {errorCount > 0 && (
                  <span className="absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center bg-red-500 text-white text-xs rounded-full">
                    {errorCount}
                  </span>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
