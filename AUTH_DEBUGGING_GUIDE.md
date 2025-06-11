# Authentication Debugging Guide

This guide explains how to use the enhanced authentication logging to debug the PKCE and Keycloak authentication issues you're experiencing in production.

## 🚨 What Was Added

### 1. Enhanced Auth.ts Logging
- **Comprehensive logging** throughout the authentication flow
- **Token refresh monitoring** with detailed request/response logging
- **Organization and role parsing** with error handling
- **PKCE flow debugging** with explicit configuration
- **Performance monitoring** for all auth operations

### 2. Middleware Logging
- **Request tracking** for all authenticated/unauthenticated requests
- **Session state monitoring** 
- **Redirect logging** for debugging flow issues
- **Error detection** in URLs and auth flow

### 3. Enhanced Error Page
- **Detailed error information** display
- **Technical details** for debugging
- **Copy-to-clipboard** functionality for error reporting
- **Better error categorization** and user guidance

### 4. Auth Diagnostics Component
- **Real-time session monitoring**
- **Cookie and storage inspection**
- **Environment variable verification**
- **Complete diagnostic data export**

## 🔍 How to Use the Logging

### 1. Enable Debug Mode
Make sure your `.env` file has:
```bash
AUTH_DEBUG=true
```

### 2. Monitor Production Logs
Look for these log prefixes in your container logs:
- `[AUTH][INFO]` - Normal authentication flow information
- `[AUTH][WARN]` - Warnings that might indicate issues
- `[AUTH][ERROR]` - Critical errors requiring attention
- `[AUTH][DEBUG]` - Detailed debugging information (only when AUTH_DEBUG=true)
- `[MIDDLEWARE][INFO/WARN/ERROR/DEBUG]` - Middleware-level auth logging

### 3. Add Temporary Diagnostics Component
To gather detailed information about auth state, temporarily add the diagnostics component to a page:

```tsx
import AuthDiagnostics from '@/components/debug/AuthDiagnostics';

export default function SomePage() {
  return (
    <div>
      {/* Your existing content */}
      
      {/* Temporary - Remove in production */}
      {process.env.NODE_ENV !== 'production' && <AuthDiagnostics />}
    </div>
  );
}
```

## 🐛 Debugging Your Specific Issues

### Issue 1: `pkceCodeVerifier value could not be parsed`

**What to Look For:**
```
[AUTH][DEBUG] Token refresh request
[AUTH][ERROR] Token refresh failed
[AUTH][ERROR] NextAuth Error [InvalidCheck]
```

**Likely Causes:**
1. **Browser storage issues** - PKCE codes stored in browser storage are corrupted
2. **Network interruption** during auth flow
3. **Clock skew** between client and server
4. **Redirect URI mismatch** between development and production

**How to Debug:**
1. Check the diagnostics component for storage state
2. Look for middleware logs showing redirect patterns
3. Monitor token refresh timing in logs

### Issue 2: `Code not valid` from Keycloak

**What to Look For:**
```
[AUTH][ERROR] Token refresh failed: 400 invalid_grant
[AUTH][ERROR] [Details]: {"error": "invalid_grant", "error_description": "Code not valid"}
```

**Likely Causes:**
1. **Authorization code reuse** - Code used multiple times
2. **Expired authorization code** - Code used after expiration (typically 60 seconds)
3. **Redirect URI mismatch** - Production URI doesn't match Keycloak configuration
4. **Client configuration issues** - Client ID/secret mismatch

**How to Debug:**
1. Check authorization timing in logs:
   ```
   [AUTH][DEBUG] JWT callback triggered
   [AUTH][DEBUG] Token expiration check
   ```
2. Look for multiple callback attempts
3. Verify redirect URI in production matches Keycloak config

### Issue 3: 502 Bad Gateway Errors

**What to Look For:**
```
[MIDDLEWARE][ERROR] Middleware execution failed
[AUTH][ERROR] Token refresh failed: Network error
```

**Likely Causes:**
1. **Keycloak server unreachable** from production environment
2. **Network configuration issues**
3. **Load balancer/proxy issues**

## 🔧 Production Environment Checklist

### 1. Environment Variables
Verify these are correctly set in production:
```bash
AUTH_SECRET=<secure-random-string>
AUTH_URL=<your-production-url>  # Important: Must match exactly
AUTH_KEYCLOAK_ID=<client-id>
AUTH_KEYCLOAK_SECRET=<client-secret>
AUTH_KEYCLOAK_ISSUER=<keycloak-realm-url>
```

### 2. Keycloak Client Configuration
In your Keycloak admin console, verify:
- **Valid Redirect URIs** include: `https://your-domain.com/api/auth/callback/keycloak`
- **Web Origins** include: `https://your-domain.com`
- **Client Protocol** is set to `openid-connect`
- **Access Type** is `confidential`
- **Standard Flow Enabled** is ON
- **Direct Access Grants Enabled** is ON (for refresh tokens)

### 3. Network Connectivity
Ensure your production environment can reach:
- Keycloak server at `AUTH_KEYCLOAK_ISSUER`
- All Keycloak endpoints (token, userinfo, etc.)

## 📊 Monitoring Key Metrics

### 1. Authentication Success Rate
Monitor logs for:
```
[AUTH][INFO] JWT callback completed successfully
[AUTH][INFO] Session callback completed
```

### 2. Token Refresh Success Rate
Monitor logs for:
```
[AUTH][INFO] Token refresh completed successfully
[AUTH][ERROR] Token refresh failed
```

### 3. Error Patterns
Track frequency of:
- `InvalidCheck` errors
- `invalid_grant` errors  
- Network timeouts
- Redirect loops

## 🚀 Deployment Steps

1. **Deploy the enhanced auth.ts** with logging
2. **Enable AUTH_DEBUG=true** temporarily
3. **Monitor logs** during authentication flows
4. **Use diagnostics component** on a test page to gather detailed state
5. **Analyze patterns** in the logs to identify root cause
6. **Fix identified issues**
7. **Disable AUTH_DEBUG** once resolved
8. **Remove diagnostics component** from production

## 📝 Log Analysis Examples

### Successful Authentication Flow
```
[MIDDLEWARE][INFO] Unauthenticated request: /
[AUTH][INFO] JWT callback triggered: keycloak login
[AUTH][DEBUG] Processing user data from access token
[AUTH][INFO] Successfully parsed 2 organizations
[AUTH][INFO] Successfully parsed 5 unique roles
[AUTH][INFO] JWT callback completed in 45ms
[MIDDLEWARE][INFO] Authenticated request: /dashboard
```

### Failed Token Refresh
```
[AUTH][INFO] Starting token refresh process
[AUTH][DEBUG] Token refresh URL: https://keycloak.example.com/realms/crm/protocol/openid-connect/token
[AUTH][ERROR] Token refresh failed: 400 invalid_grant
[AUTH][ERROR] Token refresh response: {"error":"invalid_grant","error_description":"Code not valid"}
```

### PKCE Verification Error
```
[AUTH][ERROR] NextAuth Error [InvalidCheck]: pkceCodeVerifier value could not be parsed
[AUTH][DEBUG] Session callback triggered: token error present
[MIDDLEWARE][WARN] Auth error detected in URL: InvalidCheck
```

This enhanced logging will give you the detailed information needed to identify and resolve the authentication issues you're experiencing in production.

## 🔄 Next Steps

1. Deploy these changes to production
2. Monitor the logs during authentication flows
3. Use the diagnostics component to gather detailed state information
4. Analyze the patterns to identify the root cause
5. Apply specific fixes based on the findings

The logs will now provide enough detail to pinpoint exactly where and why the authentication is failing in your production environment.