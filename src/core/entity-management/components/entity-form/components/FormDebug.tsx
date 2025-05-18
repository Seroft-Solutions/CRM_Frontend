import React, { useState, useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { SectionConfig } from '../../../types/entity-form';
import { Button } from '@/components/ui/button';
import { Bug } from 'lucide-react';
import { hasValidValue, isolateFormValues, isRequiredFieldFilled, getFieldValue } from '../../../utils/fieldValidation';

interface FormDebugProps {
  form: UseFormReturn<any>;
  sections: SectionConfig[];
}

// Helper to check if a field has a valid value
// This is a duplicate for debugging only - the real function is in utils/fieldValidation.ts 
const hasFieldValue = (value: any): boolean => {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string' && value.trim() === '') return false;
  if (typeof value === 'number' && isNaN(value)) return false;
  // Check for numbers (0 is a valid value)
  if (typeof value === 'number') return true;
  if (Array.isArray(value) && value.length === 0) return false;
  return true;
};

/**
 * Debug component for form development - only rendered in development mode
 * This component should never be included in production builds
 */
export function FormDebug({ form, sections }: FormDebugProps) {
  // Return null in production environment
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  const [isOpen, setIsOpen] = useState(false);
  const [allValues, setAllValues] = useState({});
  const [refresh, setRefresh] = useState(0);
  
  // Watch form values
  useEffect(() => {
    const subscription = form.watch((value) => {
      setAllValues(isolateFormValues(form.getValues()));
    });
    
    // Initial values
    setAllValues(isolateFormValues(form.getValues()));
    
    return () => subscription.unsubscribe();
  }, [form]);
  
  // Refresh every second to catch any changes
  useEffect(() => {
    const timer = setInterval(() => {
      setRefresh(prev => prev + 1);
      setAllValues(isolateFormValues(form.getValues()));
    }, 1000);
    
    return () => clearInterval(timer);
  }, [form]);
  
  if (!isOpen) {
    return (
        <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsOpen(true)}
            className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50 opacity-70 hover:opacity-100"
        >
        <Bug size={16} className="mr-1" />
        Debug
      </Button>
    );
  }
  
  // Get all required fields
  const requiredFields = [];
  sections.forEach(section => {
    section.fields.forEach(field => {
      if (field.required) {
        // Get a precise reference to the value
        const value = getFieldValue(allValues, field.name);
        requiredFields.push({
          name: field.name,
          section: section.title,
          value: value,
          error: form.formState.errors[field.name],
          isFilled: hasValidValue(value, field.name),
          type: typeof value
        });
      }
    });
  });
  
  return (
    <div className="fixed bottom-0 left-0 w-96 max-h-96 overflow-auto bg-white dark:bg-gray-950 shadow-lg border rounded-tr-lg z-50 p-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold">Form Debug</h3>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(false)}
        >
          Close
        </Button>
      </div>
      
      <div className="space-y-2 text-xs">
        <p><strong>Form State:</strong> {form.formState.isValid ? '✅ Valid' : '❌ Invalid'}</p>
        <p><strong>Dirty: </strong> {form.formState.isDirty ? '✅ Yes' : '❌ No'}</p>
        <p><strong>Required Fields:</strong> {requiredFields.length}</p>
        <p><strong>Last refresh:</strong> {new Date().toLocaleTimeString()}</p>
        
        <div className="mt-2 space-y-1">
          <p className="font-semibold">Required Fields Status:</p>
          {requiredFields.map((field, index) => (
            <div 
              key={index} 
              className={`p-2 rounded-sm ${field.isFilled ? 'bg-green-50 dark:bg-green-900/20' : field.error ? 'bg-red-50 dark:bg-red-900/20' : 'bg-amber-50 dark:bg-amber-900/20'}`}
            >
              <p className="font-medium">{field.name} ({field.section})</p>
              <p>Value: <code>{JSON.stringify(field.value)}</code></p>
              <p>Type: <code>{field.type}</code></p>
              <p>Status: {field.isFilled ? '✅ Filled' : '❌ Empty'}</p>
              {field.error && <p>Error: {field.error.message}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
