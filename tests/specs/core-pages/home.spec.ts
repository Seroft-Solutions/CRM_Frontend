import { test, expect } from '../../fixtures/test-base';
import { TestHelpers, Selectors } from '../../utils/test-helpers';

test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load the home page successfully', async ({ page }) => {
    const helpers = new TestHelpers(page);
    
    // Wait for page to load
    await helpers.waitForPageLoad();
    
    // Check if page title is correct
    await expect(page).toHaveTitle(/CRM/i);
    
    // Verify page loads without errors
    await expect(page.locator('body')).toBeVisible();
  });

  test('should display hero section with CRM Cup branding', async ({ page }) => {
    const helpers = new TestHelpers(page);
    await helpers.waitForPageLoad();
    
    // Check for hero section or main heading
    const heroSection = page.locator('h1, h2, [data-testid="hero"]').first();
    await expect(heroSection).toBeVisible();
    
    // Verify some text content related to CRM
    await expect(page.getByText(/crm|customer|management/i).first()).toBeVisible();
  });

  test('should have navigation elements', async ({ page }) => {
    const helpers = new TestHelpers(page);
    await helpers.waitForPageLoad();
    
    // Look for navigation elements (could be navbar, menu, or links)
    const navigation = page.locator(
      'nav, [role="navigation"], header a, .navbar, [data-testid="nav"]'
    ).first();
    
    if (await navigation.isVisible()) {
      await expect(navigation).toBeVisible();
    } else {
      // Alternative: check for any clickable links or buttons
      const interactiveElements = page.locator('a, button').first();
      await expect(interactiveElements).toBeVisible();
    }
  });

  test('should be responsive and render properly', async ({ page }) => {
    const helpers = new TestHelpers(page);
    await helpers.waitForPageLoad();
    
    // Test desktop view
    await page.setViewportSize({ width: 1280, height: 720 });
    await expect(page.locator('body')).toBeVisible();
    
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await helpers.waitForPageLoad();
    await expect(page.locator('body')).toBeVisible();
    
    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await helpers.waitForPageLoad();
    await expect(page.locator('body')).toBeVisible();
  });

  test('should not have console errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    
    // Capture console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await page.goto('/');
    const helpers = new TestHelpers(page);
    await helpers.waitForPageLoad();
    
    // Filter out common non-critical errors
    const criticalErrors = consoleErrors.filter(error => 
      !error.includes('favicon') && 
      !error.includes('sourcemap') &&
      !error.includes('extension')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });

  test('should load within reasonable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    
    const helpers = new TestHelpers(page);
    await helpers.waitForPageLoad();
    
    const loadTime = Date.now() - startTime;
    
    // Expect page to load within 10 seconds (generous for CI/CD)
    expect(loadTime).toBeLessThan(10000);
  });
});