# Core Auth Module

This module provides authentication and authorization functionality for the application.

## Overview

The auth module serves as a single source of truth for all authentication-related functionality, including:

- User authentication (login, register, logout)
- Token management
- Authorization (role-based access control)
- User state management

## Dependencies

This module has the following dependencies:

- **core/api**: Used for API communication - auth module delegates all API calls to core/api

## Architecture

The module follows a feature-oriented architecture with clear separation of concerns:

- **services/auth.api.ts**: Single source of truth for all API endpoint configurations (delegates actual API calls to core/api)
- **services/token.service.ts**: Utility for token management
- **hooks/auth.hooks.ts**: React hooks that use the API configurations from auth.api.ts
- **context/AuthContext.tsx**: Context for auth state
- **providers/AuthProvider.tsx**: Provides auth context using hooks
- **rbac/**: Role-based access control implementation (see RBAC section below)

## Responsibility Separation

- **auth.api.ts** - Defines WHAT (API endpoints and configurations)
- **core/api** - Defines HOW (actual API communication)
- **auth.hooks.ts** - Defines WHEN (React hooks that use the API)
- **constants/routes.ts** - Single source of truth for all API routes
- **AuthProvider** - Provides the auth context to the application

## Usage

### Basic Setup

```tsx
import { AuthProvider, createTokenService } from '@/core/auth';

// Create a token service
const tokenService = createTokenService({
  tokenKey: 'my_app_token',
  refreshTokenKey: 'my_app_refresh_token',
});

// Wrap your application with the auth provider
function App() {
  return (
    <AuthProvider tokenService={tokenService} enableAutoLogin={true}>
      <YourApplication />
    </AuthProvider>
  );
}
```

### Using Auth Hooks

```tsx
import { useAuth, useUser, useIsAuthenticated, useLogin } from '@/core/auth';

function LoginForm() {
  const { login, isLoggingIn, loginError } = useLogin();

  const handleSubmit = async (email, password) => {
    try {
      await login(email, password);
      // User is now logged in
    } catch (error) {
      // Handle login error
    }
  };

  return (/* your login form */);
}
```

### Using RBAC

```tsx
import { useHasPermission, useHasRole } from '@/core/auth';

function AdminPanel() {
  const hasRole = useHasRole();
  const hasPermission = useHasPermission();

  // Check if user has admin role
  if (!hasRole('admin')) {
    return <AccessDenied />;
  }

  // Or check specific permissions
  const canManageUsers = hasPermission('users:manage');

  return (/* admin panel UI */);
}
```

## RBAC (Role-Based Access Control)

The RBAC module provides a comprehensive solution for permission-based access control:

- **Role-based checks**: Control access based on user roles
- **Permission-based checks**: Fine-grained control based on specific permissions
- **UI Guards**: Conditionally render UI elements based on permissions/roles
- **Route Guards**: Protect routes based on permissions/roles

See the [RBAC README](./rbac/README.md) for detailed documentation.

## Key Components

### auth.api.ts

Single source of truth for all API-related configurations:

- Query keys for caching
- API endpoint configurations
- Request builders

### auth.hooks.ts

React hooks that leverage the API configurations:

- Authentication hooks (login, register, logout)
- User information hooks (useUser, useIsAuthenticated)
- Authorization hooks (useHasRole, useHasPermission)

### TokenService

Manages authentication tokens:

- Storage and retrieval of auth and refresh tokens
- Token clearing on logout
- Supports different storage mechanisms (localStorage, sessionStorage)

### AuthProvider

Provider component that:

- Wraps the application with auth context
- Provides RBAC functionality
- Uses hooks from auth.hooks.ts
