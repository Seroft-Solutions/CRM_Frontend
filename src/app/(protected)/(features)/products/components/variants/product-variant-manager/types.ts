import { ProductVariantDTOStatus } from '@/core/api/generated/spring/schemas/ProductVariantDTOStatus';
import type { VariantImageSlotMap } from '@/features/product-variant-images/utils/variant-image-slots';

/**
 * @interface VariantSelection
 * @description Represents a single selected attribute and option for a product variant.
 * @property {number} attributeId - The ID of the system config attribute.
 * @property {string} attributeLabel - The display label of the attribute.
 * @property {number} optionId - The ID of the selected system config attribute option.
 * @property {string} optionLabel - The display label of the option.
 * @property {string} [optionCode] - The unique code for the option, often used in SKU generation.
 */
export interface VariantSelection {
  attributeId: number;
  attributeLabel: string;
  optionId: number;
  optionLabel: string;
  optionCode?: string;
}

/**
 * @interface DraftVariantRow
 * @description Represents a newly generated variant that has not been saved yet.
 * @property {string} key - A unique key identifying the combination of attribute options.
 * @property {string} sku - The stock keeping unit for the variant.
 * @property {number} [price] - The price of the variant.
 * @property {number} stockQuantity - The available stock for the variant.
 * @property {ProductVariantDTOStatus} status - The status of the variant (e.g., ACTIVE, INACTIVE).
 * @property {VariantSelection[]} selections - The array of attribute/option selections that define this variant.
 * @property {boolean} isDuplicate - Whether this variant combination already exists.
 * @property {boolean} [isPrimary] - Whether this variant should be marked as primary.
 * @property {VariantImageSlotMap<File | null>} [imageFiles] - Optional image files for front/back/side slots.
 */
export interface DraftVariantRow {
  key: string;
  sku: string;
  price?: number;
  stockQuantity: number;
  status: ProductVariantDTOStatus;
  selections: VariantSelection[];
  isDuplicate?: boolean;
  isPrimary?: boolean;
  imageFiles?: VariantImageSlotMap<File | null>;
}

/**
 * @interface ExistingVariantRow
 * @description Represents a product variant that is already saved in the system.
 * @property {number} id - The unique ID of the variant.
 * @property {string} sku - The stock keeping unit for the variant.
 * @property {number} [price] - The price of the variant.
 * @property {number} stockQuantity - The available stock for the variant.
 * @property {ProductVariantDTOStatus} status - The status of the variant.
 * @property {VariantSelection[]} selections - The array of attribute/option selections that define this variant.
 * @property {boolean} [isPrimary] - Whether this variant is marked as primary.
 */
export interface ExistingVariantRow {
  id: number;
  sku: string;
  price?: number;
  stockQuantity: number;
  status: ProductVariantDTOStatus;
  selections: VariantSelection[];
  isPrimary?: boolean;
}

/**
 * @type CombinedVariantRow
 * @description A union type that represents a row in the variants table. It can be a new draft, duplicate draft, or existing variant.
 */
export type CombinedVariantRow =
  | { kind: 'draft'; rowKey: string; row: DraftVariantRow }
  | { kind: 'duplicate'; rowKey: string; row: DraftVariantRow }
  | { kind: 'existing'; rowKey: string; row: ExistingVariantRow };
