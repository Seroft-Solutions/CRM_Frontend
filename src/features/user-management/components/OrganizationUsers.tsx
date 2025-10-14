/**
 * Organization Users Component
 * Main hub for managing users within an organization
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  useOrganizationUsers,
  useRemoveUser,
  useOrganizationContext,
  useBulkUserOperations,
  useUserManagementRefresh,
} from '@/features/user-management/hooks/client';
import { PermissionGuard } from '@/core/auth';
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
  DropdownMenuCheckboxItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
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
  Building2,
  RefreshCw,
  X,
  CheckCircle,
  XCircle,
  Clock,
  SlidersHorizontal,
} from 'lucide-react';
import type { OrganizationUser, UserFilters } from '../types';
import { UserAvatar } from '@/features/user-management/components/UserAvatar';
import { UserStatusBadge } from '@/features/user-management/components/UserStatusBadge';
import { ClickableRolesBadge } from '@/features/user-management/components/ClickableRolesBadge';
import { ClickableGroupsBadge } from '@/features/user-management/components/ClickableGroupsBadge';
import { toast } from 'sonner';

interface OrganizationUsersProps {
  className?: string;
}

// Inner component that contains permission-required hooks
function OrganizationUsersContent({
  className,
  organizationId,
  organizationName,
  availableOrganizations,
  hasMultipleOrganizations,
  switchOrganization,
}: OrganizationUsersProps & {
  organizationId: string;
  organizationName: string;
  availableOrganizations: any[];
  hasMultipleOrganizations: boolean;
  switchOrganization: (orgId: string) => void;
}) {
  const router = useRouter();
  const { removeUser, isRemoving } = useRemoveUser();
  const { refreshOrganizationUsers } = useUserManagementRefresh();
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
  const [searchTerm, setSearchTerm] = useState('');
  const [userToRemove, setUserToRemove] = useState<OrganizationUser | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Debounced search effect
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setFilters((prev) => ({
        ...prev,
        search: searchTerm,
        page: 1, // Reset to first page when searching
      }));
    }, 300); // 300ms debounce

    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  // Fetch organization users - now safe inside permission guard
  const { users, totalCount, isLoading, error, refetch } = useOrganizationUsers(
    organizationId,
    filters
  );

  // Handle search input change
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchTerm('');
  };

  // Handle filter changes
  const handleFilterChange = useCallback((key: keyof UserFilters, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to first page when filtering
    }));
  }, []);

  // Clear all filters
  const handleClearFilters = () => {
    setFilters({
      search: '',
      page: 1,
      size: 20,
    });
    setSearchTerm('');
  };

  // Check if any filters are active
  const hasActiveFilters =
    filters.search || filters.enabled !== undefined || filters.emailVerified !== undefined;

  // Handle user selection
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      selectAllUsers(users.map((user) => user.id!));
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

  // Handle manual refresh
  const handleRefresh = async () => {
    await refreshOrganizationUsers(organizationId);
  };

  // Format date
  const formatDate = (timestamp?: number) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleDateString();
  };

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>Failed to load organization users</p>
            <p className="text-sm text-muted-foreground mt-1">Organization ID: {organizationId}</p>
            <Button variant="outline" onClick={() => refetch()} className="mt-2">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Organization Users</h1>
          <div className="flex items-center gap-2 text-muted-foreground">
            <span>
              Manage users in {organizationName}
              {hasActiveFilters ? (
                <span className="ml-1">
                  (Showing {users.length} of {totalCount} users)
                </span>
              ) : (
                <span className="ml-1">({totalCount} users)</span>
              )}
            </span>
            {isLoading && searchTerm && (
              <div className="flex items-center gap-1 text-xs">
                <div className="h-3 w-3 animate-spin rounded-full border border-primary border-t-transparent" />
                Searching...
              </div>
            )}
          </div>
          {hasActiveFilters && (
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="text-xs">
                Filters Active
              </Badge>
              {searchTerm && (
                <Badge variant="outline" className="text-xs">
                  Search: "{searchTerm}"
                </Badge>
              )}
              {filters.enabled !== undefined && (
                <Badge variant="outline" className="text-xs">
                  Status: {filters.enabled ? 'Active' : 'Disabled'}
                </Badge>
              )}
              {filters.emailVerified !== undefined && (
                <Badge variant="outline" className="text-xs">
                  Email: {filters.emailVerified ? 'Verified' : 'Unverified'}
                </Badge>
              )}
            </div>
          )}
          {hasMultipleOrganizations && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm text-muted-foreground">Switch organization:</span>
              {availableOrganizations.map((org) => (
                <Button
                  key={org.id}
                  variant={org.id === organizationId ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => switchOrganization(org.id)}
                >
                  {org.name}
                </Button>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleRefresh} variant="outline" className="gap-2" disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={handleInviteUsers} className="gap-2" disabled={!organizationId}>
            <Plus className="h-4 w-4" />
            Invite Users
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Management
          </CardTitle>
          <CardDescription>View and manage all users in your organization</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filters */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search users by name, email, or username..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearSearch}
                  className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            <Dialog open={showFilters} onOpenChange={setShowFilters}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <SlidersHorizontal className="h-4 w-4" />
                  Filters
                  {hasActiveFilters && (
                    <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                      !
                    </Badge>
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Filter Users</DialogTitle>
                  <DialogDescription>
                    Filter the user list by status and verification
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>User Status</Label>
                    <Select
                      value={
                        filters.enabled === undefined
                          ? 'all'
                          : filters.enabled
                            ? 'active'
                            : 'disabled'
                      }
                      onValueChange={(value) =>
                        handleFilterChange(
                          'enabled',
                          value === 'all' ? undefined : value === 'active'
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Users</SelectItem>
                        <SelectItem value="active">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            Active Users
                          </div>
                        </SelectItem>
                        <SelectItem value="disabled">
                          <div className="flex items-center gap-2">
                            <XCircle className="h-4 w-4 text-red-600" />
                            Disabled Users
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Email Verification</Label>
                    <Select
                      value={
                        filters.emailVerified === undefined
                          ? 'all'
                          : filters.emailVerified
                            ? 'verified'
                            : 'unverified'
                      }
                      onValueChange={(value) =>
                        handleFilterChange(
                          'emailVerified',
                          value === 'all' ? undefined : value === 'verified'
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select verification status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Users</SelectItem>
                        <SelectItem value="verified">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            Email Verified
                          </div>
                        </SelectItem>
                        <SelectItem value="unverified">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-orange-600" />
                            Email Unverified
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={handleClearFilters}>
                    Clear All
                  </Button>
                  <Button onClick={() => setShowFilters(false)}>Apply Filters</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={handleClearFilters} className="gap-2">
                <X className="h-4 w-4" />
                Clear
              </Button>
            )}
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
                          {hasActiveFilters
                            ? 'No users found matching your search or filters'
                            : 'No users in this organization'}
                        </p>
                        {hasActiveFilters ? (
                          <Button variant="outline" onClick={handleClearFilters}>
                            Clear Search & Filters
                          </Button>
                        ) : (
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
                          onCheckedChange={(checked) =>
                            handleUserSelect(user.id!, checked as boolean)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <UserAvatar user={user} />
                          <div>
                            <div className="font-medium">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-sm text-muted-foreground">@{user.username}</div>
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
                        <ClickableRolesBadge
                          userId={user.id!}
                          organizationId={organizationId}
                          roles={user.assignedRoles || []}
                          enableProgressiveLoading={false}
                        />
                      </TableCell>
                      <TableCell>
                        <ClickableGroupsBadge
                          userId={user.id!}
                          organizationId={organizationId}
                          groups={user.assignedGroups || []}
                          enableProgressiveLoading={false}
                        />
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
              Are you sure you want to remove{' '}
              <strong>
                {userToRemove?.firstName} {userToRemove?.lastName}
              </strong>
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
  );
}

export function OrganizationUsers({ className }: OrganizationUsersProps) {
  const {
    organizationId,
    organizationName,
    isLoading: isLoadingOrg,
    availableOrganizations,
    hasMultipleOrganizations,
    switchOrganization,
  } = useOrganizationContext();

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
                You don't appear to be associated with any organization, or organization data is not
                available in your session.
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

  return (
    <PermissionGuard requiredPermission="manage:users">
      <OrganizationUsersContent
        className={className}
        organizationId={organizationId}
        organizationName={organizationName}
        availableOrganizations={availableOrganizations}
        hasMultipleOrganizations={hasMultipleOrganizations}
        switchOrganization={switchOrganization}
      />
    </PermissionGuard>
  );
}
