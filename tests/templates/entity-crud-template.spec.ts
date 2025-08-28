import { test, expect } from '../fixtures/test-base';
import { TestHelpers, Selectors } from '../utils/test-helpers';

/**
 * Template for Entity CRUD Tests
 * Replace {Entity} with your entity name (e.g., Customer, Product, Organization)
 * Replace {entity} with lowercase version (e.g., customer, product, organization)
 * Replace {entities} with plural lowercase (e.g., customers, products, organizations)
 */

test.describe('{Entity} Management', () => {
  test.describe('{Entity} List Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/{entities}');
    });

    test('should display {entities} list with proper columns', async ({ page }) => {
      const helpers = new TestHelpers(page);
      await helpers.waitForPageLoad();
      
      // Verify table headers - customize based on your entity fields
      await expect(page.locator('table th')).toContainText(['Name', 'Status', 'Created']);
      
      // Verify data rows are displayed
      await expect(page.locator('table tbody tr')).toHaveCountGreaterThan(0);
    });

    test('should filter {entities} by organization', async ({ page }) => {
      const helpers = new TestHelpers(page);
      await helpers.waitForPageLoad();
      
      // Use organization filter if applicable
      await page.getByLabel('Organization').click();
      await page.getByRole('option', { name: 'Test Organization' }).click();
      
      await helpers.waitForNavigation();
      await expect(page.locator('table tbody tr')).toContainText('Test Organization');
    });

    test('should search {entities} by name', async ({ page }) => {
      const helpers = new TestHelpers(page);
      await helpers.waitForPageLoad();
      
      await page.getByPlaceholder('Search {entities}...').fill('Test {Entity}');
      await page.keyboard.press('Enter');
      
      await helpers.waitForNavigation();
      await expect(page.locator('table tbody tr')).toContainText('Test {Entity}');
    });
  });

  test.describe('Create {Entity}', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/{entities}/new');
    });

    test('should create {entity} with valid data', async ({ page }) => {
      const helpers = new TestHelpers(page);
      await helpers.waitForPageLoad();
      
      // Fill form fields - customize based on your entity
      await page.getByLabel('{Entity} Name').fill('Test {Entity}');
      await page.getByLabel('Description').fill('Test description');
      
      // Submit form
      await page.getByRole('button', { name: 'Create {Entity}' }).click();
      
      // Verify success
      await expect(page.locator(Selectors.successToast)).toBeVisible();
      await expect(page).toHaveURL('/{entities}');
    });

    test('should show validation errors for invalid data', async ({ page }) => {
      const helpers = new TestHelpers(page);
      await helpers.waitForPageLoad();
      
      // Submit without required fields
      await page.getByRole('button', { name: 'Create {Entity}' }).click();
      
      // Verify validation errors - customize based on required fields
      await expect(page.getByText('{Entity} name is required')).toBeVisible();
    });
  });

  test.describe('Edit {Entity}', () => {
    test('should update {entity} details', async ({ page }) => {
      // Navigate to edit page - adjust URL pattern as needed
      await page.goto('/{entities}/1/edit');
      
      const helpers = new TestHelpers(page);
      await helpers.waitForPageLoad();
      
      // Modify existing data
      await page.getByLabel('{Entity} Name').clear();
      await page.getByLabel('{Entity} Name').fill('Updated {Entity}');
      
      await page.getByRole('button', { name: 'Update {Entity}' }).click();
      
      // Verify success
      await expect(page.locator(Selectors.successToast)).toBeVisible();
    });
  });

  test.describe('Delete {Entity}', () => {
    test('should delete {entity} with confirmation', async ({ page }) => {
      await page.goto('/{entities}');
      
      const helpers = new TestHelpers(page);
      await helpers.waitForPageLoad();
      
      // Find delete button for first item
      await page.locator('table tbody tr').first().getByRole('button', { name: 'Delete' }).click();
      
      // Confirm deletion in dialog
      await page.getByRole('button', { name: 'Confirm Delete' }).click();
      
      // Verify success
      await expect(page.locator(Selectors.successToast)).toBeVisible();
      await expect(page.locator(Selectors.successToast)).toContainText('{Entity} deleted successfully');
    });
  });
});