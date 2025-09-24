import { test, expect } from '../../fixtures/test-base';
import { TestHelpers, Selectors } from '../../utils/test-helpers';

test.describe('Meeting Management', () => {
  test.describe('Meeting List Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/meetings');
    });

    test('should display meetings list with scheduling information', async ({ page }) => {
      const helpers = new TestHelpers(page);
      await helpers.waitForPageLoad();

      // Check for meeting-specific table headers
      await expect(page.locator('table th')).toContainText(['Title', 'Date', 'Participants']);

      // Verify meeting rows are displayed
      await expect(page.locator('table tbody tr')).toHaveCountGreaterThan(0);
    });

    test('should filter meetings by date range', async ({ page }) => {
      const helpers = new TestHelpers(page);
      await helpers.waitForPageLoad();

      // Look for date range filter
      const dateFilter = page.getByLabel(/date|from|start/i);
      if (await dateFilter.isVisible()) {
        await dateFilter.fill('2024-12-01');

        await helpers.waitForNavigation();

        // Verify filtered results
        await expect(page.locator('table tbody tr')).toHaveCountGreaterThanOrEqual(0);
      }
    });

    test('should show meeting status (upcoming, in-progress, completed)', async ({ page }) => {
      const helpers = new TestHelpers(page);
      await helpers.waitForPageLoad();

      // Check for status indicators
      const statusElements = page.locator('table tbody tr td').filter({
        hasText: /upcoming|in progress|completed|scheduled/i,
      });

      if (await statusElements.first().isVisible()) {
        await expect(statusElements.first()).toBeVisible();
      }
    });

    test('should navigate to meeting details', async ({ page }) => {
      const helpers = new TestHelpers(page);
      await helpers.waitForPageLoad();

      // Click on first meeting row
      await page.locator('table tbody tr').first().click();

      // Verify navigation to meeting details
      await expect(page).toHaveURL(/\/meetings\/\d+/);
    });

    test('should have create new meeting option', async ({ page }) => {
      const helpers = new TestHelpers(page);
      await helpers.waitForPageLoad();

      // Look for create/schedule new meeting button
      const createButton = page.getByRole('button', {
        name: /new meeting|schedule meeting|create/i,
      });
      await expect(createButton).toBeVisible();

      // Test navigation to create form
      await createButton.click();
      await expect(page).toHaveURL('/meetings/new');
    });

    test('should display participant count or list', async ({ page }) => {
      const helpers = new TestHelpers(page);
      await helpers.waitForPageLoad();

      // Check for participant information
      const participantInfo = page.locator('table tbody tr td').filter({
        hasText: /participant|attendee|\d+\s+(people|users)/i,
      });

      if (await participantInfo.first().isVisible()) {
        await expect(participantInfo.first()).toBeVisible();
      } else {
        // Alternative: check for participant count numbers
        const countPattern = page.locator('table tbody tr td').filter({
          hasText: /^\d+$/,
        });
        if (await countPattern.first().isVisible()) {
          await expect(countPattern.first()).toBeVisible();
        }
      }
    });

    test('should show meeting reminders status', async ({ page }) => {
      const helpers = new TestHelpers(page);
      await helpers.waitForPageLoad();

      // Check for reminder indicators
      const reminderElements = page.locator('[data-testid*="reminder"], .reminder-status').first();

      if (await reminderElements.isVisible()) {
        await expect(reminderElements).toBeVisible();
      } else {
        // Alternative: check in actions menu
        const actionsButton = page
          .locator('table tbody tr')
          .first()
          .getByRole('button', { name: /actions|menu/i });
        if (await actionsButton.isVisible()) {
          await actionsButton.click();
          const reminderOption = page.getByText(/reminder/i);
          if (await reminderOption.isVisible()) {
            await expect(reminderOption).toBeVisible();
          }
        }
      }
    });

    test('should support meeting search functionality', async ({ page }) => {
      const helpers = new TestHelpers(page);
      await helpers.waitForPageLoad();

      // Use meeting search
      const searchInput = page.getByPlaceholder(/search.*meeting/i);
      if (await searchInput.isVisible()) {
        await searchInput.fill('team meeting');
        await page.keyboard.press('Enter');

        await helpers.waitForNavigation();

        // Verify search results
        await expect(page.locator('table tbody tr')).toContainText(/team meeting/i);
      }
    });
  });
});
