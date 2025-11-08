/**
 * Lead Number Generation Utility
 *
 * Generates unique lead numbers for calls using the format:
 * [ORG_PREFIX][5_NUMERIC_DIGITS]
 *
 * Example: ABC12345
 *
 * Where:
 * - ORG_PREFIX: First 3 alphabetic characters of organization name (uppercase)
 * - 5_NUMERIC_DIGITS: 5-digit numeric sequence based on timestamp and random
 */

/**
 * Generates a unique lead number for a call
 * @param organizationName - The name of the organization (for prefix)
 * @returns Generated lead number string (8 characters total)
 */
export function generateLeadNo(organizationName: string): string {
  const orgPrefix = organizationName
    .replace(/[^a-zA-Z]/g, '')
    .substring(0, 3)
    .toUpperCase()
    .padEnd(3, 'A');

  const now = new Date();

  const year = now.getFullYear() % 100;
  const month = now.getMonth() + 1;
  const day = now.getDate();

  const dateNumber = (year * 10000 + month * 100 + day) % 10000;
  const dateDigits = String(dateNumber).padStart(4, '0');

  const randomDigit = Math.floor(Math.random() * 10);

  return `${orgPrefix}${dateDigits}${randomDigit}`;
}

/**
 * Generates a random alphanumeric string
 * @param length - Length of the random string
 * @returns Random alphanumeric string
 */
function generateRandomString(length: number): string {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';

  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return result;
}

/**
 * Validates if a lead number follows the expected format
 * @param leadNo - Lead number to validate
 * @returns Boolean indicating if the format is valid
 */
export function validateLeadNoFormat(leadNo: string): boolean {
  if (!leadNo || typeof leadNo !== 'string') {
    return false;
  }

  const pattern = /^[A-Z]{3}\d{5}$/;
  return pattern.test(leadNo);
}

/**
 * Extracts components from a lead number
 * @param leadNo - Lead number to parse
 * @returns Object containing parsed components or null if invalid
 */
export function parseLeadNo(leadNo: string): {
  orgPrefix: string;
  numericPart: string;
} | null {
  if (!validateLeadNoFormat(leadNo)) {
    return null;
  }

  return {
    orgPrefix: leadNo.substring(0, 3),
    numericPart: leadNo.substring(3, 8),
  };
}

/**
 * Formats a lead number for display (adds separators for readability)
 * @param leadNo - Lead number to format
 * @returns Formatted lead number string
 */
export function formatLeadNoForDisplay(leadNo: string): string {
  const parsed = parseLeadNo(leadNo);
  if (!parsed) {
    return leadNo;
  }

  const { orgPrefix, numericPart } = parsed;

  return `${orgPrefix}-${numericPart}`;
}
