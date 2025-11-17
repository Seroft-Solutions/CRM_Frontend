import { test, expect } from '@playwright/test';

const EMAIL = 'abdulrehmantahir353@gmail.com';
const PASSWORD = 'abdul.123';

test.describe('Login flow', () => {
  test('user goes from landing → login → dashboard', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /start brewing/i }).click();

    // If already authenticated, we may land on the dashboard directly.
    let onDashboard = false;
    try {
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 8000 });
      onDashboard = true;
    } catch {
      onDashboard = false;
    }

    if (!onDashboard) {
      await expect(page).toHaveURL(/(signin|auth)/, { timeout: 15000 });

      const usernameInput = page.locator(
        'input[name="username"], input[name="email"], input#username, input#email'
      );
      await usernameInput.first().fill(EMAIL);

      const passwordInput = page.locator(
        'input[type="password"], input#password, input[name="password"]'
      );
      await passwordInput.first().fill(PASSWORD);

      await page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Log In")').first().click();
    }

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 30000 });
  });
});
