// ===============================================================
// 🛑 AUTO-GENERATED FILE – DO NOT EDIT DIRECTLY 🛑
// - Source: code generation pipeline
// - To customize: use ./overrides/[filename].ts or feature-level
//   extensions (e.g., ./src/features/.../extensions/)
// - Direct edits will be overwritten on regeneration
// ===============================================================
import type { FormConfig, FormStep, FieldConfig, RelationshipConfig } from './form-types';

/**
 * Configuration for Customer form
 * This file is auto-generated. To modify the form structure, update the generator templates.
 */
export const customerFormConfig: FormConfig = {
  entity: 'Customer',

  // Form steps configuration
  steps: [
    {
      id: 'basic',
      title: 'Basic Information',
      description: 'Enter essential details',
      fields: ['customerBusinessName', 'email', 'mobile', 'whatsApp', 'contactPerson', 'status'],
      relationships: [],
      validation: {
        mode: 'onBlur',
        validateOnNext: true,
      },
    },
    {
      id: 'geographic',
      title: 'Location Details',
      description: 'Select geographic information',
      fields: [],
      relationships: ['state', 'district', 'city', 'area'],
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
      name: 'customerBusinessName',
      type: 'text',
      label: 'Customer Business Name',
      placeholder: 'Enter customer business name (minimum 2 characters)',
      required: true,
      validation: {
        required: true,
        minLength: 2,
        maxLength: 100,
      },
      ui: {},
    },
    {
      name: 'email',
      type: 'text',
      label: 'Email',
      placeholder: 'Enter email address (example: name@company.com)',
      required: false,
      validation: {
        required: false,
        maxLength: 254,
        pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      },
      ui: {},
    },
    {
      name: 'mobile',
      type: 'text',
      label: 'Mobile',
      placeholder: 'Enter phone number (example: 03001234567)',
      required: true,
      validation: {
        required: true,
        pattern: /^[+]?[0-9]{10,15}$/,
      },
      ui: {},
    },
    {
      name: 'whatsApp',
      type: 'text',
      label: 'Whats App',
      placeholder: 'Enter whats app',
      required: false,
      validation: {
        required: false,
        pattern: /^[+]?[0-9]{10,15}$/,
      },
      ui: {},
    },
    {
      name: 'contactPerson',
      type: 'text',
      label: 'Contact Person',
      placeholder: 'Enter contact person',
      required: false,
      validation: {
        required: false,
        minLength: 2,
        maxLength: 100,
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
      name: 'state',
      type: 'many-to-one',
      targetEntity: 'state',
      displayField: 'name',
      primaryKey: 'id',
      required: true,
      multiple: false,
      category: 'geographic',
      api: {
        useGetAllHook: 'useGetAllStates',
        useSearchHook: 'useSearchStates',
        useCountHook: 'useCountStates',
        entityName: 'States',
      },
      creation: {
        canCreate: true,
        createPath: '/states/new',
        createPermission: 'state:create:inline',
      },
      ui: {
        label: 'State',
        placeholder: 'Select state',
        icon: '📍',
      },
    },
    {
      name: 'district',
      type: 'many-to-one',
      targetEntity: 'district',
      displayField: 'name',
      primaryKey: 'id',
      required: true,
      multiple: false,
      category: 'geographic',
      cascadingFilter: {
        parentField: 'state',
        filterField: 'state',
      },
      api: {
        useGetAllHook: 'useGetAllDistricts',
        useSearchHook: 'useSearchDistricts',
        useCountHook: 'useCountDistricts',
        entityName: 'Districts',
      },
      creation: {
        canCreate: true,
        createPath: '/districts/new',
        createPermission: 'district:create:inline',
      },
      ui: {
        label: 'District',
        placeholder: 'Select district',
        icon: '📍',
      },
    },
    {
      name: 'city',
      type: 'many-to-one',
      targetEntity: 'city',
      displayField: 'name',
      primaryKey: 'id',
      required: true,
      multiple: false,
      category: 'geographic',
      cascadingFilter: {
        parentField: 'district',
        filterField: 'district',
      },
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
      },
    },
    {
      name: 'area',
      type: 'many-to-one',
      targetEntity: 'area',
      displayField: 'name',
      primaryKey: 'id',
      required: true,
      multiple: false,
      category: 'geographic',
      cascadingFilter: {
        parentField: 'city',
        filterField: 'city',
      },
      api: {
        useGetAllHook: 'useGetAllAreas',
        useSearchHook: 'useSearchAreas',
        useCountHook: 'useCountAreas',
        entityName: 'Areas',
      },
      creation: {
        canCreate: true,
        createPath: '/areas/new',
        createPermission: 'area:create:inline',
      },
      ui: {
        label: 'Area',
        placeholder: 'Select area',
        icon: '📍',
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
      storagePrefix: 'CustomerFormState_',
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
export const customerFormHelpers = {
  getStepById: (stepId: string) => customerFormConfig.steps.find((step) => step.id === stepId),
  getFieldConfig: (fieldName: string) =>
    customerFormConfig.fields.find((field) => field.name === fieldName),
  getRelationshipConfig: (relationshipName: string) =>
    customerFormConfig.relationships.find((rel) => rel.name === relationshipName),
  getStepFields: (stepId: string) => {
    const step = customerFormConfig.steps.find((s) => s.id === stepId);
    return step ? [...step.fields, ...step.relationships] : [];
  },
};
