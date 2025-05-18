import React, { useEffect, useState } from 'react';
import { UseFormReturn, useFormState } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { Check, AlertCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { SectionConfig } from '../../../types/entity-form';

interface TabProgressProps {
  sections: SectionConfig[];
  form: UseFormReturn<any>;
  currentTab: string;
  onTabChange: (tabId: string) => void;
}

export function EntityFormTabProgress({
  sections,
  form,
  currentTab,
  onTabChange
}: TabProgressProps) {
  const { errors, dirtyFields, isSubmitted } = useFormState({ control: form.control });
  const [tabStatus, setTabStatus] = useState<Record<string, { 
    complete: boolean, 
    hasErrors: boolean, 
    touched: boolean,
    requiredFields: number,
    completedFields: number 
  }>>({});
  
  // Analyze the form state to determine tab status
  useEffect(() => {
    const newTabStatus: Record<string, any> = {};
    
    sections.forEach((section, index) => {
      const tabId = `tab-${section.title || index}`;
      const sectionFields = section.fields;
      const requiredFields = sectionFields.filter(field => field.required).length;
      
      let completedFields = 0;
      let hasErrors = false;
      let touched = false;
      
      sectionFields.forEach(field => {
        // Check for errors
        if (errors[field.name]) {
          hasErrors = true;
        }
        
        // Check if fields are touched/dirty
        if (dirtyFields[field.name]) {
          touched = true;
        }
        
        // Count completed required fields
        if (field.required) {
          const value = form.getValues(field.name);
          if (value && (!Array.isArray(value) || value.length > 0)) {
            completedFields++;
          }
        }
      });
      
      const complete = completedFields === requiredFields && !hasErrors;
      
      newTabStatus[tabId] = {
        complete,
        hasErrors,
        touched,
        requiredFields,
        completedFields
      };
    });
    
    setTabStatus(newTabStatus);
  }, [sections, form, errors, dirtyFields, isSubmitted]);
  
  return (
    <div className="flex w-full border-b border-gray-200 dark:border-gray-800 mb-5 overflow-x-auto">
      {sections.map((section, index) => {
        const tabId = `tab-${section.title || index}`;
        const status = tabStatus[tabId] || { 
          complete: false, 
          hasErrors: false, 
          touched: false,
          requiredFields: 0,
          completedFields: 0 
        };
        
        return (
          <TooltipProvider key={tabId}>
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => onTabChange(tabId)}
                  className={cn(
                    "px-5 py-3 flex items-center gap-2 text-sm font-medium border-b-2 transition-colors relative",
                    currentTab === tabId 
                      ? "border-primary text-primary dark:text-primary-foreground" 
                      : "border-transparent text-muted-foreground hover:text-foreground",
                    status.hasErrors && "text-red-500 dark:text-red-400"
                  )}
                >
                  {section.title || `Section ${index + 1}`}
                  
                  {status.complete && (
                    <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200">
                      <Check className="h-3 w-3 mr-1" />
                      <span className="text-xs">Complete</span>
                    </Badge>
                  )}
                  
                  {status.hasErrors && (
                    <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-200">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      <span className="text-xs">Error</span>
                    </Badge>
                  )}
                  
                  {!status.complete && !status.hasErrors && status.requiredFields > 0 && (
                    <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-200">
                      <span className="text-xs">{status.completedFields}/{status.requiredFields}</span>
                    </Badge>
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs max-w-xs">
                {status.complete ? (
                  <p className="text-green-600">All required fields completed in this section</p>
                ) : status.hasErrors ? (
                  <p className="text-red-600">This section has fields with errors</p>
                ) : status.requiredFields > 0 ? (
                  <p>
                    {status.touched ? 
                      `Progress: ${status.completedFields}/${status.requiredFields} required fields completed` :
                      `This section has ${status.requiredFields} required fields`
                    }
                  </p>
                ) : (
                  <p>Optional section</p>
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      })}
    </div>
  );
}
