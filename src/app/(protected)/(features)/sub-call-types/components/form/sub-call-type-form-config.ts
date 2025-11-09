import type { FormConfig } from './form-types';

/**
 * Configuration for SubCallType form
 * This file is auto-generated. To modify the form structure, update the generator templates.
 */
export const subCallTypeFormConfig: FormConfig = {
  entity: 'SubCallType',

  steps: [
    {
      id: 'basic',
      title: 'Basic Information',
      description: 'Enter essential details',
      relationships: ['callType'],
      fields: ['name', 'description', 'remark', 'status'],
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
  relationships: [
    {
      name: 'callType',
      type: 'many-to-one',
      targetEntity: 'callType',
      displayField: 'name',
      primaryKey: 'id',
      required: true,
      multiple: false,
      category: 'basic',
      api: {
        useGetAllHook: 'useGetAllCallTypes',
        useSearchHook: 'useSearchCallTypes',
        useCountHook: 'useCountCallTypes',
        entityName: 'CallTypes',
      },
      creation: {
        canCreate: true,
        createPath: '/call-types/new',
        createPermission: 'callType:create:inline',
      },
      ui: {
        label: 'Call Type',
        placeholder: 'Select call type',
        icon: '🏷️',
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
      name: 'remark',
      type: 'text',
      label: 'Remark',
      placeholder: 'Enter remark',
      required: false,
      validation: {
        required: false,
        maxLength: 1000,
      },
      ui: {},
    },
  ],

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
      storagePrefix: 'SubCallTypeFormState_',
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

export const subCallTypeFormHelpers = {
  getStepById: (stepId: string) => subCallTypeFormConfig.steps.find((step) => step.id === stepId),
  getFieldConfig: (fieldName: string) =>
    subCallTypeFormConfig.fields.find((field) => field.name === fieldName),
  getRelationshipConfig: (relationshipName: string) =>
    subCallTypeFormConfig.relationships.find((rel) => rel.name === relationshipName),
  getStepFields: (stepId: string) => {
    const step = subCallTypeFormConfig.steps.find((s) => s.id === stepId);
    return step ? [...step.fields, ...step.relationships] : [];
  },
};
