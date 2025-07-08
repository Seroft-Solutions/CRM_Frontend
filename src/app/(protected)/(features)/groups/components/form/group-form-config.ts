import type { FormConfig, FormStep, FieldConfig, RelationshipConfig } from "./form-types";

/**
 * Configuration for Group form
 * This file is auto-generated. To modify the form structure, update the generator templates.
 */
export const groupFormConfig: FormConfig = {
  entity: 'Group',
  
  // Form steps configuration
  steps: [
    {
      id: 'basic',
      title: 'Basic Information',
      description: 'Enter essential details',
      fields: [
        'keycloakGroupId',
        'name',
        'path',
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
      title: 'People & Users',
      description: 'Assign users and responsibilities',
      fields: [
      ],
      relationships: [
        'members',
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
        'isActive',
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
        'organization',
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
      name: 'keycloakGroupId',
      type: 'text',
      label: 'Keycloak Group Id',
      placeholder: 'Enter keycloak group id',
      required: true,
      validation: {
        required: true,
        pattern: /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,
      },
      ui: {
      }
    },
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
      name: 'path',
      type: 'text',
      label: 'Path',
      placeholder: 'Enter path',
      required: true,
      validation: {
        required: true,
        maxLength: 500,
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
        maxLength: 255,
      },
      ui: {
      }
    },
    {
      name: 'isActive',
      type: 'boolean',
      label: 'Is Active',
      placeholder: 'Enter is active',
      required: true,
      validation: {
        required: true,
      },
      ui: {
      }
    },
  ],

  // Relationship definitions
  relationships: [
    {
      name: 'organization',
      type: 'many-to-one',
      targetEntity: 'organization',
      displayField: 'name',
      primaryKey: 'id',
      required: false,
      multiple: false,
      category: 'other',
      api: {
        useGetAllHook: 'useGetAllOrganizations',
        useSearchHook: 'useSearchOrganizations',
        useCountHook: 'useCountOrganizations',
        entityName: 'Organizations',
      },
      creation: {
        canCreate: true,
        createPath: '/organizations/new',
        createPermission: 'organization:create:inline',
      },
      ui: {
        label: 'Organization',
        placeholder: 'Select organization',
        icon: '🔗',
      }
    },
    {
      name: 'members',
      type: 'many-to-many',
      targetEntity: 'userProfile',
      displayField: 'displayName',
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
        createPermission: 'userProfile:create:inline',
      },
      ui: {
        label: 'Members',
        placeholder: 'Select members',
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
      storagePrefix: 'GroupFormState_',
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
export const groupFormHelpers = {
  getStepById: (stepId: string) => groupFormConfig.steps.find(step => step.id === stepId),
  getFieldConfig: (fieldName: string) => groupFormConfig.fields.find(field => field.name === fieldName),
  getRelationshipConfig: (relationshipName: string) => groupFormConfig.relationships.find(rel => rel.name === relationshipName),
  getStepFields: (stepId: string) => {
    const step = groupFormConfig.steps.find(s => s.id === stepId);
    return step ? [...step.fields, ...step.relationships] : [];
  }
};
