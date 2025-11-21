import { test, expect, Page } from '@playwright/test';
import { gotoWithAuth, loginIfNeeded, resetSession } from '../../fixtures/auth';

const subRowByName = (page: Page, name: string) =>
  page
    .locator('table tbody tr')
    .filter({ has: page.getByRole('cell', { name }) })
    .filter({ has: page.getByRole('link', { name: /view/i }) });

const statusCell = (page: Page, name: string) =>
  subRowByName(page, name)
    .getByRole('cell', { name: /(Active|Inactive|Archived|Draft)/i })
    .first();

const selectCallType = async (page: Page, name: string) => {
  await expect(page.getByLabel('Name')).toBeVisible({ timeout: 20000 });

  const trigger = page.getByRole('combobox').first();
  await expect(trigger).toBeVisible({ timeout: 20000 });
  await trigger.click();

  const searchInput = page.getByPlaceholder(/search calltypes/i).first();
  await expect(searchInput).toBeVisible({ timeout: 15000 });
  await searchInput.fill(name);

  const option = page.getByRole('option', { name, exact: false }).first();
  await expect(option).toBeVisible({ timeout: 15000 });
  await option.click();

  await expect(trigger).toContainText(name, { timeout: 10000 });
};

test.describe.serial('Sub Call Type CRUD', () => {
  const parentCallTypeName = `E2E Parent CallType ${Date.now()}`;
  const subCallTypeName = `E2E Sub Call Type ${Date.now()}`;
  const updatedSubCallTypeName = `${subCallTypeName} - Updated`;
  const description = 'Auto-created by Playwright';
  const remark = 'Automated Sub Call Type validation';
  const updatedDescription = `${description} - updated`;
  const updatedRemark = `${remark} - updated`;
  let currentSubCallTypeName = subCallTypeName;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await loginIfNeeded(page);

    // Ensure parent call type exists for relationship field.
    await gotoWithAuth(page, '/call-types/new');
    await page.getByLabel('Name').fill(parentCallTypeName);
    await page.getByLabel('Description').fill('Parent for sub call type tests');
    await page.getByLabel('Remark').fill('Created by sub-call-type E2E setup');
    await page.getByRole('button', { name: /next step/i }).click();
    await page.getByRole('button', { name: /create call type/i }).click();

    // Accept either redirect to list or staying on form; navigate to list to verify creation.
    try {
      await page.waitForURL(/\/call-types$/, { timeout: 8000 });
    } catch {
      await gotoWithAuth(page, '/call-types');
    }

    const callTypeFilters = page.getByPlaceholder('Filter...');
    const callTypeNameFilter = callTypeFilters.nth(0);
    await expect(callTypeNameFilter).toBeVisible({ timeout: 20000 });
    await callTypeNameFilter.fill(parentCallTypeName);
    await expect(page.getByRole('cell', { name: parentCallTypeName })).toBeVisible({
      timeout: 20000,
    });

    await page.close();
  });

  test.beforeEach(async ({ page }) => {
    await loginIfNeeded(page);
  });

  test.afterEach(async ({ page }) => {
    await resetSession(page);
    await page.goto('/');
  });

  test('create sub call type', async ({ page }) => {
    await gotoWithAuth(page, '/sub-call-types');

    const createLink = page.getByRole('link', { name: /create/i }).first();
    await expect(createLink).toBeVisible({ timeout: 15000 });
    await createLink.click();
    await expect(page).toHaveURL(/\/sub-call-types\/new/, { timeout: 15000 });

    // Relationship: select parent call type
    await selectCallType(page, parentCallTypeName);

    // Fields
    await page.getByLabel('Name').fill(subCallTypeName);
    await page.getByLabel('Description').fill(description);
    await page.getByLabel('Remark').fill(remark);

    await page.getByRole('button', { name: /next step/i }).click();
    await page.getByRole('button', { name: /create sub call type/i }).click();

    await expect(page).toHaveURL(/\/sub-call-types$/, { timeout: 30000 });
    const filters = page.getByPlaceholder('Filter...');
    const nameFilter = filters.nth(0);
    await expect(nameFilter).toBeVisible({ timeout: 30000 });
    await nameFilter.fill(subCallTypeName);
    await expect(statusCell(page, subCallTypeName)).toContainText(/Active/i, { timeout: 25000 });
  });

  test('search created sub call type by all filters', async ({ page }) => {
    await gotoWithAuth(page, '/sub-call-types');
    const filters = page.getByPlaceholder('Filter...');
    const nameFilter = filters.nth(0);
    const descriptionFilter = filters.nth(1);
    const remarkFilter = filters.nth(2);
    const callTypeFilter = filters.nth(4);

    await nameFilter.fill(currentSubCallTypeName);
    await expect(subRowByName(page, currentSubCallTypeName)).toHaveCount(1, { timeout: 15000 });

    await nameFilter.clear();
    await descriptionFilter.fill(description);
    await expect(subRowByName(page, currentSubCallTypeName)).toHaveCount(1, { timeout: 15000 });

    await descriptionFilter.clear();
    await remarkFilter.fill(remark);
    await expect(subRowByName(page, currentSubCallTypeName)).toHaveCount(1, { timeout: 15000 });

    await remarkFilter.clear();
    await callTypeFilter.fill(parentCallTypeName);
    await expect(subRowByName(page, currentSubCallTypeName)).toHaveCount(1, { timeout: 15000 });

    await nameFilter.clear();
    await descriptionFilter.clear();
    await remarkFilter.clear();
    await callTypeFilter.clear();
  });

  test('edit sub call type details', async ({ page }) => {
    await gotoWithAuth(page, '/sub-call-types');
    const filters = page.getByPlaceholder('Filter...');
    const nameFilter = filters.nth(0);
    await nameFilter.fill(currentSubCallTypeName);
    await subRowByName(page, currentSubCallTypeName)
      .getByRole('link', { name: /edit/i })
      .click();
    await expect(page).toHaveURL(/\/sub-call-types\/\d+\/edit/, { timeout: 20000 });

    await page.getByLabel('Name').fill(updatedSubCallTypeName);
    await page.getByLabel('Description').fill(updatedDescription);
    await page.getByLabel('Remark').fill(updatedRemark);
    await page.getByRole('button', { name: /next step/i }).click();
    await page.getByRole('button', { name: /update sub call type/i }).click();

    await expect(page).toHaveURL(/\/sub-call-types$/, { timeout: 30000 });
    await nameFilter.fill(updatedSubCallTypeName);
    await expect(
      subRowByName(page, updatedSubCallTypeName).getByRole('cell', { name: updatedDescription })
    ).toBeVisible({ timeout: 20000 });

    currentSubCallTypeName = updatedSubCallTypeName;
  });

  test('change sub call type status to archive', async ({ page }) => {
    await gotoWithAuth(page, '/sub-call-types');
    const filters = page.getByPlaceholder('Filter...');
    const nameFilter = filters.nth(0);
    await nameFilter.fill(currentSubCallTypeName);

    const activeRow = subRowByName(page, currentSubCallTypeName);
    await activeRow.getByRole('button', { name: /status actions/i }).click();
    await page.getByRole('menuitem', { name: /archive/i }).click();
    await page.getByRole('button', { name: /^archive$/i }).click();
    await expect(activeRow).toHaveCount(0, { timeout: 45000 });

    await page.reload();
    await page.getByRole('tab', { name: 'Archived', exact: true }).click();
    await nameFilter.fill(currentSubCallTypeName);
    const archivedRow = subRowByName(page, currentSubCallTypeName);
    await expect(
      archivedRow.getByRole('cell', { name: /(Active|Inactive|Archived|Draft)/i }).first()
    ).toHaveText(/Archived/i, { timeout: 45000 });

    await page.getByRole('tab', { name: 'Active', exact: true }).click();
    await nameFilter.fill(currentSubCallTypeName);
    await expect(subRowByName(page, currentSubCallTypeName)).toHaveCount(0, { timeout: 15000 });
  });
});
