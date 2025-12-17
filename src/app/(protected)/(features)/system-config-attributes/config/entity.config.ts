'use client';

import type { SystemConfigAttributeDTO } from '@/core/api/generated/spring/schemas';
import type { EntityTablePageConfig } from '@/entity-library/config';
import { SystemConfigAttributeDTOStatus } from '@/core/api/generated/spring/schemas/SystemConfigAttributeDTOStatus';
import {
  useGetAllSystemConfigAttributes,
  useUpdateSystemConfigAttribute,
} from '@/core/api/generated/spring/endpoints/system-config-attribute-resource/system-config-attribute-resource.gen';
import { systemConfigAttributeTableConfig } from './table.config';

/**
 * Complete entity configuration for System Config Attributes
 * All UI logic is handled by EntityTablePage - this just provides DTO-based config
 */
export const systemConfigAttributeEntityConfig: EntityTablePageConfig<
  SystemConfigAttributeDTO,
  typeof SystemConfigAttributeDTOStatus
> = {
  entityName: 'Attributes',
  basePath: '/system-config-attributes',
  tableConfig: systemConfigAttributeTableConfig,
  statusEnum: SystemConfigAttributeDTOStatus,
  getEntityId: (entity) => entity.id,
  useGetAll: useGetAllSystemConfigAttributes,
  useUpdate: useUpdateSystemConfigAttribute,
  queryKeyPrefix: '/api/system-config-attributes',
};
