'use client';

import React from 'react';
import { UserProfileForm } from './form/user-profile-form-wizard';

interface UserProfileFormProps {
  id?: number;
}

/**
 * Main entry point for the UserProfile form.
 * This component uses the new modular, config-driven form architecture.
 *
 * To modify the form structure, update the configuration in:
 * - form/user-profile-form-config.ts (generated from templates)
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
export function UserProfileFormWrapper({ id }: UserProfileFormProps) {
  return <UserProfileForm id={id} />;
}

export { UserProfileFormWrapper as UserProfileForm };
