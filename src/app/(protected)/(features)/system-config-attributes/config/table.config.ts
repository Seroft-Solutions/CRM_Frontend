import type { SystemConfigAttributeDTO } from '@/core/api/generated/spring/schemas';
import type { TableConfig } from '@/entity-library/config';
import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { SystemConfigAttributeDTOStatus } from '@/core/api/generated/spring/schemas/SystemConfigAttributeDTOStatus';
import type { SystemConfigDTO } from '@/core/api/generated/spring/schemas/SystemConfigDTO';

export const systemConfigAttributeTableConfig: TableConfig<SystemConfigAttributeDTO> = {
  columns: [
    {
      field: 'id',
      header: 'ID',
      type: 'text',
      sortable: true,
      filterable: false,
    },
    {
      field: 'label',
      header: 'Attribute Name',
      type: 'text',
      sortable: true,
      filterable: true,
    },
    {
      field: 'name',
      header: 'Attribute Key',
      type: 'text',
      sortable: true,
      filterable: true,
    },
    {
      field: 'attributeType',
      header: 'Data Type',
      type: 'text',
      sortable: true,
      filterable: true,
    },
    {
      field: 'systemConfig',
      header: 'System Config',
      type: 'text',
      sortable: false,
      filterable: false,
      render: (value: SystemConfigAttributeDTO[keyof SystemConfigAttributeDTO]) => {
        const config = value as SystemConfigDTO;

        // Backend returns minimal representation - use configKey or id
        return config?.configKey || (config?.id ? `ID: ${config.id}` : '-');
      },
    },
    {
      field: 'isRequired',
      header: 'Required',
      type: 'text',
      sortable: true,
      filterable: false,
      render: (value: SystemConfigAttributeDTO[keyof SystemConfigAttributeDTO]) => {
        const isRequired = Boolean(value);

        return React.createElement(
          Badge,
          { variant: isRequired ? 'default' : 'outline' },
          isRequired ? 'Yes' : 'No'
        );
      },
    },
    {
      field: 'status',
      header: 'Status',
      type: 'text',
      sortable: true,
      filterable: true,
      render: (value: SystemConfigAttributeDTO[keyof SystemConfigAttributeDTO]) => {
        const v = typeof value === 'string' ? (value as SystemConfigAttributeDTOStatus) : undefined;

        const variant: 'default' | 'secondary' | 'destructive' | 'outline' =
          v === SystemConfigAttributeDTOStatus.ARCHIVED
            ? 'destructive'
            : v === SystemConfigAttributeDTOStatus.ACTIVE
              ? 'default'
              : v === SystemConfigAttributeDTOStatus.INACTIVE
                ? 'outline'
                : 'secondary';

        return React.createElement(Badge, { variant }, String(v ?? ''));
      },
    },
  ],
  defaultSort: {
    field: 'id',
    direction: 'asc',
  },
  pagination: {
    defaultPageSize: 10,
    pageSizeOptions: [10, 25, 50, 100],
    showTotalCount: true,
    showPageSizeSelector: true,
    strategy: 'offset',
  },
  columnVisibility: {
    storageKey: 'system-config-attribute-table-columns',
    userConfigurable: true,
  },
  rowSelection: { enabled: true },
  emptyState: {
    title: 'No attributes',
    description: 'Try adjusting your filters or create a new attribute.',
  },
};
