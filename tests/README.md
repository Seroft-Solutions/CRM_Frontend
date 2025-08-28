# Playwright E2E Testing Infrastructure

This directory contains the Playwright end-to-end testing infrastructure for the CRM Frontend project, organized to scale with your extensive feature set.

## Structure

```
tests/
├── fixtures/                    # Test fixtures and base test setup
│   └── test-base.ts            # Base test configuration and extensions
├── utils/                      # Test utilities and helpers
│   └── test-helpers.ts         # Common test utilities and selectors
├── specs/                      # Test specifications organized by feature domain
│   ├── auth/                   # Authentication & authorization tests
│   ├── core-pages/            # Core application pages
│   │   └── home.spec.ts       # Home page test suite
│   ├── entity-management/     # Entity CRUD operations
│   │   ├── customers/         # Customer management tests
│   │   │   └── customer-list.spec.ts
│   │   ├── organizations/     # Organization management tests
│   │   ├── products/          # Product management tests
│   │   ├── areas/            # Geographic area tests
│   │   ├── cities/           # City management tests
│   │   ├── districts/        # District management tests
│   │   └── states/           # State management tests
│   ├── call-management/       # Call tracking and management
│   │   ├── calls/            # Call-related tests
│   │   │   └── call-create.spec.ts
│   │   ├── call-types/       # Call type management
│   │   ├── call-statuses/    # Call status management
│   │   └── call-remarks/     # Call remarks functionality
│   ├── meeting-system/        # Meeting scheduling and management
│   │   ├── meetings/         # Meeting tests
│   │   │   └── meeting-schedule.spec.ts
│   │   ├── meeting-participants/ # Participant management
│   │   ├── reminders/        # Meeting reminders
│   │   └── time-slots/       # Available time slots
│   ├── user-management/       # User and role management
│   │   ├── profiles/         # User profile tests
│   │   ├── roles/           # Role management tests
│   │   ├── groups/          # Group management tests
│   │   └── invitations/     # User invitation tests
│   ├── business-partners/     # Business partner management
│   ├── drafts/               # Draft management system
│   └── system-data/          # System configuration data
│       ├── channels/         # Channel type tests
│       ├── priorities/       # Priority management tests
│       └── sources/          # Source management tests
├── templates/                 # Test templates for new features
│   └── entity-crud-template.spec.ts # CRUD test template
└── TEST_ORGANIZATION.md      # Detailed organization guide
```

## Running Tests

### Available Commands

- `npm run test:e2e` - Run all tests in headless mode
- `npm run test:e2e:headed` - Run tests with visible browser windows
- `npm run test:e2e:ui` - Run tests with Playwright UI mode (recommended for development)
- `npm run test:e2e:debug` - Run tests with debugging capabilities
- `npm run test:e2e:report` - Show the HTML test report

### Test Execution Modes

#### Headless Mode (Default)
```bash
npm run test:e2e
```
- Fastest execution
- No browser windows visible
- Ideal for CI/CD pipelines

#### Headed Mode
```bash
npm run test:e2e:headed
```
- Browser windows are visible
- Useful for debugging
- Slower execution

#### UI Mode (Recommended for Development)
```bash
npm run test:e2e:ui
```
- Interactive test runner
- Step-by-step execution
- Built-in debugging tools
- Visual test execution

## Test Organization

### Test Categories

1. **Core Pages** (`specs/core-pages/`)
   - Home page functionality
   - Dashboard functionality
   - Organization setup flows

2. **Entity Management** (`specs/entity-management/`)
   - CRUD operations for all business entities
   - Data validation and relationships
   - Search, filter, and pagination

3. **Call Management** (`specs/call-management/`)
   - Call creation and tracking
   - Call status management
   - Call reporting and analytics

4. **Meeting System** (`specs/meeting-system/`)
   - Meeting scheduling and management
   - Participant coordination
   - Calendar integration

5. **User Management** (`specs/user-management/`)
   - User profiles and roles
   - Permission management
   - User invitations and onboarding

6. **Authentication Tests** (`specs/auth/`)
   - Login/logout flows
   - Permission validation
   - Session management

### Base Test Setup

All tests extend from `fixtures/test-base.ts` which provides:
- Common test configuration
- Shared fixtures
- Authentication helpers (when implemented)

### Test Utilities

The `utils/test-helpers.ts` file provides:
- `TestHelpers` class with common operations
- `Selectors` constants for consistent element selection
- Utility functions for common test scenarios

## Writing Tests

### Using Templates

For new features, use the provided templates to ensure consistency:

1. **Entity CRUD Tests**: Use `templates/entity-crud-template.spec.ts`
   - Copy template and replace `{Entity}`, `{entity}`, `{entities}` placeholders
   - Customize field validations and test data
   - Follow the established patterns

2. **Feature-Specific Tests**: Follow examples in respective directories
   - `specs/call-management/calls/call-create.spec.ts` for form creation patterns
   - `specs/meeting-system/meetings/meeting-schedule.spec.ts` for complex workflows
   - `specs/entity-management/customers/customer-list.spec.ts` for list/table patterns

### Running Specific Test Categories

```bash
# Run all entity management tests
npx playwright test tests/specs/entity-management

# Run specific entity tests
npx playwright test tests/specs/entity-management/customers

# Run call management tests
npx playwright test tests/specs/call-management

# Run specific feature tests with pattern matching
npx playwright test --grep "customer"
```

### Basic Test Structure

```typescript
import { test, expect } from '../../fixtures/test-base';
import { TestHelpers, Selectors } from '../../utils/test-helpers';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/your-page');
  });

  test('should do something', async ({ page }) => {
    const helpers = new TestHelpers(page);
    await helpers.waitForPageLoad();
    
    // Your test logic here
    await expect(page.locator('selector')).toBeVisible();
  });
});
```

### Best Practices

1. **Use Descriptive Test Names**
   ```typescript
   test('should display error message when login fails with invalid credentials')
   ```

2. **Wait for Page Load**
   ```typescript
   const helpers = new TestHelpers(page);
   await helpers.waitForPageLoad();
   ```

3. **Use Web-First Assertions**
   ```typescript
   await expect(page.locator('button')).toBeVisible();
   await expect(page).toHaveTitle(/Expected Title/);
   ```

4. **Organize with describe blocks**
   ```typescript
   test.describe('Authentication', () => {
     test.describe('Login Flow', () => {
       // Login specific tests
     });
   });
   ```

## Browser Configuration

The tests are configured to run on:
- **Desktop Browsers**: Chrome, Firefox, Safari, Edge
- **Mobile Devices**: Mobile Chrome, Mobile Safari
- **Cross-platform**: Windows, macOS, Linux compatibility

## CI/CD Integration

The configuration includes:
- Retry logic for flaky tests
- Parallel execution control
- Trace collection on failures
- HTML reporting for test results

## Debugging

### Local Debugging
1. Use `npm run test:e2e:debug` for step-by-step debugging
2. Use `npm run test:e2e:ui` for visual test execution
3. Add `await page.pause()` in your test for breakpoints

### CI Debugging
1. Check the HTML report with `npm run test:e2e:report`
2. Review traces in the test results
3. Examine screenshots from failed tests

## Organization Benefits

The new feature-based structure provides:

### 🔍 **Easy Navigation**
- Tests mirror your application structure
- Logical grouping by business domain
- Clear naming conventions

### 🔧 **Maintainability**
- Related tests grouped together
- Shared utilities and templates
- Consistent patterns across features

### 🚀 **Scalability**
- Easy to add new feature tests using templates
- Parallel execution optimization by feature area
- Clear ownership boundaries for team development

### 🎯 **Development Workflow**
- Feature developers focus on relevant test directories
- Easy identification of test coverage gaps
- Targeted test execution during development

## Migration Guide

See `TEST_ORGANIZATION.md` for detailed migration strategy and comprehensive examples.

## Future Enhancements

- Authentication fixtures for protected routes
- API mocking utilities for integration tests
- Visual regression testing for UI components
- Performance testing integration
- Custom reporters for different environments
- End-to-end workflow tests across multiple features