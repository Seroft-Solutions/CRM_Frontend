'use client';

import React from 'react';
import { ProductSubCategoryForm } from './form/product-sub-category-form-wizard';

interface ProductSubCategoryFormProps {
  id?: number;
}

/**
 * Main entry point for the ProductSubCategory form.
 * This component uses the new modular, config-driven form architecture.
 *
 * To modify the form structure, update the configuration in:
 * - form/product-sub-category-form-config.ts (generated from templates)
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
export function ProductSubCategoryFormWrapper({ id }: ProductSubCategoryFormProps) {
  return <ProductSubCategoryForm id={id} />;
}

export { ProductSubCategoryFormWrapper as ProductSubCategoryForm };
