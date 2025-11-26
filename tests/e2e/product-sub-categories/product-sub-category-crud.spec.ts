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

const selectCategory = async (page: Page, name: string) => {
  // Classification step: category relationship picker (required).
  let trigger = page.getByRole('combobox', { name: /category/i }).first();
  if ((await trigger.count()) === 0) {
    trigger = page.getByRole('combobox').first();
  }

  await expect(trigger).toBeVisible({ timeout: 20000 });

  // If already selected (edit flow), skip re-selection to avoid validation noise.
  const currentText = (await trigger.innerText()).trim();
  if (new RegExp(name, 'i').test(currentText) && currentText.length > 0) {
    return;
  }

  await trigger.click();

  const searchInput = page.getByPlaceholder(/search product\s*categories/i).first();
  await expect(searchInput).toBeVisible({ timeout: 15000 });
  await searchInput.fill(name);

  const option = page.getByRole('option', { name: new RegExp(name, 'i') }).first();
  try {
    await expect(option).toBeVisible({ timeout: 25000 });
    await option.click({ timeout: 25000 });
  } catch {
    // Fallback: select first option via keyboard if paginated results delay rendering.
    await searchInput.press('Enter');
  }

  await expect(trigger).toContainText(new RegExp(name, 'i'), { timeout: 15000 });
};

test.describe.serial('Product Sub Category CRUD', () => {
  const categoryName = `E2E Product Category ${Date.now()}`;
  const categoryCode = `PC-${Date.now()}`;
  const subCategoryName = `E2E Product Sub Category ${Date.now()}`;
  // Code must be <= 20 chars per validation; keep it short.
  const subCategoryCode = `PSC-${Date.now().toString().slice(-6)}`;
  const updatedSubCategoryName = `${subCategoryName} - Updated`;
  const updatedSubCategoryCode = `${subCategoryCode}-UPD`;
  const description = 'Auto-created by Playwright';
  const remark = 'Automated Product Sub Category validation';
  const updatedDescription = `${description} - updated`;
  const updatedRemark = `${remark} - updated`;
  let currentSubCategoryName = subCategoryName;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await loginIfNeeded(page);

    // Ensure parent product category exists for the relationship field.
    await gotoWithAuth(page, '/product-categories/new');
    await page.getByLabel('Name').fill(categoryName);
    await page.getByLabel('Code').fill(categoryCode);
    await page.getByLabel('Description').fill('Parent for product sub category tests');
    await page.getByLabel('Remark').fill('Created by product-sub-category E2E setup');
    await page.getByRole('button', { name: /next step/i }).click();
    await page.getByRole('button', { name: /create product category/i }).click();

    try {
      await page.waitForURL(/\/product-categories$/, { timeout: 8000 });
    } catch {
      await gotoWithAuth(page, '/product-categories');
    }

    const filters = page.getByPlaceholder('Filter...');
    const nameFilter = filters.nth(0);
    await expect(nameFilter).toBeVisible({ timeout: 20000 });
    await nameFilter.fill(categoryName);
    await expect(page.getByRole('cell', { name: categoryName })).toBeVisible({ timeout: 20000 });

    await page.close();
  });

  test.beforeEach(async ({ page }) => {
    await loginIfNeeded(page);
  });

  test.afterEach(async ({ page }) => {
    await resetSession(page);
    await page.goto('/');
  });

  test('create product sub category', async ({ page }) => {
    await gotoWithAuth(page, '/product-sub-categories');

    const createLink = page.getByRole('link', { name: /create/i }).first();
    await expect(createLink).toBeVisible({ timeout: 15000 });
    await createLink.click();
    await expect(page).toHaveURL(/\/product-sub-categories\/new/, { timeout: 15000 });

    await page.getByLabel('Name').fill(subCategoryName);
    await page.getByLabel('Code').fill(subCategoryCode);
    await page.getByLabel('Description').fill(description);
    await page.getByLabel('Remark').fill(remark);

    await page.getByRole('button', { name: /next step/i }).click();
    await selectCategory(page, categoryName);
    await page.getByRole('button', { name: /next step/i }).click();
    await page.getByRole('button', { name: /create product sub category/i }).click();

    await expect(page).toHaveURL(/\/product-sub-categories$/, { timeout: 30000 });
    const filters = page.getByPlaceholder('Filter...');
    const nameFilter = filters.nth(0);
    await expect(nameFilter).toBeVisible({ timeout: 30000 });
    await nameFilter.fill(subCategoryName);
    await expect(statusCell(page, subCategoryName)).toContainText(/Active/i, { timeout: 20000 });
  });

  test('search created product sub category by filters', async ({ page }) => {
    await gotoWithAuth(page, '/product-sub-categories');
    const filters = page.getByPlaceholder('Filter...');
    const nameFilter = filters.nth(0);
    const codeFilter = filters.nth(1);
    const descriptionFilter = filters.nth(2);
    const remarkFilter = filters.nth(3);
    const categoryFilter = filters.nth(5);

    await nameFilter.fill(currentSubCategoryName);
    await expect(rowByName(page, currentSubCategoryName)).toHaveCount(1, { timeout: 15000 });

    await nameFilter.clear();
    await codeFilter.fill(subCategoryCode);
    await expect(rowByName(page, currentSubCategoryName)).toHaveCount(1, { timeout: 15000 });

    await codeFilter.clear();
    await descriptionFilter.fill(description);
    await expect(rowByName(page, currentSubCategoryName)).toHaveCount(1, { timeout: 15000 });

    await descriptionFilter.clear();
    await remarkFilter.fill(remark);
    await expect(rowByName(page, currentSubCategoryName)).toHaveCount(1, { timeout: 15000 });

    await remarkFilter.clear();
    await categoryFilter.fill(categoryName);
    await expect(rowByName(page, currentSubCategoryName)).toHaveCount(1, { timeout: 15000 });

    await nameFilter.clear();
    await codeFilter.clear();
    await descriptionFilter.clear();
    await remarkFilter.clear();
    await categoryFilter.clear();
  });

  test('edit product sub category details', async ({ page }) => {
    await gotoWithAuth(page, '/product-sub-categories');
    const filters = page.getByPlaceholder('Filter...');
    const nameFilter = filters.nth(0);
    await nameFilter.fill(currentSubCategoryName);
    await rowByName(page, currentSubCategoryName).getByRole('link', { name: /edit/i }).click();
    await expect(page).toHaveURL(/\/product-sub-categories\/\d+\/edit/, { timeout: 20000 });

    await page.getByLabel('Name').fill(updatedSubCategoryName);
    await page.getByLabel('Code').fill(updatedSubCategoryCode);
    await page.getByLabel('Description').fill(updatedDescription);
    await page.getByLabel('Remark').fill(updatedRemark);
    await page.getByRole('button', { name: /next step/i }).click();
    await selectCategory(page, categoryName);
    const nextBtn = page.getByRole('button', { name: /next step/i }).last();
    await expect(nextBtn).toBeEnabled({ timeout: 10000 });
    await nextBtn.click();
    const updateBtn = page.getByRole('button', { name: /update product sub category/i }).first();
    await expect(updateBtn).toBeVisible({ timeout: 15000 });
    await updateBtn.click();

    await expect(page).toHaveURL(/\/product-sub-categories$/, { timeout: 30000 });
    await nameFilter.fill(updatedSubCategoryName);
    await expect(
      rowByName(page, updatedSubCategoryName).getByRole('cell', { name: updatedDescription })
    ).toBeVisible({ timeout: 20000 });

    currentSubCategoryName = updatedSubCategoryName;
  });

  test('change product sub category status to archive', async ({ page }) => {
    await gotoWithAuth(page, '/product-sub-categories');
    const filters = page.getByPlaceholder('Filter...');
    const nameFilter = filters.nth(0);
    await nameFilter.fill(currentSubCategoryName);

    const activeRow = rowByName(page, currentSubCategoryName);
    await activeRow.getByRole('button', { name: /status actions/i }).click();
    await page.getByRole('menuitem', { name: /archive/i }).click();
    await page.getByRole('button', { name: /^archive$/i }).click();
    await expect(activeRow).toHaveCount(0, { timeout: 45000 });

    await page.reload();
    await page.getByRole('tab', { name: 'Archived', exact: true }).click();
    await nameFilter.fill(currentSubCategoryName);
    const archivedRow = rowByName(page, currentSubCategoryName);
    await expect(
      archivedRow.getByRole('cell', { name: /(Active|Inactive|Archived|Draft)/i }).first()
    ).toHaveText(/Archived/i, { timeout: 45000 });

    await page.getByRole('tab', { name: 'Active', exact: true }).click();
    await nameFilter.fill(currentSubCategoryName);
    await expect(rowByName(page, currentSubCategoryName)).toHaveCount(0, { timeout: 15000 });
  });
});
