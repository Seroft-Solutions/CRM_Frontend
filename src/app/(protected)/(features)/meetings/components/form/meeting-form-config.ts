// ===============================================================
// 🛑 AUTO-GENERATED FILE – DO NOT EDIT DIRECTLY 🛑
// - Source: code generation pipeline
// - To customize: use ./overrides/[filename].ts or feature-level
//   extensions (e.g., ./src/features/.../extensions/)
// - Direct edits will be overwritten on regeneration
// ===============================================================
import type { FormConfig, FormStep, FieldConfig, RelationshipConfig } from './form-types';

/**
 * Configuration for Meeting form
 * This file is auto-generated. To modify the form structure, update the generator templates.
 */
export const meetingFormConfig: FormConfig = {
  entity: 'Meeting',

  // Form steps configuration
  steps: [
    {
      id: 'basic',
      title: 'Basic Information',
      description: 'Enter essential details',
      fields: [
        'title',
        'description',
        'meetingUrl',
        'googleCalendarEventId',
        'notes',
        'timeZone',
        'meetingStatus',
        'meetingType',
        'status',
        'duration',
      ],
      relationships: [],
      validation: {
        mode: 'onBlur',
        validateOnNext: true,
      },
    },
    {
      id: 'business',
      title: 'Business Relations',
      description: 'Connect with customers and sources',
      fields: [],
      relationships: ['assignedCustomer'],
      validation: {
        mode: 'onBlur',
        validateOnNext: true,
      },
    },
    {
      id: 'assignment',
      title: 'Assignment & Date',
      description: 'Assign users, set dates and status',
      fields: ['meetingDateTime', 'createdAt', 'updatedAt'],
      relationships: [],
      validation: {
        mode: 'onBlur',
        validateOnNext: true,
      },
    },
    {
      id: 'users',
      title: 'People & Users',
      description: 'Assign users and responsibilities',
      fields: [],
      relationships: ['organizer'],
      validation: {
        mode: 'onBlur',
        validateOnNext: true,
      },
    },
    {
      id: 'settings',
      title: 'Settings & Files',
      description: 'Configure options',
      fields: ['isRecurring'],
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

  // Field definitions
  fields: [
    {
      name: 'meetingDateTime',
      type: 'date',
      label: 'Meeting Date Time',
      placeholder: 'Enter meeting date time',
      required: true,
      validation: {
        required: true,
      },
      ui: {},
    },
    {
      name: 'duration',
      type: 'number',
      label: 'Duration',
      placeholder: 'Enter duration',
      required: true,
      validation: {
        required: true,
        min: 15,
        max: 480,
      },
      ui: {
        inputType: 'number',
      },
    },
    {
      name: 'title',
      type: 'text',
      label: 'Title',
      placeholder: 'Enter title',
      required: true,
      validation: {
        required: true,
        minLength: 2,
        maxLength: 200,
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
        maxLength: 1000,
      },
      ui: {},
    },
    {
      name: 'meetingUrl',
      type: 'text',
      label: 'Meeting Url',
      placeholder: 'Enter meeting url',
      required: false,
      validation: {
        required: false,
        maxLength: 500,
      },
      ui: {},
    },
    {
      name: 'googleCalendarEventId',
      type: 'text',
      label: 'Google Calendar Event Id',
      placeholder: 'Enter google calendar event id',
      required: false,
      validation: {
        required: false,
        maxLength: 100,
      },
      ui: {},
    },
    {
      name: 'notes',
      type: 'text',
      label: 'Notes',
      placeholder: 'Enter notes',
      required: false,
      validation: {
        required: false,
        maxLength: 2000,
      },
      ui: {},
    },
    {
      name: 'isRecurring',
      type: 'boolean',
      label: 'Is Recurring',
      placeholder: 'Enter is recurring',
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
    {
      name: 'meetingStatus',
      type: 'text',
      label: 'Meeting Status',
      placeholder: 'Enter meeting status',
      required: true,
      validation: {
        required: true,
      },
      ui: {},
    },
    {
      name: 'meetingType',
      type: 'text',
      label: 'Meeting Type',
      placeholder: 'Enter meeting type',
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
    {
      name: 'createdAt',
      type: 'date',
      label: 'Created At',
      placeholder: 'Enter created at',
      required: false,
      validation: {
        required: false,
      },
      ui: {},
    },
    {
      name: 'updatedAt',
      type: 'date',
      label: 'Updated At',
      placeholder: 'Enter updated at',
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
      name: 'organizer',
      type: 'many-to-one',
      targetEntity: 'userProfile',
      displayField: 'displayName',
      primaryKey: 'id',
      required: false,
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
        createPermission: 'userProfile:create:inline',
      },
      ui: {
        label: 'Organizer',
        placeholder: 'Select organizer',
        icon: '👥',
      },
    },
    {
      name: 'assignedCustomer',
      type: 'many-to-one',
      targetEntity: 'customer',
      displayField: 'customerBusinessName',
      primaryKey: 'id',
      required: false,
      multiple: false,
      category: 'business',
      api: {
        useGetAllHook: 'useGetAllCustomers',
        useSearchHook: 'useSearchCustomers',
        useCountHook: 'useCountCustomers',
        entityName: 'Customers',
      },
      creation: {
        canCreate: true,
        createPath: '/customers/new',
        createPermission: 'customer:create:inline',
      },
      ui: {
        label: 'Assigned Customer',
        placeholder: 'Select assigned customer',
        icon: '🏢',
      },
    },
    {
      name: 'call',
      type: 'many-to-one',
      targetEntity: 'call',
      displayField: 'name',
      primaryKey: 'id',
      required: false,
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
      storagePrefix: 'MeetingFormState_',
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
export const meetingFormHelpers = {
  getStepById: (stepId: string) => meetingFormConfig.steps.find((step) => step.id === stepId),
  getFieldConfig: (fieldName: string) =>
    meetingFormConfig.fields.find((field) => field.name === fieldName),
  getRelationshipConfig: (relationshipName: string) =>
    meetingFormConfig.relationships.find((rel) => rel.name === relationshipName),
  getStepFields: (stepId: string) => {
    const step = meetingFormConfig.steps.find((s) => s.id === stepId);
    return step ? [...step.fields, ...step.relationships] : [];
  },
};
