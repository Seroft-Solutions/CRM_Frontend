import { test, expect } from '../../../fixtures/test-base';
import { TestHelpers, Selectors } from '../../../utils/test-helpers';

test.describe('Meeting System', () => {
  test.describe('Meeting Scheduling', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/meetings/new');
    });

    test('should schedule meeting with participants', async ({ page }) => {
      const helpers = new TestHelpers(page);
      await helpers.waitForPageLoad();
      
      // Fill meeting details
      await page.getByLabel('Meeting Title').fill('Product Demo Meeting');
      await page.getByLabel('Description').fill('Demonstrating new features to client');
      
      // Set date and time
      await page.getByLabel('Meeting Date').fill('2024-12-30');
      await page.getByLabel('Start Time').fill('14:00');
      await page.getByLabel('End Time').fill('15:30');
      
      // Add participants
      await page.getByRole('button', { name: 'Add Participants' }).click();
      await page.getByLabel('Search participants').fill('John');
      await page.getByRole('option', { name: 'John Doe' }).click();
      await page.getByRole('option', { name: 'Jane Smith' }).click();
      
      // Submit meeting
      await page.getByRole('button', { name: 'Schedule Meeting' }).click();
      
      // Verify success and navigation
      await expect(page.locator(Selectors.successToast)).toBeVisible();
      await expect(page.locator(Selectors.successToast)).toContainText('Meeting scheduled successfully');
    });

    test('should check participant availability', async ({ page }) => {
      const helpers = new TestHelpers(page);
      await helpers.waitForPageLoad();
      
      // Fill basic details
      await page.getByLabel('Meeting Title').fill('Client Review');
      await page.getByLabel('Meeting Date').fill('2024-12-31');
      await page.getByLabel('Start Time').fill('10:00');
      
      // Add participant who might be busy
      await page.getByRole('button', { name: 'Add Participants' }).click();
      await page.getByLabel('Search participants').fill('Busy User');
      await page.getByRole('option', { name: 'Busy User' }).click();
      
      // Check availability button
      await page.getByRole('button', { name: 'Check Availability' }).click();
      await helpers.waitForNavigation();
      
      // Should show availability status
      const availabilityStatus = page.locator('[data-testid="availability-status"]');
      await expect(availabilityStatus).toBeVisible();
      
      // May show conflict warning
      if (await page.getByText('Participant has conflict').isVisible()) {
        await expect(page.getByText('Busy User has another meeting at this time')).toBeVisible();
      }
    });

    test('should send calendar invites after scheduling', async ({ page }) => {
      const helpers = new TestHelpers(page);
      await helpers.waitForPageLoad();
      
      // Create meeting
      await page.getByLabel('Meeting Title').fill('Team Sync');
      await page.getByLabel('Meeting Date').fill('2024-12-29');
      await page.getByLabel('Start Time').fill('09:00');
      
      // Add participants
      await page.getByRole('button', { name: 'Add Participants' }).click();
      await page.getByRole('option', { name: 'Team Member 1' }).click();
      
      // Enable calendar invites
      await page.getByLabel('Send Calendar Invites').check();
      
      await page.getByRole('button', { name: 'Schedule Meeting' }).click();
      
      // Verify invite sending
      await expect(page.locator(Selectors.successToast)).toContainText('Calendar invites sent');
    });

    test('should handle recurring meeting setup', async ({ page }) => {
      const helpers = new TestHelpers(page);
      await helpers.waitForPageLoad();
      
      // Fill meeting details
      await page.getByLabel('Meeting Title').fill('Weekly Standup');
      await page.getByLabel('Meeting Date').fill('2024-12-30');
      await page.getByLabel('Start Time').fill('09:00');
      
      // Set up recurrence
      await page.getByLabel('Recurring Meeting').check();
      await page.getByLabel('Repeat').click();
      await page.getByRole('option', { name: 'Weekly' }).click();
      
      await page.getByLabel('End Recurrence').fill('2025-03-30');
      
      await page.getByRole('button', { name: 'Schedule Meeting' }).click();
      
      // Verify recurring meeting creation
      await expect(page.locator(Selectors.successToast)).toContainText('Recurring meeting scheduled');
    });

    test('should validate meeting time constraints', async ({ page }) => {
      const helpers = new TestHelpers(page);
      await helpers.waitForPageLoad();
      
      // Try to set end time before start time
      await page.getByLabel('Start Time').fill('15:00');
      await page.getByLabel('End Time').fill('14:00');
      
      await page.getByRole('button', { name: 'Schedule Meeting' }).click();
      
      // Should show validation error
      await expect(page.getByText('End time must be after start time')).toBeVisible();
    });
  });
});