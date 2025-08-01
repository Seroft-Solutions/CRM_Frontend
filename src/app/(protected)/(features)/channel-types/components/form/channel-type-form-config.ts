// ===============================================================
// 🛑 AUTO-GENERATED FILE – DO NOT EDIT DIRECTLY 🛑
// - Source: code generation pipeline
// - To customize: use ./overrides/[filename].ts or feature-level
//   extensions (e.g., ./src/features/.../extensions/)
// - Direct edits will be overwritten on regeneration
// ===============================================================
import type { FormConfig, FormStep, FieldConfig, RelationshipConfig } from "./form-types";

/**
 * Configuration for ChannelType form
 * This file is auto-generated. To modify the form structure, update the generator templates.
 */
export const channelTypeFormConfig: FormConfig = {
  entity: 'ChannelType',
  
  // Form steps configuration
  steps: [
    {
      id: 'basic',
      title: 'Basic Information',
      description: 'Enter essential details',
      fields: [
        'name',
        'description',
        'commissionRate',
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
      name: 'commissionRate',
      type: 'number',
      label: 'Commission Rate (%)',
      placeholder: 'Enter commission rate in percentage',
      required: false,
      validation: {
        required: false,
        min: 0,
        max: 100,
      },
      ui: {
        inputType: 'number',
      }
    },
  ],

  // Relationship definitions
  relationships: [
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
      storagePrefix: 'ChannelTypeFormState_',
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
export const channelTypeFormHelpers = {
  getStepById: (stepId: string) => channelTypeFormConfig.steps.find(step => step.id === stepId),
  getFieldConfig: (fieldName: string) => channelTypeFormConfig.fields.find(field => field.name === fieldName),
  getRelationshipConfig: (relationshipName: string) => channelTypeFormConfig.relationships.find(rel => rel.name === relationshipName),
  getStepFields: (stepId: string) => {
    const step = channelTypeFormConfig.steps.find(s => s.id === stepId);
    return step ? [...step.fields, ...step.relationships] : [];
  }
};
