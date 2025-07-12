"use client";

import React from "react";
import { ChannelTypeForm } from "@/app/(protected)/(features)/channel-types/components/form/channel-type-form-wizard";

interface ChannelTypeFormProps {
  id?: number;
}

/**
 * Main entry point for the ChannelType form.
 * This component uses the new modular, config-driven form architecture.
 *
 * To modify the form structure, update the configuration in:
 * - form/channel-type-form-config.ts (generated from templates)
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
export function ChannelTypeFormWrapper({ id }: ChannelTypeFormProps) {
  return <ChannelTypeForm id={id} />;
}

// Export with original name for backward compatibility
export { ChannelTypeFormWrapper as ChannelTypeForm };
