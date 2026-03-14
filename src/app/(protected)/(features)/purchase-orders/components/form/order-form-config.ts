import type { FormConfig } from './form-types';

export const purchaseOrderFormConfig: FormConfig = {
  entity: 'PurchaseOrder',
  steps: [
    {
      id: 'purchase-order',
      title: 'Purchase Order Details',
      description: 'Enter purchase order information',
      fields: [
        'orderStatus',
        'paymentStatus',
        'orderBaseAmount',
        'shippingAmount',
        'orderTaxRate',
        'shippingMethod',
      ],
      relationships: ['sundryCreditor'],
      validation: {
        mode: 'onBlur',
        validateOnNext: true,
      },
    },
    {
      id: 'review',
      title: 'Review',
      description: 'Confirm purchase order details',
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
      name: 'orderStatus',
      type: 'enum',
      label: 'Order Status',
      required: true,
      options: [
        { value: 'Created', label: 'Created' },
        { value: 'Processing', label: 'Processing' },
        { value: 'Shipped', label: 'Shipped' },
        { value: 'Delivered', label: 'Delivered' },
        { value: 'Cancelled', label: 'Cancelled' },
      ],
      validation: { required: true },
      ui: {},
    },
    {
      name: 'paymentStatus',
      type: 'enum',
      label: 'Payment Status',
      required: true,
      options: [
        { value: 'Pending', label: 'Pending' },
        { value: 'Paid', label: 'Paid' },
        { value: 'Failed', label: 'Failed' },
        { value: 'Refunded', label: 'Refunded' },
      ],
      validation: { required: true },
      ui: {},
    },
    {
      name: 'orderBaseAmount',
      type: 'number',
      label: 'Base Amount',
      required: false,
      validation: { required: false, min: 0 },
      ui: {},
    },
    {
      name: 'shippingAmount',
      type: 'number',
      label: 'Shipping Amount',
      required: false,
      validation: { required: false, min: 0 },
      ui: {},
    },
    {
      name: 'orderTaxRate',
      type: 'number',
      label: 'Tax Rate',
      required: false,
      validation: { required: false, min: 0, max: 100 },
      ui: {},
    },
    {
      name: 'shippingMethod',
      type: 'enum',
      label: 'Shipping Method',
      required: false,
      options: [
        { value: 'Courier', label: 'Courier' },
        { value: 'In-Store Pickup', label: 'In-Store Pickup' },
        { value: 'Postal', label: 'Postal' },
        { value: 'Express', label: 'Express' },
      ],
      validation: { required: false },
      ui: {},
    },
  ],
  relationships: [
    {
      name: 'sundryCreditor',
      type: 'many-to-one',
      targetEntity: 'SundryCreditor',
      displayField: 'name',
      primaryKey: 'id',
      required: false,
      multiple: false,
      category: 'business',
      api: {
        useGetAllHook: 'useGetAllSundryCreditors',
        useSearchHook: 'useSearchSundryCreditors',
        entityName: 'SundryCreditor',
      },
      creation: {
        canCreate: true,
        createPath: '/sundry-creditors/new',
        createPermission: 'sundryCreditor:create',
      },
      ui: {
        label: 'Sundry Creditor',
        placeholder: 'Select sundry creditor',
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
      storagePrefix: 'PurchaseOrderFormState_',
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
