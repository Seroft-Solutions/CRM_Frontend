import { test, expect, Page } from '@playwright/test';

const EMAIL = 'abdulrehmantahir353@gmail.com';
const PASSWORD = 'abdul.123';

async function loginIfNeeded(page: Page) {
  // If already authenticated (dashboard reachable), skip login.
  const dashboardResp = await page.goto('/dashboard');
  if (dashboardResp?.url().includes('/dashboard')) {
    return;
  }

  // Otherwise, go through the landing flow.
  await page.goto('/');
  await page.getByRole('button', { name: /start brewing/i }).first().click();

  await expect(page).toHaveURL(/(signin|auth)/, { timeout: 15000 });

  const usernameInput = page.locator(
    'input[name="username"], input[name="email"], input#username, input#email'
  );
  await usernameInput.first().fill(EMAIL);

  const passwordInput = page.locator(
    'input[type="password"], input#password, input[name="password"]'
  );
  await passwordInput.first().fill(PASSWORD);

  await page
    .locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Log In")')
    .first()
    .click();

  await expect(page).toHaveURL(/\/dashboard/, { timeout: 30000 });
}

const rowByName = (page: Page, name: string) =>
  page
    .locator('table tbody tr')
    .filter({ has: page.getByRole('cell', { name }) })
    .filter({ has: page.getByRole('link', { name: /view/i }) });

const statusCell = (page: Page, name: string) =>
  rowByName(page, name)
    .getByRole('cell', { name: /(Active|Inactive|Archived|Draft)/i })
    .first();

// Navigate to a path; if redirected to auth, login and return to the target path.
async function gotoWithAuth(page: Page, path: string) {
  await page.goto(path);
  if (/(signin|auth)/i.test(page.url())) {
    await loginIfNeeded(page);
    await page.goto(path);
  }
}

test.describe.serial('Call Type CRUD', () => {

  const callTypeName = `E2E Call Type ${Date.now()}`;
  const updatedCallTypeName = `${callTypeName} - Updated`;
  const description = 'Auto-created by Playwright';
  const remark = 'Automated CRUD validation';
  const updatedDescription = `${description} - updated`;
  const updatedRemark = `${remark} - updated`;
  let currentCallTypeName = callTypeName;

  test.beforeEach(async ({ page }) => {
    await loginIfNeeded(page);
  });

  test.afterEach(async ({ page }) => {
    // Explicit logout/cleanup so each test starts fresh.
    await page.context().clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.goto('/');
  });

  test('create call type', async ({ page }) => {
    await gotoWithAuth(page, '/call-types/new');
    await page.getByLabel('Name').fill(callTypeName);
    await page.getByLabel('Description').fill(description);
    await page.getByLabel('Remark').fill(remark);
    await page.getByRole('button', { name: /next step/i }).click();
    await page.getByRole('button', { name: /create call type/i }).click();

    await expect(page).toHaveURL(/\/call-types$/, { timeout: 30000 });
    const nameFilter = page.getByPlaceholder('Filter...').first();
    await nameFilter.fill(callTypeName);
    await expect(statusCell(page, callTypeName)).toContainText(/Active/i, { timeout: 20000 });
  });

  test('search created call type by all filters', async ({ page }) => {
    await gotoWithAuth(page, '/call-types');
    const filters = page.getByPlaceholder('Filter...');
    const nameFilter = filters.nth(0);
    const descriptionFilter = filters.nth(1);
    const remarkFilter = filters.nth(2);

    await nameFilter.fill(currentCallTypeName);
    await expect(rowByName(page, currentCallTypeName)).toHaveCount(1, { timeout: 15000 });

    await descriptionFilter.fill(description);
    await expect(rowByName(page, currentCallTypeName)).toHaveCount(1, { timeout: 15000 });

    await remarkFilter.fill(remark);
    await expect(rowByName(page, currentCallTypeName)).toHaveCount(1, { timeout: 15000 });

    await nameFilter.clear();
    await descriptionFilter.clear();
    await remarkFilter.clear();
  });

  test('edit call type details', async ({ page }) => {
    await gotoWithAuth(page, '/call-types');
    const nameFilter = page.getByPlaceholder('Filter...').first();
    await nameFilter.fill(currentCallTypeName);
    await rowByName(page, currentCallTypeName).getByRole('link', { name: /edit/i }).click();
    await expect(page).toHaveURL(/\/call-types\/\d+\/edit/, { timeout: 15000 });

    await page.getByLabel('Name').fill(updatedCallTypeName);
    await page.getByLabel('Description').fill(updatedDescription);
    await page.getByLabel('Remark').fill(updatedRemark);
    await page.getByRole('button', { name: /next step/i }).click();
    await page.getByRole('button', { name: /update call type/i }).click();

    await expect(page).toHaveURL(/\/call-types$/, { timeout: 30000 });
    await nameFilter.fill(updatedCallTypeName);
    await expect(
      rowByName(page, updatedCallTypeName).getByRole('cell', { name: updatedDescription })
    ).toBeVisible({
      timeout: 20000,
    });

    currentCallTypeName = updatedCallTypeName;
  });

  test('change status to archive', async ({ page }) => {
    await gotoWithAuth(page, '/call-types');
    const nameFilter = page.getByPlaceholder('Filter...').first();
    await nameFilter.fill(currentCallTypeName);

    const activeRow = rowByName(page, currentCallTypeName);
    await activeRow.getByRole('button', { name: /status actions/i }).click();
    await page.getByRole('menuitem', { name: /archive/i }).click();
    await page.getByRole('button', { name: /^archive$/i }).click();
    await expect(activeRow).toHaveCount(0, { timeout: 45000 });

    await page.reload();
    await page.getByRole('tab', { name: /archived/i }).click();
    await nameFilter.fill(currentCallTypeName);
    const archivedRow = rowByName(page, currentCallTypeName);
    await expect(
      archivedRow.getByRole('cell', { name: /(Active|Inactive|Archived|Draft)/i }).first()
    ).toHaveText(/Archived/i, { timeout: 45000 });

    await page.getByRole('tab', { name: /active/i }).click();
    await nameFilter.fill(currentCallTypeName);
    await expect(rowByName(page, currentCallTypeName)).toHaveCount(0, { timeout: 15000 });
  });
});
