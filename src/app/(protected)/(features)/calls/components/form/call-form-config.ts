import type { FormConfig, FormStep, FieldConfig, RelationshipConfig } from "./form-types";

/**
 * Configuration for Call form
 * This file is auto-generated. To modify the form structure, update the generator templates.
 */
export const callFormConfig: FormConfig = {
  entity: 'Call',
  
  // Form steps configuration
  steps: [
    {
      id: 'dates',
      title: 'Date & Time',
      description: 'Set relevant dates',
      fields: [
        'callDateTime',
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
        'channelParties',
        'assignedTo',
      ],
      validation: {
        mode: 'onBlur',
        validateOnNext: true
      }
    },
    {
      id: 'classification',
      title: 'Classification',
      description: 'Set priority, status, and categories',
      fields: [
      ],
      relationships: [
        'priority',
        'callType',
        'subCallType',
        'callCategory',
        'channelType',
        'callStatus',
      ],
      validation: {
        mode: 'onBlur',
        validateOnNext: true
      }
    },
    {
      id: 'business',
      title: 'Business Relations',
      description: 'Connect with customers and products',
      fields: [
      ],
      relationships: [
        'source',
        'customer',
      ],
      validation: {
        mode: 'onBlur',
        validateOnNext: true
      }
    },
    {
      id: 'meeting-scheduling',
        title: 'Meeting Details',
        description: 'Enter Meeting Information',
        fields: [
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
      name: 'callDateTime',
      type: 'date',
      label: 'Call Date Time',
      placeholder: 'Enter call date time',
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
      name: 'priority',
      type: 'many-to-one',
      targetEntity: 'priority',
      displayField: 'name',
      primaryKey: 'id',
      required: true,
      multiple: false,
      category: 'classification',
      api: {
        useGetAllHook: 'useGetAllPriorities',
        useSearchHook: 'useSearchPriorities',
        useCountHook: 'useCountPriorities',
        entityName: 'Priorities',
      },
      creation: {
        canCreate: true,
        createPath: '/priorities/new',
        createPermission: 'priority:create',
      },
      ui: {
        label: 'Priority',
        placeholder: 'Select priority',
        icon: '🏷️',
      }
    },
    {
      name: 'callType',
      type: 'many-to-one',
      targetEntity: 'callType',
      displayField: 'name',
      primaryKey: 'id',
      required: true,
      multiple: false,
      category: 'classification',
      api: {
        useGetAllHook: 'useGetAllCallTypes',
        useSearchHook: 'useSearchCallTypes',
        useCountHook: 'useCountCallTypes',
        entityName: 'CallTypes',
      },
      creation: {
        canCreate: true,
        createPath: '/call-types/new',
        createPermission: 'callType:create',
      },
      ui: {
        label: 'Call Type',
        placeholder: 'Select call type',
        icon: '🏷️',
      }
    },
    {
      name: 'subCallType',
      type: 'many-to-one',
      targetEntity: 'subCallType',
      displayField: 'name',
      primaryKey: 'id',
      required: true,
      multiple: false,
      category: 'classification',
      cascadingFilter: {
        parentField: 'callType',
        filterField: 'callType',
      },
      api: {
        useGetAllHook: 'useGetAllSubCallTypes',
        useSearchHook: 'useSearchSubCallTypes',
        useCountHook: 'useCountSubCallTypes',
        entityName: 'SubCallTypes',
      },
      creation: {
        canCreate: true,
        createPath: '/sub-call-types/new',
        createPermission: 'subCallType:create',
      },
      ui: {
        label: 'Sub Call Type',
        placeholder: 'Select sub call type',
        icon: '🏷️',
      }
    },
    {
      name: 'callCategory',
      type: 'many-to-one',
      targetEntity: 'callCategory',
      displayField: 'name',
      primaryKey: 'id',
      required: true,
      multiple: false,
      category: 'classification',
      api: {
        useGetAllHook: 'useGetAllCallCategories',
        useSearchHook: 'useSearchCallCategories',
        useCountHook: 'useCountCallCategories',
        entityName: 'CallCategories',
      },
      creation: {
        canCreate: true,
        createPath: '/call-categories/new',
        createPermission: 'callCategory:create',
      },
      ui: {
        label: 'Call Category',
        placeholder: 'Select call category',
        icon: '🏷️',
      }
    },
    {
      name: 'source',
      type: 'many-to-one',
      targetEntity: 'source',
      displayField: 'name',
      primaryKey: 'id',
      required: true,
      multiple: false,
      category: 'business',
      api: {
        useGetAllHook: 'useGetAllSources',
        useSearchHook: 'useSearchSources',
        useCountHook: 'useCountSources',
        entityName: 'Sources',
      },
      creation: {
        canCreate: true,
        createPath: '/sources/new',
        createPermission: 'source:create',
      },
      ui: {
        label: 'Source',
        placeholder: 'Select source',
        icon: '🏢',
      }
    },
    {
      name: 'customer',
      type: 'many-to-one',
      targetEntity: 'customer',
      displayField: 'customerBusinessName',
      primaryKey: 'id',
      required: true,
      multiple: false,
      category: 'business',
      api: {
        useGetAllHook: 'useGetAllCustomers',
        useSearchHook: 'useSearchCustomers',
        useCountHook: 'useCountCustomers',
        entityName: 'Customers',
      },
      creation: {
        canCreate: true,
        createPath: '/customers/new',
        createPermission: 'customer:create',
      },
      ui: {
        label: 'Customer',
        placeholder: 'Select customer',
        icon: '🏢',
      }
    },
    {
      name: 'channelType',
      type: 'many-to-one',
      targetEntity: 'channelType',
      displayField: 'name',
      primaryKey: 'id',
      required: true,
      multiple: false,
      category: 'classification',
      api: {
        useGetAllHook: 'useGetAllChannelTypes',
        useSearchHook: 'useSearchChannelTypes',
        useCountHook: 'useCountChannelTypes',
        entityName: 'ChannelTypes',
      },
      creation: {
        canCreate: true,
        createPath: '/channel-types/new',
        createPermission: 'channelType:create',
      },
      ui: {
        label: 'Channel Type',
        placeholder: 'Select channel type',
        icon: '🏷️',
      }
    },
    {
      name: 'channelParties',
      type: 'many-to-one',
      targetEntity: 'userProfile',
      displayField: 'displayName',
      primaryKey: 'id',
      required: false,
      multiple: false,
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
        label: 'Channel Parties',
        placeholder: 'Select channel parties',
        icon: '👥',
      }
    },
    {
      name: 'assignedTo',
      type: 'many-to-one',
      targetEntity: 'userProfile',
      displayField: 'displayName',
      primaryKey: 'id',
      required: false,
      multiple: false,
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
        label: 'Assigned To',
        placeholder: 'Select assigned to',
        icon: '👥',
      }
    },
    {
      name: 'callStatus',
      type: 'many-to-one',
      targetEntity: 'callStatus',
      displayField: 'name',
      primaryKey: 'id',
      required: true,
      multiple: false,
      category: 'classification',
      api: {
        useGetAllHook: 'useGetAllCallStatuses',
        useSearchHook: 'useSearchCallStatuses',
        useCountHook: 'useCountCallStatuses',
        entityName: 'CallStatuses',
      },
      creation: {
        canCreate: true,
        createPath: '/call-statuses/new',
        createPermission: 'callStatus:create',
      },
      ui: {
        label: 'Call Status',
        placeholder: 'Select call status',
        icon: '🏷️',
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
      storagePrefix: 'CallFormState_',
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
export const callFormHelpers = {
  getStepById: (stepId: string) => callFormConfig.steps.find(step => step.id === stepId),
  getFieldConfig: (fieldName: string) => callFormConfig.fields.find(field => field.name === fieldName),
  getRelationshipConfig: (relationshipName: string) => callFormConfig.relationships.find(rel => rel.name === relationshipName),
  getStepFields: (stepId: string) => {
    const step = callFormConfig.steps.find(s => s.id === stepId);
    return step ? [...step.fields, ...step.relationships] : [];
  }
};
