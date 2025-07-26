# Unified Keycloak Admin Client Integration

## Overview

This document outlines the new unified Keycloak admin client architecture that
consolidates all Keycloak operations into a single, type-safe, and maintainable
solution.

## Architecture Changes

### 🔄 **Unified Service Structure**

**Previous Architecture:**

- Manual admin client in `/lib/keycloak-admin-client.ts` (❌ Removed)
- Separate service configurations
- Duplicated authentication logic
- Inconsistent error handling

**New Architecture:**

- Single unified `KeycloakService` in `/core/api/services/keycloak-service/`
- Leverages generated endpoints from Orval
- Consistent authentication and error handling
- Type-safe operations throughout

### 📁 **File Structure**

```
src/core/api/services/keycloak-service/
├── index.ts              # Main KeycloakService class
├── config.ts             # Service configuration
├── service-mutator.ts    # Orval integration mutator
└── service.ts            # Exports and type definitions

src/core/api/generated/keycloak/
├── endpoints/            # Generated API endpoints
├── schemas/              # Generated TypeScript types
└── index.ts              # Generated exports

src/app/api/keycloak/     # Next.js API routes
├── users/[userId]/
│   ├── route.ts          # User details
│   ├── roles/route.ts    # User role management
│   └── groups/route.ts   # User group management
├── roles/route.ts        # Realm roles
├── groups/route.ts       # Groups
└── organizations/[orgId]/members/route.ts # Organization members
```

## Key Features

### 🔐 **Unified Authentication**

- Single admin token management
- Automatic token refresh with caching
- Consistent authentication across all operations
- Environment-based configuration

### 🛡️ **Type Safety**

- Generated TypeScript types for all operations
- Runtime type validation
- IDE autocomplete and error detection
- Consistent data structures

### 🔧 **Enhanced Error Handling**

- Consistent error format across all operations
- Proper HTTP status codes
- Contextual error messages
- Admin permission verification

### 🚀 **Performance Optimizations**

- Token caching to reduce authentication calls
- Parallel API calls where possible
- Optimized request/response handling

## Implementation Details

### **KeycloakService Class**

```typescript
export class KeycloakService extends BaseService {
  // Admin token management
  private async getAdminAccessToken(): Promise<string | null>;

  // Admin operations
  async adminGet<T>(endpoint: string, config?: any): Promise<T>;
  async adminPost<T>(endpoint: string, data?: any, config?: any): Promise<T>;
  async adminPut<T>(endpoint: string, data?: any, config?: any): Promise<T>;
  async adminDelete<T>(endpoint: string, config?: any): Promise<T>;

  // Permission verification
  async verifyAdminPermissions(): Promise<PermissionCheckResult>;

  // Utility methods
  async checkAdminConnectivity(): Promise<boolean>;
  getAdminPath(): string;
  getRealm(): string;
}
```

### **Service Mutator Integration**

The service mutator bridges Orval-generated endpoints with our unified admin
client:

```typescript
export const keycloakServiceMutator = async <T>(
  requestConfig: ServiceRequestConfig,
  options?: AxiosRequestConfig
): Promise<T> => {
  // Automatically routes all requests through the unified admin client
  // Handles authentication, error handling, and type safety
};
```

### **API Routes**

All API routes now use the unified service:

```typescript
// Example: User details route
import { keycloakService } from '@/core/api/services/keycloak-service';
import { getAdminRealmsRealmUsersUserId } from '@/core/api/generated/keycloak';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const permissionCheck = await keycloakService.verifyAdminPermissions();
  if (!permissionCheck.authorized) {
    return NextResponse.json({ error: permissionCheck.error }, { status: 401 });
  }

  const user = await getAdminRealmsRealmUsersUserId(realm, userId);
  return NextResponse.json(user);
}
```

## Configuration

### **Environment Variables**

```bash
# Keycloak Configuration
AUTH_KEYCLOAK_ID=web_app
AUTH_KEYCLOAK_SECRET=web_app
AUTH_KEYCLOAK_ISSUER=http://localhost:9080/realms/crm

# Admin Credentials
KEYCLOAK_ADMIN_USERNAME=admin
KEYCLOAK_ADMIN_PASSWORD=admin
```

### **Service Configuration**

```typescript
export const KEYCLOAK_SERVICE_CONFIG: BaseServiceConfig = {
  baseURL:
    process.env.AUTH_KEYCLOAK_ISSUER?.replace('/realms/crm', '') ||
    'http://localhost:9080',
  timeout: 30000,
  authType: 'bearer',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
};
```

## Migration Guide

### **For Existing Code**

1. **Replace imports:**

   ```typescript
   // Before
   import { keycloakAdminClient } from '@/lib/keycloak-admin-client';

   // After
   import { keycloakService } from '@/core/api/services/keycloak-service';
   ```

2. **Update method calls:**

   ```typescript
   // Before
   await keycloakAdminClient.getUser(userId);

   // After
   await keycloakService.adminGet(`/users/${userId}`);
   // Or use generated endpoints:
   await getAdminRealmsRealmUsersUserId(realm, userId);
   ```

3. **Use generated types:**

   ```typescript
   import type { UserRepresentation } from '@/core/api/generated/keycloak';

   const user: UserRepresentation = await getAdminRealmsRealmUsersUserId(
     realm,
     userId
   );
   ```

## Available Endpoints

### **User Management**

- `GET /api/keycloak/users/[userId]` - Get user details
- `PUT /api/keycloak/users/[userId]` - Update user
- `GET /api/keycloak/users/[userId]/roles` - Get user roles
- `POST /api/keycloak/users/[userId]/roles` - Assign/unassign roles
- `GET /api/keycloak/users/[userId]/groups` - Get user groups
- `POST /api/keycloak/users/[userId]/groups` - Assign/unassign groups

### **Organization Management**

- `GET /api/keycloak/organizations/[orgId]/members` - Get organization members
- `POST /api/keycloak/organizations/[orgId]/members` - Invite user to
  organization

### **Roles & Groups**

- `GET /api/keycloak/roles` - Get realm roles
- `GET /api/keycloak/groups` - Get groups

## Next Steps

### **Recommended Actions**

1. **Update Orval Configuration** (if needed):

   ```bash
   npm run orval:generate
   ```

2. **Test the Integration:**

   - Verify all API routes work correctly
   - Test user management operations
   - Validate role and group assignments

3. **Update Frontend Components:**
   - Ensure all user management components use the new API structure
   - Update type imports to use generated types
   - Test all user flows

### **Future Enhancements**

1. **Additional Endpoints:**

   - Client role management
   - Advanced user search
   - Bulk operations
   - Audit logging

2. **Performance Improvements:**

   - Request batching
   - Advanced caching strategies
   - Connection pooling

3. **Security Enhancements:**
   - Role-based access control
   - Rate limiting
   - Request validation

## Troubleshooting

### **Common Issues**

1. **Authentication Errors:**

   - Verify environment variables are set correctly
   - Check admin credentials
   - Ensure Keycloak is accessible

2. **Type Errors:**

   - Regenerate types with Orval
   - Check import paths
   - Verify TypeScript configuration

3. **Permission Errors:**
   - Verify user has required roles
   - Check realm configuration
   - Validate admin permissions

### **Debug Tips**

1. **Enable Debug Logging:**

   ```typescript
   console.log('Keycloak Service Debug:', {
     realm: keycloakService.getRealm(),
     baseUrl: keycloakService.config.baseURL,
     adminConnectivity: await keycloakService.checkAdminConnectivity(),
   });
   ```

2. **Check Token Validity:**
   ```bash
   # Call the health check endpoint
   curl -X GET http://localhost:3000/api/keycloak/roles
   ```

## Benefits of New Architecture

- ✅ **Single source of truth** for Keycloak operations
- ✅ **Type safety** throughout the application
- ✅ **Consistent error handling** and authentication
- ✅ **Maintainable code** with clear separation of concerns
- ✅ **Performance optimized** with caching and efficient requests
- ✅ **Future-proof** architecture supporting easy extensions
- ✅ **Developer friendly** with good TypeScript support and documentation

This unified approach provides a solid foundation for all Keycloak admin
operations while maintaining flexibility for future enhancements.
