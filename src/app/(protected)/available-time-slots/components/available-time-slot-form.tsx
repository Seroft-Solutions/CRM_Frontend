"use client";

import React from "react";
import { AvailableTimeSlotForm } from "./form/available-time-slot-form-wizard";

interface AvailableTimeSlotFormProps {
  id?: number;
}

/**
 * Main entry point for the AvailableTimeSlot form.
 * This component uses the new modular, config-driven form architecture.
 *
 * To modify the form structure, update the configuration in:
 * - form/available-time-slot-form-config.ts (generated from templates)
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
export function AvailableTimeSlotFormWrapper({ id }: AvailableTimeSlotFormProps) {
  return <AvailableTimeSlotForm id={id} />;
}

// Export with original name for backward compatibility
export { AvailableTimeSlotFormWrapper as AvailableTimeSlotForm };
