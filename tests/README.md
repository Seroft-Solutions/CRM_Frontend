# CRM Frontend E2E Testing Guide

**Single Source of Truth for Playwright Testing**

This is the complete guide for end-to-end testing in the CRM Frontend project using Playwright.

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Test Organization](#test-organization)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [Templates](#templates)
- [Best Practices](#best-practices)
- [Debugging](#debugging)
- [CI/CD Integration](#cicd-integration)

## 🚀 Quick Start

### Installation Complete ✅
Playwright is already installed and configured. Jump straight to running tests:

```bash
# Run all tests (headless)
npm run test:e2e

# Run tests with visible browsers (great for development)
npm run test:e2e:headed

# Interactive test development (recommended)
npm run test:e2e:ui
```

### Available Commands
```bash
npm run test:e2e          # Headless mode (fast, CI-friendly)
npm run test:e2e:headed   # Visible browser windows
npm run test:e2e:ui       # Interactive UI mode (best for development)
npm run test:e2e:debug    # Debug mode with breakpoints
npm run test:e2e:report   # View HTML test report
```

## 🏗️ Test Organization

### Perfect Feature Alignment

Tests are organized to **exactly mirror** your CRM application structure from `src/app/(protected)/(features)/`:

```
tests/
├── fixtures/              # Shared test setup
│   └── test-base.ts      # Base test configuration
├── utils/                # Common test utilities  
│   └── test-helpers.ts   # Helper functions and selectors
├── specs/                # Test specifications
│   ├── core-pages/       # Core application pages
│   │   └── home.spec.ts  # Home page tests ✅
│   ├── auth/             # Authentication flows
│   │
│   # === EXACT CRM FEATURE MAPPING ===
│   │
│   ├── areas/                 # Geographic Areas (/areas)
│   ├── available-time-slots/  # Time Slots (/available-time-slots)
│   ├── call-remarks/          # Call Remarks (/call-remarks)
│   ├── call-statuses/         # Call Statuses (/call-statuses)
│   ├── call-types/           # Call Types (/call-types)
│   ├── calls/                # Call Management (/calls) ✅
│   ├── channel-types/        # Channel Types (/channel-types)
│   ├── cities/               # Cities (/cities)
│   ├── customers/            # Customers (/customers) ✅
│   ├── districts/            # Districts (/districts)
│   ├── groups/               # User Groups (/groups)
│   ├── meeting-participants/ # Meeting Participants (/meeting-participants)
│   ├── meeting-reminders/    # Meeting Reminders (/meeting-reminders)
│   ├── meetings/             # Meetings (/meetings) ✅
│   ├── organizations/        # Organizations (/organizations)
│   ├── priorities/           # Priorities (/priorities)
│   ├── products/             # Products (/products)
│   ├── roles/                # User Roles (/roles)
│   ├── sources/              # Lead Sources (/sources)
│   ├── states/               # States (/states)
│   ├── sub-call-types/       # Sub Call Types (/sub-call-types)
│   ├── user-availabilities/  # User Availability (/user-availabilities)
│   ├── user-drafts/          # Draft Management (/user-drafts)
│   └── user-profiles/        # User Profiles (/user-profiles)
│
├── workflows/             # End-to-end user journeys
├── integration/           # Cross-feature integration tests
└── templates/            # Test templates for new features
    ├── entity-crud-template.spec.ts      # Generic CRUD pattern
    └── feature-specific-template.spec.ts # CRM-specific pattern
```

### Why This Organization?

✅ **1:1 Feature Mapping**: Every test directory matches your app exactly  
✅ **Developer Workflow**: Feature developers know exactly where their tests live  
✅ **Easy Navigation**: Tests mirror your application structure  
✅ **Scalable**: Add new features by copying templates  
✅ **Targeted Testing**: Run only tests for features being developed  

## 🎯 Running Tests

### By Individual Feature
```bash
# Test specific features
npm run test:e2e tests/specs/calls
npm run test:e2e tests/specs/customers  
npm run test:e2e tests/specs/meetings
npm run test:e2e tests/specs/organizations
```

### By Feature Groups
```bash
# All call-related features
npx playwright test --grep "call"

# All meeting-related features  
npx playwright test --grep "meeting"

# All geographic features
npx playwright test --grep "state|district|city|area"

# All user management features
npx playwright test --grep "user|role|group"
```

### By Related Features
```bash
# Geographic hierarchy together
npm run test:e2e tests/specs/states tests/specs/districts tests/specs/cities tests/specs/areas

# Call ecosystem together  
npm run test:e2e tests/specs/calls tests/specs/call-types tests/specs/call-statuses tests/specs/call-remarks

# Meeting system together
npm run test:e2e tests/specs/meetings tests/specs/meeting-participants tests/specs/meeting-reminders
```

### Test Modes

#### Headless Mode (Default - Fast)
```bash
npm run test:e2e
```
- No visible browser windows
- Fastest execution  
- Perfect for CI/CD
- Background execution

#### Headed Mode (Visual)
```bash
npm run test:e2e:headed
```
- Browser windows visible
- Great for debugging
- See what tests are doing
- Slower execution

#### UI Mode (Interactive - Best for Development)
```bash
npm run test:e2e:ui
```
- Interactive test runner
- Step-by-step execution
- Built-in debugging tools
- Visual test development
- **Recommended for writing new tests**

#### Debug Mode (Troubleshooting)
```bash
npm run test:e2e:debug
```
- Step-through debugging
- Breakpoint support
- Playwright Inspector
- Element highlighting

## ✍️ Writing Tests

### Step 1: Choose Your Template

#### For Standard CRUD Features
Use `templates/feature-specific-template.spec.ts` for features like:
- areas, cities, customers, districts, groups, organizations
- priorities, products, roles, sources, states  
- channel-types, call-types, call-statuses, call-remarks

#### For Complex Features
Look at existing examples:
- `specs/calls/call-list.spec.ts` - Complex feature with relationships
- `specs/meetings/meeting-list.spec.ts` - Scheduling and participants
- `specs/customers/customer-list.spec.ts` - Standard list operations

### Step 2: Create Your Test File

```bash
# Example: Creating tests for products feature
cp templates/feature-specific-template.spec.ts specs/products/product-list.spec.ts
```

### Step 3: Customize the Template

Replace placeholders in the template:
- `{FeatureName}` → `Product`
- `{featureName}` → `product`  
- `{feature-path}` → `products`
- `{Feature Context}` → `Product Management`

### Standard Test Structure

```typescript
import { test, expect } from '../../fixtures/test-base';
import { TestHelpers, Selectors } from '../../utils/test-helpers';

test.describe('Product Management', () => {
  test.describe('Product List Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/products');
    });

    test('should display products with essential information', async ({ page }) => {
      const helpers = new TestHelpers(page);
      await helpers.waitForPageLoad();
      
      // Verify table headers
      await expect(page.locator('table th')).toContainText(['Name', 'Category', 'Price']);
      
      // Verify data rows
      await expect(page.locator('table tbody tr')).toHaveCountGreaterThan(0);
    });

    test('should create new product', async ({ page }) => {
      const helpers = new TestHelpers(page);
      await helpers.waitForPageLoad();
      
      // Click create button
      await page.getByRole('button', { name: /new product|create/i }).click();
      await expect(page).toHaveURL('/products/new');
      
      // Fill form
      await page.getByLabel('Product Name').fill('Test Product');
      await page.getByLabel('Category').click();
      await page.getByRole('option', { name: 'Electronics' }).click();
      
      // Submit
      await page.getByRole('button', { name: /create/i }).click();
      
      // Verify success
      await expect(page.locator(Selectors.successToast)).toBeVisible();
      await expect(page).toHaveURL('/products');
    });
  });
});
```

### Test Categories to Cover

#### 1. List Page Tests
- Display data correctly
- Search functionality
- Filter by organization/category
- Pagination
- Sort columns
- Export data (if available)

#### 2. Create Tests  
- Valid data creation
- Required field validation
- Relationship handling
- Error scenarios
- Success confirmation

#### 3. Edit Tests
- Load existing data
- Update functionality  
- Validation on updates
- Success confirmation

#### 4. Detail Tests
- Display complete information
- Action buttons available
- Related data shown
- Navigation working

#### 5. Delete Tests
- Confirmation dialog
- Successful deletion
- Prevent deletion with dependencies
- Success feedback

#### 6. Feature-Specific Tests
- **Calls**: Meeting integration, status updates, remarks
- **Meetings**: Participant management, scheduling conflicts
- **Geographic**: Hierarchy validation (State → District → City → Area)
- **Users**: Permission handling, role assignments

## 🔧 Templates

### Available Templates

#### 1. Feature-Specific Template (`templates/feature-specific-template.spec.ts`)
**Use for**: Most CRM features with standard CRUD operations

**Includes**:
- List page tests
- Create/Edit/Delete operations
- Form validation
- Relationship handling
- Feature-specific workflows

**Placeholders to replace**:
```typescript
{FeatureName}   // e.g., "Product", "Customer", "Call"
{featureName}   // e.g., "product", "customer", "call"  
{feature-path}  // e.g., "products", "customers", "calls"
```

#### 2. Legacy CRUD Template (`templates/entity-crud-template.spec.ts`)
**Use for**: Generic entity operations (kept for compatibility)

### Creating Tests from Templates

```bash
# Step 1: Copy template
cp templates/feature-specific-template.spec.ts specs/priorities/priority-list.spec.ts

# Step 2: Replace placeholders
# {FeatureName} → Priority
# {featureName} → priority
# {feature-path} → priorities

# Step 3: Customize feature-specific logic
# Add priority-specific validations, relationships, workflows
```

## 🎯 Best Practices

### Test Writing Guidelines

#### 1. Use Descriptive Test Names
```typescript
// Good
test('should create call with customer association and auto-populate contact details')

// Bad  
test('should create call')
```

#### 2. Wait for Page Load
```typescript
test('should do something', async ({ page }) => {
  const helpers = new TestHelpers(page);
  await helpers.waitForPageLoad(); // Always do this first
  
  // Your test logic here
});
```

#### 3. Use Web-First Assertions
```typescript
// Good - waits automatically
await expect(page.locator('button')).toBeVisible();
await expect(page).toHaveURL('/expected-path');

// Bad - no waiting
const element = page.locator('button');
expect(await element.isVisible()).toBe(true);
```

#### 4. Organize with Describe Blocks
```typescript
test.describe('Customer Management', () => {
  test.describe('Customer List', () => {
    // List-related tests
  });
  
  test.describe('Customer Creation', () => {
    // Creation-related tests  
  });
});
```

#### 5. Handle Dynamic Content
```typescript
// Check if optional elements exist before testing
const exportButton = page.getByRole('button', { name: /export/i });
if (await exportButton.isVisible()) {
  await expect(exportButton).toBeVisible();
}
```

### Locator Strategies (Priority Order)

```typescript
// 1. Role-based (Preferred)
page.getByRole('button', { name: 'Submit' })
page.getByRole('textbox', { name: 'Email' })

// 2. Label-based  
page.getByLabel('Password')
page.getByLabel('Organization')

// 3. Text content
page.getByText('Create Customer')
page.getByText(/customer.*created/i)

// 4. Test IDs (add to your components)
page.getByTestId('customer-form')
page.getByTestId('submit-button')

// 5. CSS selectors (last resort)
page.locator('.customer-table')
page.locator('table tbody tr')
```

### Common Test Patterns

#### Navigation Tests
```typescript
test('should navigate to feature details', async ({ page }) => {
  await helpers.waitForPageLoad();
  
  await page.locator('table tbody tr').first().click();
  await expect(page).toHaveURL(/\/customers\/\d+/);
});
```

#### Form Tests
```typescript
test('should validate required fields', async ({ page }) => {
  await page.getByRole('button', { name: /create/i }).click();
  
  await expect(page.getByText('Name is required')).toBeVisible();
  await expect(page.getByText('Organization is required')).toBeVisible();
});
```

#### Search Tests
```typescript  
test('should search by name', async ({ page }) => {
  await page.getByPlaceholder(/search/i).fill('John Doe');
  await page.keyboard.press('Enter');
  
  await helpers.waitForNavigation();
  await expect(page.locator('table tbody tr')).toContainText('John Doe');
});
```

## 🐛 Debugging

### Local Debugging

#### 1. Use UI Mode (Recommended)
```bash
npm run test:e2e:ui
```
- Visual test execution
- Step-by-step debugging  
- Element inspector
- Network monitoring

#### 2. Use Debug Mode
```bash
npm run test:e2e:debug
```
- Playwright Inspector
- Breakpoint support
- Element highlighting

#### 3. Add Breakpoints in Code
```typescript
test('should do something', async ({ page }) => {
  await page.goto('/customers');
  
  await page.pause(); // Pauses execution here
  
  // Continue with test logic
});
```

#### 4. Take Screenshots
```typescript
test('should debug issue', async ({ page }) => {
  await helpers.waitForPageLoad();
  
  // Take screenshot for debugging
  await helpers.takeTimestampedScreenshot('debug-customer-list');
  
  // Continue with test
});
```

### Test Failure Analysis

#### 1. Check Test Reports
```bash
npm run test:e2e:report
```
- View HTML report
- See failure screenshots  
- Review test traces
- Network activity logs

#### 2. Common Failure Patterns

**Element Not Found**
```typescript
// Problem: Element doesn't exist yet
await page.getByRole('button', { name: 'Submit' }).click();

// Solution: Wait for element  
await expect(page.getByRole('button', { name: 'Submit' })).toBeVisible();
await page.getByRole('button', { name: 'Submit' }).click();
```

**Navigation Issues**  
```typescript
// Problem: Page hasn't loaded
await page.getByRole('link', { name: 'Customers' }).click();
await expect(page).toHaveURL('/customers'); // May fail

// Solution: Wait for navigation
await page.getByRole('link', { name: 'Customers' }).click();
await helpers.waitForNavigation();
await expect(page).toHaveURL('/customers');
```

**Timing Issues**
```typescript
// Problem: Action too fast
await page.getByLabel('Organization').click();
await page.getByRole('option', { name: 'Acme' }).click(); // May fail

// Solution: Wait for dropdown
await page.getByLabel('Organization').click();
await expect(page.getByRole('option', { name: 'Acme' })).toBeVisible();
await page.getByRole('option', { name: 'Acme' }).click();
```

## 🔄 CI/CD Integration

### GitHub Actions Ready

The configuration is optimized for CI/CD:

```typescript
// playwright.config.ts includes:
retries: process.env.CI ? 2 : 0,     // Retry failed tests in CI
workers: process.env.CI ? 1 : undefined, // Control parallelism  
forbidOnly: !!process.env.CI,       // Prevent test.only in CI
```

### CI Commands
```bash
# In your CI pipeline
npm install
npx playwright install --with-deps
npm run test:e2e

# Generate and upload reports
npx playwright show-report
```

### Test Artifacts

The following are automatically generated and should be ignored in git:
- `/test-results/` - Test execution results
- `/playwright-report/` - HTML reports  
- `/blob-report/` - Binary reports
- Test screenshots and videos
- Test traces for debugging

## 📈 Development Workflow

### Phase 1: Core Features (High Priority)
1. **calls/** - Main business functionality ✅  
2. **customers/** - Primary entities ✅
3. **meetings/** - Core scheduling ✅
4. **organizations/** - Multi-tenant foundation

### Phase 2: Supporting Features (Medium Priority)
1. **call-types/**, **call-statuses/**, **call-remarks/** - Call support
2. **meeting-participants/**, **meeting-reminders/** - Meeting support  
3. **user-profiles/**, **roles/**, **groups/** - User management
4. **products/**, **priorities/**, **sources/** - Business data

### Phase 3: Configuration Features (Lower Priority)  
1. **states/**, **districts/**, **cities/**, **areas/** - Geographic
2. **channel-types/**, **sub-call-types/** - Configuration
3. **user-availabilities/**, **available-time-slots/** - Availability
4. **user-drafts/** - Draft management

### Phase 4: Integration & Workflows (Final)
1. **workflows/** - End-to-end user journeys
2. **integration/** - Cross-feature validation

### Adding Tests for New Features

1. **Copy Template**: Use `feature-specific-template.spec.ts`
2. **Replace Placeholders**: Feature name, paths, etc.
3. **Customize Logic**: Add feature-specific validations
4. **Run Tests**: Verify they work with your feature
5. **Iterate**: Refine tests as feature develops

## 🎉 Summary

You now have a comprehensive, feature-aligned Playwright testing infrastructure that:

✅ **Mirrors your exact CRM structure**  
✅ **Scales with your application**  
✅ **Provides clear development workflow**  
✅ **Includes ready-to-use templates**  
✅ **Supports all testing modes**  
✅ **Is CI/CD ready**  

**Single Source of Truth**: This README is your complete testing guide. No need to reference multiple documentation files.

Happy testing! 🚀