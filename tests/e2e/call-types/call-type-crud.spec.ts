import { test, expect, Page } from '@playwright/test';

const EMAIL = 'abdulrehmantahir353@gmail.com';
const PASSWORD = 'abdul.123';

async function loginIfNeeded(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: /start brewing/i }).click();

  // Wait for either dashboard (already logged in) or an auth page
  const maybeDashboard = page.waitForURL(/\/dashboard/, { timeout: 8000 }).then(
    () => true,
    () => false
  );
  const onDashboard = await maybeDashboard;
  if (onDashboard) return;

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

test.describe('Call Type CRUD', () => {
  test('create → verify → update status → archive', async ({ page }) => {
    await loginIfNeeded(page);

    const callTypeName = `E2E Call Type ${Date.now()}`;
    const description = 'Auto-created by Playwright';
    const remark = 'Automated CRUD validation';

    // Create
    await page.goto('/call-types/new');
    await page.getByLabel('Name').fill(callTypeName);
    await page.getByLabel('Description').fill(description);
    await page.getByLabel('Remark').fill(remark);
    await page.getByRole('button', { name: /next step/i }).click();
    await page.getByRole('button', { name: /create call type/i }).click();

    // Back on list
    await expect(page).toHaveURL(/\/call-types$/, { timeout: 30000 });
    const nameFilter = page.getByPlaceholder('Filter...').first();
    await nameFilter.fill(callTypeName);
    const activeRow = page
      .locator('table tbody tr')
      .filter({ has: page.getByRole('cell', { name: callTypeName }) })
      .filter({ has: page.getByRole('link', { name: /view/i }) });
    const statusCell = activeRow
      .getByRole('cell', {
        name: /(Active|Inactive|Archived|Draft)/i,
      })
      .first();
    await expect(statusCell).toContainText(/Active/i, { timeout: 20000 });

    // Update status to Inactive
    await activeRow.getByRole('button', { name: /status actions/i }).click();
    await page.getByRole('menuitem', { name: /set inactive/i }).click();
    await page.getByRole('button', { name: /update status/i }).click();
    await expect(activeRow).toHaveCount(0, { timeout: 45000 });
    await page.getByRole('tab', { name: /inactive/i }).click();
    await nameFilter.fill(callTypeName);
    const inactiveRow = page
      .locator('table tbody tr')
      .filter({ has: page.getByRole('cell', { name: callTypeName }) })
      .filter({ has: page.getByRole('link', { name: /view/i }) });
    const inactiveStatusCell = inactiveRow
      .getByRole('cell', { name: /(Active|Inactive|Archived|Draft)/i })
      .first();
    await expect(inactiveStatusCell).toHaveText(/Inactive/i, { timeout: 45000 });

    // Archive
    await inactiveRow.getByRole('button', { name: /status actions/i }).click();
    await page.getByRole('menuitem', { name: /archive/i }).click();
    await page.getByRole('button', { name: /^archive$/i }).click();
    await expect(inactiveRow).toHaveCount(0, { timeout: 45000 });

    // Verify in archived tab
    await page.getByRole('tab', { name: /archived/i }).click();
    await nameFilter.fill(callTypeName);
    const archivedRow = page
      .locator('table tbody tr')
      .filter({ has: page.getByRole('cell', { name: callTypeName }) })
      .filter({ has: page.getByRole('link', { name: /view/i }) });
    const archivedStatusCell = archivedRow
      .getByRole('cell', { name: /(Active|Inactive|Archived|Draft)/i })
      .first();
    await expect(archivedStatusCell).toHaveText(/Archived/i, { timeout: 45000 });
  });
});
