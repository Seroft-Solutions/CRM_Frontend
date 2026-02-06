import type { FormConfig } from './form-types';

/**
 * Configuration for Customer form
 */
export const customerFormConfig: FormConfig = {
  entity: 'Customer',

  steps: [
    {
      id: 'basic',
      title: 'Basic Information',
      description: 'Enter essential details',
      fields: [
        'customerBusinessName',
        'email',
        'mobile',
        'whatsApp',
        'contactPerson',
        'status',
        'addresses',
      ],
      relationships: [],
      validation: {
        mode: 'onBlur',
        validateOnNext: true,
      },
    },
    {
      id: 'review',
      title: 'Review',
      description: 'Confirm your details',
      fields: [],
      relationships: [],
      validation: {
        mode: 'onBlur',
        validateOnNext: true,
      },
    },
  ],

  fields: [
    {
      name: 'customerBusinessName',
      type: 'text',
      label: 'Customer Business Name',
      placeholder: 'Enter customer business name (minimum 2 characters)',
      required: true,
      validation: {
        required: true,
        minLength: 2,
        maxLength: 100,
      },
      ui: {},
    },
    {
      name: 'email',
      type: 'text',
      label: 'Email',
      placeholder: 'Enter email address (example: name@company.com)',
      required: false,
      validation: {
        required: false,
        maxLength: 254,
        pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      },
      ui: {},
    },
    {
      name: 'mobile',
      type: 'text',
      label: 'Mobile',
      placeholder: 'Enter phone number (example: 03001234567)',
      required: true,
      validation: {
        required: true,
        pattern: /^[+]?[0-9]{10,15}$/,
      },
      ui: {},
    },
    {
      name: 'whatsApp',
      type: 'text',
      label: 'Whats App',
      placeholder: 'Enter whats app',
      required: false,
      validation: {
        required: false,
        pattern: /^[+]?[0-9]{10,15}$/,
      },
      ui: {},
    },
    {
      name: 'contactPerson',
      type: 'text',
      label: 'Contact Person',
      placeholder: 'Enter contact person',
      required: false,
      validation: {
        required: false,
        minLength: 2,
        maxLength: 100,
      },
      ui: {},
    },
    {
      name: 'addresses',
      type: 'custom',
      label: 'Addresses',
      placeholder: 'e.g. street address and home',
      required: true,
      validation: {
        required: true,
      },
      ui: {},
    },
  ],

  relationships: [],

  validation: {
    mode: 'onBlur',
    revalidateMode: 'onBlur',
    submitTimeout: 30000,
  },

  ui: {
    responsive: {
      mobile: 'grid-cols-1',
      tablet: 'md:grid-cols-2',
      desktop: 'xl:grid-cols-3',
    },
    animations: {
      stepTransition: 'transition-all duration-300',
      fieldFocus: 'transition-colors',
    },
    spacing: {
      stepGap: 'space-y-6',
      fieldGap: 'gap-4 sm:gap-6',
      sectionGap: 'space-y-4',
    },
  },

  behavior: {
    autoSave: {
      enabled: false,
      debounceMs: 2000,
    },
    persistence: {
      enabled: true,
      sessionTimeoutMinutes: 30,
      storagePrefix: 'CustomerFormState_',
    },
    navigation: {
      confirmOnCancel: false,
      allowStepSkipping: false,
      validateOnNext: true,
    },
    crossEntity: {
      enabled: true,
      returnUrlKey: 'returnUrl',
      relationshipInfoKey: 'relationshipFieldInfo',
      newEntityIdKey: 'newlyCreatedEntityId',
    },
    rendering: {
      useGeneratedSteps: true,
    },
    drafts: {
      enabled: true,
      saveBehavior: 'onNavigation',
      confirmDialog: true,
      autoSave: false,
      maxDrafts: 5,
      showRestorationDialog: true,
    },
  },
};

export const customerFormHelpers = {
  getStepById: (stepId: string) => customerFormConfig.steps.find((step) => step.id === stepId),
  getFieldConfig: (fieldName: string) =>
    customerFormConfig.fields.find((field) => field.name === fieldName),
  getRelationshipConfig: (relationshipName: string) =>
    customerFormConfig.relationships.find((rel) => rel.name === relationshipName),
  getStepFields: (stepId: string) => {
    const step = customerFormConfig.steps.find((s) => s.id === stepId);
    return step ? [...step.fields, ...step.relationships] : [];
  },
};
