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

test.describe.serial('Product Category CRUD', () => {
  const categoryName = `E2E Product Category ${Date.now()}`;
  // Code must be <= 20 chars per validation; keep prefix short.
  const categoryCode = `PC-${Date.now()}`;
  const updatedCategoryName = `${categoryName} - Updated`;
  const updatedCategoryCode = `${categoryCode}-UPD`;
  const description = 'Auto-created by Playwright';
  const remark = 'Automated Product Category validation';
  const updatedDescription = `${description} - updated`;
  const updatedRemark = `${remark} - updated`;
  let currentCategoryName = categoryName;

  test.beforeEach(async ({ page }) => {
    await loginIfNeeded(page);
  });

  test.afterEach(async ({ page }) => {
    await resetSession(page);
    await page.goto('/');
  });

  test('create product category', async ({ page }) => {
    await gotoWithAuth(page, '/product-categories/new');

    await page.getByLabel('Name').fill(categoryName);
    await page.getByLabel('Code').fill(categoryCode);
    await page.getByLabel('Description').fill(description);
    await page.getByLabel('Remark').fill(remark);

    await page.getByRole('button', { name: /next step/i }).click();
    await page.getByRole('button', { name: /create product category/i }).click();

    await expect(page).toHaveURL(/\/product-categories$/, { timeout: 30000 });
    const filters = page.getByPlaceholder('Filter...');
    const nameFilter = filters.nth(0);
    await expect(nameFilter).toBeVisible({ timeout: 30000 });
    await nameFilter.fill(categoryName);
    await expect(statusCell(page, categoryName)).toContainText(/Active/i, { timeout: 20000 });
  });

  test('search created product category by filters', async ({ page }) => {
    await gotoWithAuth(page, '/product-categories');
    const filters = page.getByPlaceholder('Filter...');
    const nameFilter = filters.nth(0);
    const codeFilter = filters.nth(1);
    const descriptionFilter = filters.nth(2);
    const remarkFilter = filters.nth(3);

    await nameFilter.fill(currentCategoryName);
    await expect(rowByName(page, currentCategoryName)).toHaveCount(1, { timeout: 15000 });

    await nameFilter.clear();
    await codeFilter.fill(categoryCode);
    await expect(rowByName(page, currentCategoryName)).toHaveCount(1, { timeout: 15000 });

    await codeFilter.clear();
    await descriptionFilter.fill(description);
    await expect(rowByName(page, currentCategoryName)).toHaveCount(1, { timeout: 15000 });

    await descriptionFilter.clear();
    await remarkFilter.fill(remark);
    await expect(rowByName(page, currentCategoryName)).toHaveCount(1, { timeout: 15000 });

    await nameFilter.clear();
    await codeFilter.clear();
    await descriptionFilter.clear();
    await remarkFilter.clear();
  });

  test('edit product category details', async ({ page }) => {
    await gotoWithAuth(page, '/product-categories');
    const filters = page.getByPlaceholder('Filter...');
    const nameFilter = filters.nth(0);
    await nameFilter.fill(currentCategoryName);
    await rowByName(page, currentCategoryName).getByRole('link', { name: /edit/i }).click();
    await expect(page).toHaveURL(/\/product-categories\/\d+\/edit/, { timeout: 20000 });

    await page.getByLabel('Name').fill(updatedCategoryName);
    await page.getByLabel('Code').fill(updatedCategoryCode);
    await page.getByLabel('Description').fill(updatedDescription);
    await page.getByLabel('Remark').fill(updatedRemark);
    await page.getByRole('button', { name: /next step/i }).click();
    await page.getByRole('button', { name: /update product category/i }).click();

    await expect(page).toHaveURL(/\/product-categories$/, { timeout: 30000 });
    await nameFilter.fill(updatedCategoryName);
    await expect(
      rowByName(page, updatedCategoryName).getByRole('cell', { name: updatedDescription })
    ).toBeVisible({ timeout: 20000 });

    currentCategoryName = updatedCategoryName;
  });

  test('change product category status to archive', async ({ page }) => {
    await gotoWithAuth(page, '/product-categories');
    const filters = page.getByPlaceholder('Filter...');
    const nameFilter = filters.nth(0);
    await nameFilter.fill(currentCategoryName);

    const activeRow = rowByName(page, currentCategoryName);
    await activeRow.getByRole('button', { name: /status actions/i }).click();
    await page.getByRole('menuitem', { name: /archive/i }).click();
    await page.getByRole('button', { name: /^archive$/i }).click();
    await expect(activeRow).toHaveCount(0, { timeout: 45000 });

    await page.reload();
    await page.getByRole('tab', { name: 'Archived', exact: true }).click();
    await nameFilter.fill(currentCategoryName);
    const archivedRow = rowByName(page, currentCategoryName);
    await expect(
      archivedRow.getByRole('cell', { name: /(Active|Inactive|Archived|Draft)/i }).first()
    ).toHaveText(/Archived/i, { timeout: 45000 });

    await page.getByRole('tab', { name: 'Active', exact: true }).click();
    await nameFilter.fill(currentCategoryName);
    await expect(rowByName(page, currentCategoryName)).toHaveCount(0, { timeout: 15000 });
  });
});
