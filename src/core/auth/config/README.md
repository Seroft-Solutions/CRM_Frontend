# Authentication Configuration

Clean, modular authentication implementation using NextAuth.js v5 and Keycloak.

## Architecture Overview

The authentication system is split into focused, single-responsibility modules:

```
config/
├── nextauth.ts              # Main NextAuth configuration (entry point)
├── types.ts                 # Type definitions and module augmentation
├── constants.ts             # Configuration constants
├── token-validation.ts      # Token validation utilities
├── token-refresh.ts         # Token refresh logic
├── refresh-tracker.ts       # Per-user refresh state management
├── keycloak-service.ts      # Keycloak API integration
├── callbacks.ts             # NextAuth callback handlers
├── events.ts                # NextAuth event handlers
├── protected-routes.ts      # Route protection configuration
├── providers.ts             # Provider configuration
├── logger.ts                # Logging configuration
└── index.ts                 # Module exports
```

## Module Descriptions

### Core Modules

#### `nextauth.ts` - Main Configuration
The entry point that assembles all components into the NextAuth configuration.

**Responsibilities:**
- Configure NextAuth with all modules
- Export `auth`, `signIn`, `signOut`, `handlers`

**Size:** ~50 lines (was 419 lines)

#### `types.ts` - Type Definitions
All TypeScript type definitions and module augmentations.

**Responsibilities:**
- Extend NextAuth Session and JWT types
- Define custom interfaces (RefreshResult, TokenValidation, etc.)

#### `constants.ts` - Configuration Constants
Centralized configuration values.

**Responsibilities:**
- Token refresh timings
- Session configuration
- Retry limits

**Key Constants:**
- `REFRESH_BUFFER_SECONDS = 60` - Proactive refresh timing
- `MIN_REFRESH_INTERVAL = 2000` - Prevents rapid refreshes
- `MAX_REFRESH_ATTEMPTS = 3` - Retry limit
- `MAX_TOKEN_AGE_SECONDS = 86400` - Token expiration limit

### Token Management

#### `token-validation.ts` - Validation Utilities
Pure functions to validate token state.

**Key Functions:**
- `isMarkedForSignout(token)` - Check if token should trigger logout
- `isTokenTooOld(token)` - Check if token is beyond refresh age
- `shouldRefreshToken(token)` - Determine if refresh is needed
- `validateToken(token)` - Comprehensive validation
- `getUserId(token)` - Extract user ID
- `getTimeUntilExpiry(token)` - Calculate remaining time
- `getTokenAge(token)` - Human-readable age

#### `token-refresh.ts` - Refresh Logic
Core token refresh implementation.

**Key Function:**
- `refreshAccessToken(token)` - Main refresh logic

**Flow:**
1. Early exit checks (marked for signout, too old, etc.)
2. Check for concurrent refresh (per-user)
3. Call Keycloak to refresh token
4. Handle errors with retry logic
5. Return updated or failed token

#### `refresh-tracker.ts` - State Management
Manages per-user refresh state to prevent concurrent operations.

**Class:** `RefreshTracker`

**Methods:**
- `isRefreshInProgress(userId)` - Check if user is refreshing
- `getRefreshPromise(userId)` - Get existing promise
- `setRefreshPromise(userId, promise)` - Store promise
- `clearRefresh(userId)` - Remove entry
- `getActiveRefreshCount()` - Get active count
- `clearAll()` - Clear all (for testing)

**Why:** Prevents User A's refresh from affecting User B (bug fix)

### Keycloak Integration

#### `keycloak-service.ts` - Keycloak API
Handles all communication with Keycloak server.

**Key Functions:**
- `refreshTokenWithKeycloak(refreshToken)` - Call Keycloak refresh endpoint
- `logoutFromKeycloak(idToken, redirectUri)` - Call Keycloak logout
- `isTokenExpiredError(error)` - Check if error is token expiration
- `isTemporaryError(error)` - Check if error is temporary/network

**Why:** Isolates Keycloak-specific logic for easier testing and maintenance

### Callbacks & Events

#### `callbacks.ts` - NextAuth Callbacks
All NextAuth callback implementations.

**Functions:**
- `jwtCallback({ token, account, trigger })` - JWT management
- `sessionCallback({ session, token })` - Session transformation
- `authorizedCallback({ auth, request })` - Route authorization

**Why:** Separates concerns and makes each callback independently testable

#### `events.ts` - Event Handlers
NextAuth lifecycle event handlers.

**Functions:**
- `signOutEvent(params)` - Handle signout, logout from Keycloak

### Route Protection

#### `protected-routes.ts` - Route Configuration
Defines which routes require authentication.

**Constants:**
- `PROTECTED_ROUTE_PREFIXES` - List of protected paths
- `ORGANIZATION_ROUTE_PREFIX` - Organization flow path
- `DEFAULT_LOGIN_REDIRECT` - Where to redirect after login
- `PUBLIC_ROUTES` - Public paths

**Functions:**
- `isProtectedRoute(pathname)` - Check if route is protected
- `isOrganizationRoute(pathname)` - Check if organization route
- `isPublicRoute(pathname)` - Check if public
- `shouldRedirectFromRoot(pathname, isAuth)` - Check if should redirect

**Why:** Centralizes route configuration, easy to modify

### Configuration

#### `providers.ts` - Provider Setup
Authentication provider configuration.

**Function:**
- `getKeycloakProvider()` - Returns configured Keycloak provider

**Why:** Makes it easy to add or swap providers

#### `logger.ts` - Logging
Custom logging for NextAuth.

**Export:**
- `authLogger` - Logger configuration object

## Usage Examples

### Basic Usage

```typescript
// Import main functions
import { auth, signIn, signOut } from '@/core/auth/config';

// Get session (server component)
const session = await auth();

// Sign in
await signIn('keycloak');

// Sign out
await signOut();
```

### Token Validation

```typescript
import { validateToken, isMarkedForSignout } from '@/core/auth/config';

// Validate token
const validation = validateToken(token);
if (!validation.isValid) {
  console.log('Invalid:', validation.reason);
}

// Check specific conditions
if (isMarkedForSignout(token)) {
  // Handle signout
}
```

### Protected Routes

```typescript
import { isProtectedRoute, PROTECTED_ROUTE_PREFIXES } from '@/core/auth/config';

// Check if route needs auth
if (isProtectedRoute('/dashboard/users')) {
  // Require authentication
}

// Add new protected route
// Just add to PROTECTED_ROUTE_PREFIXES array
```

### Refresh Tracking

```typescript
import { refreshTracker } from '@/core/auth/config';

// Get active refreshes count (monitoring)
const activeRefreshes = refreshTracker.getActiveRefreshCount();

// Clear specific user (admin tool)
refreshTracker.clearRefresh('user-123');
```

## Benefits of This Architecture

### 1. **Modularity**
- Each file has a single, clear responsibility
- Easy to understand what each module does
- Changes are isolated to specific modules

### 2. **Testability**
- Pure functions in validation utilities
- Services can be mocked easily
- Each module can be tested independently

### 3. **Maintainability**
- Main config file is now ~50 lines (was 419)
- Finding code is intuitive (by responsibility)
- Adding features is straightforward

### 4. **Readability**
- Clean imports show dependencies
- No 400+ line files to scroll through
- Well-named modules indicate purpose

### 5. **Reusability**
- Utilities can be used anywhere
- Services are standalone
- Constants prevent magic numbers

### 6. **Type Safety**
- All types in one place
- Proper TypeScript throughout
- Type exports are clean

## Migration Notes

### Breaking Changes
**None.** This is a pure refactor with the same external API.

### Import Changes
```typescript
// Before
import { auth, signIn, signOut } from '@/core/auth/config/nextauth';

// After (still works)
import { auth, signIn, signOut } from '@/core/auth/config/nextauth';

// Also works (via index.ts)
import { auth, signIn, signOut } from '@/core/auth/config';
```

### Adding Protected Routes

**Before:** Edit 20+ line if statement
```typescript
const isProtected = 
  nextUrl.pathname.startsWith('/dashboard') ||
  nextUrl.pathname.startsWith('/areas') ||
  // ... 20 more lines
```

**After:** Add to array
```typescript
// In protected-routes.ts
export const PROTECTED_ROUTE_PREFIXES = [
  '/dashboard',
  '/areas',
  '/new-route', // ← Add here
  // ...
];
```

## Testing

Each module can be tested independently:

```typescript
// Test token validation
describe('token-validation', () => {
  it('should detect tokens marked for signout', () => {
    const token = { shouldSignOut: true };
    expect(isMarkedForSignout(token)).toBe(true);
  });
});

// Test refresh tracker
describe('refresh-tracker', () => {
  it('should track per-user refreshes', () => {
    refreshTracker.setRefreshPromise('user-1', promise1);
    expect(refreshTracker.isRefreshInProgress('user-1')).toBe(true);
    expect(refreshTracker.isRefreshInProgress('user-2')).toBe(false);
  });
});

// Test Keycloak service (with mocks)
describe('keycloak-service', () => {
  it('should refresh tokens', async () => {
    // Mock fetch
    // Test refreshTokenWithKeycloak
  });
});
```

## Performance

No performance impact:
- Same functionality, different organization
- All functions are imported at compile time
- No runtime overhead

## Future Enhancements

Easy to add:

1. **Token Introspection**
   - Add function in `keycloak-service.ts`
   - Call from `token-validation.ts`

2. **Multiple Providers**
   - Add to `providers.ts`
   - No changes to other modules

3. **Custom Logging**
   - Update `logger.ts`
   - No changes to other modules

4. **Advanced Refresh Strategies**
   - Update `token-refresh.ts`
   - Other modules unaffected

## File Sizes

| File | Lines | Purpose |
|------|-------|---------|
| nextauth.ts | ~50 | Main config (was 419) |
| types.ts | ~50 | Type definitions |
| constants.ts | ~35 | Configuration |
| token-validation.ts | ~150 | Validation logic |
| token-refresh.ts | ~130 | Refresh logic |
| refresh-tracker.ts | ~70 | State management |
| keycloak-service.ts | ~140 | Keycloak API |
| callbacks.ts | ~180 | Callback handlers |
| events.ts | ~40 | Event handlers |
| protected-routes.ts | ~65 | Route config |
| providers.ts | ~20 | Provider setup |
| logger.ts | ~20 | Logging config |

**Total:** ~950 lines (vs 419 in one file)
**Benefit:** Better organization, readability, and maintainability

## Summary

This refactor transforms a single 419-line file into a clean, modular architecture with:
- ✅ Clear separation of concerns
- ✅ Easy to test and maintain
- ✅ Simple to extend
- ✅ Better documentation
- ✅ No breaking changes
- ✅ Same functionality

