/**
 * Additional metadata we attach to product image files while they stay
 * inside the form. It allows us to track whether a user manually renamed
 * the file so we can skip automatic renaming later in the flow.
 */
export type RenamableProductImageFile = File & {
  /**
   * Final filename (including extension) chosen by the user. When present,
   * we do not overwrite the file name with the default orientation-based name.
   */
  productCustomName?: string;
};
