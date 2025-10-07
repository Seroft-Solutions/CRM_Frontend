// ===============================================================
// 🛑 AUTO-GENERATED FILE – DO NOT EDIT DIRECTLY 🛑
// - Source: code generation pipeline
// - To customize: use ./overrides/[filename].ts or feature-level
//   extensions (e.g., ./src/features/.../extensions/)
// - Direct edits will be overwritten on regeneration
// ===============================================================
'use client';

import React from 'react';
import { ProductCategoryForm } from './form/product-category-form-wizard';

interface ProductCategoryFormProps {
  id?: number;
}

/**
 * Main entry point for the ProductCategory form.
 * This component uses the new modular, config-driven form architecture.
 *
 * To modify the form structure, update the configuration in:
 * - form/product-category-form-config.ts (generated from templates)
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
export function ProductCategoryFormWrapper({ id }: ProductCategoryFormProps) {
  return <ProductCategoryForm id={id} />;
}

// Export with original name for backward compatibility
export { ProductCategoryFormWrapper as ProductCategoryForm };
