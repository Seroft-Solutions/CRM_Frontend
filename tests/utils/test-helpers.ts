import type { Page } from '@playwright/test';

/**
 * Common test utilities and helpers
 */
export class TestHelpers {
  constructor(private page: Page) {}

  /**
   * Wait for the page to load completely
   */
  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Take a screenshot with timestamp
   */
  async takeTimestampedScreenshot(name: string) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    await this.page.screenshot({
      path: `test-results/screenshots/${name}-${timestamp}.png`,
      fullPage: true,
    });
  }

  /**
   * Check if element is visible and enabled
   */
  async isElementReady(selector: string): Promise<boolean> {
    const element = this.page.locator(selector);
    return (await element.isVisible()) && (await element.isEnabled());
  }

  /**
   * Wait for navigation to complete
   */
  async waitForNavigation() {
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(500); // Small buffer for any async operations
  }
}

/**
 * Common selectors for CRM frontend
 */
export const Selectors = {
  // Navigation
  navbar: '[role="navigation"]',
  sidebar: '[data-testid="sidebar"]',

  // Common buttons
  submitButton: 'button[type="submit"]',
  cancelButton: 'button:has-text("Cancel")',
  saveButton: 'button:has-text("Save")',

  // Forms
  formContainer: 'form',
  loadingSpinner: '[data-testid="loading"]',

  // Toast notifications
  toast: '[data-testid="toast"]',
  successToast: '[data-testid="toast"]:has-text("success")',
  errorToast: '[data-testid="toast"]:has-text("error")',
} as const;
