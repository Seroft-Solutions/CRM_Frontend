'use client';

import { EntityFormPage } from '@/entity-library';
import {
  systemConfigAttributeOptionCreateFormPageConfig,
  systemConfigAttributeOptionEditFormPageConfig,
  systemConfigAttributeOptionViewFormPageConfig,
} from '../config/form-page.config';

export function SystemConfigAttributeOptionCreateFormPageClient() {
  return <EntityFormPage config={systemConfigAttributeOptionCreateFormPageConfig} />;
}

export function SystemConfigAttributeOptionEditFormPageClient({ id }: { id: number }) {
  return <EntityFormPage config={systemConfigAttributeOptionEditFormPageConfig} id={id} />;
}

export function SystemConfigAttributeOptionViewFormPageClient({ id }: { id: number }) {
  return <EntityFormPage config={systemConfigAttributeOptionViewFormPageConfig} id={id} />;
}
