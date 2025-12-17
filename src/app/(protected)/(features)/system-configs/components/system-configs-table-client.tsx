'use client';

import { EntityTablePage } from '@/entity-library';
import { systemConfigEntityConfig } from '../config/entity.config';

export function SystemConfigsTableClient() {
  return <EntityTablePage config={systemConfigEntityConfig} />;
}
