'use client';

import { z } from 'zod';
import type { FieldConfig, FormConfig } from '@/entity-library/config';
import type {
  SystemConfigAttributeDTO,
  SystemConfigDTO,
} from '@/core/api/generated/spring/schemas';
import { SystemConfigAttributeDTOAttributeType } from '@/core/api/generated/spring/schemas/SystemConfigAttributeDTOAttributeType';
import { SystemConfigAttributeDTOStatus } from '@/core/api/generated/spring/schemas/SystemConfigAttributeDTOStatus';
import { useGetAllSystemConfigs } from '@/core/api/generated/spring/endpoints/system-config-resource/system-config-resource.gen';

const schema = z.object({
  systemConfig: z.object({ id: z.number() }).passthrough(),
  name: z
    .string()
    .min(1, 'Name is required')
    .max(50, 'Name must not exceed 50 characters')
    .regex(
      /^[a-z][a-z0-9_]*$/,
      'Name must start with lowercase letter and contain only lowercase letters, numbers, and underscores'
    ),
  label: z.string().min(1, 'Label is required').max(100, 'Label must not exceed 100 characters'),
  attributeType: z.nativeEnum(SystemConfigAttributeDTOAttributeType),
  isRequired: z.boolean(),
  sortOrder: z.number().min(0, 'Sort order must be 0 or greater'),
  status: z.nativeEnum(SystemConfigAttributeDTOStatus),
});

// Make schema type-compatible with FormConfig expectations
const validationSchema = schema as unknown as z.ZodType<Partial<SystemConfigAttributeDTO>>;

const systemConfigRelationship: FieldConfig<SystemConfigAttributeDTO>['relationshipConfig'] = {
  useGetAll: (params) => useGetAllSystemConfigs(params as Record<string, unknown>),
  params: { page: 0, size: 1000 },
  getOptionId: (o) => (o as SystemConfigDTO).id ?? '',
  getOptionLabel: (o) =>
    (o as SystemConfigDTO).configKey ?? `ID: ${(o as SystemConfigDTO).id ?? '-'}`,
  toValue: (o) => ({ id: (o as SystemConfigDTO).id }) as SystemConfigDTO,
  getValueId: (v) => {
    if (typeof v !== 'object' || !v) return undefined;
    const id = (v as Record<string, unknown>).id;

    return typeof id === 'string' || typeof id === 'number' ? id : undefined;
  },
  placeholder: 'Select a system config',
};

export const systemConfigAttributeBaseFields: Array<FieldConfig<SystemConfigAttributeDTO>> = [
  {
    field: 'systemConfig',
    label: 'System Config',
    type: 'relationship',
    required: true,
    helpText: 'Parent system configuration. Cannot be changed after creation.',
    relationshipConfig: systemConfigRelationship,
    colSpan: 2,
  },
  {
    field: 'name',
    label: 'Name',
    type: 'text',
    required: true,
    placeholder: 'e.g., max_items',
    helpText: 'Internal name (lowercase, underscores allowed). Cannot be changed after creation.',
    colSpan: 2,
  },
  {
    field: 'label',
    label: 'Label',
    type: 'text',
    required: true,
    placeholder: 'e.g., Maximum Items',
    helpText: 'Display label for this attribute.',
    colSpan: 2,
  },
  {
    field: 'attributeType',
    label: 'Attribute Type',
    type: 'select',
    required: true,
    options: [
      { label: 'String', value: SystemConfigAttributeDTOAttributeType.STRING },
      { label: 'Number', value: SystemConfigAttributeDTOAttributeType.NUMBER },
      { label: 'Boolean', value: SystemConfigAttributeDTOAttributeType.BOOLEAN },
      { label: 'Enum', value: SystemConfigAttributeDTOAttributeType.ENUM },
    ],
  },
  {
    field: 'isRequired',
    label: 'Required',
    type: 'checkbox',
    helpText: 'Whether this attribute must be provided.',
  },
  {
    field: 'sortOrder',
    label: 'Sort Order',
    type: 'number',
    required: true,
    helpText: 'Lower numbers appear first.',
  },
  {
    field: 'status',
    label: 'Status',
    type: 'select',
    required: true,
    options: [
      { label: 'Draft', value: SystemConfigAttributeDTOStatus.DRAFT },
      { label: 'Active', value: SystemConfigAttributeDTOStatus.ACTIVE },
      { label: 'Inactive', value: SystemConfigAttributeDTOStatus.INACTIVE },
      { label: 'Archived', value: SystemConfigAttributeDTOStatus.ARCHIVED },
    ],
  },
];

// For create form, hide the Status field but keep default/validation
const systemConfigAttributeCreateFields: Array<FieldConfig<SystemConfigAttributeDTO>> =
  systemConfigAttributeBaseFields.filter((f) => f.field !== 'status');

export const systemConfigAttributeCreateFormConfig: Omit<
  FormConfig<SystemConfigAttributeDTO>,
  'onSuccess' | 'onError'
> = {
  mode: 'create',
  layout: 'two-column',
  fields: systemConfigAttributeCreateFields,
  validationSchema,
  defaultValues: {
    attributeType: SystemConfigAttributeDTOAttributeType.ENUM,
    isRequired: false,
    sortOrder: 0,
    status: SystemConfigAttributeDTOStatus.ACTIVE,
  } as Partial<SystemConfigAttributeDTO>,
  submitButtonText: 'Create Config Attribute',
  cancelButtonText: 'Cancel',
  showCancelButton: true,
  successMessage: 'Config attribute created successfully',
};

export const systemConfigAttributeEditFormConfig: Omit<
  FormConfig<SystemConfigAttributeDTO>,
  'onSuccess' | 'onError'
> = {
  mode: 'edit',
  layout: 'two-column',
  fields: systemConfigAttributeBaseFields.map((f) =>
    f.field === 'systemConfig'
      ? { ...f, helpText: 'Parent system configuration.' }
      : f.field === 'name'
        ? { ...f, helpText: 'Internal name (lowercase, underscores allowed).' }
        : f
  ),
  validationSchema,
  submitButtonText: 'Update Config Attribute',
  cancelButtonText: 'Cancel',
  showCancelButton: true,
  successMessage: 'Config attribute updated successfully',
};
