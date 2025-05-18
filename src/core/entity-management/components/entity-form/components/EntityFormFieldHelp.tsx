import React from 'react';
import { FieldConfig } from '../../../types/entity-form';
import { FieldError } from 'react-hook-form';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { HelpCircle, AlertCircle } from 'lucide-react';

interface EntityFormFieldHelpProps {
  field: FieldConfig;
  error?: FieldError;
}

export function EntityFormFieldHelp({
  field,
  error
}: EntityFormFieldHelpProps) {
  if (!field.description && !error) return null;
  
  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <div className="inline-flex ml-2 cursor-help">
            {error ? (
              <AlertCircle className="h-4 w-4 text-red-500" />
            ) : (
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" align="start" className="max-w-xs">
          {error ? (
            <div className="text-red-500 text-sm">
              {error.message || 'This field has an error'}
            </div>
          ) : (
            <div className="text-sm">
              {field.description}
            </div>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
