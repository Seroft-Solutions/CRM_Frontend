import React from 'react';
import { FieldConfig } from '../../types/entity-form';
import { FormMode } from '@/features/core/tanstack-query-api';
import { TextFieldRenderer } from './renderers/TextFieldRenderer';
import { NumberFieldRenderer } from './renderers/NumberFieldRenderer';
import { SelectFieldRenderer } from './renderers/SelectFieldRenderer';
import { CheckboxFieldRenderer } from './renderers/CheckboxFieldRenderer';
import { DateFieldRenderer } from './renderers/DateFieldRenderer';
import { TextareaFieldRenderer } from './renderers/TextareaFieldRenderer';
import { SwitchFieldRenderer } from './renderers/SwitchFieldRenderer';

export interface FieldRendererProps {
  field: FieldConfig;
  form: any;
  formMode: FormMode;
  data?: any;
  isReadOnly: boolean;
  key?: string;
}

export function renderField(props: FieldRendererProps) {
  const field = props.field;
  const formMode = props.formMode;
  
  if (field.type === 'text' || field.type === 'email' || field.type === 'password') {
    return React.createElement(TextFieldRenderer, props);
  }
  
  if (field.type === 'number') {
    return React.createElement(NumberFieldRenderer, props);
  }
  
  if (field.type === 'select' || field.type === 'dependent-select') {
    return React.createElement(SelectFieldRenderer, props);
  }
  
  if (field.type === 'checkbox') {
    return React.createElement(CheckboxFieldRenderer, props);
  }
  
  if (field.type === 'date') {
    return React.createElement(DateFieldRenderer, props);
  }
  
  if (field.type === 'textarea') {
    return React.createElement(TextareaFieldRenderer, props);
  }
  
  if (field.type === 'switch') {
    return React.createElement(SwitchFieldRenderer, props);
  }
  
  return React.createElement(TextFieldRenderer, props);
}

export { TextFieldRenderer };
export { NumberFieldRenderer };
export { SelectFieldRenderer };
export { CheckboxFieldRenderer };
export { DateFieldRenderer };
export { TextareaFieldRenderer };
export { SwitchFieldRenderer };
