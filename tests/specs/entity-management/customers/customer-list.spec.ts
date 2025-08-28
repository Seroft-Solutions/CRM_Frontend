import { test, expect } from '../../../fixtures/test-base';
import { TestHelpers, Selectors } from '../../../utils/test-helpers';

test.describe('Customer Management', () => {
  test.describe('Customer List Page', () => {
    test.beforeEach(async ({ page }) => {
      // Navigate to customers page
      await page.goto('/customers');
    });

    test('should display customers list with proper columns', async ({ page }) => {
      const helpers = new TestHelpers(page);
      await helpers.waitForPageLoad();
      
      // Check for table headers
      await expect(page.locator('table th')).toContainText(['Name', 'Email', 'Organization']);
      
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
      await page.getByPlaceholder('Search customers...').fill('John Doe');
      await page.keyboard.press('Enter');
      
      await helpers.waitForNavigation();
      
      // Verify search results
      await expect(page.locator('table tbody tr')).toContainText('John Doe');
    });

    test('should navigate to customer details on row click', async ({ page }) => {
      const helpers = new TestHelpers(page);
      await helpers.waitForPageLoad();
      
      // Click on first customer row
      await page.locator('table tbody tr').first().click();
      
      // Verify navigation to customer details
      await expect(page).toHaveURL(/\/customers\/\d+/);
    });

    test('should handle pagination correctly', async ({ page }) => {
      const helpers = new TestHelpers(page);
      await helpers.waitForPageLoad();
      
      // Check if pagination exists (if there are many customers)
      const pagination = page.locator('[data-testid="pagination"]');
      
      if (await pagination.isVisible()) {
        // Click next page
        await page.getByRole('button', { name: 'Next' }).click();
        await helpers.waitForNavigation();
        
        // Verify page change
        await expect(page.locator('table tbody tr')).toHaveCountGreaterThan(0);
      }
    });
  });
});