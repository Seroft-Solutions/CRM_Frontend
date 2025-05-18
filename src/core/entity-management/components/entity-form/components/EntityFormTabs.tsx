import React, { useState, useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import {
  Tabs,
  TabsContent
} from '@/components/ui/tabs';
import { SectionConfig, FieldLayout } from '../../../types/entity-form';
import { FormMode } from '@/features/core/tanstack-query-api';
import { renderField } from '../../form-fields';
import { EntityFormReadOnly } from './EntityFormReadOnly';
import { EntityFormTabProgress } from './EntityFormTabProgress';
import { EntityFormSticky } from './EntityFormSticky';
import { EntityFormFieldHelp } from './EntityFormFieldHelp';

export interface EntityFormTabsProps {
  sections: SectionConfig[];
  layout: FieldLayout;
  formMode: FormMode;
  data?: any;
  form: UseFormReturn<any>;
  isReadOnly: boolean;
  submitError?: string;
  onSubmit: () => void;
  onClose: () => void;
  onEdit?: () => void;
  isSubmitting?: boolean;
}

export function EntityFormTabs({
  sections,
  layout,
  formMode,
  data,
  form,
  isReadOnly,
  submitError,
  onSubmit,
  onClose,
  onEdit,
  isSubmitting = false
}: EntityFormTabsProps) {
  // Use the first tab as the default value
  const defaultTab = `tab-${sections[0]?.title || '0'}`;
  const [currentTab, setCurrentTab] = useState(defaultTab);
  
  // Update the form field rendering to include help text and validation
  const renderFieldWithHelp = (field: any, fieldProps: any) => {
    const error = form.formState.errors[field.name];
    return (
      <div key={fieldProps.key} className="relative">
        {renderField(fieldProps)}
        <div className="absolute top-0 right-0">
          <EntityFormFieldHelp field={field} error={error} />
        </div>
      </div>
    );
  };
  
  // Check if all required fields are filled and form is valid
  const isFormValid = () => {
    const { errors } = form.formState;
    return Object.keys(errors).length === 0;
  };
  
  // If we're in read-only mode, use the read-only component
  if (isReadOnly) {
    return <EntityFormReadOnly sections={sections} data={data} layout={layout} />;
  }
  
  return (
    <div className="flex flex-col h-full">
      <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full flex-1 flex flex-col">
        {/* Tab Navigation with Progress Indicators */}
        <EntityFormTabProgress 
          sections={sections} 
          form={form} 
          currentTab={currentTab}
          onTabChange={setCurrentTab}
        />

        {/* Tab Content */}
        <div className="flex-1 overflow-auto">
          {sections.map((section, index) => {
            const tabId = `tab-${section.title || index}`;
            const sectionLayout = section.layout || layout;
            const gridClass = sectionLayout === '2-column' 
              ? 'grid grid-cols-1 md:grid-cols-2 gap-6' 
              : 'space-y-6';
              
            return (
              <TabsContent 
                key={`tab-content-${index}`} 
                value={tabId}
                className="bg-white dark:bg-gray-900 p-5 rounded-lg border border-gray-200 dark:border-gray-800 mt-0 mb-4 data-[state=inactive]:hidden min-h-[400px]"
              >
                {section.description && (
                  <p className="text-sm text-muted-foreground mb-5">
                    {section.description}
                  </p>
                )}
                
                <div className={gridClass}>
                  {section.fields.map((field, fieldIndex) => renderFieldWithHelp(field, {
                    field,
                    form,
                    formMode,
                    data,
                    isReadOnly,
                    key: `${index}-${fieldIndex}`
                  }))}
                </div>
              </TabsContent>
            );
          })}
          
          {submitError && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 p-4 rounded-md text-sm border border-red-200 dark:border-red-900 mt-4 mb-4">
              {submitError}
            </div>
          )}
        </div>
        
        {/* Sticky Footer with Form Summary and Actions */}
        <EntityFormSticky
          formMode={formMode}
          isSubmitting={isSubmitting}
          onClose={onClose}
          onSubmit={onSubmit}
          onEdit={onEdit}
          sections={sections}
          form={form}
          showSummary={!isFormValid()}
        />
      </Tabs>
    </div>
  );
}
