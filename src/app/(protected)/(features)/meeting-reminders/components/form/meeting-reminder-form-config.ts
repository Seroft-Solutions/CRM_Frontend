import type { FormConfig, FormStep, FieldConfig, RelationshipConfig } from "./form-types";

/**
 * Configuration for MeetingReminder form
 * This file is auto-generated. To modify the form structure, update the generator templates.
 */
export const meetingReminderFormConfig: FormConfig = {
  entity: 'MeetingReminder',
  
  // Form steps configuration
  steps: [
    {
      id: 'basic',
      title: 'Basic Information',
      description: 'Enter essential details',
      fields: [
        'reminderType',
        'failureReason',
        'reminderMinutesBefore',
      ],
      relationships: [
      ],
      validation: {
        mode: 'onBlur',
        validateOnNext: true
      }
    },
    {
      id: 'assignment',
      title: 'Assignment & Date',
      description: 'Assign users, set dates and status',
      fields: [
        'triggeredAt',
      ],
      relationships: [
      ],
      validation: {
        mode: 'onBlur',
        validateOnNext: true
      }
    },
    {
      id: 'settings',
      title: 'Settings & Files',
      description: 'Configure options',
      fields: [
        'isTriggered',
      ],
      relationships: [
      ],
      validation: {
        mode: 'onBlur',
        validateOnNext: true
      }
    },
    {
      id: 'other',
      title: 'Additional Relations',
      description: 'Other connections and references',
      fields: [
      ],
      relationships: [
        'meeting',
      ],
      validation: {
        mode: 'onBlur',
        validateOnNext: true
      }
    },
    {
      id: 'review',
      title: 'Review',
      description: 'Confirm your details',
      fields: [
      ],
      relationships: [
      ],
      validation: {
        mode: 'onBlur',
        validateOnNext: true
      }
    },
  ],

  // Field definitions
  fields: [
    {
      name: 'reminderType',
      type: 'text',
      label: 'Reminder Type',
      placeholder: 'Enter reminder type',
      required: true,
      validation: {
        required: true,
      },
      ui: {
      }
    },
    {
      name: 'reminderMinutesBefore',
      type: 'number',
      label: 'Reminder Minutes Before',
      placeholder: 'Enter reminder minutes before',
      required: true,
      validation: {
        required: true,
        min: 5,
        max: 43200,
      },
      ui: {
        inputType: 'number',
      }
    },
    {
      name: 'isTriggered',
      type: 'boolean',
      label: 'Is Triggered',
      placeholder: 'Enter is triggered',
      required: false,
      validation: {
        required: false,
      },
      ui: {
      }
    },
    {
      name: 'triggeredAt',
      type: 'date',
      label: 'Triggered At',
      placeholder: 'Enter triggered at',
      required: false,
      validation: {
        required: false,
      },
      ui: {
      }
    },
    {
      name: 'failureReason',
      type: 'text',
      label: 'Failure Reason',
      placeholder: 'Enter failure reason',
      required: false,
      validation: {
        required: false,
        maxLength: 500,
      },
      ui: {
      }
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
      required: true,
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
      }
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
    }
  },

  behavior: {
    autoSave: {
      enabled: false,
      debounceMs: 2000,
    },
    persistence: {
      enabled: true,
      sessionTimeoutMinutes: 30,
      storagePrefix: 'MeetingReminderFormState_',
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
    }
  }
};

// Export utility functions for external use
export const meetingReminderFormHelpers = {
  getStepById: (stepId: string) => meetingReminderFormConfig.steps.find(step => step.id === stepId),
  getFieldConfig: (fieldName: string) => meetingReminderFormConfig.fields.find(field => field.name === fieldName),
  getRelationshipConfig: (relationshipName: string) => meetingReminderFormConfig.relationships.find(rel => rel.name === relationshipName),
  getStepFields: (stepId: string) => {
    const step = meetingReminderFormConfig.steps.find(s => s.id === stepId);
    return step ? [...step.fields, ...step.relationships] : [];
  }
};
