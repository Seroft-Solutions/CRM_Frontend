/**
 * Type definitions for the entity form configuration system
 * This file is auto-generated. To modify types, update the generator templates.
 */

export interface FormConfig {
  entity: string;
  steps: FormStep[];
  fields: FieldConfig[];
  relationships: RelationshipConfig[];
  validation: ValidationConfig;
  ui: UIConfig;
  behavior: BehaviorConfig;
}

export interface FormStep {
  id: string;
  title: string;
  description: string;
  fields: string[];
  relationships: string[];
  conditionalRender?: ConditionalRule;
  validation?: StepValidation;
}

export interface FieldConfig {
  name: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'enum' | 'file' | 'textarea';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: Array<{ value: string; label: string }>;
  accept?: string;
  validation: FieldValidation;
  ui: FieldUIConfig;
}

export interface RelationshipConfig {
  name: string;
  type: 'many-to-one' | 'one-to-many' | 'many-to-many';
  targetEntity: string;
  displayField: string;
  primaryKey: string;
  required: boolean;
  multiple: boolean;
  category: 'geographic' | 'user' | 'classification' | 'business' | 'other';
  cascadingFilter?: CascadingFilter;
  api: RelationshipAPI;
  creation: CreationConfig;
  ui: RelationshipUIConfig;
}

export interface ConditionalRule {
  field: string;
  operator: 'equals' | 'notEquals' | 'contains' | 'exists';
  value: any;
  logic?: 'and' | 'or';
  rules?: ConditionalRule[];
}

export interface StepValidation {
  mode: 'onChange' | 'onBlur' | 'onSubmit';
  validateOnNext: boolean;
  customValidators?: ValidationFunction[];
}

export interface FieldValidation {
  required: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  customValidator?: ValidationFunction;
}

export interface FieldUIConfig {
  rows?: number;
  inputType?: string;
  className?: string;
  disabled?: boolean;
  readonly?: boolean;
}

export interface CascadingFilter {
  parentField: string;
  filterField: string;
  dependentFields?: string[];
}

export interface RelationshipAPI {
  useGetAllHook: string;
  useSearchHook: string;
  useCountHook?: string;
  entityName: string;
}

export interface CreationConfig {
  canCreate: boolean;
  createPath?: string;
  createPermission?: string;
}

export interface RelationshipUIConfig {
  label: string;
  placeholder: string;
  icon?: string;
  disabled?: boolean;
}

export interface ValidationConfig {
  mode: 'onChange' | 'onBlur' | 'onSubmit';
  revalidateMode: 'onChange' | 'onBlur' | 'onSubmit';
  submitTimeout: number;
}

export interface UIConfig {
  responsive: ResponsiveConfig;
  animations: AnimationConfig;
  spacing: SpacingConfig;
}

export interface ResponsiveConfig {
  mobile: string;
  tablet: string;
  desktop: string;
}

export interface AnimationConfig {
  stepTransition: string;
  fieldFocus: string;
}

export interface SpacingConfig {
  stepGap: string;
  fieldGap: string;
  sectionGap: string;
}

export interface BehaviorConfig {
  autoSave: AutoSaveConfig;
  persistence: PersistenceConfig;
  navigation: NavigationConfig;
  crossEntity: CrossEntityConfig;
  rendering?: RenderingConfig;
  drafts?: DraftsConfig;
}

export interface AutoSaveConfig {
  enabled: boolean;
  debounceMs: number;
}

export interface PersistenceConfig {
  enabled: boolean;
  sessionTimeoutMinutes: number;
  storagePrefix: string;
}

export interface NavigationConfig {
  confirmOnCancel: boolean;
  allowStepSkipping: boolean;
  validateOnNext: boolean;
}

export interface CrossEntityConfig {
  enabled: boolean;
  returnUrlKey: string;
  relationshipInfoKey: string;
  newEntityIdKey: string;
}

export interface RenderingConfig {
  useGeneratedSteps: boolean;
}

export interface DraftsConfig {
  enabled: boolean;
  saveBehavior: 'onNavigation' | 'onUnload' | 'both';
  confirmDialog: boolean;
  autoSave: boolean;
  maxDrafts: number;
  showRestorationDialog: boolean;
}

export type ValidationFunction = (value: any, allValues: Record<string, any>) => string | undefined;

// Form state interfaces
export interface FormState {
  currentStep: number;
  isLoading: boolean;
  isSubmitting: boolean;
  isDirty: boolean;
  errors: Record<string, any>;
  values: Record<string, any>;
  touchedFields: Record<string, boolean>;
  isAutoPopulating: boolean;
  // Draft-related state
  drafts: any[];
  isLoadingDrafts: boolean;
  isSavingDraft: boolean;
  isDeletingDraft: boolean;
  showDraftDialog: boolean;
  showRestorationDialog: boolean;
  currentDraftId?: number;
  draftRestorationInProgress: boolean;
}

export interface FormActions {
  nextStep: () => Promise<boolean>;
  prevStep: () => void;
  goToStep: (stepIndex: number) => Promise<boolean>;
  validateStep: (stepIndex?: number) => Promise<boolean>;
  submitForm: () => Promise<void>;
  resetForm: () => void;
  saveFormState: (forCrossNavigation?: boolean) => void;
  restoreFormState: () => boolean;
  handleEntityCreated: (entityId: number, relationshipName: string) => void;
  getNavigationProps: (fieldName: string) => {
    referrerForm: string;
    referrerSessionId: string;
    referrerField: string;
  };
  // Draft-related actions
  saveDraft: () => Promise<boolean>;
  loadDraft: (draftId: number) => Promise<boolean>;
  deleteDraft: (draftId: number) => Promise<boolean>;
  checkForDrafts: () => void;
}

export interface NavigationInfo {
  hasReferrer: boolean;
  urlParams: {
    ref?: string;
    sessionId?: string;
    field?: string;
    returnUrl?: string;
  };
  navigationState: any;
}

export interface FormContextValue {
  config: FormConfig;
  state: FormState;
  actions: FormActions;
  form: any; // React Hook Form instance
  navigation: NavigationInfo;
}

// Step component props
export interface StepComponentProps {
  stepConfig: FormStep;
  isActive: boolean;
  isCompleted: boolean;
}

// Field component props
export interface FieldComponentProps {
  fieldConfig: FieldConfig;
  value: any;
  onChange: (value: any) => void;
  error?: string;
  disabled?: boolean;
}

// Relationship component props
export interface RelationshipComponentProps {
  relationshipConfig: RelationshipConfig;
  value: any;
  onChange: (value: any) => void;
  error?: string;
  disabled?: boolean;
  parentFilter?: any;
}
