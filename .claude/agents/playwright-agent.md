# Playwright E2E Testing Agent

## Purpose
This agent is responsible for setting up and maintaining end-to-end tests using Playwright for the CRM Frontend application, ensuring complete user workflows work correctly across different browsers.

## Responsibilities

### 1. E2E Test Infrastructure Setup
- Configure Playwright with TypeScript
- Set up test environments (dev, staging, prod)
- Configure browser testing (Chrome, Firefox, Safari)
- Set up visual regression testing
- Configure test reporting and debugging

### 2. User Workflow Testing
- Complete customer management workflows
- Call management and scheduling flows
- Meeting booking and management
- Authentication and authorization flows
- Cross-feature integration testing

### 3. Browser Compatibility Testing
- Cross-browser testing across major browsers
- Mobile responsive testing
- Performance testing
- Accessibility testing
- Progressive web app features

### 4. Visual Regression Testing
- Screenshot comparisons
- UI component visual testing
- Layout testing across viewports
- Theme and styling consistency
- Print stylesheet testing

### 5. Performance and Load Testing
- Page load performance
- API response times
- Memory usage monitoring
- Network throttling tests
- Stress testing critical paths

## Configuration Files

### playwright.config.ts
```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  expect: { timeout: 5000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/results.xml' }],
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
})
```

### e2e/auth.setup.ts
```typescript
import { test as setup, expect } from '@playwright/test'

const authFile = 'playwright/.auth/user.json'

setup('authenticate', async ({ page }) => {
  await page.goto('/auth/signin')
  
  // Perform authentication steps
  await page.fill('input[name="email"]', 'test@example.com')
  await page.fill('input[name="password"]', 'testpassword')
  await page.click('button[type="submit"]')
  
  // Wait for redirect to dashboard
  await page.waitForURL('/dashboard')
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
  
  // Save authentication state
  await page.context().storageState({ path: authFile })
})
```

## Test Utilities

### e2e/utils/test-helpers.ts
```typescript
import { Page, expect } from '@playwright/test'

export class TestHelpers {
  constructor(private page: Page) {}

  async navigateToCustomers() {
    await this.page.click('nav a[href="/customers"]')
    await this.page.waitForURL('/customers')
  }

  async createCustomer(customerData: {
    name: string
    email: string
    phone?: string
  }) {
    await this.page.click('button:has-text("New Customer")')
    await this.page.fill('input[name="name"]', customerData.name)
    await this.page.fill('input[name="email"]', customerData.email)
    
    if (customerData.phone) {
      await this.page.fill('input[name="phone"]', customerData.phone)
    }
    
    await this.page.click('button[type="submit"]')
    await expect(this.page.getByText('Customer created successfully')).toBeVisible()
  }

  async selectCustomerFromList(customerName: string) {
    await this.page.click(`tr:has-text("${customerName}")`)
  }

  async scheduleCall(callData: {
    type: string
    priority: string
    notes?: string
  }) {
    await this.page.click('button:has-text("Schedule Call")')
    await this.page.selectOption('select[name="type"]', callData.type)
    await this.page.selectOption('select[name="priority"]', callData.priority)
    
    if (callData.notes) {
      await this.page.fill('textarea[name="notes"]', callData.notes)
    }
    
    await this.page.click('button[type="submit"]')
    await expect(this.page.getByText('Call scheduled successfully')).toBeVisible()
  }

  async bookMeeting(date: string, time: string) {
    await this.page.click('button:has-text("Schedule Meeting")')
    await this.page.click(`[data-date="${date}"]`)
    await this.page.click(`[data-time="${time}"]`)
    await this.page.click('button:has-text("Confirm Booking")')
    await expect(this.page.getByText('Meeting booked successfully')).toBeVisible()
  }

  async verifyToastMessage(message: string) {
    await expect(this.page.getByRole('alert')).toContainText(message)
  }

  async waitForLoadingToComplete() {
    await this.page.waitForSelector('[data-testid="loading"]', { state: 'hidden' })
  }
}
```

### e2e/fixtures/auth-fixture.ts
```typescript
import { test as base } from '@playwright/test'

type AuthFixtures = {
  authenticatedPage: Page
}

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: 'playwright/.auth/user.json'
    })
    const page = await context.newPage()
    await use(page)
    await context.close()
  }
})

export { expect } from '@playwright/test'
```

## Test Examples

### e2e/customer-management.spec.ts
```typescript
import { test, expect } from './fixtures/auth-fixture'
import { TestHelpers } from './utils/test-helpers'

test.describe('Customer Management', () => {
  test('should create a new customer successfully', async ({ authenticatedPage }) => {
    const helpers = new TestHelpers(authenticatedPage)
    
    await helpers.navigateToCustomers()
    
    const customerData = {
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+1234567890'
    }
    
    await helpers.createCustomer(customerData)
    
    // Verify customer appears in the list
    await expect(authenticatedPage.getByText(customerData.name)).toBeVisible()
    await expect(authenticatedPage.getByText(customerData.email)).toBeVisible()
  })

  test('should validate required fields', async ({ authenticatedPage }) => {
    const helpers = new TestHelpers(authenticatedPage)
    
    await helpers.navigateToCustomers()
    await authenticatedPage.click('button:has-text("New Customer")')
    await authenticatedPage.click('button[type="submit"]')
    
    await expect(authenticatedPage.getByText('Name is required')).toBeVisible()
    await expect(authenticatedPage.getByText('Email is required')).toBeVisible()
  })
})
```

### e2e/meeting-booking.spec.ts
```typescript
import { test, expect } from './fixtures/auth-fixture'
import { TestHelpers } from './utils/test-helpers'

test.describe('Meeting Booking', () => {
  test('should book a meeting successfully', async ({ authenticatedPage }) => {
    const helpers = new TestHelpers(authenticatedPage)
    
    // Create customer first
    await helpers.navigateToCustomers()
    await helpers.createCustomer({
      name: 'Jane Smith',
      email: 'jane.smith@example.com'
    })
    
    // Schedule a call
    await helpers.selectCustomerFromList('Jane Smith')
    await helpers.scheduleCall({
      type: 'Sales Call',
      priority: 'High'
    })
    
    // Book a meeting
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dateStr = tomorrow.toISOString().split('T')[0]
    
    await helpers.bookMeeting(dateStr, '10:00')
    
    // Verify meeting appears in schedule
    await authenticatedPage.goto('/meetings')
    await expect(authenticatedPage.getByText('Jane Smith')).toBeVisible()
    await expect(authenticatedPage.getByText('10:00')).toBeVisible()
  })
})
```

### e2e/realtime-collaboration.spec.ts
```typescript
import { test, expect } from '@playwright/test'

test.describe('Realtime Collaboration', () => {
  test('should show live updates when another user modifies data', async ({ browser }) => {
    // Create two browser contexts for two users
    const context1 = await browser.newContext({ storageState: 'playwright/.auth/user1.json' })
    const context2 = await browser.newContext({ storageState: 'playwright/.auth/user2.json' })
    
    const page1 = await context1.newPage()
    const page2 = await context2.newPage()
    
    // Both users navigate to customers page
    await page1.goto('/customers')
    await page2.goto('/customers')
    
    // User 1 creates a customer
    await page1.click('button:has-text("New Customer")')
    await page1.fill('input[name="name"]', 'Realtime Test Customer')
    await page1.fill('input[name="email"]', 'realtime@test.com')
    await page1.click('button[type="submit"]')
    
    // User 2 should see the new customer appear automatically
    await expect(page2.getByText('Realtime Test Customer')).toBeVisible({ timeout: 5000 })
    
    await context1.close()
    await context2.close()
  })

  test('should show user presence indicators', async ({ browser }) => {
    const context1 = await browser.newContext({ storageState: 'playwright/.auth/user1.json' })
    const context2 = await browser.newContext({ storageState: 'playwright/.auth/user2.json' })
    
    const page1 = await context1.newPage()
    const page2 = await context2.newPage()
    
    // Both users view the same customer
    await page1.goto('/customers/123')
    await page2.goto('/customers/123')
    
    // User 1 should see User 2's presence indicator
    await expect(page1.getByTestId('presence-indicator')).toBeVisible({ timeout: 5000 })
    
    // User 2 starts editing
    await page2.click('button:has-text("Edit")')
    
    // User 1 should see editing indicator
    await expect(page1.getByTestId('editing-indicator')).toBeVisible({ timeout: 5000 })
    
    await context1.close()
    await context2.close()
  })
})
```

## Visual Regression Testing

### e2e/visual/ui-components.spec.ts
```typescript
import { test, expect } from '@playwright/test'

test.describe('Visual Regression Tests', () => {
  test('customer list page layout', async ({ page }) => {
    await page.goto('/customers')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveScreenshot('customer-list.png')
  })

  test('customer form layout', async ({ page }) => {
    await page.goto('/customers/new')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveScreenshot('customer-form.png')
  })

  test('meeting scheduler layout', async ({ page }) => {
    await page.goto('/meetings/schedule')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveScreenshot('meeting-scheduler.png')
  })
})
```

## Performance Testing

### e2e/performance/load-times.spec.ts
```typescript
import { test, expect } from '@playwright/test'

test.describe('Performance Tests', () => {
  test('page load times should be under 3 seconds', async ({ page }) => {
    const start = Date.now()
    await page.goto('/customers')
    await page.waitForLoadState('networkidle')
    const loadTime = Date.now() - start
    
    expect(loadTime).toBeLessThan(3000)
  })

  test('API response times should be under 1 second', async ({ page }) => {
    await page.goto('/customers')
    
    const [response] = await Promise.all([
      page.waitForResponse('/api/customers'),
      page.reload()
    ])
    
    const responseTime = response.timing()
    expect(responseTime.responseEnd - responseTime.requestStart).toBeLessThan(1000)
  })
})
```

## Scripts to Add to package.json

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:report": "playwright show-report",
    "test:e2e:install": "playwright install"
  }
}
```

## Dependencies to Install

```bash
npm install --save-dev @playwright/test
npx playwright install
```

## Test Organization

```
e2e/
├── fixtures/
│   ├── auth-fixture.ts
│   └── data-fixture.ts
├── utils/
│   ├── test-helpers.ts
│   ├── mock-data.ts
│   └── api-helpers.ts
├── tests/
│   ├── auth/
│   ├── customer-management/
│   ├── call-management/
│   ├── meeting-booking/
│   └── realtime-collaboration/
├── visual/
│   └── ui-components.spec.ts
├── performance/
│   └── load-times.spec.ts
└── playwright/.auth/
    ├── user1.json
    └── user2.json
```

## Best Practices

1. **Page Object Model**: Use page objects for reusable test logic
2. **Test Data Management**: Use fixtures for consistent test data
3. **Wait Strategies**: Use explicit waits instead of sleep
4. **Test Isolation**: Each test should be independent
5. **Error Handling**: Include proper error scenarios
6. **Visual Testing**: Regular screenshot comparisons
7. **Performance Monitoring**: Track key performance metrics

## CI/CD Integration

The Playwright agent ensures E2E tests run in CI/CD with:
- Parallel test execution across browsers
- Visual regression detection
- Performance baseline tracking
- Test result reporting
- Failed test debugging artifacts
- Cross-browser compatibility verification