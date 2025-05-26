# Environment Variables Setup for CORS Fix

Add these environment variables to your `.env.local` file:

```bash
# Existing Keycloak Configuration
AUTH_KEYCLOAK_ID=crm-frontend
AUTH_KEYCLOAK_SECRET=your-client-secret
AUTH_KEYCLOAK_ISSUER=http://localhost:9080/realms/master
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret

# New: Keycloak Admin Credentials (for API proxy)
KEYCLOAK_ADMIN_USERNAME=admin
KEYCLOAK_ADMIN_PASSWORD=admin

# Optional: Override default Keycloak base URL if different
# KEYCLOAK_BASE_URL=http://localhost:9080
```

## What This Fixes:

1. **CORS Issues**: Eliminates browser CORS errors by using server-side API routes
2. **Authentication**: Handles admin authentication automatically
3. **Security**: Keeps admin credentials server-side only
4. **Performance**: Reduces client-side complexity

## API Routes Created:

- `GET /api/keycloak/organizations/[organizationId]/members` - Get organization users
- `POST /api/keycloak/organizations/[organizationId]/members` - Invite user
- `GET /api/keycloak/users/[userId]` - Get user details
- `POST /api/keycloak/users/[userId]/roles` - Manage user roles
- `POST /api/keycloak/users/[userId]/groups` - Manage user groups
- `GET /api/keycloak/roles` - Get available roles
- `GET /api/keycloak/groups` - Get available groups

## Testing:

After adding the environment variables, restart your dev server:
```bash
npm run dev
```

The user management pages should now work without CORS errors.
