'use client';

import { EntityTablePage } from '@/entity-library';
import { systemConfigAttributeOptionEntityConfig } from '../config/entity.config';

export function SystemConfigAttributeOptionsTableClient() {
  return <EntityTablePage config={systemConfigAttributeOptionEntityConfig} />;
}
