'use client';

import type { SystemConfigDTO } from '@/core/api/generated/spring/schemas';
import {
  useCreateSystemConfig,
  useGetSystemConfig,
  useUpdateSystemConfig,
} from '@/core/api/generated/spring/endpoints/system-config-resource/system-config-resource.gen';
import type { EntityFormPageConfig } from '@/entity-library/config';

import { systemConfigCreateFormConfig, systemConfigEditFormConfig } from './form.config';
import { SystemConfigDTOStatus } from '@/core/api/generated/spring/schemas/SystemConfigDTOStatus';
import { SystemConfigDTOSystemConfigType } from '@/core/api/generated/spring/schemas/SystemConfigDTOSystemConfigType';

export const systemConfigCreateFormPageConfig: EntityFormPageConfig<SystemConfigDTO> = {
  entityName: 'System Config',
  basePath: '/system-configs',
  queryKeyPrefix: '/api/system-configs',
  submitMode: 'create',
  useCreate: () => {
    const mutation = useCreateSystemConfig();

    return {
      mutateAsync: async (params: { data: Partial<SystemConfigDTO> }) =>
        mutation.mutateAsync({
          data: {
            ...params.data,
            status: SystemConfigDTOStatus.ACTIVE,
          } as SystemConfigDTO,
        }),
    };
  },
  form: systemConfigCreateFormConfig,
};

export const systemConfigEditFormPageConfig: EntityFormPageConfig<SystemConfigDTO> = {
  entityName: 'System Config',
  basePath: '/system-configs',
  queryKeyPrefix: '/api/system-configs',
  submitMode: 'update',
  useGetById: (id: number) => {
    const q = useGetSystemConfig(id);

    return {
      data: q.data,
      isLoading: q.isLoading,
      error: q.error,
      refetch: q.refetch,
    };
  },
  useUpdate: () => {
    const mutation = useUpdateSystemConfig();

    return {
      mutateAsync: async (params: { id: number; data: Partial<SystemConfigDTO> }) =>
        mutation.mutateAsync({
          id: params.id,
          data: {
            ...params.data,
            systemConfigType: params.data.systemConfigType || SystemConfigDTOSystemConfigType.PRODUCT,
            status: params.data.status || SystemConfigDTOStatus.ACTIVE,
          } as SystemConfigDTO,
        }),
    };
  },
  form: systemConfigEditFormConfig,
};

export const systemConfigViewFormPageConfig: EntityFormPageConfig<SystemConfigDTO> = {
  entityName: 'System Config',
  basePath: '/system-configs',
  queryKeyPrefix: '/api/system-configs',
  submitMode: 'view',
  useGetById: (id: number) => {
    const q = useGetSystemConfig(id);

    return {
      data: q.data,
      isLoading: q.isLoading,
      error: q.error,
      refetch: q.refetch,
    };
  },
  form: systemConfigEditFormConfig,
};
