'use client';

import { ImportHistoryDTO } from '@/core/api/generated/spring/schemas';

export const tableScrollStyles = `
  .table-scroll::-webkit-scrollbar {
    height: 8px;
  }
  .table-scroll::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 4px;
  }
  .table-scroll::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 4px;
  }
  .table-scroll::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }
`;

export const HEADERS = [
  'Customer name',
  'Customer Phone Number',
  'Zip Code',
  'Product Name',
  'Barcode Text',
  'External Id',
  'Call Type',
  'Sub Call Type',
  'Priority',
  'Call Status',
  'Remark',
  'Reason',
] as const;

export const TEMPLATE_FIELD_ORDER: Array<keyof ImportHistoryDTO> = [
  'externalId',
  'customerBusinessName',
  'phoneNumber',
  'zipCode',
  'productName',
  'productCode',
  'callType',
  'subCallType',
  'priority',
  'callStatus',
  'remark',
];

export const normalizeKey = (value?: string | null) => value?.trim().toLowerCase() ?? '';

export const buildSubCallTypeKey = (callTypeId: number, name: string) =>
  `${callTypeId}:${normalizeKey(name)}`;
