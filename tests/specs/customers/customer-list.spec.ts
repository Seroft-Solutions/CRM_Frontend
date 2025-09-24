import { test, expect } from '../../fixtures/test-base';
import { TestHelpers, Selectors } from '../../utils/test-helpers';

test.describe('Customer Management', () => {
  test.describe('Customer List Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/customers');
    });

    test('should display customers list with essential information', async ({ page }) => {
      const helpers = new TestHelpers(page);
      await helpers.waitForPageLoad();

      // Check for customer-specific table headers
      await expect(page.locator('table th')).toContainText(['Name', 'Organization']);

      // Verify customer rows are displayed
      await expect(page.locator('table tbody tr')).toHaveCountGreaterThan(0);
    });

    test('should filter customers by organization', async ({ page }) => {
      const helpers = new TestHelpers(page);
      await helpers.waitForPageLoad();

      // Use organization filter
      await page.getByLabel('Organization').click();
      await page.getByRole('option', { name: 'Test Organization' }).click();

      await helpers.waitForNavigation();

      // Verify filtered results
      await expect(page.locator('table tbody tr')).toContainText('Test Organization');
    });

    test('should search customers by name', async ({ page }) => {
      const helpers = new TestHelpers(page);
      await helpers.waitForPageLoad();

      // Use search functionality
      await page.getByPlaceholder('Search customers...').fill('John');
      await page.keyboard.press('Enter');

      await helpers.waitForNavigation();

      // Verify search results
      await expect(page.locator('table tbody tr')).toContainText('John');
    });

    test('should navigate to customer details', async ({ page }) => {
      const helpers = new TestHelpers(page);
      await helpers.waitForPageLoad();

      // Click on first customer row
      await page.locator('table tbody tr').first().click();

      // Verify navigation to customer details
      await expect(page).toHaveURL(/\/customers\/\d+/);
    });

    test('should have create new customer option', async ({ page }) => {
      const helpers = new TestHelpers(page);
      await helpers.waitForPageLoad();

      // Look for create/add new customer button
      const createButton = page.getByRole('button', { name: /new customer|add customer|create/i });
      await expect(createButton).toBeVisible();

      // Test navigation to create form
      await createButton.click();
      await expect(page).toHaveURL('/customers/new');
    });

    test('should support customer data export if available', async ({ page }) => {
      const helpers = new TestHelpers(page);
      await helpers.waitForPageLoad();

      // Look for export functionality
      const exportButton = page.getByRole('button', { name: /export|download/i });

      if (await exportButton.isVisible()) {
        await expect(exportButton).toBeVisible();
      }
    });

    test('should handle pagination for large customer lists', async ({ page }) => {
      const helpers = new TestHelpers(page);
      await helpers.waitForPageLoad();

      // Check if pagination exists
      const pagination = page.locator(
        '[data-testid="pagination"], .pagination, nav[aria-label="pagination"]'
      );

      if (await pagination.isVisible()) {
        // Test pagination functionality
        const nextButton = page.getByRole('button', { name: /next/i });
        if (await nextButton.isEnabled()) {
          await nextButton.click();
          await helpers.waitForNavigation();

          // Verify page change
          await expect(page.locator('table tbody tr')).toHaveCountGreaterThan(0);
        }
      }
    });
  });
});
