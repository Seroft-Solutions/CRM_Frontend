'use client';

import React from 'react';
import { ProductForm } from './form/product-form-wizard';

interface ProductFormProps {
  id?: number;
}

/**
 * Main entry point for the Product form.
 * This component uses the new modular, config-driven form architecture.
 *
 * To modify the form structure, update the configuration in:
 * - form/product-form-config.ts (generated from templates)
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
export function ProductFormWrapper({ id }: ProductFormProps) {
  return <ProductForm id={id} />;
}

export { ProductFormWrapper as ProductForm };
