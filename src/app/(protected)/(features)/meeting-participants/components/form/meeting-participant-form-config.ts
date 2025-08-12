// ===============================================================
// 🛑 AUTO-GENERATED FILE – DO NOT EDIT DIRECTLY 🛑
// - Source: code generation pipeline
// - To customize: use ./overrides/[filename].ts or feature-level
//   extensions (e.g., ./src/features/.../extensions/)
// - Direct edits will be overwritten on regeneration
// ===============================================================
import type { FormConfig, FormStep, FieldConfig, RelationshipConfig } from './form-types';

/**
 * Configuration for MeetingParticipant form
 * This file is auto-generated. To modify the form structure, update the generator templates.
 */
export const meetingParticipantFormConfig: FormConfig = {
  entity: 'MeetingParticipant',

  // Form steps configuration
  steps: [
    {
      id: 'basic',
      title: 'Basic Information',
      description: 'Enter essential details',
      fields: ['email', 'name'],
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
      fields: ['responseDateTime'],
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
      fields: ['isRequired', 'hasAccepted', 'hasDeclined'],
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
      relationships: ['meeting'],
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
      name: 'email',
      type: 'text',
      label: 'Email',
      placeholder: 'Enter email address (example: name@company.com)',
      required: true,
      validation: {
        required: true,
        maxLength: 254,
        pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      },
      ui: {},
    },
    {
      name: 'name',
      type: 'text',
      label: 'Name',
      placeholder: 'Enter name (minimum 2 characters)',
      required: false,
      validation: {
        required: false,
        maxLength: 100,
      },
      ui: {},
    },
    {
      name: 'isRequired',
      type: 'boolean',
      label: 'Is Required',
      placeholder: 'Enter is required',
      required: false,
      validation: {
        required: false,
      },
      ui: {},
    },
    {
      name: 'hasAccepted',
      type: 'boolean',
      label: 'Has Accepted',
      placeholder: 'Enter has accepted',
      required: false,
      validation: {
        required: false,
      },
      ui: {},
    },
    {
      name: 'hasDeclined',
      type: 'boolean',
      label: 'Has Declined',
      placeholder: 'Enter has declined',
      required: false,
      validation: {
        required: false,
      },
      ui: {},
    },
    {
      name: 'responseDateTime',
      type: 'date',
      label: 'Response Date Time',
      placeholder: 'Enter response date time',
      required: false,
      validation: {
        required: false,
      },
      ui: {},
    },
  ],

  // Relationship definitions
  relationships: [
    {
      name: 'meeting',
      type: 'many-to-one',
      targetEntity: 'meeting',
      displayField: 'name',
      primaryKey: 'id',
      required: false,
      multiple: false,
      category: 'other',
      api: {
        useGetAllHook: 'useGetAllMeetings',
        useSearchHook: 'useSearchMeetings',
        useCountHook: 'useCountMeetings',
        entityName: 'Meetings',
      },
      creation: {
        canCreate: true,
        createPath: '/meetings/new',
        createPermission: 'meeting:create:inline',
      },
      ui: {
        label: 'Meeting',
        placeholder: 'Select meeting',
        icon: '🔗',
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
      storagePrefix: 'MeetingParticipantFormState_',
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
      useGeneratedSteps: false, // true = use generated step files, false = use dynamic renderer
    },
    drafts: {
      enabled: true,
      saveBehavior: 'onNavigation', // 'onNavigation' | 'onUnload' | 'both'
      confirmDialog: true,
      autoSave: false,
      maxDrafts: 5, // limit number of drafts per entity type per user
      showRestorationDialog: true,
    },
  },
};

// Export utility functions for external use
export const meetingParticipantFormHelpers = {
  getStepById: (stepId: string) =>
    meetingParticipantFormConfig.steps.find((step) => step.id === stepId),
  getFieldConfig: (fieldName: string) =>
    meetingParticipantFormConfig.fields.find((field) => field.name === fieldName),
  getRelationshipConfig: (relationshipName: string) =>
    meetingParticipantFormConfig.relationships.find((rel) => rel.name === relationshipName),
  getStepFields: (stepId: string) => {
    const step = meetingParticipantFormConfig.steps.find((s) => s.id === stepId);
    return step ? [...step.fields, ...step.relationships] : [];
  },
};
