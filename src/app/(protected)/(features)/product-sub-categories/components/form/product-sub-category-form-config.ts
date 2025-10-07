// ===============================================================
// 🛑 AUTO-GENERATED FILE – DO NOT EDIT DIRECTLY 🛑
// - Source: code generation pipeline
// - To customize: use ./overrides/[filename].ts or feature-level
//   extensions (e.g., ./src/features/.../extensions/)
// - Direct edits will be overwritten on regeneration
// ===============================================================
import type { FormConfig, FormStep, FieldConfig, RelationshipConfig } from './form-types';

/**
 * Configuration for ProductSubCategory form
 * This file is auto-generated. To modify the form structure, update the generator templates.
 */
export const productSubCategoryFormConfig: FormConfig = {
  entity: 'ProductSubCategory',

  // Form steps configuration
  steps: [
    {
      id: 'basic',
      title: 'Basic Information',
      description: 'Enter essential details',
      fields: ['name', 'code', 'description', 'remark', 'status'],
      relationships: [],
      validation: {
        mode: 'onBlur',
        validateOnNext: true,
      },
    },
    {
      id: 'classification',
      title: 'Classification',
      description: 'Set priority, status, and categories',
      fields: [],
      relationships: ['category'],
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
      ui: {},
    },
    {
      name: 'code',
      type: 'text',
      label: 'Code',
      placeholder: 'Enter code',
      required: true,
      validation: {
        required: true,
        minLength: 2,
        maxLength: 20,
        pattern: /^[A-Za-z0-9_-]+$/,
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
        maxLength: 500,
      },
      ui: {},
    },
    {
      name: 'remark',
      type: 'text',
      label: 'Remark',
      placeholder: 'Enter remark',
      required: false,
      validation: {
        required: false,
        maxLength: 1000,
      },
      ui: {},
    },
  ],

  // Relationship definitions
  relationships: [
    {
      name: 'category',
      type: 'many-to-one',
      targetEntity: 'productCategory',
      displayField: 'name',
      primaryKey: 'id',
      required: true,
      multiple: false,
      category: 'classification',
      api: {
        useGetAllHook: 'useGetAllProductCategories',
        useSearchHook: 'useSearchProductCategories',
        useCountHook: 'useCountProductCategories',
        entityName: 'ProductCategories',
      },
      creation: {
        canCreate: true,
        createPath: '/product-categories/new',
        createPermission: 'productCategory:create:inline',
      },
      ui: {
        label: 'Category',
        placeholder: 'Select category',
        icon: '🏷️',
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
      storagePrefix: 'ProductSubCategoryFormState_',
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
export const productSubCategoryFormHelpers = {
  getStepById: (stepId: string) =>
    productSubCategoryFormConfig.steps.find((step) => step.id === stepId),
  getFieldConfig: (fieldName: string) =>
    productSubCategoryFormConfig.fields.find((field) => field.name === fieldName),
  getRelationshipConfig: (relationshipName: string) =>
    productSubCategoryFormConfig.relationships.find((rel) => rel.name === relationshipName),
  getStepFields: (stepId: string) => {
    const step = productSubCategoryFormConfig.steps.find((s) => s.id === stepId);
    return step ? [...step.fields, ...step.relationships] : [];
  },
};
