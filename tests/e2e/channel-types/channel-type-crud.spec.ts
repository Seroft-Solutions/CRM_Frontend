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

const openCreateForm = async (page: Page) => {
  await gotoWithAuth(page, '/channel-types');

  const createLink = page.getByRole('link', { name: /create channel type/i }).first();
  const createButton = page.getByRole('button', { name: /create channel type/i }).first();

  if ((await createLink.count()) > 0) {
    await createLink.click();
  } else if ((await createButton.count()) > 0) {
    await createButton.click();
  } else {
    await gotoWithAuth(page, '/channel-types/new');
  }

  await expect(page).toHaveURL(/\/channel-types\/new/, { timeout: 15000 });
};

test.describe.serial('Channel Type CRUD', () => {
  const channelTypeName = `E2E Channel Type ${Date.now()}`;
  const updatedChannelTypeName = `${channelTypeName} - Updated`;
  const description = 'Auto-created by Playwright';
  const commissionRate = '5';
  const updatedDescription = `${description} - updated`;
  const updatedCommissionRate = '10';
  let currentChannelTypeName = channelTypeName;

  test.beforeEach(async ({ page }) => {
    await loginIfNeeded(page);
  });

  test.afterEach(async ({ page }) => {
    await resetSession(page);
    await page.goto('/');
  });

  test('create channel type', async ({ page }) => {
    await openCreateForm(page);

    await page.getByLabel('Name').fill(channelTypeName);
    await page.getByLabel('Description').fill(description);
    await page.getByLabel('Commission Rate').fill(commissionRate);

    await page.getByRole('button', { name: /next step/i }).click();
    await page.getByRole('button', { name: /create channel type/i }).click();

    await expect(page).toHaveURL(/\/channel-types$/, { timeout: 30000 });
    const filters = page.getByPlaceholder('Filter...');
    const nameFilter = filters.nth(0);
    await expect(nameFilter).toBeVisible({ timeout: 30000 });
    await nameFilter.fill(channelTypeName);
    await expect(statusCell(page, channelTypeName)).toContainText(/Active/i, { timeout: 20000 });
  });

  test('search created channel type by filters', async ({ page }) => {
    await gotoWithAuth(page, '/channel-types');
    const filters = page.getByPlaceholder('Filter...');
    const nameFilter = filters.nth(0);
    const descriptionFilter = filters.nth(1);
    const commissionFilter = filters.nth(2);

    await nameFilter.fill(currentChannelTypeName);
    await expect(rowByName(page, currentChannelTypeName)).toHaveCount(1, { timeout: 15000 });

    await descriptionFilter.fill(description);
    await expect(rowByName(page, currentChannelTypeName)).toHaveCount(1, { timeout: 15000 });

    await commissionFilter.fill(commissionRate);
    await expect(rowByName(page, currentChannelTypeName)).toHaveCount(1, { timeout: 15000 });

    await nameFilter.clear();
    await descriptionFilter.clear();
    await commissionFilter.clear();
  });

  test('edit channel type details', async ({ page }) => {
    await gotoWithAuth(page, '/channel-types');
    const filters = page.getByPlaceholder('Filter...');
    const nameFilter = filters.nth(0);
    await nameFilter.fill(currentChannelTypeName);
    await rowByName(page, currentChannelTypeName).getByRole('link', { name: /edit/i }).click();
    await expect(page).toHaveURL(/\/channel-types\/\d+\/edit/, { timeout: 20000 });

    await page.getByLabel('Name').fill(updatedChannelTypeName);
    await page.getByLabel('Description').fill(updatedDescription);
    await page.getByLabel('Commission Rate').fill(updatedCommissionRate);
    await page.getByRole('button', { name: /next step/i }).click();
    await page.getByRole('button', { name: /update channel type/i }).click();

    await expect(page).toHaveURL(/\/channel-types$/, { timeout: 30000 });
    await nameFilter.fill(updatedChannelTypeName);
    await expect(
      rowByName(page, updatedChannelTypeName).getByRole('cell', { name: updatedDescription })
    ).toBeVisible({ timeout: 20000 });

    currentChannelTypeName = updatedChannelTypeName;
  });

  test('change channel type status to archive', async ({ page }) => {
    await gotoWithAuth(page, '/channel-types');
    const filters = page.getByPlaceholder('Filter...');
    const nameFilter = filters.nth(0);
    await nameFilter.fill(currentChannelTypeName);

    const activeRow = rowByName(page, currentChannelTypeName);
    await activeRow.getByRole('button', { name: /status actions/i }).click();
    await page.getByRole('menuitem', { name: /archive/i }).click();
    await page.getByRole('button', { name: /^archive$/i }).click();
    await expect(activeRow).toHaveCount(0, { timeout: 45000 });

    await page.reload();
    await page.getByRole('tab', { name: 'Archived', exact: true }).click();
    await nameFilter.fill(currentChannelTypeName);
    const archivedRow = rowByName(page, currentChannelTypeName);
    await expect(
      archivedRow.getByRole('cell', { name: /(Active|Inactive|Archived|Draft)/i }).first()
    ).toHaveText(/Archived/i, { timeout: 45000 });

    await page.getByRole('tab', { name: 'Active', exact: true }).click();
    await nameFilter.fill(currentChannelTypeName);
    await expect(rowByName(page, currentChannelTypeName)).toHaveCount(0, { timeout: 15000 });
  });
});
