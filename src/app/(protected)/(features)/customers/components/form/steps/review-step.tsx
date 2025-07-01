"use client";

import React from "react";

interface CustomerReviewStepProps {
  form: any;
  config: any;
  actions: any;
}

export function CustomerReviewStep({ form, config, actions }: CustomerReviewStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold">Review Your Information</h3>
        <p className="text-muted-foreground mt-2">Please review all the information before submitting.</p>
      </div>
      
      {/* Review all previous steps */}
      {config.steps.slice(0, -1).map((step: any) => {
        const stepFields = [...step.fields, ...step.relationships];
        if (stepFields.length === 0) return null;
        
        return (
          <div key={step.id} className="border rounded-lg p-4">
            <h4 className="font-medium mb-3">{step.title}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Review regular fields */}
              {step.fields.map((fieldName: string) => {
                const fieldConfig = config.fields.find((f: any) => f.name === fieldName);
                if (!fieldConfig) return null;
                const value = form.getValues(fieldName);
                
                // Format value for display
                const displayValue = (() => {
                  if (!value) return 'Not set';
                  
                  if (fieldConfig.type === 'date') {
                    try {
                      const date = value instanceof Date ? value : new Date(value);
                      return isNaN(date.getTime()) ? 'Invalid date' : date.toLocaleDateString();
                    } catch {
                      return 'Invalid date';
                    }
                  }
                  
                  if (fieldConfig.type === 'boolean') {
                    return value ? 'Yes' : 'No';
                  }
                  
                  if (fieldConfig.type === 'enum') {
                    const option = fieldConfig.options?.find((opt: any) => opt.value === value);
                    return option ? option.label : value;
                  }
                  
                  if (fieldConfig.type === 'file') {
                    return value && value.name ? value.name : 'No file selected';
                  }
                  
                  return String(value);
                })();
                
                return (
                  <div key={fieldName} className="text-sm">
                    <span className="font-medium">{fieldConfig.label}:</span>
                    <span className="ml-2">{displayValue}</span>
                  </div>
                );
              })}
              
              {/* Review relationships */}
              {step.relationships.map((relName: string) => {
                const relConfig = config.relationships.find((r: any) => r.name === relName);
                if (!relConfig) return null;
                const value = form.getValues(relName);
                
                const displayValue = (() => {
                  if (!value) return 'Not selected';
                  
                  if (relConfig.multiple && Array.isArray(value)) {
                    return value.length > 0 ? `${value.length} selected` : 'None selected';
                  }
                  
                  return 'Selected';
                })();
                
                return (
                  <div key={relName} className="text-sm">
                    <span className="font-medium">{relConfig.ui.label}:</span>
                    <span className="ml-2">{displayValue}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
