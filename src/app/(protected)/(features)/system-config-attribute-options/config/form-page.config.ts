'use client';

import type { SystemConfigAttributeOptionDTO } from '@/core/api/generated/spring/schemas';
import {
  useCreateSystemConfigAttributeOption,
  useGetSystemConfigAttributeOption,
  useUpdateSystemConfigAttributeOption,
} from '@/core/api/generated/spring/endpoints/system-config-attribute-option-resource/system-config-attribute-option-resource.gen';
import type { EntityFormPageConfig } from '@/entity-library/config';

import {
  systemConfigAttributeOptionCreateFormConfig,
  systemConfigAttributeOptionEditFormConfig,
} from './form.config';
import { SystemConfigAttributeOptionDTOStatus } from '@/core/api/generated/spring/schemas/SystemConfigAttributeOptionDTOStatus';

export const systemConfigAttributeOptionCreateFormPageConfig: EntityFormPageConfig<SystemConfigAttributeOptionDTO> =
  {
    entityName: 'Attribute Option',
    basePath: '/system-config-attribute-options',
    queryKeyPrefix: '/api/system-config-attribute-options',
    submitMode: 'create',
    useCreate: () => {
      const mutation = useCreateSystemConfigAttributeOption();

      return {
        mutateAsync: async (params: { data: Partial<SystemConfigAttributeOptionDTO> }) =>
          mutation.mutateAsync({
            data: {
              ...params.data,
              status: SystemConfigAttributeOptionDTOStatus.ACTIVE,
            } as SystemConfigAttributeOptionDTO,
          }),
      };
    },
    form: systemConfigAttributeOptionCreateFormConfig,
  };

export const systemConfigAttributeOptionEditFormPageConfig: EntityFormPageConfig<SystemConfigAttributeOptionDTO> =
  {
    entityName: 'Attribute Option',
    basePath: '/system-config-attribute-options',
    queryKeyPrefix: '/api/system-config-attribute-options',
    submitMode: 'update',
    useGetById: (id: number) => {
      const q = useGetSystemConfigAttributeOption(id);

      return { data: q.data, isLoading: q.isLoading, error: q.error, refetch: q.refetch };
    },
    useUpdate: () => {
      const mutation = useUpdateSystemConfigAttributeOption();

      return {
        mutateAsync: async (params: {
          id: number;
          data: Partial<SystemConfigAttributeOptionDTO>;
        }) =>
          mutation.mutateAsync({
            id: params.id,
            data: params.data as SystemConfigAttributeOptionDTO,
          }),
      };
    },
    form: systemConfigAttributeOptionEditFormConfig,
  };

export const systemConfigAttributeOptionViewFormPageConfig: EntityFormPageConfig<SystemConfigAttributeOptionDTO> =
  {
    entityName: 'Attribute Option',
    basePath: '/system-config-attribute-options',
    queryKeyPrefix: '/api/system-config-attribute-options',
    submitMode: 'view',
    useGetById: (id: number) => {
      const q = useGetSystemConfigAttributeOption(id);

      return { data: q.data, isLoading: q.isLoading, error: q.error, refetch: q.refetch };
    },
    form: systemConfigAttributeOptionEditFormConfig,
  };
