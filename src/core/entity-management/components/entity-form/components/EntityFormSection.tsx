import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { SectionConfig, FieldLayout } from '../../../types/entity-form';
import { FormMode } from '@/features/core/tanstack-query-api';
import { renderField } from '../../form-fields';

export interface EntityFormSectionProps {
  section: SectionConfig;
  index: number;
  layout: FieldLayout;
  formMode: FormMode;
  data?: any;
  form: UseFormReturn<any>;
  isReadOnly: boolean;
}

export function EntityFormSection({
  section,
  index,
  layout,
  formMode,
  data,
  form,
  isReadOnly
}: EntityFormSectionProps) {
  // Determine section layout based on section config or parent layout
  const sectionLayout = section.layout || layout;
  
  // Enhanced responsive grid classes
  const gridClass = sectionLayout === '2-column' 
    ? 'grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4' 
    : sectionLayout === 'compact'
      ? 'grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3'
      : 'space-y-4';
  
  // Handle expandable sections
  if (section.expandable) {
    return (
      <Accordion 
        type="single" 
        defaultValue={section.defaultExpanded ? `section-${index}` : undefined}
        collapsible
        className="mb-4"
      >
        <AccordionItem value={`section-${index}`} className="border border-gray-200 dark:border-gray-800 rounded-md px-2 mb-4">
          <AccordionTrigger className="py-3 font-medium text-gray-800 dark:text-gray-200 hover:text-primary">
            {section.title || `Section ${index + 1}`}
          </AccordionTrigger>
          <AccordionContent>
            {section.description && (
              <p className="text-sm text-muted-foreground mb-4">
                {section.description}
              </p>
            )}
            <div className={gridClass}>
              {section.fields.map((field, fieldIndex) => renderField({
                field,
                form,
                formMode,
                data,
                isReadOnly,
                key: `${index}-${fieldIndex}`
              }))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    );
  }
  
  // Regular non-expandable section with enhanced mobile styling
  return (
    <div className="mb-4 sm:mb-8 bg-white dark:bg-gray-900 p-3 sm:p-5 rounded-lg border border-gray-200 dark:border-gray-800">
      {section.title && (
        <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3 text-gray-800 dark:text-gray-200 border-l-4 border-primary pl-2 sm:pl-3">
          {section.title}
        </h3>
      )}
      {section.description && (
        <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
          {section.description}
        </p>
      )}
      <div className={gridClass}>
        {section.fields.map((field, fieldIndex) => renderField({
          field,
          form,
          formMode,
          data,
          isReadOnly,
          key: `${index}-${fieldIndex}`
        }))}
      </div>
    </div>
  );
}
