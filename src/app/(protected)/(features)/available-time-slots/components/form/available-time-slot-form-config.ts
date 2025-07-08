import type { FormConfig, FormStep, FieldConfig, RelationshipConfig } from "./form-types";

/**
 * Configuration for AvailableTimeSlot form
 * This file is auto-generated. To modify the form structure, update the generator templates.
 */
export const availableTimeSlotFormConfig: FormConfig = {
  entity: 'AvailableTimeSlot',
  
  // Form steps configuration
  steps: [
    {
      id: 'basic',
      title: 'Basic Information',
      description: 'Enter essential details',
      fields: [
        'duration',
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
        'slotDateTime',
        'bookedAt',
      ],
      relationships: [
      ],
      validation: {
        mode: 'onBlur',
        validateOnNext: true
      }
    },
    {
      id: 'users',
      title: 'People & Users',
      description: 'Assign users and responsibilities',
      fields: [
      ],
      relationships: [
        'user',
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
        'isBooked',
      ],
      relationships: [
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
      name: 'slotDateTime',
      type: 'date',
      label: 'Slot Date Time',
      placeholder: 'Enter slot date time',
      required: true,
      validation: {
        required: true,
      },
      ui: {
      }
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
      }
    },
    {
      name: 'isBooked',
      type: 'boolean',
      label: 'Is Booked',
      placeholder: 'Enter is booked',
      required: false,
      validation: {
        required: false,
      },
      ui: {
      }
    },
    {
      name: 'bookedAt',
      type: 'date',
      label: 'Booked At',
      placeholder: 'Enter booked at',
      required: false,
      validation: {
        required: false,
      },
      ui: {
      }
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
        label: 'User',
        placeholder: 'Select user',
        icon: '👥',
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
      storagePrefix: 'AvailableTimeSlotFormState_',
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
    }
  }
};

// Export utility functions for external use
export const availableTimeSlotFormHelpers = {
  getStepById: (stepId: string) => availableTimeSlotFormConfig.steps.find(step => step.id === stepId),
  getFieldConfig: (fieldName: string) => availableTimeSlotFormConfig.fields.find(field => field.name === fieldName),
  getRelationshipConfig: (relationshipName: string) => availableTimeSlotFormConfig.relationships.find(rel => rel.name === relationshipName),
  getStepFields: (stepId: string) => {
    const step = availableTimeSlotFormConfig.steps.find(s => s.id === stepId);
    return step ? [...step.fields, ...step.relationships] : [];
  }
};
