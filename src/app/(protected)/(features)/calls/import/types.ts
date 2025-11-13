'use client';

import { ImportHistoryDTO } from '@/core/api/generated/spring/schemas';

export type SearchableOption = { value: string; label: string };

export type ImportHistoryRowWithMeta = ImportHistoryDTO & {
  customerIsNew?: boolean;
  productIsNew?: boolean;
};
