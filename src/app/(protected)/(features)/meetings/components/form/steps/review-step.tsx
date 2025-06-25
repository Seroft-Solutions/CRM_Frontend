"use client";

import React from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import type { StepComponentProps } from "../form-types";
import { useEntityForm } from "../meeting-form-provider";

export function ReviewStep({ stepConfig, isActive, isCompleted }: StepComponentProps) {
  const { config, form } = useEntityForm();

  const formValues = form.watch();

  const renderFieldValue = (fieldConfig: any, value: any) => {
    if (value === undefined || value === null || value === "") {
      return <span className="text-muted-foreground">—</span>;
    }

    switch (fieldConfig.type) {
      case 'boolean':
        return (
          <Badge variant={value ? "default" : "secondary"}>
            {value ? "Yes" : "No"}
          </Badge>
        );
      case 'date':
        try {
          const date = new Date(value);
          if (isNaN(date.getTime())) {
            return <span className="text-muted-foreground">Invalid date</span>;
          }
          return format(date, "PPP");
        } catch (error) {
          return <span className="text-muted-foreground">Invalid date</span>;
        }
      case 'enum':
        return <Badge variant="outline">{value}</Badge>;
      default:
        return String(value);
    }
  };

  const renderRelationshipValue = (relConfig: any, value: any) => {
    if (value === undefined || value === null) {
      return <Badge variant="outline">Not selected</Badge>;
    }

    if (relConfig.multiple) {
      const count = Array.isArray(value) ? value.length : 0;
      return (
        <Badge variant="outline">
          {count} selected
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline">
          Selected
        </Badge>
      );
    }
  };

  const fieldsByCategory = {
    basic: config.fields.filter(field => 
      ['text', 'number', 'enum'].includes(field.type)
    ),
    dates: config.fields.filter(field => field.type === 'date'),
    settings: config.fields.filter(field => 
      ['boolean', 'file', 'textarea'].includes(field.type)
    )
  };

  const relationshipsByCategory = {
    geographic: config.relationships.filter(rel => rel.category === 'geographic'),
    user: config.relationships.filter(rel => rel.category === 'user'),
    classification: config.relationships.filter(rel => rel.category === 'classification'),
    business: config.relationships.filter(rel => rel.category === 'business'),
    other: config.relationships.filter(rel => rel.category === 'other')
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-medium mb-2">Review Your Information</h3>
        <p className="text-muted-foreground">Please review all the information before submitting</p>
      </div>
      
      {/* Basic Information */}
      {fieldsByCategory.basic.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium text-lg border-b pb-2">Basic Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {fieldsByCategory.basic.map((fieldConfig) => (
              <div key={fieldConfig.name} className="space-y-1">
                <dt className="text-sm font-medium text-muted-foreground">
                  {fieldConfig.label}
                </dt>
                <dd className="text-sm">
                  {renderFieldValue(fieldConfig, formValues[fieldConfig.name])}
                </dd>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Date & Time */}
      {fieldsByCategory.dates.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium text-lg border-b pb-2">📅 Date & Time</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {fieldsByCategory.dates.map((fieldConfig) => (
              <div key={fieldConfig.name} className="space-y-1">
                <dt className="text-sm font-medium text-muted-foreground">
                  {fieldConfig.label}
                </dt>
                <dd className="text-sm">
                  {renderFieldValue(fieldConfig, formValues[fieldConfig.name])}
                </dd>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Settings */}
      {fieldsByCategory.settings.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium text-lg border-b pb-2">⚙️ Settings</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {fieldsByCategory.settings.map((fieldConfig) => (
              <div key={fieldConfig.name} className="space-y-1">
                <dt className="text-sm font-medium text-muted-foreground">
                  {fieldConfig.label}
                </dt>
                <dd className="text-sm">
                  {renderFieldValue(fieldConfig, formValues[fieldConfig.name])}
                </dd>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Relationship Reviews */}
      {Object.entries(relationshipsByCategory).map(([categoryName, relationships]) => {
        if (relationships.length === 0) return null;

        const categoryConfig = {
          geographic: { icon: '📍', title: 'Location Details' },
          user: { icon: '👥', title: 'People & Assignment' },
          classification: { icon: '🏷️', title: 'Classification' },
          business: { icon: '🏢', title: 'Business Relations' },
          other: { icon: '🔗', title: 'Additional Relations' }
        }[categoryName] || { icon: '🔗', title: 'Relations' };

        return (
          <div key={categoryName} className="space-y-4">
            <h4 className="font-medium text-lg border-b pb-2">
              {categoryConfig.icon} {categoryConfig.title}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {relationships.map((relConfig) => (
                <div key={relConfig.name} className="space-y-1">
                  <dt className="text-sm font-medium text-muted-foreground">
                    {relConfig.ui.label}
                  </dt>
                  <dd className="text-sm">
                    {renderRelationshipValue(relConfig, formValues[relConfig.name])}
                  </dd>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Submission Note */}
      <div className="bg-muted/50 rounded-lg p-4 text-center">
        <p className="text-sm text-muted-foreground">
          By submitting this form, you confirm that the information provided is accurate and complete.
        </p>
      </div>
    </div>
  );
}
