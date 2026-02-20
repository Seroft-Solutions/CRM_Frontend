import { z } from 'zod';

import type { SystemConfigDTO } from '@/core/api/generated/spring/schemas';
import { SystemConfigDTOStatus } from '@/core/api/generated/spring/schemas/SystemConfigDTOStatus';
import { SystemConfigDTOSystemConfigType } from '@/core/api/generated/spring/schemas/SystemConfigDTOSystemConfigType';
import type { FieldConfig, FormConfig } from '@/entity-library/config';

const schema = z.object({
  configKey: z
    .string()
    .min(2, 'Config key must be at least 2 characters')
    .max(100, 'Config key must not exceed 100 characters')
    .regex(/^[A-Za-z0-9_.:-]+$/, 'Config key can only contain letters, numbers, and _.:-'),
  systemConfigType: z.nativeEnum(SystemConfigDTOSystemConfigType),
  description: z.string().max(255, 'Description must not exceed 255 characters').optional(),
  status: z.nativeEnum(SystemConfigDTOStatus),
});

export const systemConfigBaseFields: Array<FieldConfig<SystemConfigDTO>> = [
  {
    field: 'configKey',
    label: 'Config Key',
    type: 'text',
    placeholder: 'e.g., app.feature.enabled',
    helpText: 'Unique identifier for this configuration. Use letters, numbers, and _.:-.',
    required: true,
    colSpan: 2,
  },
  {
    field: 'systemConfigType',
    label: 'Config Type',
    type: 'select',
    required: true,
    options: [
      { label: 'Product', value: SystemConfigDTOSystemConfigType.PRODUCT },
      { label: 'Inventory', value: SystemConfigDTOSystemConfigType.INVENTORY },
      { label: 'User', value: SystemConfigDTOSystemConfigType.USER },
      { label: 'Custom', value: SystemConfigDTOSystemConfigType.CUSTOM },
    ],
  },
  {
    field: 'status',
    label: 'Status',
    type: 'select',
    required: true,
    options: [
      { label: 'Active', value: SystemConfigDTOStatus.ACTIVE },
      { label: 'Inactive', value: SystemConfigDTOStatus.INACTIVE },
      { label: 'Archived', value: SystemConfigDTOStatus.ARCHIVED },
    ],
  },
  {
    field: 'description',
    label: 'Description',
    type: 'textarea',
    placeholder: 'Describe what this configuration controls…',
    helpText: 'Optional description of this configuration.',
    colSpan: 2,
  },
];

// For create form, hide the Status and Config Type fields but keep them in defaults/validation
const systemConfigCreateFields: Array<FieldConfig<SystemConfigDTO>> = systemConfigBaseFields.filter(
  (f) => f.field !== 'status' && f.field !== 'systemConfigType'
);

// For edit form, hide the Config Type field but keep it in defaults/validation
const systemConfigEditFields: Array<FieldConfig<SystemConfigDTO>> = systemConfigBaseFields.filter(
  (f) => f.field !== 'systemConfigType'
);

export const systemConfigCreateFormConfig: Omit<
  FormConfig<SystemConfigDTO>,
  'onSuccess' | 'onError'
> = {
  mode: 'create',
  layout: 'two-column',
  fields: systemConfigCreateFields,
  validationSchema: schema,
  defaultValues: {
    systemConfigType: SystemConfigDTOSystemConfigType.PRODUCT,
    status: SystemConfigDTOStatus.ACTIVE,
    description: '',
  },
  submitButtonText: 'Create System Config',
  cancelButtonText: 'Cancel',
  showCancelButton: true,
  successMessage: 'System config created successfully',
};

export const systemConfigEditFormConfig: Omit<
  FormConfig<SystemConfigDTO>,
  'onSuccess' | 'onError'
> = {
  mode: 'edit',
  layout: 'two-column',
  fields: systemConfigEditFields,
  validationSchema: schema,
  defaultValues: {
    systemConfigType: SystemConfigDTOSystemConfigType.PRODUCT,
    status: SystemConfigDTOStatus.ACTIVE,
  },
  submitButtonText: 'Update System Config',
  cancelButtonText: 'Cancel',
  showCancelButton: true,
  successMessage: 'System config updated successfully',
};
