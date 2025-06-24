# User Management Feature

A comprehensive user management system for organization-based user
administration with role and group assignments.

## Overview

This feature provides a complete user management solution for organizations,
including:

- **Organization Users Management**: View and manage all users within an
  organization
- **User Invitations**: Invite new users via email with single and bulk
  invitation workflows
- **Role Assignment**: Assign and unassign realm roles to organization users
- **Group Assignment**: Assign and unassign groups to organization users
- **User Details**: Comprehensive user management interface with role/group
  management

## Architecture

### Components Structure

```
src/features/user-management/
├── components/
│   ├── OrganizationUsers.tsx      # Main users list and management
│   ├── InviteUsers.tsx            # User invitation workflows
│   ├── UserDetails.tsx            # Individual user management
│   ├── UserAvatar.tsx             # User avatar with fallback
│   ├── UserStatusBadge.tsx        # User status indicator
│   ├── RolesBadgesList.tsx        # Role badges with tooltips
│   ├── GroupsBadgesList.tsx       # Group badges with tooltips
│   └── UserCard.tsx               # Reusable user card component
├── hooks/
│   └── index.ts                   # Custom hooks for API integration
├── services/
│   └── user-management.service.ts # API service layer
├── types/
│   └── index.ts                   # TypeScript type definitions
└── index.ts                       # Feature exports
```

### Pages Structure

```
src/app/(protected)/user-management/
├── organization-users/
│   └── page.tsx                   # Organization users list page
├── invite-users/
│   └── page.tsx                   # User invitation page
└── users/
    └── [userId]/
        └── page.tsx               # Individual user details page
```

## Key Features

### 1. Organization Users Management

- List all users in the organization with pagination
- Search and filter users
- Bulk user selection and operations
- Quick user actions (manage, remove)
- Real-time status indicators

### 2. User Invitation System

- **Single User Invitation**: Invite individual users with form validation
- **Bulk Invitations**: Invite multiple users simultaneously
- **Email Integration**: Automatic welcome emails
- **Invitation Status Tracking**: Track sent/failed invitations

### 3. Role Assignment

- View user's assigned realm roles
- Assign new roles with search and filtering
- Remove roles with confirmation
- Role descriptions and tooltips
- Available roles filtering

### 4. Group Assignment

- View user's group memberships
- Assign users to groups
- Remove group memberships
- Hierarchical group path display
- Group attributes display

## API Integration

### Keycloak Integration

The feature integrates with Keycloak Admin REST API:

- **Organization APIs**: Manage organization membership
- **Role Mapping APIs**: Assign/unassign realm and client roles
- **Group Management APIs**: Manage group memberships
- **User Management APIs**: Core user operations

### Service Layer

```typescript
// Get organization users
const users = await userManagementService.getOrganizationUsers(orgId, filters);

// Invite user
await userManagementService.inviteUser(invitation);

// Assign roles
await userManagementService.assignRealmRoles(assignment);

// Assign groups
await userManagementService.assignGroups(assignment);
```

## Permission System

All components are protected by `PermissionGuard` with the `"manage-users"`
permission:

```typescript
<PermissionGuard requiredPermission="manage-users">
  <OrganizationUsers />
</PermissionGuard>
```

## Usage Examples

### Basic Organization Users List

```typescript
import { OrganizationUsers } from '@/features/user-management';

export default function UsersPage() {
  return <OrganizationUsers />;
}
```

### User Invitation Page

```typescript
import { InviteUsers } from '@/features/user-management';

export default function InvitePage() {
  return <InviteUsers />;
}
```

### User Details Management

```typescript
import { UserDetails } from '@/features/user-management';

export default function UserPage({ params }: { params: { userId: string } }) {
  return <UserDetails userId={params.userId} />;
}
```

### Using Utility Components

```typescript
import {
  UserCard,
  UserAvatar,
  RolesBadgesList,
  GroupsBadgesList
} from '@/features/user-management';

// User card with actions
<UserCard
  user={user}
  onManage={(user) => navigate(`/users/${user.id}`)}
  onRemove={(user) => handleRemove(user)}
/>

// Role badges with overflow
<RolesBadgesList roles={user.assignedRoles} maxVisible={3} />
```

## Hooks Usage

### Organization Users Hook

```typescript
import { useOrganizationUsers } from '@/features/user-management';

const { users, totalCount, isLoading, refetch } = useOrganizationUsers(
  organizationId,
  {
    search: 'john',
    page: 1,
    size: 20,
  }
);
```

### Role Assignment Hook

```typescript
import { useRoleAssignment } from '@/features/user-management';

const { assignRoles, isAssigning } = useRoleAssignment();

const handleAssignRoles = () => {
  assignRoles({
    userId,
    organizationId,
    roles: selectedRoles,
    action: 'assign',
  });
};
```

## State Management

- **React Query**: Server state management with caching and optimistic updates
- **React Hook Form**: Form state management with validation
- **Zustand** (optional): Global state for organization context

## Error Handling

- Service-level error handling with typed errors
- Toast notifications for user feedback
- Graceful fallbacks for failed API calls
- Form validation with clear error messages

## Performance Optimizations

- **Query Caching**: React Query for efficient data fetching
- **Lazy Loading**: Components load data on demand
- **Pagination**: Large user lists are paginated
- **Debounced Search**: Search input is debounced for performance
- **Optimistic Updates**: UI updates before API confirmation

## Styling

- **Tailwind CSS**: Utility-first styling
- **shadcn/ui**: Consistent component library
- **Responsive Design**: Mobile-friendly interfaces
- **Dark Mode Support**: Automatic theme adaptation

## Testing Considerations

### Unit Tests

- Component rendering with various props
- Hook behavior with mock data
- Service method functionality
- Form validation logic

### Integration Tests

- User invitation workflow
- Role assignment process
- Group management flow
- Error handling scenarios

### E2E Tests

- Complete user management workflows
- Navigation between pages
- Bulk operations
- Permission-based access control

This feature provides a complete, production-ready user management system that
can be easily integrated into any organization-based application.
