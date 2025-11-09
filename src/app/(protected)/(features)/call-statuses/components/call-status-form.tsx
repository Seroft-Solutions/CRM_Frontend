'use client';

import React from 'react';
import { CallStatusForm } from './form/call-status-form-wizard';

interface CallStatusFormProps {
  id?: number;
}

/**
 * Main entry point for the CallStatus form.
 * This component uses the new modular, config-driven form architecture.
 *
 * To modify the form structure, update the configuration in:
 * - form/call-status-form-config.ts (generated from templates)
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
export function CallStatusFormWrapper({ id }: CallStatusFormProps) {
  return <CallStatusForm id={id} />;
}

export { CallStatusFormWrapper as CallStatusForm };
