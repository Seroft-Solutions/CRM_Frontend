/**
 * User Details Component
 * Individual user management with role and group assignments
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  useUserDetails, 
  useRoleAssignment, 
  useGroupAssignment,
  useOrganizationContext,
  useAvailableRoles,
  useAvailableGroups
} from '../hooks';
import { PermissionGuard } from '@/components/auth/permission-guard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Calendar, 
  Shield, 
  Users, 
  Plus, 
  Minus,
  Search,
  UserCheck,
  Settings
} from 'lucide-react';
import type { RoleRepresentation, GroupRepresentation } from '@/core/api/generated/keycloak';

interface UserDetailsProps {
  userId: string;
  className?: string;
}

export function UserDetails({ userId, className }: UserDetailsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { organizationId, organizationName } = useOrganizationContext();
  const { assignRoles, isAssigning: isAssigningRoles } = useRoleAssignment();
  const { assignGroups, isAssigning: isAssigningGroups } = useGroupAssignment();

  // Fetch user details
  const { userDetails, isLoading, error, refetch } = useUserDetails(organizationId, userId);
  const { roles: availableRoles } = useAvailableRoles();
  const { groups: availableGroups } = useAvailableGroups();

  // Initialize activeTab from URL query parameter
  const getInitialTab = (): 'overview' | 'roles' | 'groups' => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'roles' || tabParam === 'groups' || tabParam === 'overview') {
      return tabParam;
    }
    return 'overview';
  };

  // Local state
  const [activeTab, setActiveTab] = useState<'overview' | 'roles' | 'groups'>(getInitialTab);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<RoleRepresentation[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<GroupRepresentation[]>([]);
  const [roleSearchTerm, setRoleSearchTerm] = useState('');
  const [groupSearchTerm, setGroupSearchTerm] = useState('');
  const [itemToRemove, setItemToRemove] = useState<{
    type: 'role' | 'group';
    item: RoleRepresentation | GroupRepresentation;
  } | null>(null);

  // Effect to handle URL parameter changes
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'roles' || tabParam === 'groups' || tabParam === 'overview') {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center min-h-[400px] ${className}`}>
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Loading user details...</p>
        </div>
      </div>
    );
  }

  if (error || !userDetails) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>Failed to load user details</p>
            <Button variant="outline" onClick={() => refetch()} className="mt-2">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { user } = userDetails;

  // Handle navigation
  const handleBack = () => {
    router.push('/user-management/organization-users');
  };

  // Role management
  const handleAssignRoles = () => {
    setSelectedRoles([]);
    setRoleDialogOpen(true);
  };

  const handleRoleSelection = (role: RoleRepresentation, checked: boolean) => {
    if (checked) {
      setSelectedRoles(prev => [...prev, role]);
    } else {
      setSelectedRoles(prev => prev.filter(r => r.id !== role.id));
    }
  };

  const handleConfirmRoleAssignment = () => {
    if (selectedRoles.length > 0) {
      assignRoles({
        userId,
        organizationId,
        roles: selectedRoles,
        action: 'assign',
      });
      setRoleDialogOpen(false);
      setSelectedRoles([]);
    }
  };

  const handleRemoveRole = (role: RoleRepresentation) => {
    setItemToRemove({ type: 'role', item: role });
  };

  // Group management
  const handleAssignGroups = () => {
    setSelectedGroups([]);
    setGroupDialogOpen(true);
  };

  const handleGroupSelection = (group: GroupRepresentation, checked: boolean) => {
    if (checked) {
      setSelectedGroups(prev => [...prev, group]);
    } else {
      setSelectedGroups(prev => prev.filter(g => g.id !== group.id));
    }
  };

  const handleConfirmGroupAssignment = () => {
    if (selectedGroups.length > 0) {
      assignGroups({
        userId,
        organizationId,
        groups: selectedGroups,
        action: 'assign',
      });
      setGroupDialogOpen(false);
      setSelectedGroups([]);
    }
  };

  const handleRemoveGroup = (group: GroupRepresentation) => {
    setItemToRemove({ type: 'group', item: group });
  };

  // Confirm removal
  const handleConfirmRemoval = () => {
    if (itemToRemove) {
      if (itemToRemove.type === 'role') {
        assignRoles({
          userId,
          organizationId,
          roles: [itemToRemove.item as RoleRepresentation],
          action: 'unassign',
        });
      } else {
        assignGroups({
          userId,
          organizationId,
          groups: [itemToRemove.item as GroupRepresentation],
          action: 'unassign',
        });
      }
      setItemToRemove(null);
    }
  };

  // Filter functions
  const filteredAvailableRoles = availableRoles.filter(role => 
    !userDetails.assignedRealmRoles.some(assigned => assigned.id === role.id) &&
    role.name?.toLowerCase().includes(roleSearchTerm.toLowerCase())
  );

  const filteredAvailableGroups = availableGroups.filter(group => 
    !userDetails.assignedGroups.some(assigned => assigned.id === group.id) &&
    group.name?.toLowerCase().includes(groupSearchTerm.toLowerCase())
  );

  // Format date
  const formatDate = (timestamp?: number) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <PermissionGuard requiredPermission="manage-users">
      <div className={`space-y-6 ${className}`}>
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {user.firstName} {user.lastName}
            </h1>
            <p className="text-muted-foreground">
              User management in {organizationName}
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="roles">Roles</TabsTrigger>
            <TabsTrigger value="groups">Groups</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    User Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Username</p>
                      <p className="text-sm">@{user.username}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Status</p>
                      <Badge variant={user.enabled ? 'default' : 'destructive'}>
                        {user.enabled ? 'Active' : 'Disabled'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{user.email}</span>
                    {user.emailVerified && (
                      <Badge variant="outline" className="text-xs">Verified</Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Joined {formatDate(user.createdTimestamp)}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Assignment Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Roles</span>
                    </div>
                    <Badge variant="secondary">
                      {userDetails.assignedRealmRoles.length}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Groups</span>
                    </div>
                    <Badge variant="secondary">
                      {userDetails.assignedGroups.length}
                    </Badge>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full justify-start gap-2"
                      onClick={() => setActiveTab('roles')}
                    >
                      <Shield className="h-4 w-4" />
                      Manage Roles
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full justify-start gap-2"
                      onClick={() => setActiveTab('groups')}
                    >
                      <Users className="h-4 w-4" />
                      Manage Groups
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Roles Tab */}
          <TabsContent value="roles">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Role Assignments
                  </div>
                  <Button onClick={handleAssignRoles} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Assign Roles
                  </Button>
                </CardTitle>
                <CardDescription>
                  Manage roles assigned to this user
                </CardDescription>
              </CardHeader>
              <CardContent>
                {userDetails.assignedRealmRoles.length === 0 ? (
                  <div className="text-center py-8">
                    <Shield className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">No roles assigned</p>
                    <Button variant="outline" onClick={handleAssignRoles} className="mt-2">
                      Assign First Role
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Role Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {userDetails.assignedRealmRoles.map((role) => (
                        <TableRow key={role.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Badge variant="default">{role.name}</Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {role.description || 'No description'}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveRole(role)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Groups Tab */}
          <TabsContent value="groups">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Group Memberships
                  </div>
                  <Button onClick={handleAssignGroups} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Assign Groups
                  </Button>
                </CardTitle>
                <CardDescription>
                  Manage groups this user belongs to
                </CardDescription>
              </CardHeader>
              <CardContent>
                {userDetails.assignedGroups.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">No groups assigned</p>
                    <Button variant="outline" onClick={handleAssignGroups} className="mt-2">
                      Assign First Group
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Group Name</TableHead>
                        <TableHead>Path</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {userDetails.assignedGroups.map((group) => (
                        <TableRow key={group.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{group.name}</Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {group.path || '/'}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveGroup(group)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Role Assignment Dialog */}
        <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Assign Roles</DialogTitle>
              <DialogDescription>
                Select roles to assign to {user.firstName} {user.lastName}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search available roles..."
                  value={roleSearchTerm}
                  onChange={(e) => setRoleSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="max-h-[300px] overflow-y-auto border rounded-lg">
                {filteredAvailableRoles.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    No available roles found
                  </div>
                ) : (
                  <div className="p-2">
                    {filteredAvailableRoles.map((role) => (
                      <div key={role.id} className="flex items-center space-x-2 p-2 hover:bg-muted rounded">
                        <Checkbox
                          checked={selectedRoles.some(r => r.id === role.id)}
                          onCheckedChange={(checked) => handleRoleSelection(role, checked as boolean)}
                        />
                        <div className="flex-1">
                          <div className="font-medium">{role.name}</div>
                          {role.description && (
                            <div className="text-sm text-muted-foreground">{role.description}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleConfirmRoleAssignment} 
                disabled={selectedRoles.length === 0 || isAssigningRoles}
              >
                {isAssigningRoles ? 'Assigning...' : `Assign ${selectedRoles.length} Role${selectedRoles.length > 1 ? 's' : ''}`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Group Assignment Dialog */}
        <Dialog open={groupDialogOpen} onOpenChange={setGroupDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Assign Groups</DialogTitle>
              <DialogDescription>
                Select groups to assign to {user.firstName} {user.lastName}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search available groups..."
                  value={groupSearchTerm}
                  onChange={(e) => setGroupSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="max-h-[300px] overflow-y-auto border rounded-lg">
                {filteredAvailableGroups.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    No available groups found
                  </div>
                ) : (
                  <div className="p-2">
                    {filteredAvailableGroups.map((group) => (
                      <div key={group.id} className="flex items-center space-x-2 p-2 hover:bg-muted rounded">
                        <Checkbox
                          checked={selectedGroups.some(g => g.id === group.id)}
                          onCheckedChange={(checked) => handleGroupSelection(group, checked as boolean)}
                        />
                        <div className="flex-1">
                          <div className="font-medium">{group.name}</div>
                          <div className="text-sm text-muted-foreground">{group.path}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setGroupDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleConfirmGroupAssignment} 
                disabled={selectedGroups.length === 0 || isAssigningGroups}
              >
                {isAssigningGroups ? 'Assigning...' : `Assign ${selectedGroups.length} Group${selectedGroups.length > 1 ? 's' : ''}`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Removal Confirmation Dialog */}
        <AlertDialog open={!!itemToRemove} onOpenChange={() => setItemToRemove(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Remove {itemToRemove?.type === 'role' ? 'Role' : 'Group'}
              </AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove <strong>{itemToRemove?.item.name}</strong> from this user? 
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmRemoval}
                className="bg-red-600 hover:bg-red-700"
              >
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PermissionGuard>
  );
}
