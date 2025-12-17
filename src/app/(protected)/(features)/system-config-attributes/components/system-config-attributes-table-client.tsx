'use client';

import { EntityTablePage } from '@/entity-library';
import { systemConfigAttributeEntityConfig } from '../config/entity.config';

export function SystemConfigAttributesTableClient() {
  return <EntityTablePage config={systemConfigAttributeEntityConfig} />;
}
