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
      field: 'attribute',
      header: 'System Config',
      type: 'text',
      sortable: false,
      filterable: false,
      render: (value: SystemConfigAttributeOptionDTO[keyof SystemConfigAttributeOptionDTO]) => {
        const attr = value as SystemConfigAttributeDTO;

        return attr?.systemConfig?.configKey ? String(attr.systemConfig.configKey) : '-';
      },
    },
    {
      field: 'attribute',
      header: 'Attribute Config',
      type: 'text',
      sortable: false,
      filterable: false,
      render: (value: SystemConfigAttributeOptionDTO[keyof SystemConfigAttributeOptionDTO]) => {
        const attr = value as SystemConfigAttributeDTO;

        return attr?.label || attr?.name || '-';
      },
    },
    {
      field: 'code',
      header: 'Option Value',
      type: 'text',
      sortable: true,
      filterable: true,
      render: (
        value: SystemConfigAttributeOptionDTO[keyof SystemConfigAttributeOptionDTO],
        row: SystemConfigAttributeOptionDTO
      ) => {
        const attr = row.attribute as SystemConfigAttributeDTO;
        const isColorField = attr?.name?.toLowerCase().includes('color');
        const code = String(value ?? '');

        if (isColorField && /^#[0-9A-Fa-f]{6}$/.test(code)) {
          return React.createElement(
            'div',
            { className: 'flex items-center gap-2' },
            React.createElement('div', {
              className: 'h-6 w-6 rounded border border-gray-300',
              style: { backgroundColor: code },
            }),
            React.createElement('span', null, code)
          );
        }

        return code;
      },
    },
    {
      field: 'label',
      header: 'Display Label',
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
    field: 'label',
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
