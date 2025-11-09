import type { FormConfig } from './form-types';

/**
 * Configuration for ChannelType form
 * This file is auto-generated. To modify the form structure, update the generator templates.
 */
export const channelTypeFormConfig: FormConfig = {
  entity: 'ChannelType',

  steps: [
    {
      id: 'basic',
      title: 'Basic Information',
      description: 'Enter essential details',
      fields: ['name', 'description', 'status', 'commissionRate'],
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
      name: 'name',
      type: 'text',
      label: 'Name',
      placeholder: 'Enter name (minimum 2 characters)',
      required: true,
      validation: {
        required: true,
        minLength: 2,
        maxLength: 50,
      },
      ui: {},
    },
    {
      name: 'description',
      type: 'text',
      label: 'Description',
      placeholder: 'Enter description',
      required: false,
      validation: {
        required: false,
        maxLength: 255,
      },
      ui: {},
    },
    {
      name: 'commissionRate',
      type: 'number',
      label: 'Commission Rate',
      placeholder: 'Enter commission rate',
      required: false,
      validation: {
        required: false,
        min: 0,
        max: 100,
      },
      ui: {
        inputType: 'number',
      },
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
      storagePrefix: 'ChannelTypeFormState_',
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
      useGeneratedSteps: false,
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

export const channelTypeFormHelpers = {
  getStepById: (stepId: string) => channelTypeFormConfig.steps.find((step) => step.id === stepId),
  getFieldConfig: (fieldName: string) =>
    channelTypeFormConfig.fields.find((field) => field.name === fieldName),
  getRelationshipConfig: (relationshipName: string) =>
    channelTypeFormConfig.relationships.find((rel) => rel.name === relationshipName),
  getStepFields: (stepId: string) => {
    const step = channelTypeFormConfig.steps.find((s) => s.id === stepId);
    return step ? [...step.fields, ...step.relationships] : [];
  },
};
