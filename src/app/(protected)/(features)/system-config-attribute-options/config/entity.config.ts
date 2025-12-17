'use client';

import type { SystemConfigAttributeOptionDTO } from '@/core/api/generated/spring/schemas';
import type { EntityConfig } from '@/entity-library/config';
import { SystemConfigAttributeOptionDTOStatus } from '@/core/api/generated/spring/schemas/SystemConfigAttributeOptionDTOStatus';
import {
  useGetAllSystemConfigAttributeOptions,
  useUpdateSystemConfigAttributeOption,
} from '@/core/api/generated/spring/endpoints/system-config-attribute-option-resource/system-config-attribute-option-resource.gen';
import { systemConfigAttributeOptionTableConfig } from './table.config';

/**
 * Complete entity configuration for System Config Attribute Options
 * All UI logic is handled by EntityTablePage - this just provides DTO-based config
 */
export const systemConfigAttributeOptionEntityConfig: EntityConfig<
  SystemConfigAttributeOptionDTO,
  typeof SystemConfigAttributeOptionDTOStatus
> = {
  entityName: 'Attribute Options',
  basePath: '/system-config-attribute-options',
  tableConfig: systemConfigAttributeOptionTableConfig,
  statusEnum: SystemConfigAttributeOptionDTOStatus,
  getEntityId: (entity) => entity.id,
  useGetAll: useGetAllSystemConfigAttributeOptions,
  useUpdate: useUpdateSystemConfigAttributeOption,
  queryKeyPrefix: '/api/system-config-attribute-options',
};
