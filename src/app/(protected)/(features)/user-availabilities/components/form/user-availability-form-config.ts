import type { FormConfig, FormStep, FieldConfig, RelationshipConfig } from './form-types';

/**
 * Configuration for UserAvailability form
 * This file is auto-generated. To modify the form structure, update the generator templates.
 */
export const userAvailabilityFormConfig: FormConfig = {
  entity: 'UserAvailability',

  // Form steps configuration
  steps: [
    {
      id: 'basic',
      title: 'Basic Information',
      description: 'Enter essential details',
      fields: ['dayOfWeek', 'startTime', 'endTime', 'timeZone'],
      relationships: [],
      validation: {
        mode: 'onBlur',
        validateOnNext: true,
      },
    },
    {
      id: 'dates',
      title: 'Date & Time',
      description: 'Set relevant dates',
      fields: ['effectiveFrom', 'effectiveTo'],
      relationships: [],
      validation: {
        mode: 'onBlur',
        validateOnNext: true,
      },
    },
    {
      id: 'settings',
      title: 'Settings & Files',
      description: 'Configure options',
      fields: ['isAvailable'],
      relationships: [],
      validation: {
        mode: 'onBlur',
        validateOnNext: true,
      },
    },
    {
      id: 'users',
      title: 'People & Assignment',
      description: 'Assign users and responsibilities',
      fields: [],
      relationships: ['user'],
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

  // Field definitions
  fields: [
    {
      name: 'dayOfWeek',
      type: 'text',
      label: 'Day Of Week',
      placeholder: 'Enter day of week',
      required: true,
      validation: {
        required: true,
      },
      ui: {},
    },
    {
      name: 'startTime',
      type: 'text',
      label: 'Start Time',
      placeholder: 'Enter start time',
      required: true,
      validation: {
        required: true,
        pattern: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
      },
      ui: {},
    },
    {
      name: 'endTime',
      type: 'text',
      label: 'End Time',
      placeholder: 'Enter end time',
      required: true,
      validation: {
        required: true,
        pattern: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
      },
      ui: {},
    },
    {
      name: 'isAvailable',
      type: 'boolean',
      label: 'Is Available',
      placeholder: 'Enter is available',
      required: true,
      validation: {
        required: true,
      },
      ui: {},
    },
    {
      name: 'effectiveFrom',
      type: 'date',
      label: 'Effective From',
      placeholder: 'Enter effective from',
      required: false,
      validation: {
        required: false,
      },
      ui: {},
    },
    {
      name: 'effectiveTo',
      type: 'date',
      label: 'Effective To',
      placeholder: 'Enter effective to',
      required: false,
      validation: {
        required: false,
      },
      ui: {},
    },
    {
      name: 'timeZone',
      type: 'text',
      label: 'Time Zone',
      placeholder: 'Enter time zone',
      required: false,
      validation: {
        required: false,
        maxLength: 50,
      },
      ui: {},
    },
  ],

  // Relationship definitions
  relationships: [
    {
      name: 'user',
      type: 'many-to-one',
      targetEntity: 'userProfile',
      displayField: 'displayName',
      primaryKey: 'id',
      required: true,
      multiple: false,
      category: 'user',
      api: {
        useGetAllHook: 'useGetAllUserProfiles',
        useSearchHook: 'useSearchUserProfiles',
        useCountHook: 'useCountUserProfiles',
        entityName: 'UserProfiles',
      },
      creation: {
        canCreate: true,
        createPath: '/user-profiles/new',
        createPermission: 'userProfile:create',
      },
      ui: {
        label: 'User',
        placeholder: 'Select user',
        icon: '👥',
      },
    },
  ],

  // Global form configuration
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
      storagePrefix: 'UserAvailabilityFormState_',
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
  },
};

// Export utility functions for external use
export const userAvailabilityFormHelpers = {
  getStepById: (stepId: string) =>
    userAvailabilityFormConfig.steps.find((step) => step.id === stepId),
  getFieldConfig: (fieldName: string) =>
    userAvailabilityFormConfig.fields.find((field) => field.name === fieldName),
  getRelationshipConfig: (relationshipName: string) =>
    userAvailabilityFormConfig.relationships.find((rel) => rel.name === relationshipName),
  getStepFields: (stepId: string) => {
    const step = userAvailabilityFormConfig.steps.find((s) => s.id === stepId);
    return step ? [...step.fields, ...step.relationships] : [];
  },
};
