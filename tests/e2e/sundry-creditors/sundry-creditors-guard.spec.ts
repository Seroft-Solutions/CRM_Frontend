import { test, expect } from '@playwright/test';

test.describe('Sundry creditors auth guard', () => {
  test('redirects unauthenticated users to landing page', async ({ page }) => {
    await page.goto('/sundry-creditors');

    await expect(page).toHaveURL(/\/$/);
    await expect(
      page.getByRole('heading', { name: /brew better customer relationships/i })
    ).toBeVisible();
  });
});
