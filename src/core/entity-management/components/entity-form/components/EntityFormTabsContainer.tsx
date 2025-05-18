"use client";

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { SectionConfig, FieldLayout } from '../../../types/entity-form';
import { FormMode } from '@/features/core/tanstack-query-api';
import { EntityFormReadOnly } from './EntityFormReadOnly';
import { EntityFormTabsNavigation } from './EntityFormTabsNavigation';
import { renderField } from '../../form-fields';
import { 
  HelpCircle, 
  BadgeInfo 
} from 'lucide-react';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { 
  Progress 
} from '@/components/ui/progress';
import { FormDebug } from './FormDebug';
import { hasValidValue, isolateFormValues, isRequiredFieldFilled, getFieldValue } from '../../../utils/fieldValidation';

interface EntityFormTabsContainerProps {
  sections: SectionConfig[];
  layout: FieldLayout;
  formMode: FormMode;
  data?: any;
  form: UseFormReturn<any>;
  isReadOnly: boolean;
  submitError?: string;
}

export function EntityFormTabsContainer({
  sections,
  layout,
  formMode,
  data,
  form,
  isReadOnly,
  submitError
}: EntityFormTabsContainerProps) {
  // Store stable refs to props to prevent unwanted re-renders
  const sectionsRef = useRef(sections);
  const formRef = useRef(form);
  const isReadOnlyRef = useRef(isReadOnly);
  
  // Update refs when props change
  useEffect(() => {
    sectionsRef.current = sections;
    formRef.current = form;
    isReadOnlyRef.current = isReadOnly;
  }, [sections, form, isReadOnly]);
  
  // Default to first tab - always initialized even if in read-only mode
  const defaultTab = useMemo(() => `tab-${sections[0]?.title || '0'}`, [sections]);
  const [activeTab, setActiveTab] = useState(defaultTab);
  
  // Handle tab switching with proper field isolation - defined always
  const handleTabChange = React.useCallback((newTabId) => {
    if (isReadOnlyRef.current) return; // No-op in read-only mode, but function still exists
    
    // Preserve current values
    console.log(`[TabsContainer] Switching from tab ${activeTab} to ${newTabId}`);
    
    // Explicitly blur any active input to prevent value crossover
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    
    // Update state with a slight delay to ensure UI updates properly
    setTimeout(() => {
      setActiveTab(newTabId);
    }, 0);
  }, [activeTab]); // Only depends on activeTab
  
  // Helper to check if a field has a valid value - defined unconditionally
  const hasFieldValue = React.useCallback((value) => {
    if (value === undefined || value === null) return false;
    if (typeof value === 'string' && value.trim() === '') return false;
    if (typeof value === 'number' && isNaN(value)) return false;
    // Check for numbers (0 is a valid value)
    if (typeof value === 'number') return true;
    if (Array.isArray(value) && value.length === 0) return false;
    return true;
  }, []);
  
  // Watch all required fields for changes
  const requiredFieldNames = useMemo(() => {
    const names = [];
    sectionsRef.current.forEach(section => {
      section.fields.forEach(field => {
        if (field.required) {
          names.push(field.name);
        }
      });
    });
    return names;
  }, []);  // Empty dependency array - we use the ref for latest values
  
  // Watch form changes - always initialize this state
  const [formValues, setFormValues] = useState({});
  
  // Subscribe to form changes with consistent hooks usage
  useEffect(() => {
    // Create a safe wrapper to prevent state updates on unmounted components
    let isMounted = true;
    const safeSetFormValues = (values) => {
      if (!isMounted) return;
      
      try {
        // Always ensure we're dealing with a clean object to prevent reference issues
        setFormValues(isolateFormValues(values || {}));
      } catch (e) {
        console.error('[TabsContainer] Error setting form values:', e);
        // Set empty object as fallback to maintain hook consistency
        setFormValues({});
      }
    };
    
    // Skip intensive work in read-only mode but maintain hook
    if (isReadOnlyRef.current) {
      safeSetFormValues({});
      return () => { isMounted = false; };
    }
    
    // Get initial values - always with defensive fallback
    let initialValues = {};
    try {
      initialValues = formRef.current.getValues() || {};
      console.log('[TabsContainer] Initial form values:', initialValues);
    } catch (e) {
      console.error('[TabsContainer] Error getting initial values:', e);
    }
    safeSetFormValues(initialValues);
    
    // Subscribe to form changes with error handling
    let subscription;
    try {
      subscription = formRef.current.watch((value, { name, type } = { name: 'unknown', type: 'unknown' }) => {
        if (!isMounted) return;
        
        console.log(`[TabsContainer] Field '${name || 'unknown'}' changed to:`, value);
        // Always get fresh values directly to avoid stale state
        try {
          const latest = formRef.current.getValues() || {};
          safeSetFormValues(latest);
        } catch (e) {
          console.error('[TabsContainer] Error watching form:', e);
          safeSetFormValues({});
        }
      });
    } catch (e) {
      console.error('[TabsContainer] Error setting up form watch:', e);
    }
    
    // Proper cleanup with defensive approach
    return () => {
      isMounted = false;
      if (subscription && typeof subscription.unsubscribe === 'function') {
        try {
          subscription.unsubscribe();
        } catch (e) {
          console.error('[TabsContainer] Error unsubscribing from form:', e);
        }
      }
    };
  }, []);  // Empty dependency array - rely on refs for latest values
  
  // Calculate form completion progress - called unconditionally
  const { completion, requiredFieldCount, filledRequiredFieldCount, fieldStatus } = useMemo(() => {
    // Return default values for read-only to save unnecessary calculation while maintaining hook call order
    if (isReadOnlyRef.current) return { 
      completion: 100, 
      requiredFieldCount: 0, 
      filledRequiredFieldCount: 0,
      fieldStatus: {}
    };
    
    let totalRequired = 0;
    let totalFilled = 0;
    const fieldStatus = {};
    
    // Count all required fields and how many are filled
    sectionsRef.current.forEach(section => {
      section.fields.forEach(field => {
        if (field.required) {
          totalRequired++;
          // Get specific field value by exact name
          const value = getFieldValue(formValues, field.name);
          const isFilled = hasValidValue(value, field.name);
          
          // Track field status for debugging
          fieldStatus[field.name] = {
            name: field.name,
            section: section.title,
            value,
            isFilled,
            hasError: !!formRef.current.formState.errors[field.name]
          };
          
          if (isFilled) {
            totalFilled++;
          }
        }
      });
    });
    
    // Log field status for debugging
    console.debug('[TabsContainer] Field status:', fieldStatus);
    console.debug(`[TabsContainer] Required fields filled: ${totalFilled}/${totalRequired}`);
    
    const percent = totalRequired > 0 
      ? Math.round((totalFilled / totalRequired) * 100)
      : 100;
    
    return { 
      completion: percent,
      requiredFieldCount: totalRequired,
      filledRequiredFieldCount: totalFilled,
      fieldStatus
    };
  }, [formValues, hasFieldValue]);  // Only depend on formValues and hasFieldValue
  
  // Update progress display - called unconditionally
  useEffect(() => {
    // Skip logging in read-only mode but keep the effect
    if (isReadOnlyRef.current) return;
    
    // Log when current field status changes
    console.log(`[TabsContainer] Current form values:`, formValues);
    console.log(`[TabsContainer] Current completion: ${filledRequiredFieldCount}/${requiredFieldCount}`);
  }, [formValues, filledRequiredFieldCount, requiredFieldCount]);
  
  // Find the active section - calculated regardless of mode
  const activeSection = useMemo(() => {
    return sectionsRef.current.find((section, index) => 
      `tab-${section.title || index}` === activeTab
    ) || sectionsRef.current[0];
  }, [activeTab]);
  return (
    <div className="flex flex-col h-full">
      {isReadOnly ? (
        // Read-only view
        <EntityFormReadOnly sections={sections} data={data} layout={layout} />
      ) : (
        // Edit/Create view
        <>
          {/* Form Progress */}
          <div className="px-6 py-2 flex items-center gap-2">
            <Progress value={completion} className="h-2 flex-1" />
            <span className={`text-xs whitespace-nowrap ${(requiredFieldCount === 0 || filledRequiredFieldCount === requiredFieldCount) ? 'text-green-500 font-medium' : 'text-amber-500 font-medium'}`}>
              {requiredFieldCount > 0 ? `${filledRequiredFieldCount}/${requiredFieldCount} fields completed` : 'No required fields'}
            </span>
          </div>
          
          {/* Tab Navigation */}
          <EntityFormTabsNavigation 
            sections={sections}
            activeTab={activeTab}
            onChange={handleTabChange}
            formState={form.formState}
          />
      
          {/* Tab Content */}
          <div className="p-6 overflow-y-auto space-y-6">
            {/* Section title and description */}
            {activeSection && (
              <div className="mb-6">
                {activeSection.title && (
                  <h3 className="text-lg font-semibold flex items-center">
                    {activeSection.title}
                  </h3>
                )}
                
                {activeSection.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {activeSection.description}
                  </p>
                )}
              </div>
            )}
        
            {/* Section Fields */}
            {activeSection && (
              <div className={activeSection.layout === '2-column' 
                ? 'grid grid-cols-1 md:grid-cols-2 gap-6' 
                : 'space-y-6'
              }>
                {activeSection.fields.map((field, fieldIndex) => {
                  const error = form.formState.errors[field.name];
                  return (
                    <div key={fieldIndex} className="relative group">
                      {renderField({
                        field: {
                          ...field,
                          // Add section identifier to make field truly unique across tabs
                          // This prevents field value contamination
                          key: `${activeSection.title || 'section'}-${field.name}`
                        },
                        form,
                        formMode,
                        data,
                        isReadOnly: false,
                        key: `${activeSection.title || 'section'}-field-${fieldIndex}`
                      })}
                      
                      {/* Help tooltip */}
                      {field.description && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="absolute top-0 right-0 opacity-50 group-hover:opacity-100 transition-opacity">
                                <BadgeInfo size={16} className="text-muted-foreground" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="right" align="start" className="max-w-xs bg-secondary p-2">
                              <p className="text-xs">{field.description}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      
                      {/* Error message */}
                      {error && (
                        <p className="text-xs text-red-500 mt-1">
                          {error.message as string}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
        
            {/* Submit Error */}
            {submitError && (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 p-4 rounded-md text-sm border border-red-200 dark:border-red-900 mt-6">
                {submitError}
              </div>
            )}
          </div>
          
          {/* Debug component - only visible in development */}
          {process.env.NODE_ENV !== 'production' && (
            <FormDebug form={form} sections={sections} />
          )}
        </>
      )}
    </div>
  );
}
