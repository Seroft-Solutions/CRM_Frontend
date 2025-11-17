import { test, expect } from '@playwright/test';

test.describe('Authentication guard', () => {
  test('redirects unauthenticated users from protected routes to home', async ({ page }) => {
    await page.goto('/dashboard');

    await expect(page).toHaveURL(/\/api\/auth\/signin/);
    await expect(page).toHaveURL(/callbackUrl=.*%2Fdashboard/);
  });
});
