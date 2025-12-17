'use client';

import { EntityFormPage } from '@/entity-library';

import {
  systemConfigCreateFormPageConfig,
  systemConfigEditFormPageConfig,
  systemConfigViewFormPageConfig,
} from '../config/form-page.config';

export function SystemConfigCreateFormPageClient() {
  return <EntityFormPage config={systemConfigCreateFormPageConfig} />;
}

export function SystemConfigEditFormPageClient({ id }: { id: number }) {
  return <EntityFormPage config={systemConfigEditFormPageConfig} id={id} />;
}

export function SystemConfigViewFormPageClient({ id }: { id: number }) {
  return <EntityFormPage config={systemConfigViewFormPageConfig} id={id} />;
}
