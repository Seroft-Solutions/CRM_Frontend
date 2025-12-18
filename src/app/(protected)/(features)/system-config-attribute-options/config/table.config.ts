import type { SystemConfigAttributeOptionDTO } from '@/core/api/generated/spring/schemas';
import type { TableConfig } from '@/entity-library/config';
import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { SystemConfigAttributeOptionDTOStatus } from '@/core/api/generated/spring/schemas/SystemConfigAttributeOptionDTOStatus';
import type { SystemConfigAttributeDTO } from '@/core/api/generated/spring/schemas/SystemConfigAttributeDTO';

export const systemConfigAttributeOptionTableConfig: TableConfig<SystemConfigAttributeOptionDTO> = {
  columns: [
    {
      field: 'id',
      header: 'ID',
      type: 'text',
      sortable: true,
      filterable: false,
    },
    {
      field: 'code',
      header: 'Option Value',
      type: 'text',
      sortable: true,
      filterable: true,
    },
    {
      field: 'label',
      header: 'Option Label',
      type: 'text',
      sortable: true,
      filterable: true,
    },
    {
      field: 'attribute',
      header: 'Attribute',
      type: 'text',
      sortable: false,
      filterable: false,
      render: (value: SystemConfigAttributeOptionDTO[keyof SystemConfigAttributeOptionDTO]) => {
        const attr = value as SystemConfigAttributeDTO;

        return attr?.name ? String(attr.name) : '-';
      },
    },
    {
      field: 'sortOrder',
      header: 'Sort Order',
      type: 'text',
      sortable: true,
      filterable: false,
    },
    {
      field: 'status',
      header: 'Status',
      type: 'text',
      sortable: true,
      filterable: true,
      render: (value: SystemConfigAttributeOptionDTO[keyof SystemConfigAttributeOptionDTO]) => {
        const v =
          typeof value === 'string' ? (value as SystemConfigAttributeOptionDTOStatus) : undefined;

        const variant: 'default' | 'secondary' | 'destructive' | 'outline' =
          v === SystemConfigAttributeOptionDTOStatus.ARCHIVED
            ? 'destructive'
            : v === SystemConfigAttributeOptionDTOStatus.ACTIVE
              ? 'default'
              : v === SystemConfigAttributeOptionDTOStatus.INACTIVE
                ? 'outline'
                : 'secondary';

        return React.createElement(Badge, { variant }, String(v ?? ''));
      },
    },
  ],
  defaultSort: {
    field: 'sortOrder',
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
    storageKey: 'system-config-attribute-option-table-columns',
    userConfigurable: true,
  },
  rowSelection: { enabled: true },
  emptyState: {
    title: 'No attribute options',
    description: 'Try adjusting your filters or create a new attribute option.',
  },
};
