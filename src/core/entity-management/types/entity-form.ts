import { ReactNode } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormMode, UseApiQueryOptions } from '@/features/core/tanstack-query-api';
import { EntityFormStore } from '../components/entity-form/store';

/**
 * Display mode for entity forms
 */
export type DisplayMode = 'dialog' | 'sheet' | 'page';

/**
 * Supported form field types
 */
export type FieldType = 
  | 'text' 
  | 'number' 
  | 'email' 
  | 'password' 
  | 'select' 
  | 'multiselect'
  | 'dependent-select' 
  | 'phone' 
  | 'date' 
  | 'checkbox' 
  | 'switch' 
  | 'textarea'
  | 'custom';

/**
 * Base field configuration
 */
export interface BaseFieldConfig {
  name: string;
  label: string;
  description?: string;
  required?: boolean;
  disabled?: boolean | ((mode: FormMode, data?: any) => boolean);
  hidden?: boolean | ((mode: FormMode, data?: any) => boolean);
  icon?: ReactNode;
  className?: string;
  gridClassName?: string;
  readOnlyFormatter?: (value: any, data?: any) => ReactNode;
}

/**
 * Input field configuration
 */
export interface InputFieldConfig extends BaseFieldConfig {
  type: 'text' | 'number' | 'email' | 'password';
  placeholder?: string;
  validation?: {
    pattern?: {
      value: RegExp;
      message: string;
    };
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
  };
}

/**
 * SelectFieldConfig for endpoints
 */
export interface SelectEndpointOptions {
  endpoint: string;
  labelKey?: string;
  valueKey?: string;
  queryOptions?: UseApiQueryOptions<any>;
  /**
   * Dependencies for this select field.
   * When specified, the options will be refetched when dependency values change.
   * Typically used for dependent dropdowns (like Country → State → City).
   */
  dependencies?: string | string[] | Record<string, any>;
}

/**
 * Select field configuration
 */
export interface SelectFieldConfig extends BaseFieldConfig {
  type: 'select';
  placeholder?: string;
  options: 
    | { label: string; value: string }[] 
    | ((data?: any) => { label: string; value: string }[])
    | SelectEndpointOptions;
  searchable?: boolean;
  loadOptions?: (searchText: string) => Promise<{ label: string; value: string }[]>;
  
  /**
   * Dependent field configuration.
   * Used to define which fields this select depends on.
   * When those fields change, this field's value will be reset and options refetched.
   * 
   * Example: "callTypeId" or ["stateId", "cityId"]
   */
  dependsOn?: string | string[];
  
  /**
   * When true, the field's value will be automatically cleared when its dependencies change.
   * Default is true for fields with dependsOn specified.
   */
  clearOnDependencyChange?: boolean;
  
  /**
   * Function to fetch options for dependent fields.
   * Receives an object with keys as dependency field names and values as their current values.
   * Example: { callTypeId: "123" } or { stateId: "10", cityId: "20" }
   * 
   * This is an alternative to using options with endpoint for dependent fields.
   */
  fetchOptions?: (dependencyValues: Record<string, any>) => Promise<{ label: string; value: string }[]>;
  
  /**
   * Whether to auto-select the first option when options change and there's only one option.
   * Useful for dependent fields when there's often only one valid option.
   * @default false
   */
  autoSelectSingleOption?: boolean;
  
  /**
   * Custom message to show when no options are available.
   * @default "No options available"
   */
  noOptionsMessage?: string;
  
  /**
   * Custom message to show when dependencies are not selected.
   * @default "Select [dependency] first"
   */
  missingDependenciesMessage?: string;
  
  /**
   * Custom transform function for formatting dependency values before fetching options.
   * Useful when you need to transform values before sending to the API.
   */
  transformDependencyValues?: (dependencies: Record<string, any>) => Record<string, any>;
  
  /**
   * The field that, if this field is dependent on multiple fields, acts as the primary dependency.
   * This is used to determine which API endpoint to use if this field has both dependsOn and options.endpoint.
   */
  primaryDependencyField?: string;
}

/**
 * Multi-select field configuration
 */
export interface MultiSelectFieldConfig extends BaseFieldConfig {
  type: 'multiselect';
  placeholder?: string;
  options: { label: string; value: string }[] | ((data?: any) => { label: string; value: string }[]);
  searchable?: boolean;
  loadOptions?: (searchText: string) => Promise<{ label: string; value: string }[]>;
}

/**
 * Phone field configuration
 */
export interface PhoneFieldConfig extends BaseFieldConfig {
  type: 'phone';
  placeholder?: string;
  defaultCountry?: string;
  copyFromField?: string;
  copyToField?: string;
}

/**
 * Date field configuration
 */
export interface DateFieldConfig extends BaseFieldConfig {
  type: 'date';
  placeholder?: string;
  min?: Date | string;
  max?: Date | string;
  format?: string;
}

/**
 * Checkbox field configuration
 */
export interface CheckboxFieldConfig extends BaseFieldConfig {
  type: 'checkbox';
}

/**
 * Switch field configuration
 */
export interface SwitchFieldConfig extends BaseFieldConfig {
  type: 'switch';
}

/**
 * Textarea field configuration
 */
export interface TextareaFieldConfig extends BaseFieldConfig {
  type: 'textarea';
  placeholder?: string;
  rows?: number;
}

/**
 * Custom field configuration
 */
export interface CustomFieldConfig extends BaseFieldConfig {
  type: 'custom';
  render: (props: {
    field: any;
    fieldState: any;
    formState: any;
    mode: FormMode;
    data?: any;
  }) => ReactNode;
  renderReadOnly?: (value: any, data?: any) => ReactNode;
}

/**
 * Dependent Select field configuration
 */
export interface DependentSelectFieldConfig extends BaseFieldConfig {
  type: 'dependent-select';
  placeholder?: string;
  
  /**
   * The parent field name(s) that this select depends on.
   * Can be a single field name or an array of field names.
   * Example: "callTypeId" or ["stateId", "cityId"]
   */
  dependsOn: string | string[];
  
  /**
   * API endpoint to fetch options when dependencies change.
   * Can be a string template with :param or {param} placeholders that will be
   * replaced with dependency values.
   * Example: "/api/states/:countryId/cities" or "/api/masters/call-type/{callTypeId}/sub-types"
   */
  endpoint?: string;
  
  /**
   * Whether to use path parameters instead of query parameters
   * @default false
   */
  usePathParams?: boolean;
  
  /**
   * Path to extract the array of items from the response
   * Example: 'content', 'data', 'data.items'
   */
  contentPath?: string;
  
  /**
   * Function to fetch options based on parent field values.
   * Receives an object with keys as dependency field names and values as their current values.
   * Example: { callTypeId: "123" } or { stateId: "10", cityId: "20" }
   * Must return a promise resolving to an array of { label: string; value: string } objects.
   */
  fetchOptions?: (dependencyValues: Record<string, any>) => Promise<{ label: string; value: string }[]>;
  
  /**
   * Whether to clear this field's value when dependencies change.
   * @default true
   */
  clearOnDependencyChange?: boolean;
  
  /**
   * Whether to auto-select the first option when options change and there's only one option.
   * @default false
   */
  autoSelectSingleOption?: boolean;
  
  /**
   * Custom message to show when no options are available.
   * @default "No options available"
   */
  noOptionsMessage?: string;
  
  /**
   * Custom message to show when dependencies are not selected.
   * @default "Select [dependency] first"
   */
  missingDependenciesMessage?: string;
  
  /**
   * Custom transform function for formatting the dependency values before fetching.
   * Useful when you need to transform the values before sending to the API.
   */
  transformDependencyValues?: (dependencies: Record<string, any>) => Record<string, any>;
  
  /**
   * Debug mode - logs additional information about the component lifecycle
   */
  debug?: boolean;
}

/**
 * Union type of all field configurations
 */
export type FieldConfig =
  | InputFieldConfig
  | SelectFieldConfig
  | MultiSelectFieldConfig
  | PhoneFieldConfig
  | DateFieldConfig
  | CheckboxFieldConfig
  | SwitchFieldConfig
  | TextareaFieldConfig
  | DependentSelectFieldConfig
  | CustomFieldConfig;

/**
 * Field layout types
 */
export type FieldLayout = 'default' | '2-column' | 'compact';

/**
 * Section configuration for grouping fields
 */
export interface SectionConfig {
  title?: string;
  description?: string;
  icon?: ReactNode;
  fields: FieldConfig[];
  layout?: FieldLayout;
  expandable?: boolean;
  defaultExpanded?: boolean;
  visible?: boolean | ((mode: FormMode, data?: any) => boolean);
}

/**
 * Props for the EntityForm component
 */
export interface EntityFormProps<TData = any> {
  // Modal state
  open: boolean;
  onClose: () => void;
  
  // Display configuration
  displayMode?: DisplayMode;
  
  // Form configuration
  formMode: FormMode;
  onChangeFormMode?: (mode: FormMode) => void;
  title?: string | ((mode: FormMode) => string);
  description?: string | ((mode: FormMode) => string);
  
  // Field configuration
  sections?: SectionConfig[];
  fields?: FieldConfig[];
  layout?: FieldLayout;
  
  // Data and callbacks
  data?: TData;
  onSubmit: (data: any) => void | Promise<void>;
  onDelete?: (data: TData) => void | Promise<void>;
  
  // Permissions
  canEdit?: boolean;
  canDelete?: boolean;
  
  // Form control
  form?: UseFormReturn<any>;
  defaultValues?: any;
  validationSchema?: any;
  
  // UI states
  isSubmitting?: boolean;
  submitError?: string;
  
  // Custom rendering
  renderFooter?: (props: {
    formMode: FormMode;
    isSubmitting: boolean;
    onClose: () => void;
    onEdit?: () => void;
    onSubmit: () => void;
    canEdit: boolean;
    canDelete: boolean;
  }) => ReactNode;
  
  renderHeader?: (props: {
    formMode: FormMode;
    title?: string;
    description?: string;
  }) => ReactNode;
  
  // Zustand state management (optional)
  store?: EntityFormStore<TData>;
}
