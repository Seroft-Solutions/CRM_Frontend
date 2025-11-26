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

const selectRelationship = async (
  page: Page,
  label: RegExp,
  searchPlaceholder: RegExp,
  optionName: string,
  fallbackIndex?: number
) => {
  // Prefer a positional combobox when provided, then try named, then first available.
  const candidates = [
    ...(typeof fallbackIndex === 'number' ? [page.getByRole('combobox').nth(fallbackIndex)] : []),
    page.getByRole('combobox', { name: label }).first(),
    page.getByRole('combobox').first(),
  ];

  let trigger: ReturnType<Page['getByRole']> | null = null;
  for (const candidate of candidates) {
    try {
      await expect(candidate).toBeVisible({ timeout: 15000 });
      trigger = candidate;
      break;
    } catch {
      // try next candidate
    }
  }

  if (!trigger) {
    throw new Error(`Relationship picker not found for ${optionName}`);
  }

  const currentText = (await trigger.innerText()).trim();
  if (new RegExp(optionName, 'i').test(currentText) && currentText.length > 0) {
    return;
  }

  await trigger.click();

  const searchInputCandidates = [
    page.getByPlaceholder(searchPlaceholder).first(),
    page.locator('input[placeholder^="Search"]').first(),
  ];

  let searchInput = searchInputCandidates[0];
  if ((await searchInput.count()) === 0) {
    searchInput = searchInputCandidates[1];
  }

  await expect(searchInput).toBeVisible({ timeout: 20000 });
  await searchInput.fill(optionName);

  const option = page.getByRole('option', { name: new RegExp(optionName, 'i') }).first();
  try {
    await expect(option).toBeVisible({ timeout: 25000 });
    await option.click({ timeout: 25000 });
  } catch {
    await searchInput.press('Enter');
  }

  await expect(trigger).toContainText(new RegExp(optionName, 'i'), { timeout: 15000 });
};

test.describe.serial('Product CRUD', () => {
  const categoryName = `E2E Product Category ${Date.now()}`;
  const categoryCode = `PC-${Date.now().toString().slice(-6)}`;
  const subCategoryName = `E2E Product Sub Category ${Date.now()}`;
  const subCategoryCode = `PSC-${Date.now().toString().slice(-6)}`;
  const productName = `E2E Product ${Date.now()}`;
  const productCode = `PROD-${Date.now().toString().slice(-6)}`;
  const updatedProductName = `${productName} - Updated`;
  const updatedProductCode = `${productCode}-UPD`;
  const description = 'Auto-created by Playwright';
  const remark = 'Automated Product validation';
  const updatedDescription = `${description} - updated`;
  const updatedRemark = `${remark} - updated`;
  const basePrice = '150';
  const minPrice = '100';
  const maxPrice = '250';
  let currentProductName = productName;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await loginIfNeeded(page);

    // Ensure a product category exists for relationship fields.
    await gotoWithAuth(page, '/product-categories/new');
    await page.getByLabel('Name').fill(categoryName);
    await page.getByLabel('Code').fill(categoryCode);
    await page.getByLabel('Description').fill('Parent for product tests');
    await page.getByLabel('Remark').fill('Created by product E2E setup');
    await page.getByRole('button', { name: /next step/i }).click();
    await page.getByRole('button', { name: /create product category/i }).click();

    try {
      await page.waitForURL(/\/product-categories$/, { timeout: 8000 });
    } catch {
      await gotoWithAuth(page, '/product-categories');
    }
    const categoryFilter = page.getByPlaceholder('Filter...').first();
    await expect(categoryFilter).toBeVisible({ timeout: 20000 });
    await categoryFilter.fill(categoryName);
    await expect(rowByName(page, categoryName)).toHaveCount(1, { timeout: 20000 });

    // Ensure a product sub category exists (mirror dedicated sub-category flow).
    await gotoWithAuth(page, '/product-sub-categories');

    const createLink = page.getByRole('link', { name: /create/i }).first();
    await expect(createLink).toBeVisible({ timeout: 15000 });
    await createLink.click();
    await expect(page).toHaveURL(/\/product-sub-categories\/new/, { timeout: 15000 });

    await page.getByLabel('Name').fill(subCategoryName);
    await page.getByLabel('Code').fill(subCategoryCode);
    await page.getByLabel('Description').fill('Child category for product tests');
    await page.getByLabel('Remark').fill('Created by product E2E setup');
    await page.getByRole('button', { name: /next step/i }).click();
    await selectRelationship(page, /category/i, /search\s*product\s*categories/i, categoryName, 0);
    await page.getByRole('button', { name: /next step/i }).click();
    await page.getByRole('button', { name: /create product sub category/i }).click();

    try {
      await page.waitForURL(/\/product-sub-categories$/, { timeout: 8000 });
    } catch {
      await gotoWithAuth(page, '/product-sub-categories');
    }
    const subCategoryFilter = page.getByPlaceholder('Filter...').first();
    await expect(subCategoryFilter).toBeVisible({ timeout: 20000 });
    await subCategoryFilter.fill(subCategoryName);
    await expect(rowByName(page, subCategoryName)).toHaveCount(1, { timeout: 20000 });

    await page.close();
  });

  test.beforeEach(async ({ page }) => {
    await loginIfNeeded(page);
  });

  test.afterEach(async ({ page }) => {
    await resetSession(page);
    await page.goto('/');
  });

  test('create product', async ({ page }) => {
    await gotoWithAuth(page, '/products/new');

    await page.getByLabel('Name').fill(productName);
    await page.getByLabel('Code').fill(productCode);
    await page.getByLabel('Description').fill(description);
    await page.getByLabel('Remark').fill(remark);
    await page.getByLabel('Base Price').fill(basePrice);
    await page.getByLabel('Min Price').fill(minPrice);
    await page.getByLabel('Max Price').fill(maxPrice);

    await page.getByRole('button', { name: /next step/i }).click();
    await selectRelationship(page, /category/i, /search\s*product\s*categories/i, categoryName, 0);
    await selectRelationship(
      page,
      /sub category/i,
      /search\s*product\s*sub\s*categories/i,
      subCategoryName
    );
    await page.getByRole('button', { name: /next step/i }).click();
    await page.getByRole('button', { name: /next step/i }).click();
    await page.getByRole('button', { name: /create product/i }).click();

    await expect(page).toHaveURL(/\/products$/, { timeout: 40000 });
    const filters = page.getByPlaceholder('Filter...');
    const nameFilter = filters.nth(0);
    await expect(nameFilter).toBeVisible({ timeout: 30000 });
    await nameFilter.fill(productName);
    await expect(statusCell(page, productName)).toContainText(/Active/i, { timeout: 25000 });
  });

  test('search created product by filters', async ({ page }) => {
    await gotoWithAuth(page, '/products');
    const filters = page.getByPlaceholder('Filter...');

    const nameFilter = filters.nth(0);
    const codeFilter = filters.nth(1);
    const descriptionFilter = filters.nth(2);
    const basePriceFilter = filters.nth(3);
    const minPriceFilter = filters.nth(4);
    const maxPriceFilter = filters.nth(5);
    const remarkFilter = filters.nth(6);
    const statusFilter = filters.nth(7);
    const categoryFilter = filters.nth(8);
    const subCategoryFilter = filters.nth(9);

    await nameFilter.fill(currentProductName);
    await expect(rowByName(page, currentProductName)).toHaveCount(1, { timeout: 20000 });

    await nameFilter.clear();
    await codeFilter.fill(productCode);
    await expect(rowByName(page, currentProductName)).toHaveCount(1, { timeout: 20000 });

    await codeFilter.clear();
    await descriptionFilter.fill(description);
    await expect(rowByName(page, currentProductName)).toHaveCount(1, { timeout: 20000 });

    await descriptionFilter.clear();
    await basePriceFilter.fill(basePrice);
    await expect(rowByName(page, currentProductName)).toHaveCount(1, { timeout: 20000 });

    await basePriceFilter.clear();
    await minPriceFilter.fill(minPrice);
    await expect(rowByName(page, currentProductName)).toHaveCount(1, { timeout: 20000 });

    await minPriceFilter.clear();
    await maxPriceFilter.fill(maxPrice);
    await expect(rowByName(page, currentProductName)).toHaveCount(1, { timeout: 20000 });

    await maxPriceFilter.clear();
    await remarkFilter.fill(remark);
    await expect(rowByName(page, currentProductName)).toHaveCount(1, { timeout: 20000 });

    await remarkFilter.clear();
    await statusFilter.fill('ACTIVE');
    await expect(rowByName(page, currentProductName)).toHaveCount(1, { timeout: 20000 });

    await statusFilter.clear();
    await categoryFilter.fill(categoryName);
    await expect(rowByName(page, currentProductName)).toHaveCount(1, { timeout: 20000 });

    await categoryFilter.clear();
    await subCategoryFilter.fill(subCategoryName);
    await expect(rowByName(page, currentProductName)).toHaveCount(1, { timeout: 20000 });

    await nameFilter.clear();
    await codeFilter.clear();
    await descriptionFilter.clear();
    await basePriceFilter.clear();
    await minPriceFilter.clear();
    await maxPriceFilter.clear();
    await remarkFilter.clear();
    await statusFilter.clear();
    await categoryFilter.clear();
    await subCategoryFilter.clear();
  });

  test('edit product details', async ({ page }) => {
    await gotoWithAuth(page, '/products');
    const filters = page.getByPlaceholder('Filter...');
    const nameFilter = filters.nth(0);
    await nameFilter.fill(currentProductName);
    await rowByName(page, currentProductName).getByRole('link', { name: /edit/i }).click();
    await expect(page).toHaveURL(/\/products\/\d+\/edit/, { timeout: 25000 });

    await page.getByLabel('Name').fill(updatedProductName);
    await page.getByLabel('Code').fill(updatedProductCode);
    await page.getByLabel('Description').fill(updatedDescription);
    await page.getByLabel('Remark').fill(updatedRemark);
    await page.getByLabel('Base Price').fill(basePrice);
    await page.getByLabel('Min Price').fill(minPrice);
    await page.getByLabel('Max Price').fill(maxPrice);

    await page.getByRole('button', { name: /next step/i }).click();
    await selectRelationship(page, /category/i, /search\s*product\s*categories/i, categoryName, 0);
    await selectRelationship(
      page,
      /sub category/i,
      /search\s*product\s*sub\s*categories/i,
      subCategoryName,
      1
    );
    await page.getByRole('button', { name: /next step/i }).click();
    await page.getByRole('button', { name: /next step/i }).click();
    await page.getByRole('button', { name: /update product/i }).click();

    await expect(page).toHaveURL(/\/products$/, { timeout: 40000 });
    await nameFilter.fill(updatedProductName);
    await expect(
      rowByName(page, updatedProductName).getByRole('cell', { name: updatedDescription })
    ).toBeVisible({ timeout: 20000 });

    currentProductName = updatedProductName;
  });

  test('change product status to archive', async ({ page }) => {
    await gotoWithAuth(page, '/products');
    const filters = page.getByPlaceholder('Filter...');
    const nameFilter = filters.nth(0);
    await nameFilter.fill(currentProductName);

    const activeRow = rowByName(page, currentProductName);
    await activeRow.getByRole('button', { name: /status actions/i }).click();
    await page.getByRole('menuitem', { name: /archive/i }).click();
    await page.getByRole('button', { name: /^archive$/i }).click();
    await expect(activeRow).toHaveCount(0, { timeout: 45000 });

    await page.reload();
    await page.getByRole('tab', { name: 'Archived', exact: true }).click();
    await nameFilter.fill(currentProductName);
    await expect(statusCell(page, currentProductName)).toContainText(/Archived/i, {
      timeout: 45000,
    });

    await page.getByRole('tab', { name: 'Active', exact: true }).click();
    await nameFilter.fill(currentProductName);
    await expect(rowByName(page, currentProductName)).toHaveCount(0, { timeout: 15000 });
  });
});
