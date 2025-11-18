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

test.describe.serial('Source CRUD', () => {
  const sourceName = `E2E Source ${Date.now()}`;
  const updatedSourceName = `${sourceName} - Updated`;
  const description = 'Auto-created by Playwright';
  const remark = 'Automated Source validation';
  const updatedDescription = `${description} - updated`;
  const updatedRemark = `${remark} - updated`;
  let currentSourceName = sourceName;

  test.beforeEach(async ({ page }) => {
    await loginIfNeeded(page);
  });

  test.afterEach(async ({ page }) => {
    await resetSession(page);
    await page.goto('/');
  });

  test('create source', async ({ page }) => {
    await gotoWithAuth(page, '/sources/new');

    await page.getByLabel('Name').fill(sourceName);
    await page.getByLabel('Description').fill(description);
    await page.getByLabel('Remark').fill(remark);

    await page.getByRole('button', { name: /next step/i }).click();
    await page.getByRole('button', { name: /create source/i }).click();

    await expect(page).toHaveURL(/\/sources$/, { timeout: 30000 });
    const filters = page.getByPlaceholder('Filter...');
    const nameFilter = filters.nth(0);
    await expect(nameFilter).toBeVisible({ timeout: 30000 });
    await nameFilter.fill(sourceName);
    await expect(statusCell(page, sourceName)).toContainText(/Active/i, { timeout: 20000 });
  });

  test('search created source by all filters', async ({ page }) => {
    await gotoWithAuth(page, '/sources');
    const filters = page.getByPlaceholder('Filter...');
    const nameFilter = filters.nth(0);
    const descriptionFilter = filters.nth(1);
    const remarkFilter = filters.nth(2);

    await nameFilter.fill(currentSourceName);
    await expect(rowByName(page, currentSourceName)).toHaveCount(1, { timeout: 15000 });

    await descriptionFilter.fill(description);
    await expect(rowByName(page, currentSourceName)).toHaveCount(1, { timeout: 15000 });

    await remarkFilter.fill(remark);
    await expect(rowByName(page, currentSourceName)).toHaveCount(1, { timeout: 15000 });

    await nameFilter.clear();
    await descriptionFilter.clear();
    await remarkFilter.clear();
  });

  test('edit source details', async ({ page }) => {
    await gotoWithAuth(page, '/sources');
    const filters = page.getByPlaceholder('Filter...');
    const nameFilter = filters.nth(0);
    await nameFilter.fill(currentSourceName);
    await rowByName(page, currentSourceName).getByRole('link', { name: /edit/i }).click();
    await expect(page).toHaveURL(/\/sources\/\d+\/edit/, { timeout: 20000 });

    await page.getByLabel('Name').fill(updatedSourceName);
    await page.getByLabel('Description').fill(updatedDescription);
    await page.getByLabel('Remark').fill(updatedRemark);
    await page.getByRole('button', { name: /next step/i }).click();
    await page.getByRole('button', { name: /update source/i }).click();

    await expect(page).toHaveURL(/\/sources$/, { timeout: 30000 });
    await nameFilter.fill(updatedSourceName);
    await expect(
      rowByName(page, updatedSourceName).getByRole('cell', { name: updatedDescription })
    ).toBeVisible({ timeout: 20000 });

    currentSourceName = updatedSourceName;
  });

  test('change source status to archive', async ({ page }) => {
    await gotoWithAuth(page, '/sources');
    const filters = page.getByPlaceholder('Filter...');
    const nameFilter = filters.nth(0);
    await nameFilter.fill(currentSourceName);

    const activeRow = rowByName(page, currentSourceName);
    await activeRow.getByRole('button', { name: /status actions/i }).click();
    await page.getByRole('menuitem', { name: /archive/i }).click();
    await page.getByRole('button', { name: /^archive$/i }).click();
    await expect(activeRow).toHaveCount(0, { timeout: 45000 });

    await page.reload();
    await page.getByRole('tab', { name: 'Archived', exact: true }).click();
    await nameFilter.fill(currentSourceName);
    const archivedRow = rowByName(page, currentSourceName);
    await expect(
      archivedRow.getByRole('cell', { name: /(Active|Inactive|Archived|Draft)/i }).first()
    ).toHaveText(/Archived/i, { timeout: 45000 });

    await page.getByRole('tab', { name: 'Active', exact: true }).click();
    await nameFilter.fill(currentSourceName);
    await expect(rowByName(page, currentSourceName)).toHaveCount(0, { timeout: 15000 });
  });
});
