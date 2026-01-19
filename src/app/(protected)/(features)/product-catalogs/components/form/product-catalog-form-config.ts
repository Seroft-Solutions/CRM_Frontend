import type { FormConfig } from './form-types';

/**
 * Configuration for ProductCatalog form
 * This file is auto-generated. To modify the form structure, update the generator templates.
 */
export const productCatalogFormConfig: FormConfig = {
  entity: 'ProductCatalog',

  steps: [
    {
      id: 'basic',
      title: 'Catalog Details',
      description: 'Enter catalog information',
      fields: ['productCatalogName', 'price', 'description'],
      relationships: [],
      validation: {
        mode: 'onBlur',
        validateOnNext: true,
      },
    },
    {
      id: 'product',
      title: 'Product & Variants',
      description: 'Select a product and its variants',
      fields: [],
      relationships: ['product', 'variants'],
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

  fields: [
    {
      name: 'productCatalogName',
      type: 'text',
      label: 'Product Catalog Name',
      placeholder: 'Enter catalog name (minimum 2 characters)',
      required: true,
      validation: {
        required: true,
        minLength: 2,
        maxLength: 100,
      },
      ui: {},
    },
    {
      name: 'price',
      type: 'number',
      label: 'Price',
      placeholder: 'Enter price',
      required: true,
      validation: {
        required: true,
        min: 0,
        max: 999999,
      },
      ui: {},
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Description',
      placeholder: 'Enter description',
      required: false,
      validation: {
        required: false,
        maxLength: 500,
      },
      ui: {
        rows: 4,
      },
    },
  ],

  relationships: [
    {
      name: 'product',
      type: 'many-to-one',
      targetEntity: 'product',
      displayField: 'name',
      primaryKey: 'id',
      required: true,
      multiple: false,
      category: 'classification',
      api: {
        useGetAllHook: 'useGetAllProducts',
        useSearchHook: 'useSearchProducts',
        useCountHook: 'useCountProducts',
        entityName: 'Products',
      },
      creation: {
        canCreate: true,
        createPath: '/products/new',
        createPermission: 'product:create:inline',
      },
      ui: {
        label: 'Product',
        placeholder: 'Select product',
        icon: '📦',
      },
    },
    {
      name: 'variants',
      type: 'many-to-many',
      targetEntity: 'productVariant',
      displayField: 'sku',
      primaryKey: 'id',
      required: false,
      multiple: true,
      category: 'classification',
      cascadingFilter: {
        parentField: 'product',
        filterField: 'productId.equals',
      },
      api: {
        useGetAllHook: 'useGetAllProductVariants',
        useSearchHook: 'useSearchProductVariants',
        useCountHook: 'useCountProductVariants',
        entityName: 'ProductVariants',
      },
      creation: {
        canCreate: false,
      },
      ui: {
        label: 'Variants',
        placeholder: 'Select variants',
        icon: '🔢',
      },
    },
  ],

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
      storagePrefix: 'ProductCatalogFormState_',
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
      useGeneratedSteps: false,
    },
    drafts: {
      enabled: true,
      saveBehavior: 'onNavigation',
      confirmDialog: true,
      autoSave: false,
      maxDrafts: 5,
      showRestorationDialog: true,
    },
  },
};

export const productCatalogFormHelpers = {
  getStepById: (stepId: string) =>
    productCatalogFormConfig.steps.find((step) => step.id === stepId),
  getFieldConfig: (fieldName: string) =>
    productCatalogFormConfig.fields.find((field) => field.name === fieldName),
  getRelationshipConfig: (relationshipName: string) =>
    productCatalogFormConfig.relationships.find((rel) => rel.name === relationshipName),
  getStepFields: (stepId: string) => {
    const step = productCatalogFormConfig.steps.find((s) => s.id === stepId);
    return step ? [...step.fields, ...step.relationships] : [];
  },
};
