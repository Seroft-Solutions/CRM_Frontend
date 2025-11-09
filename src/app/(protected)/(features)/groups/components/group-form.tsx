'use client';

import React from 'react';
import { GroupForm } from './form/group-form-wizard';

interface GroupFormProps {
  id?: number;
}

/**
 * Main entry point for the Group form.
 * This component uses the new modular, config-driven form architecture.
 *
 * To modify the form structure, update the configuration in:
 * - form/group-form-config.ts (generated from templates)
 *
 * The form configuration controls:
 * - Step order and field grouping
 * - Validation rules
 * - Relationship dependencies and cascading filters
 * - UI behavior and styling
 *
 * This approach ensures consistency across all entity forms while maintaining
 * full customization capabilities through configuration rather than code changes.
 */
export function GroupFormWrapper({ id }: GroupFormProps) {
  return <GroupForm id={id} />;
}

export { GroupFormWrapper as GroupForm };
