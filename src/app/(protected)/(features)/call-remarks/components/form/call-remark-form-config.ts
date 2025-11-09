import type { FormConfig, FormStep, FieldConfig, RelationshipConfig } from './form-types';

/**
 * Configuration for CallRemark form
 * This file is auto-generated. To modify the form structure, update the generator templates.
 */
export const callRemarkFormConfig: FormConfig = {
  entity: 'CallRemark',

  steps: [
    {
      id: 'basic',
      title: 'Basic Information',
      description: 'Enter essential details',
      fields: ['remark', 'status'],
      relationships: [],
      validation: {
        mode: 'onBlur',
        validateOnNext: true,
      },
    },
    {
      id: 'assignment',
      title: 'Assignment & Date',
      description: 'Assign users, set dates and status',
      fields: ['dateTime'],
      relationships: [],
      validation: {
        mode: 'onBlur',
        validateOnNext: true,
      },
    },
    {
      id: 'other',
      title: 'Additional Relations',
      description: 'Other connections and references',
      fields: [],
      relationships: ['call'],
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
      name: 'remark',
      type: 'text',
      label: 'Remark',
      placeholder: 'Enter remark',
      required: true,
      validation: {
        required: true,
        maxLength: 2000,
      },
      ui: {},
    },
    {
      name: 'dateTime',
      type: 'date',
      label: 'Date Time',
      placeholder: 'Enter date time',
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

  relationships: [
    {
      name: 'call',
      type: 'many-to-one',
      targetEntity: 'call',
      displayField: 'name',
      primaryKey: 'id',
      required: true,
      multiple: false,
      category: 'other',
      api: {
        useGetAllHook: 'useGetAllCalls',
        useSearchHook: 'useSearchCalls',
        useCountHook: 'useCountCalls',
        entityName: 'Calls',
      },
      creation: {
        canCreate: true,
        createPath: '/calls/new',
        createPermission: 'call:create:inline',
      },
      ui: {
        label: 'Call',
        placeholder: 'Select call',
        icon: '🔗',
      },
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
      storagePrefix: 'CallRemarkFormState_',
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

export const callRemarkFormHelpers = {
  getStepById: (stepId: string) => callRemarkFormConfig.steps.find((step) => step.id === stepId),
  getFieldConfig: (fieldName: string) =>
    callRemarkFormConfig.fields.find((field) => field.name === fieldName),
  getRelationshipConfig: (relationshipName: string) =>
    callRemarkFormConfig.relationships.find((rel) => rel.name === relationshipName),
  getStepFields: (stepId: string) => {
    const step = callRemarkFormConfig.steps.find((s) => s.id === stepId);
    return step ? [...step.fields, ...step.relationships] : [];
  },
};
