"use client";

import React from 'react';
import { UseFormReturn, FormProvider } from 'react-hook-form';
import { EntityFormSection } from './EntityFormSection';
import { EntityFormReadOnly } from './EntityFormReadOnly';
import { EntityFormTabsContainer } from './EntityFormTabsContainer';
import { EntityFormActions } from './EntityFormActions';
import { getVisibleSections } from './FormUtils';
import { SectionConfig, FieldConfig, FieldLayout, DisplayMode } from '../../../types/entity-form';
import { FormMode } from '@/features/core/tanstack-query-api';

export interface EntityFormContentProps {
  formMode: FormMode;
  displayMode?: DisplayMode;
  sections?: SectionConfig[];
  fields?: FieldConfig[];
  layout?: FieldLayout;
  data?: any;
  form: UseFormReturn<any>;
  submitError?: string;
  onSubmit: () => void;
}

export function EntityFormContent({
  formMode,
  displayMode = 'dialog',
  sections = [],
  fields = [],
  layout = 'default',
  data,
  form,
  submitError,
  onSubmit
}: EntityFormContentProps) {
  // Determine if we're in read-only mode
  const isReadOnly = formMode === 'view';
  
  // Use React.useMemo to ensure hooks are called consistently
  const sectionsToRender = React.useMemo(() => 
    getVisibleSections(sections, fields, formMode, data, layout),
    [sections, fields, formMode, data, layout]
  );
  
  // Handle direct submit using React.useCallback to maintain consistent hooks
  const handleSubmit = React.useCallback(() => {
    form.handleSubmit(onSubmit)();
  }, [form, onSubmit]);
  
  // Pre-compute component conditions to avoid hook order issues
  const showTabsContainer = React.useMemo(() => sectionsToRender.length > 1, [sectionsToRender.length]);
  
  // Render with conditional display, not conditional hook calls
  return (
    <FormProvider {...form}>
      <React.Fragment>
        {showTabsContainer ? (
          // Multi-section form with tabs
          <form id="entityForm" onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="flex flex-col h-full">
            <EntityFormTabsContainer
              sections={sectionsToRender}
              layout={layout}
              formMode={formMode}
              data={data}
              form={form}
              isReadOnly={isReadOnly}
              submitError={submitError}
            />
          </form>
        ) : (
          // Single section form - can be either readOnly or editable
          // Use the same container structure but render different content inside
          <div className="form-container">
            {isReadOnly ? (
              // Read-only view for single section
              <EntityFormReadOnly sections={sectionsToRender} data={data} layout={layout} />
            ) : (
              // Editable view for single section
              <form id="entityForm" onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-4">
                {sectionsToRender.map((section, index) => (
                  <EntityFormSection
                    key={index}
                    section={section}
                    index={index}
                    layout={layout}
                    formMode={formMode}
                    data={data}
                    form={form}
                    isReadOnly={isReadOnly}
                  />
                ))}
                
                {submitError && (
                  <div className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 p-4 rounded-md text-sm border border-red-200 dark:border-red-900">
                    {submitError}
                  </div>
                )}
              </form>
            )}
          </div>
        )}
      </React.Fragment>
    </FormProvider>
  );
}
