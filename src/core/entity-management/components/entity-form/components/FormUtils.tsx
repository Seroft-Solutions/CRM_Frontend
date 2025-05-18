import React from 'react';
import { SectionConfig, FieldConfig, FieldLayout } from '../../../types/entity-form';
import { FormMode } from '@/features/core/tanstack-query-api';

/**
 * Helper function to filter sections based on visibility conditions
 */
export function getVisibleSections(
  sections: SectionConfig[],
  fields: FieldConfig[],
  formMode: FormMode,
  data?: any,
  layout: FieldLayout = 'default'
): SectionConfig[] {
  if (sections.length > 0) {
    return sections.filter(section => {
      if (typeof section.visible === 'function') {
        return section.visible(formMode, data);
      }
      return section.visible !== false;
    });
  }
  
  return [{
    fields: fields.filter(field => {
      const isHidden = typeof field.hidden === 'function' 
        ? field.hidden(formMode, data)
        : field.hidden;
      
      return !isHidden;
    }),
    layout
  }];
}

/**
 * Helper function to determine if a field should be disabled
 */
export function isFieldDisabled(
  field: FieldConfig,
  formMode: FormMode,
  data?: any
): boolean {
  return typeof field.disabled === 'function' 
    ? field.disabled(formMode, data)
    : !!field.disabled;
}

/**
 * Helper function to generate form title based on mode
 */
export function generateTitle(
  title: string | ((mode: FormMode) => string) | undefined,
  formMode: FormMode
): string {
  if (typeof title === 'function') {
    return title(formMode);
  }
  
  if (title) {
    return title;
  }
  
  switch (formMode) {
    case 'create':
      return 'Create New Item';
    case 'edit':
      return 'Edit Item';
    default:
      return 'Item Details';
  }
}

/**
 * Helper function to generate form description based on mode
 */
export function generateDescription(
  description: string | ((mode: FormMode) => string) | undefined,
  formMode: FormMode
): string {
  if (typeof description === 'function') {
    return description(formMode);
  }
  
  if (description) {
    return description;
  }
  
  switch (formMode) {
    case 'create':
      return 'Create a new item with the form below.';
    case 'edit':
      return 'Edit the item details with the form below.';
    default:
      return 'View the details of the item.';
  }
}
