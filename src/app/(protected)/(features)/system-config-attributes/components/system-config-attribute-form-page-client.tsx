'use client';

import { EntityFormPage } from '@/entity-library';
import {
  systemConfigAttributeCreateFormPageConfig,
  systemConfigAttributeEditFormPageConfig,
  systemConfigAttributeViewFormPageConfig,
} from '../config/form-page.config';

export function SystemConfigAttributeCreateFormPageClient() {
  return <EntityFormPage config={systemConfigAttributeCreateFormPageConfig} />;
}

export function SystemConfigAttributeEditFormPageClient({ id }: { id: number }) {
  return <EntityFormPage config={systemConfigAttributeEditFormPageConfig} id={id} />;
}

export function SystemConfigAttributeViewFormPageClient({ id }: { id: number }) {
  return <EntityFormPage config={systemConfigAttributeViewFormPageConfig} id={id} />;
}
