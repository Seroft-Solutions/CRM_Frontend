// ===============================================================
// 🛑 AUTO-GENERATED FILE – DO NOT EDIT DIRECTLY 🛑
// - Source: code generation pipeline
// - To customize: use ./overrides/[filename].ts or feature-level
//   extensions (e.g., ./src/features/.../extensions/)
// - Direct edits will be overwritten on regeneration
// ===============================================================
import type { FormConfig, FormStep, FieldConfig, RelationshipConfig } from './form-types';

/**
 * Configuration for UserProfile form
 * This file is auto-generated. To modify the form structure, update the generator templates.
 */
export const userProfileFormConfig: FormConfig = {
  entity: 'UserProfile',

  // Form steps configuration
  steps: [
    {
      id: 'basic',
      title: 'Basic Information',
      description: 'Enter essential details',
      fields: ['keycloakId', 'firstName', 'lastName', 'email', 'phone', 'displayName'],
      relationships: [],
      validation: {
        mode: 'onBlur',
        validateOnNext: true,
      },
    },
    {
      id: 'channel',
      title: 'Channel Details',
      description: 'Channel type and parties',
      fields: [],
      relationships: ['channelType'],
      validation: {
        mode: 'onBlur',
        validateOnNext: true,
      },
    },
    {
      id: 'users',
      title: 'People & Users',
      description: 'Assign users and responsibilities',
      fields: [],
      relationships: ['internalUser'],
      validation: {
        mode: 'onBlur',
        validateOnNext: true,
      },
    },
    {
      id: 'other',
      title: 'Additional Relations',
      description: 'Other connections and references',
      fields: [],
      relationships: ['organizations', 'groups', 'roles'],
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
      name: 'keycloakId',
      type: 'text',
      label: 'Keycloak Id',
      placeholder: 'Enter keycloak id',
      required: false,
      validation: {
        required: false,
        pattern: /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,
      },
      ui: {},
    },
    {
      name: 'firstName',
      type: 'text',
      label: 'First Name',
      placeholder: 'Enter first name (minimum 2 characters)',
      required: true,
      validation: {
        required: true,
        minLength: 2,
        maxLength: 50,
      },
      ui: {},
    },
    {
      name: 'lastName',
      type: 'text',
      label: 'Last Name',
      placeholder: 'Enter last name (minimum 2 characters)',
      required: true,
      validation: {
        required: true,
        minLength: 2,
        maxLength: 50,
      },
      ui: {},
    },
    {
      name: 'email',
      type: 'text',
      label: 'Email',
      placeholder: 'Enter email address (example: name@company.com)',
      required: true,
      validation: {
        required: true,
        pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      },
      ui: {},
    },
    {
      name: 'phone',
      type: 'text',
      label: 'Phone',
      placeholder: 'Enter phone number (example: 03001234567)',
      required: false,
      validation: {
        required: false,
        maxLength: 20,
        pattern: /^[+]?[0-9\s\-\(\)]{10,20}$/,
      },
      ui: {},
    },
    {
      name: 'displayName',
      type: 'text',
      label: 'Display Name',
      placeholder: 'Enter display name (minimum 2 characters)',
      required: false,
      validation: {
        required: false,
        maxLength: 200,
      },
      ui: {},
    },
  ],

  // Relationship definitions
  relationships: [
    {
      name: 'internalUser',
      type: 'one-to-one',
      targetEntity: 'user',
      displayField: 'login',
      primaryKey: 'id',
      required: false,
      multiple: false,
      category: 'user',
      api: {
        useGetAllHook: 'useGetAllPublicUsers',
        useSearchHook: 'useSearchPublicUsers',
        entityName: 'PublicUsers',
      },
      creation: {
        canCreate: false,
      },
      ui: {
        label: 'Internal User',
        placeholder: 'Select internal user',
        icon: '👥',
      },
    },
    {
      name: 'organizations',
      type: 'many-to-many',
      targetEntity: 'organization',
      displayField: 'name',
      primaryKey: 'id',
      required: false,
      multiple: true,
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
        label: 'Organizations',
        placeholder: 'Select organizations',
        icon: '🔗',
      },
    },
    {
      name: 'groups',
      type: 'many-to-many',
      targetEntity: 'group',
      displayField: 'name',
      primaryKey: 'id',
      required: false,
      multiple: true,
      category: 'other',
      api: {
        useGetAllHook: 'useGetAllGroups',
        useSearchHook: 'useSearchGroups',
        useCountHook: 'useCountGroups',
        entityName: 'Groups',
      },
      creation: {
        canCreate: true,
        createPath: '/groups/new',
        createPermission: 'group:create:inline',
      },
      ui: {
        label: 'Groups',
        placeholder: 'Select groups',
        icon: '🔗',
      },
    },
    {
      name: 'roles',
      type: 'many-to-many',
      targetEntity: 'role',
      displayField: 'name',
      primaryKey: 'id',
      required: false,
      multiple: true,
      category: 'other',
      api: {
        useGetAllHook: 'useGetAllRoles',
        useSearchHook: 'useSearchRoles',
        useCountHook: 'useCountRoles',
        entityName: 'Roles',
      },
      creation: {
        canCreate: true,
        createPath: '/roles/new',
        createPermission: 'role:create:inline',
      },
      ui: {
        label: 'Roles',
        placeholder: 'Select roles',
        icon: '🔗',
      },
    },
    {
      name: 'channelType',
      type: 'many-to-one',
      targetEntity: 'channelType',
      displayField: 'name',
      primaryKey: 'id',
      required: false,
      multiple: false,
      category: 'channel',
      api: {
        useGetAllHook: 'useGetAllChannelTypes',
        useSearchHook: 'useSearchChannelTypes',
        useCountHook: 'useCountChannelTypes',
        entityName: 'ChannelTypes',
      },
      creation: {
        canCreate: true,
        createPath: '/channel-types/new',
        createPermission: 'channelType:create:inline',
      },
      ui: {
        label: 'Channel Type',
        placeholder: 'Select channel type',
        icon: '📞',
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
      storagePrefix: 'UserProfileFormState_',
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
export const userProfileFormHelpers = {
  getStepById: (stepId: string) => userProfileFormConfig.steps.find((step) => step.id === stepId),
  getFieldConfig: (fieldName: string) =>
    userProfileFormConfig.fields.find((field) => field.name === fieldName),
  getRelationshipConfig: (relationshipName: string) =>
    userProfileFormConfig.relationships.find((rel) => rel.name === relationshipName),
  getStepFields: (stepId: string) => {
    const step = userProfileFormConfig.steps.find((s) => s.id === stepId);
    return step ? [...step.fields, ...step.relationships] : [];
  },
};
