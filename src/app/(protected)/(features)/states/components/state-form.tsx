'use client';

import React from 'react';
import { StateForm } from './form/state-form-wizard';

interface StateFormProps {
  id?: number;
}

/**
 * Main entry point for the State form.
 * This component uses the new modular, config-driven form architecture.
 *
 * To modify the form structure, update the configuration in:
 * - form/state-form-config.ts (generated from templates)
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
export function StateFormWrapper({ id }: StateFormProps) {
  return <StateForm id={id} />;
}

export { StateFormWrapper as StateForm };
