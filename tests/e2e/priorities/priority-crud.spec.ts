import { test, expect, Page } from '@playwright/test';
import { gotoWithAuth, loginIfNeeded, resetSession } from '../../fixtures/auth';

const rowByName = (page: Page, name: string) =>
  page
    .locator('table tbody tr')
    .filter({ has: page.getByRole('cell', { name }) })
    .filter({ has: page.getByRole('link', { name: /view/i }) });

const statusCell = (page: Page, name: string) =>
  rowByName(page, name)
    .getByRole('cell', { name: /(Active|Inactive|Archived|Draft)/i })
    .first();

test.describe.serial('Priority CRUD', () => {
  const priorityName = `E2E Priority ${Date.now()}`;
  const updatedPriorityName = `${priorityName} - Updated`;
  const description = 'Auto-created by Playwright';
  const remark = 'Automated Priority validation';
  const updatedDescription = `${description} - updated`;
  const updatedRemark = `${remark} - updated`;
  let currentPriorityName = priorityName;

  test.beforeEach(async ({ page }) => {
    await loginIfNeeded(page);
  });

  test.afterEach(async ({ page }) => {
    await resetSession(page);
    await page.goto('/');
  });

  test('create priority', async ({ page }) => {
    await gotoWithAuth(page, '/priorities/new');

    await page.getByLabel('Name').fill(priorityName);
    await page.getByLabel('Description').fill(description);
    await page.getByLabel('Remark').fill(remark);

    await page.getByRole('button', { name: /next step/i }).click();
    await page.getByRole('button', { name: /create priority/i }).click();

    await expect(page).toHaveURL(/\/priorities$/, { timeout: 30000 });
    const filters = page.getByPlaceholder('Filter...');
    const nameFilter = filters.nth(0);
    await expect(nameFilter).toBeVisible({ timeout: 30000 });
    await nameFilter.fill(priorityName);
    await expect(statusCell(page, priorityName)).toContainText(/Active/i, { timeout: 20000 });
  });

  test('search created priority by all filters', async ({ page }) => {
    await gotoWithAuth(page, '/priorities');
    const filters = page.getByPlaceholder('Filter...');
    const nameFilter = filters.nth(0);
    const descriptionFilter = filters.nth(1);
    const remarkFilter = filters.nth(2);

    await nameFilter.fill(currentPriorityName);
    await expect(rowByName(page, currentPriorityName)).toHaveCount(1, { timeout: 15000 });

    await descriptionFilter.fill(description);
    await expect(rowByName(page, currentPriorityName)).toHaveCount(1, { timeout: 15000 });

    await remarkFilter.fill(remark);
    await expect(rowByName(page, currentPriorityName)).toHaveCount(1, { timeout: 15000 });

    await nameFilter.clear();
    await descriptionFilter.clear();
    await remarkFilter.clear();
  });

  test('edit priority details', async ({ page }) => {
    await gotoWithAuth(page, '/priorities');
    const filters = page.getByPlaceholder('Filter...');
    const nameFilter = filters.nth(0);
    await nameFilter.fill(currentPriorityName);
    await rowByName(page, currentPriorityName).getByRole('link', { name: /edit/i }).click();
    await expect(page).toHaveURL(/\/priorities\/\d+\/edit/, { timeout: 20000 });

    await page.getByLabel('Name').fill(updatedPriorityName);
    await page.getByLabel('Description').fill(updatedDescription);
    await page.getByLabel('Remark').fill(updatedRemark);
    await page.getByRole('button', { name: /next step/i }).click();
    await page.getByRole('button', { name: /update priority/i }).click();

    await expect(page).toHaveURL(/\/priorities$/, { timeout: 30000 });
    await nameFilter.fill(updatedPriorityName);
    await expect(
      rowByName(page, updatedPriorityName).getByRole('cell', { name: updatedDescription })
    ).toBeVisible({ timeout: 20000 });

    currentPriorityName = updatedPriorityName;
  });

  test('change priority status to archive', async ({ page }) => {
    await gotoWithAuth(page, '/priorities');
    const filters = page.getByPlaceholder('Filter...');
    const nameFilter = filters.nth(0);
    await nameFilter.fill(currentPriorityName);

    const activeRow = rowByName(page, currentPriorityName);
    await activeRow.getByRole('button', { name: /status actions/i }).click();
    await page.getByRole('menuitem', { name: /archive/i }).click();
    await page.getByRole('button', { name: /^archive$/i }).click();
    await expect(activeRow).toHaveCount(0, { timeout: 45000 });

    await page.reload();
    await page.getByRole('tab', { name: 'Archived', exact: true }).click();
    await nameFilter.fill(currentPriorityName);
    const archivedRow = rowByName(page, currentPriorityName);
    await expect(
      archivedRow.getByRole('cell', { name: /(Active|Inactive|Archived|Draft)/i }).first()
    ).toHaveText(/Archived/i, { timeout: 45000 });

    await page.getByRole('tab', { name: 'Active', exact: true }).click();
    await nameFilter.fill(currentPriorityName);
    await expect(rowByName(page, currentPriorityName)).toHaveCount(0, { timeout: 15000 });
  });
});
