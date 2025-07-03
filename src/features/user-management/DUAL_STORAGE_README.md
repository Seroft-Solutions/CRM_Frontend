# Dual Storage User Management System

A comprehensive user management system that synchronizes data between **Keycloak** (authentication) and **Spring Database** (application data) to provide seamless user experiences across your CRM application.

## 🏗️ **Architecture Overview**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Keycloak      │    │ Spring Database │
│   Components    │    │ (Auth/AuthZ)    │    │  (App Data)     │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ • User Lists    │◄──►│ • Users         │◄──►│ • User Profiles │
│ • Invitations   │    │ • Roles         │    │ • Extended Data │
│ • Role/Group    │    │ • Groups        │    │ • Channel Types │
│   Management    │    │ • Organizations │    │ • Business Data │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### **Data Flow**
1. **Authentication**: Keycloak handles login, roles, and permissions
2. **User Creation**: Both systems updated simultaneously with rollback on failure
3. **Profile Data**: Spring Database stores extended user information
4. **Synchronization**: Automatic sync with manual setup for initial population

---

## 🚀 **Quick Start**

### **1. Initial Setup**
After setting up a new organization, run the data synchronization:

```typescript
import { OrganizationDataSync } from '@/features/user-management/components';

<OrganizationDataSync
  organizationId={organizationId}
  organizationName={organizationName}
  onComplete={(success) => {
    if (success) {
      console.log('Setup completed successfully');
    }
  }}
  autoStart={true}
/>
```

### **2. Creating Users**
Use the dual storage creation component:

```typescript
import { DualUserCreation } from '@/features/user-management/components';

<DualUserCreation
  organizationId={organizationId}
  organizationName={organizationName}
  onUserCreated={(userId) => {
    console.log('User created:', userId);
  }}
/>
```

### **3. Managing Users**
Use the enhanced organization users component:

```typescript
import { OrganizationUsers } from '@/features/user-management/components';

<OrganizationUsers />
```

---

## 📁 **File Structure**

```
src/features/user-management/
├── components/
│   ├── DataSetup.tsx                 # Full setup interface
│   ├── OrganizationDataSync.tsx      # Simplified setup for wizards
│   ├── DualUserCreation.tsx          # Enhanced user creation
│   ├── DualStorageManagement.tsx     # Complete management interface
│   └── ... (existing components)
├── services/
│   ├── dual-storage.service.ts       # Core dual storage operations
│   ├── setup.service.ts              # Initial data population
│   └── user-management.service.ts    # Enhanced with dual storage
├── hooks/
│   └── index.ts                      # Enhanced hooks with dual storage
├── types/
│   └── index.ts                      # Extended types for dual storage
└── api/
    └── keycloak/
        ├── organizations/[orgId]/members/route.ts    # Enhanced API
        └── organizations/[orgId]/partners/route.ts   # Enhanced API
```

---

## 🔧 **Core Services**

### **DualStorageService**
Handles synchronization between Keycloak and Spring Database:

```typescript
import { dualStorageService } from '@/features/user-management/services/dual-storage.service';

// Create user in both systems
const result = await dualStorageService.createUser({
  email: 'user@example.com',
  firstName: 'John',
  lastName: 'Doe',
  organizationId: 'org-123',
  selectedGroups: [usersGroup],
  channelTypeId: 1
});

if (result.success) {
  console.log('User created in both systems');
} else {
  console.error('Creation failed:', result.errors);
}
```

### **SetupService**
Manages initial data population:

```typescript
import { setupService } from '@/features/user-management/services/setup.service';

// Check if setup is needed
const status = await setupService.isSetupRequired();

if (status.required) {
  // Run setup with progress tracking
  const result = await setupService.populateSpringFromKeycloak(
    organizationId,
    (progress) => {
      console.log(`${progress.phase}: ${progress.progress}%`);
    }
  );
}
```

---

## 🎣 **Enhanced Hooks**

### **Dual Storage Hooks**
```typescript
import {
  useDualUserCreation,
  useDualGroupCreation,
  useDualRoleCreation,
  useSystemSetup,
  useSyncStatus
} from '@/features/user-management/hooks';

// Create user with automatic dual storage
const { createUser, isCreating, error } = useDualUserCreation();

// Monitor sync status
const { syncStatus, isLoading } = useSyncStatus();

// Run system setup
const { runSetup, isRunning, progress } = useSystemSetup();
```

### **Enhanced Existing Hooks**
All existing hooks now support dual storage automatically:

```typescript
// These hooks now return Spring profile data too
const { users } = useOrganizationUsers(organizationId);
const { userDetails } = useUserDetails(organizationId, userId);

// Users now include Spring profile information:
// user.springProfile, user.phone, user.displayName, user.channelType
```

---

## 🔄 **API Integration**

### **Member Creation API** (`/api/keycloak/organizations/[orgId]/members`)
Enhanced to create users in both systems:

```json
POST /api/keycloak/organizations/123/members
{
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "selectedGroups": [{"id": "group-123", "name": "Users"}],
  "channelTypeId": 1
}

Response:
{
  "success": true,
  "message": "User created successfully",
  "userId": "user-456",
  "emailType": "password_reset",
  "springProfileCreated": true
}
```

### **Partner Creation API** (`/api/keycloak/organizations/[orgId]/partners`)
Enhanced with dual storage for business partners:

```json
POST /api/keycloak/organizations/123/partners
{
  "email": "partner@example.com",
  "firstName": "Jane",
  "lastName": "Smith",
  "phone": "+1234567890"
}

Response:
{
  "success": true,
  "message": "Partner invited successfully",
  "userId": "partner-789",
  "partnerGroup": "Business Partners",
  "springProfileCreated": true
}
```

---

## 📊 **Data Synchronization**

### **Setup Process**
1. **Roles**: Copy all Keycloak roles to Spring Database
2. **Groups**: Copy all Keycloak groups to Spring Database  
3. **Users**: Copy all organization users to Spring Database

### **Ongoing Sync**
- **User Creation**: Automatic dual creation with rollback
- **User Updates**: Manual sync or triggered updates
- **Role/Group Changes**: Reflected in both systems

### **Monitoring**
```typescript
const { syncStatus } = useSyncStatus();

console.log({
  usersSynced: syncStatus.usersSynced,
  groupsSynced: syncStatus.groupsSynced,
  rolesSynced: syncStatus.rolesSynced,
  details: {
    keycloakUsers: syncStatus.details.keycloakUsers,
    springUsers: syncStatus.details.springUsers
  }
});
```

---

## 🎨 **UI Components**

### **DataSetup Component**
Complete setup interface with progress tracking:

```typescript
<DataSetup
  organizationId={organizationId}
  organizationName={organizationName}
  onSetupComplete={() => {
    // Handle completion
  }}
/>
```

### **OrganizationDataSync Component**
Simplified setup for organization wizards:

```typescript
<OrganizationDataSync
  organizationId={organizationId}
  organizationName={organizationName}
  onComplete={(success) => {
    // Continue setup process
  }}
  autoStart={true}
/>
```

### **DualUserCreation Component**
Enhanced user creation with Spring profile fields:

```typescript
<DualUserCreation
  organizationId={organizationId}
  organizationName={organizationName}
  onUserCreated={(userId) => {
    // Handle user creation
  }}
  onCancel={() => {
    // Handle cancellation
  }}
/>
```

### **DualStorageManagement Component**
Complete management interface:

```typescript
<DualStorageManagement />
```

---

## 🚨 **Error Handling**

### **Rollback Strategy**
```typescript
// If Spring creation fails after Keycloak success:
const result = await dualStorageService.createUser(userData);

if (!result.success && result.rollbackRequired) {
  // Keycloak user was automatically deleted
  console.log('Creation rolled back due to Spring failure');
}
```

### **Partial Failures**
```typescript
const setupResult = await setupService.populateSpringFromKeycloak(orgId);

if (!setupResult.success && setupResult.summary.errors.length > 0) {
  console.log('Setup completed with errors:');
  setupResult.summary.errors.forEach(error => {
    console.error('- ', error);
  });
}
```

---

## 🔧 **Configuration**

### **Environment Variables**
Ensure these are set for proper dual storage operation:

```env
# Keycloak Configuration
AUTH_KEYCLOAK_ISSUER=https://your-keycloak.com/realms/crm
KEYCLOAK_ADMIN_USERNAME=admin
KEYCLOAK_ADMIN_PASSWORD=password

# Spring Database Configuration
SPRING_API_URL=http://localhost:8080
```

### **Permissions**
Required permissions for dual storage operations:

```typescript
// User management permissions
"manage:users"          // Core user management
"partner:create"        // Partner creation
"partner:read"          // Partner viewing
"system:setup"          // System setup (if implemented)
```

---

## 📈 **Best Practices**

### **1. Organization Setup**
- Always run data synchronization during organization creation
- Use `OrganizationDataSync` component in setup wizards
- Handle setup failures gracefully with retry options

### **2. User Creation**
- Use `DualUserCreation` component for manual user creation
- Use enhanced invitation APIs for automated user creation
- Always handle rollback scenarios in error cases

### **3. Data Management**
- Monitor sync status regularly with `useSyncStatus`
- Re-run setup if significant data discrepancies occur
- Use Spring Database as the source of truth for profile data

### **4. Error Handling**
- Implement proper error boundaries around dual storage components
- Provide clear user feedback for sync status and errors
- Log detailed error information for debugging

---

## 🔍 **Troubleshooting**

### **Common Issues**

**Q: User exists in Keycloak but not in Spring Database**
```typescript
// Solution: Re-run setup or manually create profile
const result = await setupService.populateSpringFromKeycloak(organizationId);
```

**Q: Sync status shows "Needs Sync"**
```typescript
// Solution: Check sync status details
const { syncStatus } = useSyncStatus();
console.log('Data counts:', syncStatus.details);

// If significant difference, re-run setup
if (syncStatus.details.keycloakUsers > syncStatus.details.springUsers + 5) {
  // Consider running setup
}
```

**Q: User creation fails**
```typescript
// Solution: Check error details and retry
const { createUser, error } = useDualUserCreation();

if (error) {
  console.error('Creation failed:', error.message);
  // Check if rollback occurred
  // Retry with corrected data
}
```

### **Debug Tools**

```typescript
// Check sync status
const syncStatus = await dualStorageService.checkSyncStatus();

// Check setup requirements  
const setupStatus = await setupService.isSetupRequired();

// Get user details from both systems
const userDetails = await dualStorageService.getUserDetails(userId);
```

---

## 🚀 **Migration Guide**

### **From Single Storage to Dual Storage**

1. **Update Imports**
```typescript
// Old
import { userManagementService } from './services/user-management.service';

// New - enhanced service with dual storage
import { userManagementService } from './services/user-management.service';
import { dualStorageService } from './services/dual-storage.service';
```

2. **Update Components**
```typescript
// Old
<InviteUsers />

// New - same component, enhanced functionality
<InviteUsers />

// Or use new dual storage component
<DualUserCreation />
```

3. **Run Initial Setup**
```typescript
// After migration, run setup to populate Spring Database
const result = await setupService.populateSpringFromKeycloak(organizationId);
```

---

## 📚 **Additional Resources**

- [Keycloak Admin API Documentation](https://www.keycloak.org/docs-api/latest/rest-api/)
- [Spring Boot Data JPA Reference](https://docs.spring.io/spring-data/jpa/docs/current/reference/html/)
- [React Query Documentation](https://tanstack.com/query/latest)

---

## 🤝 **Contributing**

When adding new dual storage functionality:

1. Update both `DualStorageService` and API routes
2. Add corresponding hooks in `hooks/index.ts`
3. Update TypeScript types in `types/index.ts`
4. Add UI components for user interaction
5. Update this documentation

---

## 📄 **License**

This dual storage system is part of the CRM application and follows the same licensing terms.
