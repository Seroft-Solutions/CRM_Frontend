import React from 'react';
import { SectionConfig } from '../../../types/entity-form';
import { UseFormReturn } from 'react-hook-form';
import { Check, X } from 'lucide-react';

interface EntityFormSectionSummaryProps {
  sections: SectionConfig[];
  form: UseFormReturn<any>;
}

export function EntityFormSectionSummary({
  sections,
  form
}: EntityFormSectionSummaryProps) {
  // Extract form errors
  const { errors } = form.formState;
  
  return (
    <div className="bg-muted/30 rounded-lg border border-muted p-4 mb-6">
      <h3 className="font-medium text-base mb-3">Form Summary</h3>
      <div className="space-y-2">
        {sections.map((section, index) => {
          // Calculate completion status for this section
          const sectionFields = section.fields;
          const requiredFields = sectionFields.filter(field => field.required);
          
          let completedFields = 0;
          let hasErrors = false;
          
          sectionFields.forEach(field => {
            // Check for errors
            if (errors[field.name]) {
              hasErrors = true;
            }
            
            // Count completed required fields
            if (field.required) {
              const value = form.getValues(field.name);
              if (value && (!Array.isArray(value) || value.length > 0)) {
                completedFields++;
              }
            }
          });
          
          const isComplete = completedFields === requiredFields.length && !hasErrors;
          
          return (
            <div key={index} className="flex items-start">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center mr-3 flex-shrink-0 ${
                isComplete 
                  ? 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400' 
                  : hasErrors
                    ? 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                    : 'bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400'
              }`}>
                {isComplete ? (
                  <Check className="h-3 w-3" />
                ) : hasErrors ? (
                  <X className="h-3 w-3" />
                ) : (
                  <span className="text-xs">{completedFields}/{requiredFields.length}</span>
                )}
              </div>
              <div>
                <h4 className="text-sm font-medium">
                  {section.title || `Section ${index + 1}`}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {isComplete 
                    ? 'All required fields completed' 
                    : hasErrors
                      ? 'This section has errors that need to be fixed'
                      : `${completedFields} of ${requiredFields.length} required fields completed`
                  }
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
