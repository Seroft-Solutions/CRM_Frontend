import type { FormConfig, FormStep, FieldConfig, RelationshipConfig } from "./form-types";

/**
 * Configuration for Role form
 * This file is auto-generated. To modify the form structure, update the generator templates.
 */
export const roleFormConfig: FormConfig = {
  entity: 'Role',
  
  // Form steps configuration
  steps: [
    {
      id: 'basic',
      title: 'Basic Information',
      description: 'Enter essential details',
      fields: [
        'name',
        'description',
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
      title: 'People & Assignment',
      description: 'Assign users and responsibilities',
      fields: [
      ],
      relationships: [
        'users',
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
      placeholder: 'Enter name',
      required: true,
      validation: {
        required: true,
        minLength: 2,
        maxLength: 50,
      },
      ui: {
      }
    },
    {
      name: 'description',
      type: 'text',
      label: 'Description',
      placeholder: 'Enter description',
      required: false,
      validation: {
        required: false,
        maxLength: 200,
      },
      ui: {
      }
    },
  ],

  // Relationship definitions
  relationships: [
    {
      name: 'users',
      type: 'many-to-many',
      targetEntity: 'userProfile',
      displayField: 'name',
      primaryKey: 'id',
      required: false,
      multiple: true,
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
        label: 'Users',
        placeholder: 'Select users',
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
      storagePrefix: 'RoleFormState_',
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
    }
  }
};

// Export utility functions for external use
export const roleFormHelpers = {
  getStepById: (stepId: string) => roleFormConfig.steps.find(step => step.id === stepId),
  getFieldConfig: (fieldName: string) => roleFormConfig.fields.find(field => field.name === fieldName),
  getRelationshipConfig: (relationshipName: string) => roleFormConfig.relationships.find(rel => rel.name === relationshipName),
  getStepFields: (stepId: string) => {
    const step = roleFormConfig.steps.find(s => s.id === stepId);
    return step ? [...step.fields, ...step.relationships] : [];
  }
};
