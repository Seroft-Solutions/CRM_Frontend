/**
 * Organization Users Component
 * Main hub for managing users within an organization
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  useBulkUserOperations,
  useAvailableGroups,
  useOrganizationContext,
  useOrganizationUsers,
  useReinviteOrganizationUser,
  useRemoveUser,
  useUserManagementRefresh,
} from '@/features/user-management/hooks';
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
  AlertCircle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Building2,
  CheckCircle,
  Clock,
  Mail,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Send,
  Settings,
  SlidersHorizontal,
  Users,
  UserX,
  X,
  XCircle,
} from 'lucide-react';
import type { OrganizationUser, UserFilters } from '../types';
import { UserAvatar } from '@/features/user-management/components/UserAvatar';
import { UserStatusBadge } from '@/features/user-management/components/UserStatusBadge';
import { toast } from 'sonner';

interface OrganizationUsersProps {
  className?: string;
}

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
  const { reinviteUserAsync } = useReinviteOrganizationUser();
  const { refreshOrganizationUsers } = useUserManagementRefresh();
  const { groups: availableGroups } = useAvailableGroups();
  const {
    selectedUsers,
    toggleUserSelection,
    selectAllUsers,
    clearSelection,
    hasSelectedUsers,
    selectedCount,
  } = useBulkUserOperations();

  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    page: 1,
    size: 20,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [userToRemove, setUserToRemove] = useState<OrganizationUser | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [reinviteUserId, setReinviteUserId] = useState<string | null>(null);
  const getSortIcon = (column: NonNullable<UserFilters['sortBy']>) => {
    if (filters.sortBy !== column) {
      return <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />;
    }

    return filters.sortDirection === 'asc' ? (
      <ArrowUp className="h-3.5 w-3.5 text-foreground" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5 text-foreground" />
    );
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setFilters((prev) => ({
        ...prev,
        search: searchTerm,
        page: 1,
      }));
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  const { users, totalCount, isLoading, error, refetch } = useOrganizationUsers(
    organizationId,
    filters
  );

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
  };

  const handleFilterChange = useCallback((key: keyof UserFilters, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1,
    }));
  }, []);

  const handleClearFilters = () => {
    setFilters({
      search: '',
      page: 1,
      size: 20,
    });
    setSearchTerm('');
  };

  const handleSort = (column: NonNullable<UserFilters['sortBy']>) => {
    setFilters((prev) => {
      if (prev.sortBy === column) {
        return {
          ...prev,
          sortDirection: prev.sortDirection === 'asc' ? 'desc' : 'asc',
          page: 1,
        };
      }

      return {
        ...prev,
        sortBy: column,
        sortDirection: 'asc',
        page: 1,
      };
    });
  };

  const hasActiveFilters =
    filters.search ||
    filters.enabled !== undefined ||
    filters.emailVerified !== undefined ||
    !!filters.group;

  const selectedGroupLabel =
    availableGroups.find((group) => group.id === filters.group)?.name || filters.group;

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

  const handleUserDetails = (userId: string) => {
    router.push(`/user-management/users/${userId}`);
  };

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

  const handleReinviteUser = async (user: OrganizationUser) => {
    if (!organizationId) {
      toast.error('No organization selected');
      return;
    }

    setReinviteUserId(user.id!);
    try {
      await reinviteUserAsync({
        organizationId,
        userId: user.id!,
        sendPasswordReset: true,
      });
    } catch (error) {
      console.error('Failed to resend user invitation:', error);
    } finally {
      setReinviteUserId(null);
    }
  };

  const handleInviteUsers = () => {
    router.push('/user-management/invite-users');
  };

  const handleRefresh = async () => {
    await refreshOrganizationUsers(organizationId);
  };

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
              {filters.group && (
                <Badge variant="outline" className="text-xs">
                  Group: {selectedGroupLabel}
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
                    Filter the user list by status, verification, and group
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

                  <div className="space-y-2">
                    <Label>Group</Label>
                    <Select
                      value={filters.group || 'all'}
                      onValueChange={(value) =>
                        handleFilterChange('group', value === 'all' ? undefined : value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select group" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Groups</SelectItem>
                        {availableGroups
                          .filter((group) => !!group.id)
                          .map((group) => (
                            <SelectItem key={group.id} value={group.id!}>
                              {group.name || 'Unnamed Group'}
                            </SelectItem>
                          ))}
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
                  <TableHead>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 px-1 font-semibold"
                      onClick={() => handleSort('user')}
                    >
                      User
                      {getSortIcon('user')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 px-1 font-semibold"
                      onClick={() => handleSort('email')}
                    >
                      Email
                      {getSortIcon('email')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 px-1 font-semibold"
                      onClick={() => handleSort('status')}
                    >
                      Status
                      {getSortIcon('status')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 px-1 font-semibold"
                      onClick={() => handleSort('joined')}
                    >
                      Joined
                      {getSortIcon('joined')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 px-1 font-semibold"
                      onClick={() => handleSort('groups')}
                    >
                      Groups
                      {getSortIcon('groups')}
                    </Button>
                  </TableHead>
                  <TableHead className="w-[120px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        Loading users...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
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
                        <div className="flex flex-wrap gap-1">
                          {(user.assignedGroups || []).length > 0 ? (
                            (user.assignedGroups || []).map((group, index) => (
                              <Badge
                                key={group.id || `${group.name || 'group'}-${index}`}
                                variant="outline"
                                className="text-xs px-2 py-0.5 border-yellow-300 bg-yellow-100 text-yellow-800"
                              >
                                {group.name || 'Unnamed Group'}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-sm text-muted-foreground">No groups</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
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
                            <DropdownMenuItem
                              onClick={() => handleReinviteUser(user)}
                              disabled={reinviteUserId === user.id}
                            >
                              {reinviteUserId === user.id ? (
                                <span className="mr-2 inline-flex h-4 w-4 items-center justify-center">
                                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                </span>
                              ) : (
                                <Send className="h-4 w-4 mr-2" />
                              )}
                              {reinviteUserId === user.id ? 'Sending Invite...' : 'Re-invite User'}
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
