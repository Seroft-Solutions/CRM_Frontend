"use client";

import React from "react";
import { MeetingReminderForm } from "./form/meeting-reminder-form-wizard";

interface MeetingReminderFormProps {
  id?: number;
}

/**
 * Main entry point for the MeetingReminder form.
 * This component uses the new modular, config-driven form architecture.
 *
 * To modify the form structure, update the configuration in:
 * - form/meeting-reminder-form-config.ts (generated from templates)
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
export function MeetingReminderFormWrapper({ id }: MeetingReminderFormProps) {
  return <MeetingReminderForm id={id} />;
}

// Export with original name for backward compatibility
export { MeetingReminderFormWrapper as MeetingReminderForm };
