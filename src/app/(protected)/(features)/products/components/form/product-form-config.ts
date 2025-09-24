// ===============================================================
// 🛑 AUTO-GENERATED FILE – DO NOT EDIT DIRECTLY 🛑
// - Source: code generation pipeline
// - To customize: use ./overrides/[filename].ts or feature-level
//   extensions (e.g., ./src/features/.../extensions/)
// - Direct edits will be overwritten on regeneration
// ===============================================================
import type { FormConfig, FormStep, FieldConfig, RelationshipConfig } from './form-types';

/**
 * Configuration for Product form
 * This file is auto-generated. To modify the form structure, update the generator templates.
 */
export const productFormConfig: FormConfig = {
  entity: 'Product',

  // Form steps configuration
  steps: [
    {
      id: 'basic',
      title: 'Basic Information',
      description: 'Enter essential details',
      fields: [
        'name',
        'code',
        'description',
        'remark',
        'status',
        'basePrice',
        'minPrice',
        'maxPrice',
      ],
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
      relationships: ['category', 'subCategory'],
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
      name: 'basePrice',
      type: 'number',
      label: 'Base Price',
      placeholder: 'Enter base price',
      required: false,
      validation: {
        required: false,
        min: 0,
        max: 999999,
      },
      ui: {
        inputType: 'number',
      },
    },
    {
      name: 'minPrice',
      type: 'number',
      label: 'Min Price',
      placeholder: 'Enter min price',
      required: false,
      validation: {
        required: false,
        min: 0,
        max: 999999,
      },
      ui: {
        inputType: 'number',
      },
    },
    {
      name: 'maxPrice',
      type: 'number',
      label: 'Max Price',
      placeholder: 'Enter max price',
      required: false,
      validation: {
        required: false,
        min: 0,
        max: 999999,
      },
      ui: {
        inputType: 'number',
      },
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
  ],

  // Relationship definitions
  relationships: [
    {
      name: 'category',
      type: 'many-to-one',
      targetEntity: 'productCategory',
      displayField: 'name',
      primaryKey: 'id',
      required: false,
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
    {
      name: 'subCategory',
      type: 'many-to-one',
      targetEntity: 'productSubCategory',
      displayField: 'name',
      primaryKey: 'id',
      required: false,
      multiple: false,
      category: 'classification',
      api: {
        useGetAllHook: 'useGetAllProductSubCategories',
        useSearchHook: 'useSearchProductSubCategories',
        useCountHook: 'useCountProductSubCategories',
        entityName: 'ProductSubCategories',
      },
      creation: {
        canCreate: true,
        createPath: '/product-sub-categories/new',
        createPermission: 'productSubCategory:create:inline',
      },
      ui: {
        label: 'Sub Category',
        placeholder: 'Select sub category',
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
      storagePrefix: 'ProductFormState_',
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
export const productFormHelpers = {
  getStepById: (stepId: string) => productFormConfig.steps.find((step) => step.id === stepId),
  getFieldConfig: (fieldName: string) =>
    productFormConfig.fields.find((field) => field.name === fieldName),
  getRelationshipConfig: (relationshipName: string) =>
    productFormConfig.relationships.find((rel) => rel.name === relationshipName),
  getStepFields: (stepId: string) => {
    const step = productFormConfig.steps.find((s) => s.id === stepId);
    return step ? [...step.fields, ...step.relationships] : [];
  },
};
