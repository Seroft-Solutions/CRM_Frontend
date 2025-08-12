// ===============================================================
// 🛑 AUTO-GENERATED FILE – DO NOT EDIT DIRECTLY 🛑
// - Source: code generation pipeline
// - To customize: use ./overrides/[filename].ts or feature-level
//   extensions (e.g., ./src/features/.../extensions/)
// - Direct edits will be overwritten on regeneration
// ===============================================================
'use client';

import React from 'react';
import { DistrictForm } from '@/app/(protected)/(features)/districts/components/form/district-form-wizard';

interface DistrictFormProps {
  id?: number;
}

/**
 * Main entry point for the District form.
 * This component uses the new modular, config-driven form architecture.
 *
 * To modify the form structure, update the configuration in:
 * - form/district-form-config.ts (generated from templates)
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
export function DistrictFormWrapper({ id }: DistrictFormProps) {
  return <DistrictForm id={id} />;
}

// Export with original name for backward compatibility
export { DistrictFormWrapper as DistrictForm };
