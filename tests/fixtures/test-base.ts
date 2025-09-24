import { test as base, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

// Base test fixture for common test setup
type TestFixtures = {
  authenticatedPage: Page;
};

export const test = base.extend<TestFixtures>({
  authenticatedPage: async ({ page }, use) => {
    // This fixture can be extended later for authentication
    // For now, it just provides the page instance
    await use(page);
  },
});

export { expect };
