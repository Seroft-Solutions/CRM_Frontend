# Authentication System Documentation

## Overview

The authentication system has been reorganized into a centralized,
well-structured module located at `/src/core/auth/`. This provides a single
source of truth for all authentication-related functionality.

## Directory Structure

```
/src/core/auth/
├── config/           # Authentication configuration
│   └── nextauth.ts   # NextAuth configuration with Keycloak
├── types/            # TypeScript type definitions
│   └── index.ts      # All auth-related types and interfaces
├── utils/            # Utility functions
│   └── index.ts      # Auth utilities (token parsing, logout, etc.)
├── tokens/           # Token management
│   ├── storage.ts    # Token storage utilities
│   ├── cache.ts      # In-memory token caching
│   ├── refresh.ts    # Token refresh logic
│   └── index.ts      # Token exports
├── session/          # Session management
│   ├── roles-manager.ts  # Role management system
│   ├── events.ts     # Session event system
│   └── index.ts      # Session exports
├── hooks/            # React hooks
│   ├── use-activity-tracker.ts  # User activity tracking
│   ├── use-session-monitor.ts   # Session monitoring
│   └── index.ts      # Hooks exports
├── components/       # Auth components
│   ├── permission-guard.tsx      # Permission-based access control
│   ├── unauthorized-page.tsx     # Unauthorized access page
│   ├── session-expired-modal.tsx # Session expiry notifications
│   └── index.ts      # Component exports
├── providers/        # React providers
│   ├── session-provider.tsx    # Basic session provider
│   ├── session-manager.tsx     # Advanced session management
│   └── index.ts      # Provider exports
└── index.ts          # Main auth module exports
```

## Key Features

### 1. Centralized Configuration

- **Location**: `/src/core/auth/config/nextauth.ts`
- **Purpose**: Single NextAuth configuration with Keycloak integration
- **Features**:
  - Automatic token refresh
  - Role and group parsing
  - Route protection
  - Keycloak logout handling

### 2. Type Safety

- **Location**: `/src/core/auth/types/index.ts`
- **Purpose**: Comprehensive TypeScript types for all auth functionality
- **Includes**:
  - Session interfaces
  - Token payload structures
  - Component prop types
  - Hook option types

### 3. Token Management

- **Storage**: Local/session storage utilities
- **Caching**: In-memory token caching with automatic refresh
- **Refresh**: Keycloak token refresh implementation
- **Utilities**: Token validation, expiry checking

### 4. Session Management

- **Roles Manager**: In-memory role storage and permission checking
- **Event System**: Global session event handling
- **Monitoring**: Automatic session validation and renewal

### 5. React Hooks

- **Activity Tracker**: Monitor user activity for idle detection
- **Session Monitor**: Comprehensive session state monitoring
- **Permission Hooks**: Easy permission checking in components

### 6. UI Components

- **Permission Guard**: Declarative permission-based rendering
- **Unauthorized Page**: Consistent unauthorized access handling
- **Session Modals**: User-friendly session expiry notifications

### 7. Advanced Providers

- **Session Provider**: Basic NextAuth session provider wrapper
- **Session Manager**: Advanced session management with automatic recovery

## Usage Examples

### Basic Authentication Check

```typescript
import { useAuth } from '@/core/auth';

function MyComponent() {
  const { session, isLoading } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  if (!session) return <div>Please login</div>;

  return <div>Welcome, {session.user.name}!</div>;
}
```

### Permission-Based Access Control

```typescript
import { PermissionGuard } from '@/core/auth';

function AdminPanel() {
  return (
    <PermissionGuard requiredPermission="admin:read">
      <AdminContent />
    </PermissionGuard>
  );
}
```

### Session Monitoring

```typescript
import { useSessionMonitor } from '@/core/auth';

function App() {
  const { isAuthenticated, isIdle } = useSessionMonitor({
    warningThreshold: 5, // Warn 5 minutes before expiry
    onSessionExpired: () => console.log('Session expired!'),
    onSessionWarning: (minutes) => console.log(`${minutes} minutes left!`),
  });

  return <div>Status: {isAuthenticated ? 'Logged in' : 'Logged out'}</div>;
}
```

### Role Management

```typescript
import { rolesManager } from '@/core/auth';

// Check if user has permission
const hasAccess = rolesManager.hasRole(userId, 'user:create');

// Check multiple roles
const isAdmin = rolesManager.hasAnyRole(userId, ['admin', 'super-admin']);
```

### Token Operations

```typescript
import { tokenStorage, isTokenExpired } from '@/core/auth';

// Save token
tokenStorage.saveToken(accessToken);

// Check expiry
if (isTokenExpired(token)) {
  // Handle expired token
}
```

## Migration Guide

### Old Import Patterns

```typescript
// OLD - Scattered imports
import { useSession } from 'next-auth/react';
import { rolesManager } from '@/components/auth/roles-manager';
import { useSessionMonitor } from '@/hooks/use-session-monitor';
import { tokenStorage } from '@/lib/token-storage';
```

### New Import Patterns

```typescript
// NEW - Centralized imports
import {
  useAuth,
  rolesManager,
  useSessionMonitor,
  tokenStorage,
} from '@/core/auth';
```

### Component Updates

```typescript
// OLD
import { PermissionGuard } from '@/components/auth/permission-guard';

// NEW
import { PermissionGuard } from '@/core/auth';
```

## Environment Variables

Required environment variables for the authentication system:

```env
AUTH_KEYCLOAK_ID=your_keycloak_client_id
AUTH_KEYCLOAK_SECRET=your_keycloak_client_secret
AUTH_KEYCLOAK_ISSUER=https://your-keycloak-server/realms/your-realm
AUTH_URL=http://localhost:3000
```

## Best Practices

1. **Always use the centralized auth module**: Import from `@/core/auth` instead
   of individual files
2. **Use TypeScript types**: Leverage the provided types for better development
   experience
3. **Handle loading states**: Always check `isLoading` before rendering
   auth-dependent content
4. **Use Permission Guards**: Wrap components that require specific permissions
5. **Monitor sessions**: Implement session monitoring in your main app component
6. **Handle errors gracefully**: Use the session event system for error handling

## Security Considerations

1. **Token Storage**: Tokens are stored in memory and browser storage with
   appropriate security measures
2. **Automatic Refresh**: Tokens are automatically refreshed before expiry
3. **Session Monitoring**: Idle users are warned before session expiry
4. **Permission Checks**: All permission checks are performed on both client and
   server
5. **Logout Handling**: Proper cleanup on logout including Keycloak session
   termination

## Troubleshooting

### Common Issues

1. **Import Errors**: Ensure you're importing from `@/core/auth` and not old
   paths
2. **Type Errors**: Use the provided TypeScript types from the auth module
3. **Session Not Loading**: Check NextAuth configuration and environment
   variables
4. **Permission Denied**: Verify user roles and permission strings match exactly
5. **Token Refresh Failing**: Check Keycloak configuration and network
   connectivity

### Debug Mode

Enable debug logging by setting:

```typescript
// In your development environment
console.log('Auth Debug:', { session, isLoading, isAuthenticated });
```

## Contributing

When adding new authentication features:

1. Add types to `/src/core/auth/types/index.ts`
2. Implement functionality in the appropriate subdirectory
3. Export from the relevant index file
4. Update the main `/src/core/auth/index.ts` export
5. Update this documentation

## Migration Status

✅ **Completed**:

- Centralized authentication configuration
- Type definitions
- Token management
- Session management
- React hooks
- UI components
- Provider setup

🔄 **Next Steps**:

- Update all import statements throughout the application
- Remove old authentication files
- Test all authentication flows
- Update any remaining scattered auth logic
