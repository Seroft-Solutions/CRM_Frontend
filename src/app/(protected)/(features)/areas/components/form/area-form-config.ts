import type { FormConfig, FormStep, FieldConfig, RelationshipConfig } from "./form-types";

/**
 * Configuration for Area form
 * This file is auto-generated. To modify the form structure, update the generator templates.
 */
export const areaFormConfig: FormConfig = {
  entity: 'Area',
  
  // Form steps configuration
  steps: [
    {
      id: 'basic',
      title: 'Basic Information',
      description: 'Enter essential details',
      fields: [
        'name',
        'pincode',
      ],
      relationships: [
      ],
      validation: {
        mode: 'onBlur',
        validateOnNext: true
      }
    },
    {
      id: 'geographic',
      title: 'Location Details',
      description: 'Select geographic information',
      fields: [
      ],
      relationships: [
        'city',
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
      name: 'name',
      type: 'text',
      label: 'Name',
      placeholder: 'Enter name (minimum 2 characters)',
      required: true,
      validation: {
        required: true,
        minLength: 2,
        maxLength: 100,
      },
      ui: {
      }
    },
    {
      name: 'pincode',
      type: 'text',
      label: 'Pincode',
      placeholder: 'Enter pincode',
      required: true,
      validation: {
        required: true,
        minLength: 6,
        maxLength: 6,
        pattern: /^[0-9]{6}$/,
      },
      ui: {
      }
    },
  ],

  // Relationship definitions
  relationships: [
    {
      name: 'city',
      type: 'many-to-one',
      targetEntity: 'city',
      displayField: 'name',
      primaryKey: 'id',
      required: true,
      multiple: false,
      category: 'geographic',
      api: {
        useGetAllHook: 'useGetAllCities',
        useSearchHook: 'useSearchCities',
        useCountHook: 'useCountCities',
        entityName: 'Cities',
      },
      creation: {
        canCreate: true,
        createPath: '/cities/new',
        createPermission: 'city:create:inline',
      },
      ui: {
        label: 'City',
        placeholder: 'Select city',
        icon: '📍',
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
      storagePrefix: 'AreaFormState_',
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
export const areaFormHelpers = {
  getStepById: (stepId: string) => areaFormConfig.steps.find(step => step.id === stepId),
  getFieldConfig: (fieldName: string) => areaFormConfig.fields.find(field => field.name === fieldName),
  getRelationshipConfig: (relationshipName: string) => areaFormConfig.relationships.find(rel => rel.name === relationshipName),
  getStepFields: (stepId: string) => {
    const step = areaFormConfig.steps.find(s => s.id === stepId);
    return step ? [...step.fields, ...step.relationships] : [];
  }
};
