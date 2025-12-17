'use client';

import type { SystemConfigDTO } from '@/core/api/generated/spring/schemas';
import type { EntityTablePageConfig } from '@/entity-library/config';
import { SystemConfigDTOStatus } from '@/core/api/generated/spring/schemas/SystemConfigDTOStatus';
import {
  useGetAllSystemConfigs,
  useUpdateSystemConfig,
} from '@/core/api/generated/spring/endpoints/system-config-resource/system-config-resource.gen';
import { systemConfigTableConfig } from './table.config';

/**
 * Complete entity configuration for System Configs
 * All UI logic is handled by EntityTablePage - this just provides DTO-based config
 */
export const systemConfigEntityConfig: EntityTablePageConfig<
  SystemConfigDTO,
  typeof SystemConfigDTOStatus
> = {
  entityName: 'System Configs',
  basePath: '/system-configs',
  tableConfig: systemConfigTableConfig,
  statusEnum: SystemConfigDTOStatus,
  getEntityId: (entity) => entity.id,
  includeViewAction: true,
  useGetAll: useGetAllSystemConfigs,
  useUpdate: () => {
    const mutation = useUpdateSystemConfig();

    return {
      mutateAsync: async (params: { id: number; data: Partial<SystemConfigDTO> }) => {
        return mutation.mutateAsync({
          id: params.id,
          data: params.data as SystemConfigDTO,
        });
      },
    };
  },
  queryKeyPrefix: '/api/system-configs',
};
