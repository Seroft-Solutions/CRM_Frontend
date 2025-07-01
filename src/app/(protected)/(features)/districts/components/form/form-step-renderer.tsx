"use client";

import React, { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useEntityForm } from "./district-form-provider";
import { RelationshipRenderer } from "./relationship-renderer";


import {
  useGetAllStates,
  useSearchStates,
  useCountStates,
} from "@/core/api/generated/spring/endpoints/state-resource/state-resource.gen";

interface FormStepRendererProps {
  entity?: any;
}

// Relationship value resolver component
function RelationshipValueResolver({ relConfig, value }: { relConfig: any; value: any }) {
  // Use hooks based on relationship configuration
  const resolveRelationshipDisplay = () => {
    switch (relConfig.name) {
      case 'state':
        return (
          <RelationshipDisplayValue
            value={value}
            useGetAllHook={useGetAllStates}
            displayField="name"
            primaryKey="id"
            multiple={false}
            label="States"
          />
        );
        
      default:
        return <span>{value ? 'Selected' : 'Not selected'}</span>;
    }
  };

  return resolveRelationshipDisplay();
}

// Component to display relationship values
function RelationshipDisplayValue({ 
  value, 
  useGetAllHook, 
  displayField, 
  primaryKey, 
  multiple,
  label 
}: { 
  value: any; 
  useGetAllHook: any; 
  displayField: string; 
  primaryKey: string; 
  multiple: boolean;
  label: string;
}) {
  // Fetch all data to resolve display values
  const { data: allData } = useGetAllHook(
    { page: 0, size: 1000 }, // Get enough data to resolve most relationships
    {
      query: {
        enabled: !!value, // Only fetch if there's a value to resolve
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
      }
    }
  );

  if (!value) {
    return <Badge variant="outline" className="text-muted-foreground text-xs">Not selected</Badge>;
  }

  if (!allData) {
    return <Badge variant="outline" className="text-muted-foreground text-xs">Loading...</Badge>;
  }

  // Extract data array from response (handle both direct array and paginated response)
  const dataArray = Array.isArray(allData) ? allData : 
                   allData.content ? allData.content : 
                   allData.data ? allData.data : [];

  if (multiple && Array.isArray(value)) {
    if (value.length === 0) {
      return <Badge variant="outline" className="text-muted-foreground">None selected</Badge>;
    }
    
    const selectedItems = dataArray.filter((item: any) => 
      value.includes(item[primaryKey])
    );
    
    if (selectedItems.length === 0) {
      return <Badge variant="outline">{value.length} selected</Badge>;
    }
    
    if (selectedItems.length <= 3) {
      return (
        <div className="flex flex-wrap gap-1">
          {selectedItems.map((item: any, index: number) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {item[displayField]}
            </Badge>
          ))}
        </div>
      );
    } else {
      return (
        <div className="flex flex-wrap gap-1">
          {selectedItems.slice(0, 2).map((item: any, index: number) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {item[displayField]}
            </Badge>
          ))}
          <Badge variant="outline" className="text-xs">
            +{selectedItems.length - 2} more
          </Badge>
        </div>
      );
    }
  } else {
    // Single value
    const selectedItem = dataArray.find((item: any) => 
      item[primaryKey] === value
    );
    
    return selectedItem ? (
      <Badge variant="default" className="text-xs font-medium">
        {selectedItem[displayField]}
      </Badge>
    ) : (
      <Badge variant="outline" className="text-xs text-muted-foreground">
        Selected (ID: {value})
      </Badge>
    );
  }
}

export function FormStepRenderer({ entity }: FormStepRendererProps) {
  const { config, state, form, actions } = useEntityForm();
  const currentStepConfig = config.steps[state.currentStep];

  // Update form values when entity data is loaded (for edit mode)
  useEffect(() => {
    if (entity && !state.isLoading) {
      const formValues: Record<string, any> = {};

      // Handle regular fields
      config.fields.forEach(fieldConfig => {
        const value = entity[fieldConfig.name];
        
        if (fieldConfig.type === 'date') {
          // Convert to datetime-local format for the input
          if (value) {
            try {
              const date = new Date(value);
              if (!isNaN(date.getTime())) {
                // Format as YYYY-MM-DDTHH:MM for datetime-local input
                const offset = date.getTimezoneOffset();
                const adjustedDate = new Date(date.getTime() - (offset * 60 * 1000));
                formValues[fieldConfig.name] = adjustedDate.toISOString().slice(0, 16);
              } else {
                formValues[fieldConfig.name] = "";
              }
            } catch {
              formValues[fieldConfig.name] = "";
            }
          } else {
            formValues[fieldConfig.name] = "";
          }
        } else if (fieldConfig.type === 'number') {
          formValues[fieldConfig.name] = value != null ? String(value) : "";
        } else {
          formValues[fieldConfig.name] = value || "";
        }
      });

      // Handle relationships
      config.relationships.forEach(relConfig => {
        const value = entity[relConfig.name];
        
        if (relConfig.multiple) {
          formValues[relConfig.name] = value ? value.map((item: any) => item[relConfig.primaryKey]) : [];
        } else {
          formValues[relConfig.name] = value ? value[relConfig.primaryKey] : undefined;
        }
      });

      form.reset(formValues);
    }
  }, [entity, config, form, state.isLoading]);

  const renderField = (fieldName: string) => {
    const fieldConfig = config.fields.find(f => f.name === fieldName);
    if (!fieldConfig) return null;

    return (
      <FormField
        key={fieldConfig.name}
        control={form.control}
        name={fieldConfig.name}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-medium">
              {fieldConfig.label}
              {fieldConfig.required && <span className="text-red-500 ml-1">*</span>}
            </FormLabel>
            <FormControl>
              {fieldConfig.type === 'date' ? (
                <Input
                  type="datetime-local"
                  placeholder={fieldConfig.placeholder}
                  {...field}
                  value={field.value || ''}
                  onChange={(e) => {
                    field.onChange(e.target.value || null);
                    form.trigger(fieldConfig.name);
                  }}
                />
              ) : fieldConfig.type === 'textarea' ? (
                <Textarea
                  placeholder={fieldConfig.placeholder}
                  {...field}
                  onChange={(e) => {
                    field.onChange(e.target.value);
                    form.trigger(fieldConfig.name);
                  }}
                />
              ) : fieldConfig.type === 'number' ? (
                <Input
                  type="number"
                  placeholder={fieldConfig.placeholder}
                  {...field}
                  onChange={(e) => {
                    field.onChange(e.target.value);
                    form.trigger(fieldConfig.name);
                  }}
                />
              ) : fieldConfig.name?.toLowerCase().includes('email') ? (
                <Input
                  type="email"
                  placeholder="Enter email address (example: name@company.com)"
                  {...field}
                  onChange={(e) => {
                    field.onChange(e.target.value);
                    form.trigger(fieldConfig.name);
                  }}
                />
              ) : fieldConfig.name?.toLowerCase().includes('mobile') || fieldConfig.name?.toLowerCase().includes('phone') ? (
                <Input
                  type="tel"
                  placeholder="Enter phone number (example: 03001234567)"
                  {...field}
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/[^\d\s\-\(\)\+]/g, '');
                    field.onChange(cleaned);
                    form.trigger(fieldConfig.name);
                  }}
                />
              ) : (
                <Input
                  type="text"
                  placeholder={fieldConfig.placeholder}
                  {...field}
                  onChange={(e) => {
                    field.onChange(e.target.value);
                    form.trigger(fieldConfig.name);
                  }}
                />
              )}
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  };

  const renderRelationship = (relationshipName: string) => {
    const relConfig = config.relationships.find(r => r.name === relationshipName);
    if (!relConfig) return null;

    return (
      <FormField
        key={relConfig.name}
        control={form.control}
        name={relConfig.name}
        render={({ field }) => (
          <RelationshipRenderer
            relConfig={relConfig}
            field={field}
            form={form}
            actions={actions}
            config={config}
          />
        )}
      />
    );
  };

  const renderCurrentStep = () => {
    if (!currentStepConfig) return null;

    // Special handling for review step
    if (currentStepConfig.id === 'review') {
      return (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold">Review Your Information</h3>
            <p className="text-muted-foreground mt-2">Please review all the information before submitting.</p>
          </div>
          
          {config.steps.slice(0, -1).map((step) => {
            const stepFields = [...step.fields, ...step.relationships];
            if (stepFields.length === 0) return null;
            
            return (
              <div key={step.id} className="border rounded-lg p-4">
                <h4 className="font-medium mb-3 text-sm">{step.title}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {step.fields.map(fieldName => {
                    const fieldConfig = config.fields.find(f => f.name === fieldName);
                    if (!fieldConfig) return null;
                    const value = form.getValues(fieldName);
                    
                    // Format value for display
                    const displayValue = (() => {
                      if (!value) return (
                        <Badge variant="outline" className="text-muted-foreground text-xs">Not set</Badge>
                      );
                      
                      if (fieldConfig.type === 'date') {
                        try {
                          const date = value instanceof Date ? value : new Date(value);
                          const dateStr = isNaN(date.getTime()) ? 'Invalid date' : date.toLocaleDateString();
                          return (
                            <Badge variant="secondary" className="text-xs">
                              {dateStr}
                            </Badge>
                          );
                        } catch {
                          return (
                            <Badge variant="destructive" className="text-xs">
                              Invalid date
                            </Badge>
                          );
                        }
                      }
                      
                      if (fieldConfig.type === 'boolean') {
                        return (
                          <Badge variant={value ? "default" : "secondary"} className="text-xs">
                            {value ? 'Yes' : 'No'}
                          </Badge>
                        );
                      }
                      
                      if (fieldConfig.type === 'enum') {
                        const option = fieldConfig.options?.find((opt: any) => opt.value === value);
                        return (
                          <Badge variant="default" className="text-xs">
                            {option ? option.label : value}
                          </Badge>
                        );
                      }
                      
                      if (fieldConfig.type === 'file') {
                        const fileStr = value && value.name ? value.name : 'No file selected';
                        return (
                          <Badge variant={value && value.name ? "default" : "outline"} className="text-xs">
                            {fileStr}
                          </Badge>
                        );
                      }
                      
                      return (
                        <Badge variant="secondary" className="text-xs">
                          {String(value)}
                        </Badge>
                      );
                    })();
                    
                    return (
                      <div key={fieldName} className="space-y-1">
                        <span className="text-xs font-medium text-muted-foreground">{fieldConfig.label}:</span>
                        <div>{displayValue}</div>
                      </div>
                    );
                  })}
                  {step.relationships.map(relName => {
                    const relConfig = config.relationships.find(r => r.name === relName);
                    if (!relConfig) return null;
                    const value = form.getValues(relName);
                    
                    return (
                      <div key={relName} className="space-y-1">
                        <span className="text-xs font-medium text-muted-foreground">{relConfig.ui.label}:</span>
                        <div>
                          <RelationshipValueResolver relConfig={relConfig} value={value} />
                        </div>
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

    // Regular step rendering
    return (
      <div className="space-y-6">
        <div className={`grid ${config.ui.responsive.mobile} ${config.ui.responsive.tablet} ${config.ui.responsive.desktop} ${config.ui.spacing.fieldGap}`}>
          {/* Render regular fields */}
          {currentStepConfig.fields.map(fieldName => renderField(fieldName))}
          
          {/* Render relationships */}
          {currentStepConfig.relationships.map(relationshipName => renderRelationship(relationshipName))}
        </div>
      </div>
    );
  };

  return (
    <Form {...form}>
      <form className="space-y-6">
        <Card>
          <CardContent className="p-4 sm:p-6">
            {renderCurrentStep()}
          </CardContent>
        </Card>
      </form>
    </Form>
  );
}