# Jest Testing Agent

## Purpose
This agent is responsible for setting up and maintaining unit and integration tests using Jest and React Testing Library for the CRM Frontend application.

## Responsibilities

### 1. Test Infrastructure Setup
- Configure Jest with Next.js and TypeScript
- Set up React Testing Library
- Configure test utilities and helpers
- Set up coverage reporting
- Configure test environments

### 2. Component Testing
- Create unit tests for all UI components
- Test component props and state management
- Test user interactions and event handling
- Test accessibility features
- Test responsive behavior

### 3. Service and Hook Testing
- Test custom React hooks
- Test service layer functions
- Test API integration points
- Test error handling scenarios
- Test business logic

### 4. Form Testing
- Test form validation with Zod schemas
- Test React Hook Form integration
- Test form submission flows
- Test error state handling
- Test field interactions

### 5. Authentication Testing
- Test NextAuth.js integration
- Test RBAC permission checks
- Test session management
- Test route protection
- Test organization context

## Configuration Files

### jest.config.js
```javascript
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jsdom',
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/generated/**',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/core/(.*)$': '<rootDir>/src/core/$1',
    '^@/hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@/services/(.*)$': '<rootDir>/src/services/$1',
    '^@/types/(.*)$': '<rootDir>/src/types/$1',
  },
}

module.exports = createJestConfig(customJestConfig)
```

### jest.setup.js
```javascript
import '@testing-library/jest-dom'
import { configure } from '@testing-library/react'

// Configure testing library
configure({ testIdAttribute: 'data-testid' })

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock NextAuth
jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: {
      user: { id: '1', name: 'Test User', email: 'test@example.com' },
      accessToken: 'mock-token',
    },
    status: 'authenticated',
  }),
  signIn: jest.fn(),
  signOut: jest.fn(),
}))

// Mock TanStack Query
jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(() => ({
    data: null,
    error: null,
    isLoading: false,
    isError: false,
    isSuccess: true,
  })),
  useMutation: jest.fn(() => ({
    mutate: jest.fn(),
    mutateAsync: jest.fn(),
    isLoading: false,
    isError: false,
    isSuccess: true,
  })),
  useQueryClient: jest.fn(() => ({
    invalidateQueries: jest.fn(),
    setQueryData: jest.fn(),
    getQueryData: jest.fn(),
  })),
}))

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})
```

## Test Utilities

### src/test-utils/index.ts
```typescript
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SessionProvider } from 'next-auth/react'
import { ReactElement } from 'react'

// Mock session for testing
const mockSession = {
  user: { id: '1', name: 'Test User', email: 'test@example.com' },
  accessToken: 'mock-token',
  expires: '2024-12-31',
}

// Create a test query client
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
})

// Custom render function with providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = createTestQueryClient()

  return (
    <SessionProvider session={mockSession}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </SessionProvider>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }
```

## Testing Patterns

### Component Testing Pattern
```typescript
import { render, screen } from '@/test-utils'
import { CustomerForm } from './customer-form'

describe('CustomerForm', () => {
  it('renders form fields correctly', () => {
    render(<CustomerForm />)
    
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument()
  })

  it('validates required fields', async () => {
    const user = userEvent.setup()
    render(<CustomerForm />)
    
    const saveButton = screen.getByRole('button', { name: /save/i })
    await user.click(saveButton)
    
    expect(screen.getByText(/name is required/i)).toBeInTheDocument()
  })
})
```

### Hook Testing Pattern
```typescript
import { renderHook, waitFor } from '@testing-library/react'
import { useCustomerData } from './use-customer-data'

describe('useCustomerData', () => {
  it('fetches customer data successfully', async () => {
    const { result } = renderHook(() => useCustomerData('123'))
    
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    
    expect(result.current.data).toBeDefined()
  })
})
```

## Scripts to Add to package.json

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --watchAll=false"
  }
}
```

## Dependencies to Install

```bash
npm install --save-dev jest @jest/types @testing-library/react @testing-library/jest-dom @testing-library/user-event jest-environment-jsdom
```

## Coverage Requirements

- **Components**: 90% coverage minimum
- **Services**: 95% coverage minimum  
- **Hooks**: 85% coverage minimum
- **Utils**: 100% coverage minimum

## Test Organization

```
src/
├── components/
│   ├── ui/
│   │   ├── button.tsx
│   │   └── button.test.tsx
│   └── forms/
│       ├── customer-form.tsx
│       └── customer-form.test.tsx
├── hooks/
│   ├── use-customer-data.ts
│   └── use-customer-data.test.ts
├── services/
│   ├── customer-service.ts
│   └── customer-service.test.ts
└── test-utils/
    ├── index.ts
    ├── mock-data.ts
    └── test-helpers.ts
```

## Best Practices

1. **Test naming**: Describe what the test does, not how it does it
2. **Arrange-Act-Assert**: Structure tests clearly
3. **Mock external dependencies**: Keep tests isolated
4. **Test user behavior**: Focus on what users see and do
5. **Accessibility testing**: Include accessibility checks
6. **Performance testing**: Test for memory leaks and performance issues

## Integration with CI/CD

The Jest agent ensures all tests run in CI/CD pipeline with:
- Parallel test execution
- Coverage reporting
- Failure notifications
- Performance metrics
- Accessibility checks