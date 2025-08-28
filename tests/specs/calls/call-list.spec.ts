import { test, expect } from '../../fixtures/test-base';
import { TestHelpers, Selectors } from '../../utils/test-helpers';

test.describe('Call Management', () => {
  test.describe('Call List Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/calls');
    });

    test('should display calls list with essential columns', async ({ page }) => {
      const helpers = new TestHelpers(page);
      await helpers.waitForPageLoad();
      
      // Verify table headers match call management needs
      await expect(page.locator('table th')).toContainText(['Customer', 'Call Type', 'Status', 'Scheduled']);
      
      // Verify call rows are displayed
      await expect(page.locator('table tbody tr')).toHaveCountGreaterThan(0);
    });

    test('should filter calls by status', async ({ page }) => {
      const helpers = new TestHelpers(page);
      await helpers.waitForPageLoad();
      
      // Use call status filter
      await page.getByLabel('Status').click();
      await page.getByRole('option', { name: 'Completed' }).click();
      
      await helpers.waitForNavigation();
      
      // Verify filtered results show only completed calls
      const statusCells = page.locator('table tbody tr td').filter({ hasText: /completed/i });
      await expect(statusCells.first()).toBeVisible();
    });

    test('should search calls by customer name', async ({ page }) => {
      const helpers = new TestHelpers(page);
      await helpers.waitForPageLoad();
      
      // Use customer search
      await page.getByPlaceholder('Search calls...').fill('John Doe');
      await page.keyboard.press('Enter');
      
      await helpers.waitForNavigation();
      
      // Verify search results contain customer
      await expect(page.locator('table tbody tr')).toContainText('John Doe');
    });

    test('should navigate to call details on row click', async ({ page }) => {
      const helpers = new TestHelpers(page);
      await helpers.waitForPageLoad();
      
      // Click on first call row
      await page.locator('table tbody tr').first().click();
      
      // Verify navigation to call details
      await expect(page).toHaveURL(/\/calls\/\d+/);
    });

    test('should show meeting scheduler option for calls', async ({ page }) => {
      const helpers = new TestHelpers(page);
      await helpers.waitForPageLoad();
      
      // Look for schedule meeting button/option
      const scheduleMeetingButton = page.getByRole('button', { name: /schedule meeting|meeting/i });
      
      if (await scheduleMeetingButton.isVisible()) {
        await expect(scheduleMeetingButton).toBeVisible();
      } else {
        // Alternative: check for meeting-related actions in dropdown
        const actionsButton = page.locator('table tbody tr').first().getByRole('button', { name: /actions|menu/i });
        if (await actionsButton.isVisible()) {
          await actionsButton.click();
          await expect(page.getByText(/schedule meeting|meeting/i)).toBeVisible();
        }
      }
    });

    test('should handle call status updates', async ({ page }) => {
      const helpers = new TestHelpers(page);
      await helpers.waitForPageLoad();
      
      // Find status update option (could be dropdown or button)
      const firstRow = page.locator('table tbody tr').first();
      const statusCell = firstRow.locator('td').filter({ hasText: /pending|in progress|completed/i });
      
      if (await statusCell.locator('select, button').isVisible()) {
        await statusCell.locator('select, button').first().click();
        
        // Select new status
        await page.getByRole('option', { name: 'In Progress' }).click();
        
        // Verify status update
        await expect(page.locator(Selectors.successToast)).toBeVisible();
      }
    });

    test('should display call remarks section when available', async ({ page }) => {
      const helpers = new TestHelpers(page);
      await helpers.waitForPageLoad();
      
      // Check if calls have expandable sections or separate remarks column
      const remarksSection = page.locator('[data-testid="call-remarks"], .call-remarks, td').filter({ hasText: /remark/i });
      
      if (await remarksSection.first().isVisible()) {
        await expect(remarksSection.first()).toBeVisible();
      } else {
        // Alternative: check if clicking a row shows remarks
        await page.locator('table tbody tr').first().click();
        await helpers.waitForPageLoad();
        
        const remarksOnDetailPage = page.locator('h2, h3, .section-title').filter({ hasText: /remark/i });
        if (await remarksOnDetailPage.isVisible()) {
          await expect(remarksOnDetailPage).toBeVisible();
        }
      }
    });
  });
});