import type { FormConfig, FormStep, FieldConfig, RelationshipConfig } from "./form-types";

/**
 * Configuration for City form
 * This file is auto-generated. To modify the form structure, update the generator templates.
 */
export const cityFormConfig: FormConfig = {
  entity: 'City',
  
  // Form steps configuration
  steps: [
    {
      id: 'basic',
      title: 'Basic Information',
      description: 'Enter essential details',
      fields: [
        'name',
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
        'district',
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
  ],

  // Relationship definitions
  relationships: [
    {
      name: 'district',
      type: 'many-to-one',
      targetEntity: 'district',
      displayField: 'name',
      primaryKey: 'id',
      required: true,
      multiple: false,
      category: 'geographic',
      api: {
        useGetAllHook: 'useGetAllDistricts',
        useSearchHook: 'useSearchDistricts',
        useCountHook: 'useCountDistricts',
        entityName: 'Districts',
      },
      creation: {
        canCreate: true,
        createPath: '/districts/new',
        createPermission: 'district:create',
      },
      ui: {
        label: 'District',
        placeholder: 'Select district',
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
      storagePrefix: 'CityFormState_',
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
export const cityFormHelpers = {
  getStepById: (stepId: string) => cityFormConfig.steps.find(step => step.id === stepId),
  getFieldConfig: (fieldName: string) => cityFormConfig.fields.find(field => field.name === fieldName),
  getRelationshipConfig: (relationshipName: string) => cityFormConfig.relationships.find(rel => rel.name === relationshipName),
  getStepFields: (stepId: string) => {
    const step = cityFormConfig.steps.find(s => s.id === stepId);
    return step ? [...step.fields, ...step.relationships] : [];
  }
};
