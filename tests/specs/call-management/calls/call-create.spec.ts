import { test, expect } from '../../../fixtures/test-base';
import { TestHelpers, Selectors } from '../../../utils/test-helpers';

test.describe('Call Management', () => {
  test.describe('Create Call', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/calls/new');
    });

    test('should create call with valid data', async ({ page }) => {
      const helpers = new TestHelpers(page);
      await helpers.waitForPageLoad();
      
      // Fill call form
      await page.getByLabel('Customer').click();
      await page.getByRole('option', { name: 'John Doe' }).click();
      
      await page.getByLabel('Call Type').click();
      await page.getByRole('option', { name: 'Follow-up' }).click();
      
      await page.getByLabel('Description').fill('Follow-up call regarding product inquiry');
      
      await page.getByLabel('Scheduled Date').fill('2024-12-31');
      await page.getByLabel('Scheduled Time').fill('14:30');
      
      // Submit form
      await page.getByRole('button', { name: 'Create Call' }).click();
      
      // Verify success
      await expect(page.locator(Selectors.successToast)).toBeVisible();
      await expect(page).toHaveURL('/calls');
    });

    test('should show validation errors for missing required fields', async ({ page }) => {
      const helpers = new TestHelpers(page);
      await helpers.waitForPageLoad();
      
      // Try to submit without required fields
      await page.getByRole('button', { name: 'Create Call' }).click();
      
      // Verify validation errors
      await expect(page.getByText('Customer is required')).toBeVisible();
      await expect(page.getByText('Call type is required')).toBeVisible();
    });

    test('should auto-populate customer details when selected', async ({ page }) => {
      const helpers = new TestHelpers(page);
      await helpers.waitForPageLoad();
      
      // Select customer
      await page.getByLabel('Customer').click();
      await page.getByRole('option', { name: 'John Doe' }).click();
      
      // Verify auto-populated fields
      await expect(page.getByDisplayValue('john.doe@example.com')).toBeVisible();
      await expect(page.getByDisplayValue('+1234567890')).toBeVisible();
    });

    test('should handle call scheduling conflicts', async ({ page }) => {
      const helpers = new TestHelpers(page);
      await helpers.waitForPageLoad();
      
      // Fill form with conflicting time slot
      await page.getByLabel('Customer').click();
      await page.getByRole('option', { name: 'Jane Smith' }).click();
      
      await page.getByLabel('Scheduled Date').fill('2024-12-25');
      await page.getByLabel('Scheduled Time').fill('10:00');
      
      await page.getByRole('button', { name: 'Create Call' }).click();
      
      // Verify conflict warning
      await expect(page.getByText('You have another call scheduled at this time')).toBeVisible();
      
      // Should still allow creation with confirmation
      await page.getByRole('button', { name: 'Create Anyway' }).click();
      await expect(page.locator(Selectors.successToast)).toBeVisible();
    });
  });
});