'use client';

import React from 'react';
import { CallRemarkForm } from './form/call-remark-form-wizard';

interface CallRemarkFormProps {
  id?: number;
}

/**
 * Main entry point for the CallRemark form.
 * This component uses the new modular, config-driven form architecture.
 *
 * To modify the form structure, update the configuration in:
 * - form/call-remark-form-config.ts (generated from templates)
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
export function CallRemarkFormWrapper({ id }: CallRemarkFormProps) {
  return <CallRemarkForm id={id} />;
}

export { CallRemarkFormWrapper as CallRemarkForm };
