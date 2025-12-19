'use client';

import type { SystemConfigAttributeDTO } from '@/core/api/generated/spring/schemas';
import {
  useCreateSystemConfigAttribute,
  useGetSystemConfigAttribute,
  useUpdateSystemConfigAttribute,
} from '@/core/api/generated/spring/endpoints/system-config-attribute-resource/system-config-attribute-resource.gen';
import type { EntityFormPageConfig } from '@/entity-library/config';

import {
  systemConfigAttributeCreateFormConfig,
  systemConfigAttributeEditFormConfig,
} from './form.config';
import { SystemConfigAttributeDTOStatus } from '@/core/api/generated/spring/schemas/SystemConfigAttributeDTOStatus';
import { SystemConfigAttributeDTOAttributeType } from '@/core/api/generated/spring/schemas/SystemConfigAttributeDTOAttributeType';

export const systemConfigAttributeCreateFormPageConfig: EntityFormPageConfig<SystemConfigAttributeDTO> =
  {
    entityName: 'Config Attribute',
    basePath: '/system-config-attributes',
    queryKeyPrefix: '/api/system-config-attributes',
    submitMode: 'create',
    useCreate: () => {
      const mutation = useCreateSystemConfigAttribute();

      return {
        mutateAsync: async (params: { data: Partial<SystemConfigAttributeDTO> }) =>
          mutation.mutateAsync({
            data: {
              ...params.data,
              status: SystemConfigAttributeDTOStatus.ACTIVE,
              attributeType: SystemConfigAttributeDTOAttributeType.ENUM,
              sortOrder: 0,
            } as SystemConfigAttributeDTO,
          }),
      };
    },
    form: systemConfigAttributeCreateFormConfig,
  };

export const systemConfigAttributeEditFormPageConfig: EntityFormPageConfig<SystemConfigAttributeDTO> =
  {
    entityName: 'Config Attribute',
    basePath: '/system-config-attributes',
    queryKeyPrefix: '/api/system-config-attributes',
    submitMode: 'update',
    useGetById: (id: number) => {
      const q = useGetSystemConfigAttribute(id);

      return { data: q.data, isLoading: q.isLoading, error: q.error, refetch: q.refetch };
    },
    useUpdate: () => {
      const mutation = useUpdateSystemConfigAttribute();

      return {
        mutateAsync: async (params: { id: number; data: Partial<SystemConfigAttributeDTO> }) =>
          mutation.mutateAsync({
            id: params.id,
            data: {
              ...params.data,
              attributeType: SystemConfigAttributeDTOAttributeType.ENUM,
              sortOrder: 0,
            } as SystemConfigAttributeDTO,
          }),
      };
    },
    form: systemConfigAttributeEditFormConfig,
  };

export const systemConfigAttributeViewFormPageConfig: EntityFormPageConfig<SystemConfigAttributeDTO> =
  {
    entityName: 'Config Attribute',
    basePath: '/system-config-attributes',
    queryKeyPrefix: '/api/system-config-attributes',
    submitMode: 'view',
    useGetById: (id: number) => {
      const q = useGetSystemConfigAttribute(id);

      return { data: q.data, isLoading: q.isLoading, error: q.error, refetch: q.refetch };
    },
    form: systemConfigAttributeEditFormConfig,
  };
