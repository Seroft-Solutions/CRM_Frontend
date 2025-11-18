import { expect, Page } from '@playwright/test';

const EMAIL = process.env.E2E_USERNAME ?? 'abdulrehmantahir353@gmail.com';
const PASSWORD = process.env.E2E_PASSWORD ?? 'abdul.123';

/**
 * Logs in through the landing page if the user is not already authenticated.
 * Keeps the flow generic so it can be reused across suites.
 */
export async function loginIfNeeded(page: Page) {
  const dashboardResp = await page.goto('/dashboard');
  if (dashboardResp?.url().includes('/dashboard')) {
    return;
  }

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

/**
 * Navigate to a path, performing login if redirected to auth.
 */
export async function gotoWithAuth(page: Page, path: string) {
  await page.goto(path);
  if (/(signin|auth)/i.test(page.url())) {
    await loginIfNeeded(page);
    await page.goto(path);
  }
}

/**
 * Clears cookies and storage so each test starts fresh.
 */
export async function resetSession(page: Page) {
  await page.context().clearCookies();
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}
