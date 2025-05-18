import React from 'react';
import { SectionConfig, FieldLayout, FieldConfig } from '../../../types/entity-form';

export interface EntityFormReadOnlyProps {
  sections: SectionConfig[];
  data?: any;
  layout: FieldLayout;
}

export function EntityFormReadOnly({
  sections,
  data,
  layout
}: EntityFormReadOnlyProps) {
  return (
    <div className="space-y-8 my-2 bg-white dark:bg-gray-950 rounded-md p-5 shadow-sm border border-gray-100 dark:border-gray-800">
      {sections.map((section, index) => (
        <div key={index} className="space-y-5 pb-6 border-b border-gray-100 dark:border-gray-800 last:border-0 last:pb-0">
          {section.title && (
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 border-l-4 border-primary pl-3">
              {section.title}
            </h3>
          )}
          {section.description && (
            <p className="text-sm text-muted-foreground mb-2">
              {section.description}
            </p>
          )}
          <div className={section.layout === '2-column' ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'space-y-4'}>
            {section.fields.map((field, fieldIndex) => (
              <ReadOnlyField
                key={fieldIndex}
                field={field}
                data={data}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

interface ReadOnlyFieldProps {
  field: FieldConfig;
  data?: any;
}

function ReadOnlyField({ field, data }: ReadOnlyFieldProps) {
  const value = data ? data[field.name] : undefined;
  
  // If the field has a custom formatter, use it
  if (field.readOnlyFormatter) {
    return (
      <div className="flex flex-col space-y-2 mb-5 last:mb-0">
        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
          {field.label}
        </h4>
        <div className="font-medium text-gray-900 dark:text-gray-100 text-base pt-0.5">
          {field.readOnlyFormatter(value, data) || '-'}
        </div>
      </div>
    );
  }

  // Special handling for select fields with relational data
  if (field.type === 'select' && typeof field.options === 'object' && 'endpoint' in field.options) {
    // For debugging
    console.log(`Field ${field.name} value:`, value);
    console.log(`Field ${field.name} full data:`, data);
    
    // Many API responses use "callType" for the relation object when the field is "callTypeId"
    const relationshipKey = field.name.replace('Id', '');
    const relationshipObject = data && data[relationshipKey] ? data[relationshipKey] : null;
    
    console.log(`Relationship object for ${field.name}:`, relationshipObject);
    
    // If the related entity object is available, display its name
    if (relationshipObject && typeof relationshipObject === 'object' && relationshipObject.name) {
      return (
        <div className="flex flex-col space-y-2 mb-5 last:mb-0">
          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
            {field.label}
          </h4>
          <div className="font-medium text-gray-900 dark:text-gray-100 text-base pt-0.5">
            {relationshipObject.name || '-'}
          </div>
        </div>
      );
    }
    
    // Try to find the relationship in a _data or data property (some APIs nest it)
    if (data && data._data && data._data[relationshipKey] && 
        typeof data._data[relationshipKey] === 'object' && 
        data._data[relationshipKey].name) {
      return (
        <div className="flex flex-col space-y-2 mb-5 last:mb-0">
          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
            {field.label}
          </h4>
          <div className="font-medium text-gray-900 dark:text-gray-100 text-base pt-0.5">
            {data._data[relationshipKey].name || '-'}
          </div>
        </div>
      );
    }
  }

  // Special handling for boolean/switch values
  if (field.type === 'switch' || field.type === 'checkbox') {
    return (
      <div className="flex flex-col space-y-2 mb-5 last:mb-0">
        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
          {field.label}
        </h4>
        <div className="font-medium text-gray-900 dark:text-gray-100 text-base pt-0.5">
          {value === true ? 'Yes' : value === false ? 'No' : '-'}
        </div>
      </div>
    );
  }
  
  // Default formatting for all other fields
  return (
    <div className="flex flex-col space-y-2 mb-5 last:mb-0">
      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
        {field.label}
      </h4>
      <div className="font-medium text-gray-900 dark:text-gray-100 text-base pt-0.5">
        {value || '-'}
      </div>
    </div>
  );
}
