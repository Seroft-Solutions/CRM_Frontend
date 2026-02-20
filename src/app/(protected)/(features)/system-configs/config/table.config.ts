import type { SystemConfigDTO } from '@/core/api/generated/spring/schemas';
import type { TableConfig } from '@/entity-library/config';
import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { SystemConfigDTOStatus } from '@/core/api/generated/spring/schemas/SystemConfigDTOStatus';

export const systemConfigTableConfig: TableConfig<SystemConfigDTO> = {
  columns: [
    {
      field: 'id',
      header: 'ID',
      type: 'text',
      sortable: true,
      filterable: false,
    },
    {
      field: 'configKey',
      header: 'Config Key',
      type: 'text',
      sortable: true,
      filterable: true,
    },
    {
      field: 'systemConfigType',
      header: 'Config Type',
      type: 'text',
      sortable: true,
      filterable: true,
    },
    {
      field: 'description',
      header: 'Description',
      type: 'text',
      sortable: true,
      filterable: true,
    },
    {
      field: 'status',
      header: 'Status',
      type: 'text',
      sortable: true,
      filterable: true,
      render: (value: SystemConfigDTO[keyof SystemConfigDTO]) => {
        const v = typeof value === 'string' ? (value as SystemConfigDTOStatus) : undefined;

        const variant: 'default' | 'secondary' | 'destructive' | 'outline' =
          v === SystemConfigDTOStatus.ARCHIVED
            ? 'destructive'
            : v === SystemConfigDTOStatus.ACTIVE
              ? 'default'
              : v === SystemConfigDTOStatus.INACTIVE
                ? 'outline'
                : 'secondary';

        return React.createElement(Badge, { variant }, String(v ?? ''));
      },
    },
    {
      field: 'createdBy',
      header: 'Created By',
      type: 'text',
      sortable: true,
      filterable: false,
    },
    {
      field: 'createdDate',
      header: 'Created Date',
      type: 'text',
      sortable: true,
      filterable: false,
    },
    {
      field: 'lastModifiedBy',
      header: 'Last Modified By',
      type: 'text',
      sortable: true,
      filterable: false,
    },
    {
      field: 'lastModifiedDate',
      header: 'Last Modified Date',
      type: 'text',
      sortable: true,
      filterable: false,
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
    storageKey: 'system-config-table-columns',
    userConfigurable: true,
  },
  rowSelection: { enabled: true },
  emptyState: {
    title: 'No system configs',
    description: 'Try adjusting your filters or create a new system config.',
  },
};
