// ===============================================================
// 🛑 AUTO-GENERATED FILE – DO NOT EDIT DIRECTLY 🛑
// - Source: code generation pipeline
// - To customize: use ./overrides/[filename].ts or feature-level
//   extensions (e.g., ./src/features/.../extensions/)
// - Direct edits will be overwritten on regeneration
// ===============================================================
'use client';

import React from 'react';

import {
  useGetAllPriorities,
  useSearchPriorities,
  useCountPriorities,
} from '@/core/api/generated/spring/endpoints/priority-resource/priority-resource.gen';
import {
  useGetAllCallTypes,
  useSearchCallTypes,
  useCountCallTypes,
} from '@/core/api/generated/spring/endpoints/call-type-resource/call-type-resource.gen';
import {
  useGetAllSubCallTypes,
  useSearchSubCallTypes,
  useCountSubCallTypes,
} from '@/core/api/generated/spring/endpoints/sub-call-type-resource/sub-call-type-resource.gen';
import {
  useGetAllSources,
  useSearchSources,
  useCountSources,
} from '@/core/api/generated/spring/endpoints/source-resource/source-resource.gen';
import {
  useGetAllCustomers,
  useSearchCustomers,
  useCountCustomers,
} from '@/core/api/generated/spring/endpoints/customer-resource/customer-resource.gen';
import {
  useGetAllProducts,
  useSearchProducts,
  useCountProducts,
} from '@/core/api/generated/spring/endpoints/product-resource/product-resource.gen';
import {
  useGetAllUserProfiles,
  useSearchUserProfiles,
  useCountUserProfiles,
} from '@/core/api/generated/spring/endpoints/user-profile-resource/user-profile-resource.gen';
import {
  useGetAllChannelTypes,
  useSearchChannelTypes,
  useCountChannelTypes,
} from '@/core/api/generated/spring/endpoints/channel-type-resource/channel-type-resource.gen';
import {
  useGetAllCallStatuses,
  useSearchCallStatuses,
  useCountCallStatuses,
} from '@/core/api/generated/spring/endpoints/call-status-resource/call-status-resource.gen';

interface CallReviewStepProps {
  form: any;
  config: any;
  actions: any;
  entity?: any;
}

// Relationship value resolver component
function RelationshipValueResolver({ relConfig, value }: { relConfig: any; value: any }) {
  // Use hooks based on relationship configuration
  const resolveRelationshipDisplay = () => {
    switch (relConfig.name) {
      case 'priority':
        return (
          <RelationshipDisplayValue
            value={value}
            useGetAllHook={useGetAllPriorities}
            displayField="name"
            primaryKey="id"
            multiple={false}
            label="Priorities"
          />
        );

      case 'callType':
        return (
          <RelationshipDisplayValue
            value={value}
            useGetAllHook={useGetAllCallTypes}
            displayField="name"
            primaryKey="id"
            multiple={false}
            label="CallTypes"
          />
        );

      case 'subCallType':
        return (
          <RelationshipDisplayValue
            value={value}
            useGetAllHook={useGetAllSubCallTypes}
            displayField="name"
            primaryKey="id"
            multiple={false}
            label="SubCallTypes"
          />
        );

      case 'source':
        return (
          <RelationshipDisplayValue
            value={value}
            useGetAllHook={useGetAllSources}
            displayField="name"
            primaryKey="id"
            multiple={false}
            label="Sources"
          />
        );

      case 'customer':
        return (
          <RelationshipDisplayValue
            value={value}
            useGetAllHook={useGetAllCustomers}
            displayField="customerBusinessName"
            primaryKey="id"
            multiple={false}
            label="Customers"
          />
        );

      case 'product':
        return (
          <RelationshipDisplayValue
            value={value}
            useGetAllHook={useGetAllProducts}
            displayField="name"
            primaryKey="id"
            multiple={false}
            label="Products"
          />
        );

      case 'channelParties':
        return (
          <RelationshipDisplayValue
            value={value}
            useGetAllHook={useGetAllUserProfiles}
            displayField="displayName"
            primaryKey="id"
            multiple={false}
            label="UserProfiles"
          />
        );

      case 'channelType':
        return (
          <RelationshipDisplayValue
            value={value}
            useGetAllHook={useGetAllChannelTypes}
            displayField="name"
            primaryKey="id"
            multiple={false}
            label="ChannelTypes"
          />
        );

      case 'assignedTo':
        return (
          <RelationshipDisplayValue
            value={value}
            useGetAllHook={useGetAllUserProfiles}
            displayField="displayName"
            primaryKey="id"
            multiple={false}
            label="UserProfiles"
          />
        );

      case 'callStatus':
        return (
          <RelationshipDisplayValue
            value={value}
            useGetAllHook={useGetAllCallStatuses}
            displayField="name"
            primaryKey="id"
            multiple={false}
            label="CallStatuses"
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
  label,
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
    {
      page: 0,
      size: 20, // Use backend's default page size
      sort: [`${displayField},asc`], // Sort by display field in ascending order
    },
    {
      query: {
        enabled: !!value, // Only fetch if there's a value to resolve
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
      },
    }
  );

  if (!value) {
    return <span className="text-muted-foreground italic">Not selected</span>;
  }

  if (!allData) {
    return <span className="text-muted-foreground italic">Loading...</span>;
  }

  // Extract data array from response (handle both direct array and paginated response)
  const dataArray = Array.isArray(allData)
    ? allData
    : allData.content
      ? allData.content
      : allData.data
        ? allData.data
        : [];

  if (multiple && Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="text-muted-foreground italic">None selected</span>;
    }

    const selectedItems = dataArray.filter((item: any) => value.includes(item[primaryKey]));

    if (selectedItems.length === 0) {
      return <span className="text-muted-foreground italic">{value.length} selected</span>;
    }

    const displayValues = selectedItems.map((item: any) => item[displayField]);
    return displayValues.join(', ');
  } else {
    // Single value
    const selectedItem = dataArray.find((item: any) => item[primaryKey] === value);

    return selectedItem ? (
      selectedItem[displayField]
    ) : (
      <span className="text-muted-foreground italic">Selected (ID: {value})</span>
    );
  }
}

export function CallReviewStep({ form, config, actions, entity }: CallReviewStepProps) {
  return (
    <div className="space-y-6">
      {/* Review all previous steps */}
      {config.steps.slice(0, -1).map((step: any, index: number) => {
        const stepFields = [...step.fields, ...step.relationships];
        if (stepFields.length === 0) return null;

        return (
          <div key={step.id} className="border rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3 pb-2 border-b border-border/50">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                {index + 1}
              </div>
              <div>
                <h4 className="font-semibold text-sm text-foreground">{step.title}</h4>
                {step.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
                )}
              </div>
              <div className="ml-auto text-xs text-muted-foreground">
                Step {index + 1} of {config.steps.length - 1}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Review regular fields */}
              {step.fields.map((fieldName: string) => {
                const fieldConfig = config.fields.find((f: any) => f.name === fieldName);
                if (!fieldConfig) return null;
                const value = form.getValues(fieldName);

                // Format value for display
                const displayValue = (() => {
                  if (!value) return <span className="text-muted-foreground italic">Not set</span>;

                  if (fieldConfig.type === 'date') {
                    try {
                      const date = value instanceof Date ? value : new Date(value);
                      const dateStr = isNaN(date.getTime())
                        ? 'Invalid date'
                        : date.toLocaleDateString();
                      return dateStr;
                    } catch {
                      return <span className="text-muted-foreground italic">Invalid date</span>;
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
                    const fileStr = value && value.name ? value.name : 'No file selected';
                    return fileStr;
                  }

                  return String(value);
                })();

                return (
                  <div key={fieldName} className="space-y-1">
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {fieldConfig.label}
                    </div>
                    <div className="text-sm font-semibold text-foreground">{displayValue}</div>
                  </div>
                );
              })}

              {/* Review relationships */}
              {step.relationships.map((relName: string) => {
                const relConfig = config.relationships.find((r: any) => r.name === relName);
                if (!relConfig) return null;
                const value = form.getValues(relName);

                return (
                  <div key={relName} className="space-y-1">
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {relConfig.ui.label}
                    </div>
                    <div className="text-sm font-semibold text-foreground">
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
