# Tenant Setup Implementation

## Overview

This implementation provides automatic tenant management for the CRM Frontend, handling tenant creation and setup based on organization information from the JWT token. The system ensures that each organization gets its own isolated tenant workspace without manual intervention.

## Architecture

### Components Structure

```
src/
├── hooks/
│   └── useTenantSetup.ts          # Core tenant setup logic and state management
├── components/
│   └── tenant-setup/
│       ├── TenantSetupWizard.tsx  # Main setup orchestrator component
│       ├── TenantSetupForm.tsx    # Setup configuration form
│       ├── TenantSetupProgress.tsx # Real-time progress tracking
│       └── index.ts               # Component exports
└── app/
    └── (protected)/
        └── layout.tsx             # Integration point with auth flow
```

### Data Flow

1. **Authentication**: User logs in via Keycloak → JWT contains organization info
2. **Tenant Check**: `useTenantSetup` hook extracts organization and checks tenant status
3. **Setup Decision**: If tenant doesn't exist or setup is incomplete → show setup wizard
4. **Setup Process**: User configures options → API initiates setup → real-time progress tracking
5. **Completion**: Setup completes → user proceeds to main dashboard

## Key Features

### 🏢 Organization Mapping
- **Tenant ID**: Organization ID from JWT (normalized to lowercase)
- **Tenant Name**: Organization name from JWT
- **Automatic Detection**: Extracts from NextAuth session organizations array

### 🇮🇳 India-Optimized Defaults
- **Timezone**: Asia/Kolkata (IST)
- **Currency**: Indian Rupee (INR) 
- **Language**: English
- **Geographic Data**: Indian states, districts, cities

### 📊 Real-time Progress Tracking
- **Setup Steps**: Validation → Schema Creation → Migrations → Bootstrap Data → Finalization
- **Progress Percentage**: Real-time updates via polling
- **Time Estimates**: Remaining time calculations
- **Error Handling**: Detailed error messages with retry options

### 🎯 Minimal User Input
- **Required**: Only organization name (auto-filled)
- **Optional**: Industry selection for customization
- **Sample Data**: Optional sample data for exploration
- **Smart Defaults**: Everything else pre-configured for India

## API Integration

### Endpoints Used
- `GET /api/tenant-setup/info` - Check tenant existence and status
- `POST /api/tenant-setup/initiate` - Start tenant setup process
- `GET /api/tenant-setup/progress` - Track setup progress (polled every 2s)

### Data Models
```typescript
TenantSetupRequestDTO {
  tenantName: string;        // From organization.name
  timezone: 'Asia/Kolkata'; // Fixed for India
  currency: 'INR';          // Fixed for India  
  language: 'en';           // Fixed for India
  industry?: string;        // User selected
  createSampleData: boolean; // User choice
}
```

## Integration Points

### Protected Layout Integration
The tenant setup is integrated into `/src/app/(protected)/layout.tsx`:

```typescript
// Check if tenant setup is required
if (tenantSetup.state.isSetupRequired && !tenantSetup.state.isSetupCompleted) {
  return <TenantSetupWizard tenantSetup={tenantSetup} />;
}
```

### NextAuth Session Structure
Expects organizations in session:
```typescript
session.user.organizations: Array<{
  id: string;    // Used as tenant ID
  name: string;  // Used as tenant name  
}>
```

## Usage Examples

### Basic Setup Flow
1. User logs in with Keycloak
2. JWT contains: `organizations: [{ id: "org-123", name: "ABC Corp" }]`
3. System checks if tenant "org-123" exists
4. If not, shows setup wizard for "ABC Corp"
5. User selects industry (optional) and sample data preference
6. Setup runs automatically with Indian defaults
7. User proceeds to dashboard

### Hook Usage
```typescript
import { useTenantSetup } from '@/hooks/useTenantSetup';

function MyComponent() {
  const tenantSetup = useTenantSetup();
  
  if (tenantSetup.state.isSetupRequired) {
    return <TenantSetupWizard tenantSetup={tenantSetup} />;
  }
  
  return <Dashboard />;
}
```

## Error Handling

### Robust Error Recovery
- **Connection Errors**: Automatic retry with exponential backoff
- **Setup Failures**: Clear error messages with retry options
- **Timeout Handling**: Graceful timeout with manual retry
- **State Recovery**: Maintains state across component remounts

### Error States
- **Tenant Check Failed**: Shows error with refresh option
- **Setup Initiation Failed**: Shows error with retry button  
- **Setup Progress Failed**: Shows error with restart option
- **Network Issues**: Shows connectivity error with retry

## Performance Considerations

### Optimized Polling
- **Progress Polling**: Only active during setup (2-second intervals)
- **Conditional Queries**: API calls only when needed
- **State Caching**: Minimal re-renders with proper state management

### Memory Management
- **Cleanup**: Stops polling when setup completes
- **Resource Management**: Proper cleanup of timers and subscriptions
- **State Optimization**: Minimal state updates for performance

## Security Features

### Data Protection
- **JWT Validation**: Relies on NextAuth JWT validation
- **Organization Scoping**: Only processes user's organizations
- **Input Validation**: Validates all user inputs before API calls
- **Error Sanitization**: Sanitizes error messages for security

## Customization Options

### Industry-Specific Setup
- **Industry Selection**: 15 predefined industries relevant to India
- **Custom Workflows**: Industry affects default call types and categories
- **Regional Settings**: All optimized for Indian business practices

### Sample Data Control
- **Optional Sample Data**: User can choose to include sample customers/calls
- **Production Ready**: Defaults to no sample data for production use
- **Easy Cleanup**: Sample data clearly marked for easy removal

## Testing Considerations

### Component Testing
```typescript
// Test tenant setup hook
const { result } = renderHook(() => useTenantSetup(), {
  wrapper: ({ children }) => (
    <SessionProvider session={mockSession}>
      <QueryClient>{children}</QueryClient>
    </SessionProvider>
  )
});
```

### Integration Testing
- **Mock JWT**: Test with various organization structures
- **API Mocking**: Mock setup endpoints for testing
- **Error Scenarios**: Test error handling and recovery
- **Progress Simulation**: Test progress tracking UI

## Troubleshooting

### Common Issues

1. **No Organizations in JWT**
   - Check Keycloak organization mapper configuration
   - Verify JWT token contains organizations claim

2. **Setup Stuck in Progress**
   - Check backend logs for setup process issues
   - Use manual retry from UI
   - Verify database connectivity

3. **API Connection Issues** 
   - Check network connectivity
   - Verify API endpoints are accessible
   - Check authentication tokens

### Debug Information
The hook provides detailed state for debugging:
```typescript
console.log('Tenant Setup State:', {
  organizationId: state.organizationId,
  isSetupRequired: state.isSetupRequired,
  setupProgress: state.setupProgress,
  error: state.error
});
```

## Future Enhancements

### Planned Features
- **Multi-organization Support**: Support users with multiple organizations
- **Setup Customization**: More granular setup options
- **Backup/Restore**: Tenant data backup during setup
- **Analytics**: Setup completion analytics and optimization

### Extensibility Points
- **Custom Industries**: Easy addition of new industry types
- **Regional Variants**: Support for other countries/regions  
- **Integration Hooks**: Webhook support for setup completion
- **Custom Validation**: Pluggable validation rules

## Production Deployment

### Environment Variables
No additional environment variables required - uses existing NextAuth configuration.

### Monitoring
- Monitor setup completion rates
- Track setup duration metrics
- Alert on high failure rates
- Log setup errors for analysis

### Scaling Considerations
- Setup process is backend-intensive
- Consider rate limiting for concurrent setups
- Monitor database performance during tenant creation
- Cache tenant info for better performance

This implementation provides a seamless, production-ready tenant setup experience optimized for Indian businesses while maintaining security, performance, and extensibility.
