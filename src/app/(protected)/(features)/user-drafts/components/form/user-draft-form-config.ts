import type { FormConfig, FormStep, FieldConfig, RelationshipConfig } from './form-types';

/**
 * Configuration for UserDraft form
 * This file is auto-generated. To modify the form structure, update the generator templates.
 */
export const userDraftFormConfig: FormConfig = {
  entity: 'UserDraft',

  steps: [
    {
      id: 'basic',
      title: 'Basic Information',
      description: 'Enter essential details',
      fields: ['keycloakUserId', 'type', 'jsonPayload', 'status'],
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
      name: 'keycloakUserId',
      type: 'text',
      label: 'Keycloak User Id',
      placeholder: 'Enter keycloak user id',
      required: false,
      validation: {
        required: false,
      },
      ui: {},
    },
    {
      name: 'type',
      type: 'text',
      label: 'Type',
      placeholder: 'Enter type',
      required: false,
      validation: {
        required: false,
        maxLength: 50,
      },
      ui: {},
    },
    {
      name: 'jsonPayload',
      type: 'text',
      label: 'Json Payload',
      placeholder: 'Enter json payload',
      required: true,
      validation: {
        required: true,
      },
      ui: {},
    },
    {
      name: 'status',
      type: 'text',
      label: 'Status',
      placeholder: 'Enter status',
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
      storagePrefix: 'UserDraftFormState_',
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

export const userDraftFormHelpers = {
  getStepById: (stepId: string) => userDraftFormConfig.steps.find((step) => step.id === stepId),
  getFieldConfig: (fieldName: string) =>
    userDraftFormConfig.fields.find((field) => field.name === fieldName),
  getRelationshipConfig: (relationshipName: string) =>
    userDraftFormConfig.relationships.find((rel) => rel.name === relationshipName),
  getStepFields: (stepId: string) => {
    const step = userDraftFormConfig.steps.find((s) => s.id === stepId);
    return step ? [...step.fields, ...step.relationships] : [];
  },
};
