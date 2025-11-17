import { test, expect } from '@playwright/test';

test.describe('Public landing', () => {
  test('renders hero and CTA', async ({ page }) => {
    await page.goto('/');

    await expect(
      page.getByRole('heading', { name: /brew better customer relationships/i })
    ).toBeVisible();

    await expect(page.getByRole('button', { name: /start brewing/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /create account/i })).toBeVisible();
  });
});
