/**
 * Organization Users Component
 * Main hub for managing users within an organization
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  useOrganizationUsers, 
  useRemoveUser, 
  useOrganizationContext,
  useBulkUserOperations 
} from '../hooks';
import { PermissionGuard } from '@/components/auth/permission-guard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Users, 
  Plus, 
  Search, 
  MoreHorizontal, 
  UserX, 
  Settings,
  Mail,
  Shield,
  UserCheck,
  Filter,
  AlertCircle,
  Building2
} from 'lucide-react';
import type { OrganizationUser, UserFilters } from '../types';
import { UserAvatar } from './UserAvatar';
import { UserStatusBadge } from './UserStatusBadge';
import { RolesBadgesList } from './RolesBadgesList';
import { GroupsBadgesList } from './GroupsBadgesList';
import { toast } from 'sonner';

interface OrganizationUsersProps {
  className?: string;
}

export function OrganizationUsers({ className }: OrganizationUsersProps) {
  const router = useRouter();
  const { 
    organizationId, 
    organizationName, 
    isLoading: isLoadingOrg,
    availableOrganizations,
    hasMultipleOrganizations,
    switchOrganization
  } = useOrganizationContext();
  
  const { removeUser, isRemoving } = useRemoveUser();
  const {
    selectedUsers,
    toggleUserSelection,
    selectAllUsers,
    clearSelection,
    hasSelectedUsers,
    selectedCount,
  } = useBulkUserOperations();

  // Local state
  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    page: 1,
    size: 20,
  });
  const [userToRemove, setUserToRemove] = useState<OrganizationUser | null>(null);

  // Fetch organization users - only when we have an organization ID
  const { users, totalCount, isLoading, error, refetch } = useOrganizationUsers(
    organizationId,
    filters
  );

  // Handle search
  const handleSearch = (searchTerm: string) => {
    setFilters(prev => ({
      ...prev,
      search: searchTerm,
      page: 1, // Reset to first page when searching
    }));
  };

  // Handle user selection
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      selectAllUsers(users.map(user => user.id!));
    } else {
      clearSelection();
    }
  };

  const handleUserSelect = (userId: string, checked: boolean) => {
    toggleUserSelection(userId);
  };

  // Navigate to user details
  const handleUserDetails = (userId: string) => {
    router.push(`/user-management/users/${userId}`);
  };

  // Handle user removal
  const handleRemoveUser = (user: OrganizationUser) => {
    setUserToRemove(user);
  };

  const confirmRemoveUser = () => {
    if (userToRemove && organizationId) {
      removeUser({
        organizationId,
        userId: userToRemove.id!,
      });
      setUserToRemove(null);
    }
  };

  // Navigate to invite users
  const handleInviteUsers = () => {
    router.push('/user-management/invite-users');
  };

  // Format date
  const formatDate = (timestamp?: number) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleDateString();
  };

  // Loading state for organization context
  if (isLoadingOrg) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              Loading organization...
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // No organization available
  if (!organizationId) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <AlertCircle className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-lg font-medium">No Organization Available</h3>
              <p className="text-muted-foreground">
                You don't appear to be associated with any organization, or organization data is not available in your session.
              </p>
            </div>
            {availableOrganizations.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Available organizations:</p>
                {availableOrganizations.map((org) => (
                  <Button
                    key={org.id}
                    variant="outline"
                    onClick={() => switchOrganization(org.id)}
                    className="mr-2"
                  >
                    <Building2 className="h-4 w-4 mr-2" />
                    {org.name}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>Failed to load organization users</p>
            <p className="text-sm text-muted-foreground mt-1">
              Organization ID: {organizationId}
            </p>
            <Button variant="outline" onClick={() => refetch()} className="mt-2">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <PermissionGuard requiredPermission="manage-users">
      <div className={`space-y-6 ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Organization Users</h1>
            <p className="text-muted-foreground">
              Manage users in {organizationName} ({totalCount} users)
            </p>
            {hasMultipleOrganizations && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-sm text-muted-foreground">Switch organization:</span>
                {availableOrganizations.map((org) => (
                  <Button
                    key={org.id}
                    variant={org.id === organizationId ? "default" : "outline"}
                    size="sm"
                    onClick={() => switchOrganization(org.id)}
                  >
                    {org.name}
                  </Button>
                ))}
              </div>
            )}
          </div>
          <Button onClick={handleInviteUsers} className="gap-2" disabled={!organizationId}>
            <Plus className="h-4 w-4" />
            Invite Users
          </Button>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Management
            </CardTitle>
            <CardDescription>
              View and manage all users in your organization
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search and Filters */}
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search users by name, email, or username..."
                  value={filters.search || ''}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Filters
              </Button>
            </div>

            {/* Bulk Actions */}
            {hasSelectedUsers && (
              <div className="flex items-center gap-4 p-3 bg-muted rounded-lg">
                <span className="text-sm font-medium">
                  {selectedCount} user{selectedCount > 1 ? 's' : ''} selected
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    Bulk Assign Roles
                  </Button>
                  <Button variant="outline" size="sm">
                    Bulk Assign Groups
                  </Button>
                  <Button variant="outline" size="sm" onClick={clearSelection}>
                    Clear Selection
                  </Button>
                </div>
              </div>
            )}

            {/* Users Table */}
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={users.length > 0 && selectedUsers.length === users.length}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead>Groups</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <div className="flex items-center justify-center gap-2">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                          Loading users...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2">
                          <Users className="h-8 w-8 text-muted-foreground" />
                          <p className="text-muted-foreground">
                            {filters.search ? 'No users found matching your search' : 'No users in this organization'}
                          </p>
                          {!filters.search && (
                            <Button variant="outline" onClick={handleInviteUsers}>
                              Invite First User
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedUsers.includes(user.id!)}
                            onCheckedChange={(checked) => handleUserSelect(user.id!, checked as boolean)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <UserAvatar user={user} />
                            <div>
                              <div className="font-medium">
                                {user.firstName} {user.lastName}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                @{user.username}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            {user.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          <UserStatusBadge user={user} />
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(user.createdTimestamp)}
                        </TableCell>
                        <TableCell>
                          <RolesBadgesList roles={user.assignedRoles || []} />
                        </TableCell>
                        <TableCell>
                          <GroupsBadgesList groups={user.assignedGroups || []} />
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleUserDetails(user.id!)}>
                                <Settings className="h-4 w-4 mr-2" />
                                Manage User
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleRemoveUser(user)}
                                className="text-red-600"
                              >
                                <UserX className="h-4 w-4 mr-2" />
                                Remove from Organization
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Remove User Confirmation Dialog */}
        <AlertDialog open={!!userToRemove} onOpenChange={() => setUserToRemove(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove User from Organization</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove <strong>{userToRemove?.firstName} {userToRemove?.lastName}</strong> 
                from {organizationName}? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmRemoveUser}
                disabled={isRemoving}
                className="bg-red-600 hover:bg-red-700"
              >
                {isRemoving ? 'Removing...' : 'Remove User'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PermissionGuard>
  );
}
