"use client";

import React from "react";
import { PriorityForm } from "./form/priority-form-wizard";

interface PriorityFormProps {
  id?: number;
}

/**
 * Main entry point for the Priority form.
 * This component uses the new modular, config-driven form architecture.
 *
 * To modify the form structure, update the configuration in:
 * - form/priority-form-config.ts (generated from templates)
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
export function PriorityFormWrapper({ id }: PriorityFormProps) {
  return <PriorityForm id={id} />;
}

// Export with original name for backward compatibility
export { PriorityFormWrapper as PriorityForm };
