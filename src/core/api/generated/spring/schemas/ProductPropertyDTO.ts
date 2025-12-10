/**
 * Generated manually to support configurable product properties.
 */

export interface ProductPropertyDTO {
  id?: number;
  /**
   * @minLength 1
   * @maxLength 100
   */
  name: string;
  displayOrder?: number;
  values?: string[];
}
