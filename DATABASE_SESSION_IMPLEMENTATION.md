# NextAuth v5 Database Session Strategy Implementation

This document provides comprehensive guidance for the implementation of database-backed sessions using NextAuth v5, Prisma, and PostgreSQL.

## 🎯 Overview

We have successfully migrated from JWT-based sessions to database-backed sessions for improved security and scalability. This implementation provides:

- **Enhanced Security**: Tokens stored securely in database, not in browser sessions
- **Better Scalability**: Session management independent of cookie size limits
- **Multi-tenant Support**: Automatic tenant context in API requests
- **Session Management**: Advanced session lifecycle management and cleanup

## 📋 Prerequisites

- PostgreSQL database running (you provided: localhost:5432/crmBackend)
- Node.js 18+
- Next.js 15.3.2
- NextAuth v5
- Prisma ORM

## 🚀 Quick Start

### 1. Run Database Setup

```bash
# Option 1: Windows
scripts\setup-database.bat

# Option 2: Manual commands
npm run db:generate
npm run db:migrate
```

### 2. Validate Setup

```bash
npm run auth:validate
```

### 3. Start Application

```bash
npm run dev
```

## 📊 Database Schema

The implementation creates these tables:

### Core NextAuth Tables
- `users` - User profiles and metadata
- `accounts` - OAuth provider connections (Keycloak)
- `sessions` - Active user sessions (replaces JWT)
- `verificationtokens` - Email verification tokens

### Extended Tables
- `user_roles` - User role assignments
- `user_organizations` - User organization memberships

### Key Features
- **Optimized Indexes**: Performance-optimized for session lookups
- **Cascade Deletes**: Automatic cleanup of related data
- **Audit Fields**: Creation and update timestamps
- **Security Fields**: IP address and user agent tracking

## 🔧 API Integration

### Authentication Flow

1. **User Signs In**: Session stored in database, secure cookie created
2. **API Requests**: Frontend fetches access token from `/api/auth/token`
3. **Backend Calls**: Access token included in Authorization header
4. **Multi-tenant Context**: Organization ID automatically added as headers

### Token Management

```typescript
import { tokenService } from '@/lib/token-service';

// Get access token for API calls
const token = await tokenService.getAccessToken();

// Make authenticated API request
const response = await tokenService.authenticatedFetch('/api/data');

// Check user permissions
const hasAdminRole = await tokenService.hasRole('admin');
```

### Spring Service Integration

The `BaseService` class automatically:
- Fetches access tokens from database sessions
- Adds tenant context headers (`X-Tenant-ID`, `X-Organization-ID`)
- Handles token refresh and authentication errors
- Provides graceful fallback for expired sessions

```typescript
// Example API call - authentication handled automatically
const data = await springService.get<UserData>('/users');
```

## 🔐 Security Features

### Session Security
- **Database Storage**: Sessions stored securely in PostgreSQL
- **Automatic Expiration**: Sessions expire after 8 hours (configurable)
- **Cleanup Jobs**: Expired sessions automatically removed
- **Token Refresh**: Access tokens refreshed automatically

### Multi-tenant Security
- **Tenant Isolation**: Each request includes tenant context
- **Organization Validation**: User's organization automatically verified
- **Role-based Access**: Granular permission checking

### Production Security
- **Secure Cookies**: HTTPOnly, SameSite=Lax, Secure in production
- **Connection Pooling**: Optimized database connections
- **Error Handling**: Graceful degradation for auth failures

## 📈 Session Management

### Automatic Cleanup

```bash
# Run session cleanup manually
npm run auth:cleanup

# Schedule via cron (production)
0 2 * * * cd /path/to/app && npm run auth:cleanup
```

### Session Statistics

```bash
# View session statistics
curl http://localhost:3000/api/auth/cleanup
```

### Monitoring

```typescript
import { sessionUtils } from '@/lib/prisma';

// Get session statistics
const stats = await sessionUtils.getSessionStats();
console.log(`Active sessions: ${stats.active}`);

// Clean expired sessions
const cleaned = await sessionUtils.cleanExpiredSessions();
console.log(`Cleaned ${cleaned} expired sessions`);
```

## 🛠️ Development Tools

### Database Management

```bash
# Generate Prisma client
npm run db:generate

# Apply database migrations
npm run db:migrate

# Push schema changes (development)
npm run db:push

# Open Prisma Studio
npm run db:studio

# Reset database
npm run db:reset
```

### Validation and Testing

```bash
# Validate entire setup
npm run auth:validate

# Test database connection
npm run db:validate

# Clean up test data
npm run auth:cleanup
```

## 🔧 Configuration

### Environment Variables

```env
# Database
DATABASE_URL="postgresql://crmBackend:@localhost:5432/crmBackend"

# NextAuth
AUTH_SECRET="your-super-secure-secret-key"
AUTH_URL="http://localhost:3000"

# Keycloak
AUTH_KEYCLOAK_ID="web_app"
AUTH_KEYCLOAK_SECRET="web_app"
AUTH_KEYCLOAK_ISSUER="http://localhost:9080/realms/crm"

# Spring API
NEXT_PUBLIC_SPRING_API_URL="http://localhost:8080/api"
```

### Session Configuration

```typescript
// auth.ts
session: {
  strategy: "database", // Key change from "jwt"
  maxAge: 8 * 60 * 60, // 8 hours
  updateAge: 60 * 60, // Update every hour
}
```

## 🚀 Deployment

### Production Checklist

- [ ] Database connection string configured
- [ ] AUTH_SECRET set to secure random value
- [ ] Environment variables properly secured
- [ ] Session cleanup job scheduled
- [ ] Database indexes created
- [ ] Connection pooling configured
- [ ] Monitoring and logging setup

### Performance Optimization

```typescript
// Connection pooling for production
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: `${process.env.DATABASE_URL}?connection_limit=20&pool_timeout=20`
    }
  }
})
```

### Monitoring

```sql
-- Monitor session performance
SELECT 
  COUNT(*) as total_sessions,
  COUNT(CASE WHEN expires > NOW() THEN 1 END) as active_sessions,
  AVG(EXTRACT(EPOCH FROM (expires - created_at))/3600) as avg_duration_hours
FROM sessions;
```

## 🧪 Testing

### Unit Testing

```typescript
import { sessionUtils } from '@/lib/prisma';

describe('Session Management', () => {
  test('creates session correctly', async () => {
    const session = await sessionUtils.createSession(userId, expires);
    expect(session.sessionToken).toBeDefined();
  });
});
```

### Integration Testing

```bash
# Run validation script
npm run auth:validate

# Test authentication flow
curl -X GET http://localhost:3000/api/auth/session \
  -H "Cookie: next-auth.session-token=your-session-token"
```

## 📊 Migration from JWT

### Key Changes

1. **Session Storage**: Moved from browser cookies to database
2. **Token Access**: Access tokens retrieved via API endpoint
3. **Security**: Enhanced with database-level session management
4. **Performance**: Improved with optimized database queries

### Benefits

- **Reduced Cookie Size**: No large JWT tokens in cookies
- **Enhanced Security**: Tokens not exposed to client-side
- **Better Scalability**: Database-managed session lifecycle
- **Audit Trail**: Complete session activity tracking

## 🆘 Troubleshooting

### Common Issues

1. **Database Connection Errors**
   ```bash
   # Check database connectivity
   npm run db:validate
   ```

2. **Session Not Created**
   ```sql
   -- Check sessions table
   SELECT * FROM sessions ORDER BY created_at DESC LIMIT 5;
   ```

3. **API Authentication Failures**
   ```bash
   # Check token endpoint
   curl http://localhost:3000/api/auth/token
   ```

### Debug Mode

```env
# Enable debug logging
AUTH_DEBUG=true
```

### Recovery Procedures

```bash
# Reset authentication system
npm run db:reset
npm run db:migrate

# Clear all sessions
npm run auth:cleanup
```

## 📚 Additional Resources

- [NextAuth.js Database Sessions](https://next-auth.js.org/configuration/sessions#database-session)
- [Prisma Client Reference](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
- [PostgreSQL Performance Tuning](https://wiki.postgresql.org/wiki/Performance_Optimization)

## 📞 Support

For issues or questions:

1. Check the troubleshooting section above
2. Run validation script: `npm run auth:validate`
3. Review database logs and session statistics
4. Verify environment configuration

---

**Last Updated**: Implementation completed with full database session strategy, multi-tenant support, and production-ready security features.
