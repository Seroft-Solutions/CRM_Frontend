# Clean Authentication Implementation - NextAuth v5 + Keycloak

This project uses a clean, modern authentication implementation with NextAuth v5 and Keycloak integration.

## 🚀 Key Features

- **NextAuth v5**: Latest version with improved performance and security
- **Keycloak Integration**: Full SSO integration with role and organization support
- **Token Refresh**: Automatic token refresh with proper error handling
- **Clean Architecture**: Simplified codebase with minimal complexity
- **Production Ready**: Proper error handling, logout flow, and security measures

## 📁 File Structure

```
src/
├── auth.ts                    # Main NextAuth configuration
├── auth.config.ts             # Edge-compatible auth config
├── middleware.ts              # Route protection middleware
├── lib/
│   └── auth-utils.ts          # Utility functions for logout
├── providers/
│   └── session-provider.tsx   # Simplified session provider
└── app/
    ├── api/auth/[...nextauth]/ # NextAuth API routes
    ├── login/                 # Login page
    └── auth/error/            # Error handling page
```

## 🔧 Environment Variables

```bash
# NextAuth v5 Configuration
AUTH_SECRET="your-secret-key"
AUTH_URL=http://localhost:3000

# Keycloak Configuration
AUTH_KEYCLOAK_ID=web_app
AUTH_KEYCLOAK_SECRET=web_app
AUTH_KEYCLOAK_ISSUER=http://localhost:9080/realms/crm

# Keycloak Admin (for API operations)
KEYCLOAK_ADMIN_USERNAME=admin
KEYCLOAK_ADMIN_PASSWORD=admin
```

## 🎯 Usage Examples

### Basic Authentication Check

```tsx
import { useSession } from 'next-auth/react';

export function MyComponent() {
  const { data: session, status } = useSession();
  
  if (status === 'loading') return <p>Loading...</p>;
  if (status === 'unauthenticated') return <p>Not authenticated</p>;
  
  return <p>Welcome {session?.user?.name}!</p>;
}
```

### Role-Based Access Control

```tsx
import { useAuth } from '@/providers/session-provider';

export function AdminPanel() {
  const { hasRole, hasAnyRole } = useAuth();
  
  if (!hasRole('admin')) {
    return <p>Access denied</p>;
  }
  
  return <div>Admin content</div>;
}
```

### Server-Side Authentication

```tsx
import { auth } from '@/auth';

export default async function ServerComponent() {
  const session = await auth();
  
  if (!session) {
    redirect('/login');
  }
  
  return <div>Protected server content</div>;
}
```

### API Route Protection

```tsx
import { auth } from '@/auth';

export async function GET() {
  const session = await auth();
  
  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  return Response.json({ data: 'protected data' });
}
```

### Logout

```tsx
import { logout } from '@/lib/auth-utils';

export function LogoutButton() {
  return (
    <button onClick={() => logout()}>
      Logout
    </button>
  );
}
```

## 🔄 Token Refresh

Token refresh is handled automatically:
- Access tokens are refreshed before expiration
- Refresh token errors redirect to login
- Proper error handling for expired sessions

## 🛡️ Security Features

- **Automatic CSRF Protection**: Built into NextAuth
- **Secure Cookies**: HTTPOnly, Secure, SameSite
- **Token Encryption**: JWT tokens are encrypted
- **Proper Logout**: Both NextAuth and Keycloak logout
- **Error Handling**: User-friendly error pages

## 🧪 Testing

1. Start your Keycloak server on port 9080
2. Configure your realm and client in Keycloak
3. Set the environment variables
4. Run `npm run dev`
5. Navigate to any protected route to test authentication

## 🔍 Troubleshooting

### Common Issues

1. **401 Unauthorized**: Check Keycloak client configuration
2. **CORS Errors**: Ensure Keycloak allows your domain
3. **Infinite Redirects**: Check middleware configuration
4. **Token Refresh Fails**: Verify Keycloak client secret

### Debug Mode

Enable debug mode in development:

```bash
AUTH_DEBUG=true
```

This will log authentication events to help troubleshoot issues.

## 🚀 Production Deployment

1. Use HTTPS for all environments
2. Set strong AUTH_SECRET (32+ characters)
3. Configure proper Keycloak realm settings
4. Set up monitoring for authentication errors
5. Test token refresh scenarios

## 📝 What Was Cleaned Up

### Removed Files
- `src/app/api/auth/logout/` - NextAuth handles logout
- `src/app/api/auth/session/` - NextAuth provides session endpoint
- `src/app/api/auth/token/` - Simplified token handling

### Simplified Files
- `auth.ts` - Clean NextAuth v5 configuration
- `session-provider.tsx` - Removed complex custom logic
- `middleware.ts` - Simplified route protection
- `login/page.tsx` - Clean login flow

### Improvements
- ✅ Proper NextAuth v5 patterns
- ✅ Automatic token refresh
- ✅ Clean error handling
- ✅ Simplified session management
- ✅ Production-ready architecture
