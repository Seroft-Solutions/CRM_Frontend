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

test.describe.serial('Call Status CRUD', () => {
  const callStatusName = `E2E Call Status ${Date.now()}`;
  const updatedCallStatusName = `${callStatusName} - Updated`;
  const description = 'Auto-created by Playwright';
  const remark = 'Automated Call Status validation';
  const updatedDescription = `${description} - updated`;
  const updatedRemark = `${remark} - updated`;
  let currentCallStatusName = callStatusName;

  test.beforeEach(async ({ page }) => {
    await loginIfNeeded(page);
  });

  test.afterEach(async ({ page }) => {
    await resetSession(page);
    await page.goto('/');
  });

  test('create call status', async ({ page }) => {
    await gotoWithAuth(page, '/call-statuses/new');

    await page.getByLabel('Name').fill(callStatusName);
    await page.getByLabel('Description').fill(description);
    await page.getByLabel('Remark').fill(remark);

    await page.getByRole('button', { name: /next step/i }).click();
    await page.getByRole('button', { name: /create call status/i }).click();

    await expect(page).toHaveURL(/\/call-statuses$/, { timeout: 30000 });
    const filters = page.getByPlaceholder('Filter...');
    const nameFilter = filters.nth(0);
    await expect(nameFilter).toBeVisible({ timeout: 30000 });
    await nameFilter.fill(callStatusName);
    await expect(statusCell(page, callStatusName)).toContainText(/Active/i, { timeout: 20000 });
  });

  test('search created call status by all filters', async ({ page }) => {
    await gotoWithAuth(page, '/call-statuses');
    const filters = page.getByPlaceholder('Filter...');
    const nameFilter = filters.nth(0);
    const descriptionFilter = filters.nth(1);
    const remarkFilter = filters.nth(2);

    await nameFilter.fill(currentCallStatusName);
    await expect(rowByName(page, currentCallStatusName)).toHaveCount(1, { timeout: 15000 });

    await descriptionFilter.fill(description);
    await expect(rowByName(page, currentCallStatusName)).toHaveCount(1, { timeout: 15000 });

    await remarkFilter.fill(remark);
    await expect(rowByName(page, currentCallStatusName)).toHaveCount(1, { timeout: 15000 });

    await nameFilter.clear();
    await descriptionFilter.clear();
    await remarkFilter.clear();
  });

  test('edit call status details', async ({ page }) => {
    await gotoWithAuth(page, '/call-statuses');
    const filters = page.getByPlaceholder('Filter...');
    const nameFilter = filters.nth(0);
    await nameFilter.fill(currentCallStatusName);
    await rowByName(page, currentCallStatusName).getByRole('link', { name: /edit/i }).click();
    await expect(page).toHaveURL(/\/call-statuses\/\d+\/edit/, { timeout: 20000 });

    await page.getByLabel('Name').fill(updatedCallStatusName);
    await page.getByLabel('Description').fill(updatedDescription);
    await page.getByLabel('Remark').fill(updatedRemark);
    await page.getByRole('button', { name: /next step/i }).click();
    await page.getByRole('button', { name: /update call status/i }).click();

    await expect(page).toHaveURL(/\/call-statuses$/, { timeout: 30000 });
    await nameFilter.fill(updatedCallStatusName);
    await expect(
      rowByName(page, updatedCallStatusName).getByRole('cell', { name: updatedDescription })
    ).toBeVisible({ timeout: 20000 });

    currentCallStatusName = updatedCallStatusName;
  });

  test('change call status to archive', async ({ page }) => {
    await gotoWithAuth(page, '/call-statuses');
    const filters = page.getByPlaceholder('Filter...');
    const nameFilter = filters.nth(0);
    await nameFilter.fill(currentCallStatusName);

    const activeRow = rowByName(page, currentCallStatusName);
    await activeRow.getByRole('button', { name: /status actions/i }).click();
    await page.getByRole('menuitem', { name: /archive/i }).click();
    await page.getByRole('button', { name: /^archive$/i }).click();
    await expect(activeRow).toHaveCount(0, { timeout: 45000 });

    await page.reload();
    await page.getByRole('tab', { name: 'Archived', exact: true }).click();
    await nameFilter.fill(currentCallStatusName);
    const archivedRow = rowByName(page, currentCallStatusName);
    await expect(
      archivedRow.getByRole('cell', { name: /(Active|Inactive|Archived|Draft)/i }).first()
    ).toHaveText(/Archived/i, { timeout: 45000 });

    await page.getByRole('tab', { name: 'Active', exact: true }).click();
    await nameFilter.fill(currentCallStatusName);
    await expect(rowByName(page, currentCallStatusName)).toHaveCount(0, { timeout: 15000 });
  });
});
