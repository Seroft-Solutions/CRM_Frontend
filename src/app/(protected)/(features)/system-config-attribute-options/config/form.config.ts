/* eslint-disable padding-line-between-statements */
'use client';

import { z } from 'zod';
import type { FieldConfig, FormConfig } from '@/entity-library/config';
import type {
  SystemConfigAttributeDTO,
  SystemConfigAttributeOptionDTO,
} from '@/core/api/generated/spring/schemas';
import { SystemConfigAttributeOptionDTOStatus } from '@/core/api/generated/spring/schemas/SystemConfigAttributeOptionDTOStatus';
import { useGetAllSystemConfigAttributes } from '@/core/api/generated/spring/endpoints/system-config-attribute-resource/system-config-attribute-resource.gen';

const schema = z.object({
  attribute: z.object({ id: z.number() }).passthrough(),
  code: z
    .string()
    .min(1, 'Code is required')
    .max(50, 'Code must not exceed 50 characters')
    .refine(
      (val) => {
        // Allow hex colors (#XXXXXX) or regular codes (letters, numbers, -, _)
        return /^#[0-9A-Fa-f]{6}$/.test(val) || /^[A-Za-z0-9_-]+$/.test(val);
      },
      {
        message:
          'Code must be a valid hex color (#XXXXXX) or contain only letters, numbers, - and _',
      }
    ),
  label: z.string().min(1, 'Label is required').max(100, 'Label must not exceed 100 characters'),
  sortOrder: z.number().min(0, 'Sort order must be 0 or greater'),
  status: z.nativeEnum(SystemConfigAttributeOptionDTOStatus),
});

// Make schema type-compatible with FormConfig expectations
const validationSchema = schema as unknown as z.ZodType<Partial<SystemConfigAttributeOptionDTO>>;

const attributeRelationship: FieldConfig<SystemConfigAttributeOptionDTO>['relationshipConfig'] = {
  useGetAll: (params) => useGetAllSystemConfigAttributes(params as Record<string, unknown>),
  params: { page: 0, size: 1000 },
  getOptionId: (o) => (o as SystemConfigAttributeDTO).id ?? '',
  getOptionLabel: (o) => {
    const a = o as SystemConfigAttributeDTO;
    const key = a.systemConfig?.configKey ?? 'Unknown';
    const label = a.label || a.name || `ID: ${a.id ?? '-'}`;

    return `${key} → ${label}`;
  },
  toValue: (o) => o as SystemConfigAttributeDTO,
  getValueId: (v) => {
    if (typeof v !== 'object' || !v) return undefined;
    const id = (v as Record<string, unknown>).id;

    return typeof id === 'string' || typeof id === 'number' ? id : undefined;
  },
  placeholder: 'Select an attribute',
};

// Base fields for the system config attribute option form
export const systemConfigAttributeOptionBaseFields: Array<
  FieldConfig<SystemConfigAttributeOptionDTO>
> = [
  {
    field: 'attribute',
    label: 'Attribute',
    type: 'relationship',
    required: true,
    helpText: 'Parent attribute.',
    relationshipConfig: attributeRelationship,
    colSpan: 2,
  },

  {
    field: 'code',
    label: 'Code',
    type: 'color',
    required: true,
    placeholder: 'e.g., #FF5733',

    helpText: 'Hex color code for this option.',
    colSpan: 2,

    condition: (formData) => {
      const attr = formData.attribute as SystemConfigAttributeDTO | undefined;
      return attr?.name?.toLowerCase().includes('color') ?? false;
    },
  },

  {
    field: 'code',
    label: 'Code',
    type: 'text',
    required: true,
    placeholder: 'e.g., OPTION_A',

    helpText: 'Unique code (letters, numbers, -, _).',
    colSpan: 2,

    condition: (formData) => {
      const attr = formData.attribute as SystemConfigAttributeDTO | undefined;
      return !(attr?.name?.toLowerCase().includes('color') ?? false);
    },
  },

  {
    field: 'label',
    label: 'Label',
    type: 'text',
    required: true,
    placeholder: 'e.g., Option A',
    helpText: 'Display label for this option.',
    colSpan: 2,
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
      { label: 'Draft', value: SystemConfigAttributeOptionDTOStatus.DRAFT },
      { label: 'Active', value: SystemConfigAttributeOptionDTOStatus.ACTIVE },
      { label: 'Inactive', value: SystemConfigAttributeOptionDTOStatus.INACTIVE },
      { label: 'Archived', value: SystemConfigAttributeOptionDTOStatus.ARCHIVED },
    ],
  },
];

// For create form, hide the Status field but keep default/validation
const systemConfigAttributeOptionCreateFields: Array<FieldConfig<SystemConfigAttributeOptionDTO>> =
  systemConfigAttributeOptionBaseFields.filter((f) => f.field !== 'status');

export const systemConfigAttributeOptionCreateFormConfig: Omit<
  FormConfig<SystemConfigAttributeOptionDTO>,
  'onSuccess' | 'onError'
> = {
  mode: 'create',
  layout: 'two-column',
  fields: systemConfigAttributeOptionCreateFields,
  validationSchema,
  defaultValues: {
    sortOrder: 0,
    status: SystemConfigAttributeOptionDTOStatus.ACTIVE,
  } as Partial<SystemConfigAttributeOptionDTO>,
  submitButtonText: 'Create Attribute Option',
  cancelButtonText: 'Cancel',
  showCancelButton: true,
  successMessage: 'Attribute option created successfully',
};

export const systemConfigAttributeOptionEditFormConfig: Omit<
  FormConfig<SystemConfigAttributeOptionDTO>,
  'onSuccess' | 'onError'
> = {
  mode: 'edit',
  layout: 'two-column',
  fields: systemConfigAttributeOptionBaseFields.map((f) =>
    f.field === 'attribute'
      ? { ...f, helpText: 'Parent attribute.' }
      : f.field === 'code'
        ? { ...f, helpText: 'Unique code (letters, numbers, -, _).' }
        : f
  ),
  validationSchema,
  submitButtonText: 'Update Attribute Option',
  cancelButtonText: 'Cancel',
  showCancelButton: true,
  successMessage: 'Attribute option updated successfully',
};
