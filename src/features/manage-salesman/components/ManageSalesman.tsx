'use client';

import { useMemo, useState } from 'react';
import { PermissionGuard } from '@/core/auth';
import { useOrganizationContext } from '@/features/user-management/hooks';
import {
  useAssignSalesman,
  useManageSalesman,
} from '@/features/manage-salesman/hooks/use-manage-salesman';
import type { SalesManagerWithAssignments } from '@/features/manage-salesman/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AlertCircle, Building2, Loader2, RefreshCw, UserCog, Users } from 'lucide-react';

interface ManageSalesmanProps {
  className?: string;
}

function ManageSalesmanContent({
  organizationId,
  organizationName,
}: {
  organizationId: string;
  organizationName: string;
}) {
  const { data, isLoading, isFetching, error, refetch } = useManageSalesman(organizationId);
  const { updateSalesmanAssignmentAsync, isUpdatingSalesmanAssignment } =
    useAssignSalesman(organizationId);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState<'assign' | 'unassign'>('assign');
  const [selectedManager, setSelectedManager] = useState<SalesManagerWithAssignments | null>(null);
  const [selectedSalesmanIds, setSelectedSalesmanIds] = useState<string[]>([]);
  const [salesmanSearch, setSalesmanSearch] = useState('');

  const availableSalesmen = data?.availableSalesmen || [];
  const salesManagers = data?.salesManagers || [];
  const dialogSalesmen =
    dialogAction === 'assign' ? availableSalesmen : selectedManager?.assignedSalesmen || [];

  const filteredDialogSalesmen = useMemo(() => {
    const searchToken = salesmanSearch.trim().toLowerCase();

    if (!searchToken) {
      return dialogSalesmen;
    }

    return dialogSalesmen.filter((salesman) =>
      [salesman.fullName, salesman.email, salesman.username]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(searchToken))
    );
  }, [dialogSalesmen, salesmanSearch]);

  const openAssignDialog = (manager: SalesManagerWithAssignments) => {
    setDialogAction('assign');
    setSelectedManager(manager);
    setSelectedSalesmanIds([]);
    setSalesmanSearch('');
    setIsDialogOpen(true);
  };

  const openUnassignDialog = (manager: SalesManagerWithAssignments) => {
    setDialogAction('unassign');
    setSelectedManager(manager);
    setSelectedSalesmanIds([]);
    setSalesmanSearch('');
    setIsDialogOpen(true);
  };

  const resetDialog = () => {
    setIsDialogOpen(false);
    setSelectedManager(null);
    setSelectedSalesmanIds([]);
    setSalesmanSearch('');
  };

  const toggleSalesmanSelection = (salesmanId: string, checked: boolean) => {
    if (checked) {
      setSelectedSalesmanIds((previous) => Array.from(new Set([...previous, salesmanId])));

      return;
    }

    setSelectedSalesmanIds((previous) => previous.filter((id) => id !== salesmanId));
  };

  const handleSubmitDialog = async () => {
    if (!selectedManager || selectedSalesmanIds.length === 0) {
      return;
    }

    const result = await updateSalesmanAssignmentAsync({
      action: dialogAction,
      managerUserId: selectedManager.id,
      salesmanUserIds: selectedSalesmanIds,
    });

    if (result.success) {
      resetDialog();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">Failed to Load Sales Manager Data</CardTitle>
          <CardDescription>
            {error instanceof Error ? error.message : 'Unexpected error while loading data'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Manage Salesman</h1>
            <p className="text-muted-foreground">
              Assign or unassign salesmen for sales managers in {organizationName}
            </p>
          </div>
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Sales Managers</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{salesManagers.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Available Salesmen</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{availableSalesmen.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Assigned Salesmen</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">
                {salesManagers.reduce(
                  (count, manager) => count + manager.assignedSalesmen.length,
                  0
                )}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCog className="h-5 w-5" />
              Sales Manager List
            </CardTitle>
            <CardDescription>
              A salesman can be assigned to only one sales manager child group in Keycloak.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {salesManagers.length === 0 ? (
              <div className="text-sm text-muted-foreground">No sales managers found.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Manager</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assigned Salesmen</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salesManagers.map((manager) => (
                    <TableRow key={manager.id}>
                      <TableCell>
                        <div className="font-medium">{manager.fullName}</div>
                        <div className="text-xs text-muted-foreground">
                          {manager.username || manager.id}
                        </div>
                      </TableCell>
                      <TableCell>{manager.email || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge variant={manager.enabled ? 'default' : 'secondary'}>
                          {manager.enabled ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {manager.assignedSalesmen.length === 0 ? (
                          <span className="text-sm text-muted-foreground">No assignments</span>
                        ) : (
                          <div className="space-y-1">
                            <div className="flex flex-wrap gap-1">
                              {manager.assignedSalesmen.slice(0, 3).map((salesman) => (
                                <Badge key={salesman.id} variant="outline">
                                  {salesman.fullName}
                                </Badge>
                              ))}
                              {manager.assignedSalesmen.length > 3 && (
                                <Badge variant="outline">
                                  +{manager.assignedSalesmen.length - 3} more
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Child Group: {manager.assignedGroupName || 'Not created'}
                            </div>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            onClick={() => openAssignDialog(manager)}
                            disabled={availableSalesmen.length === 0}
                          >
                            Assign Salesman
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openUnassignDialog(manager)}
                            disabled={manager.assignedSalesmen.length === 0}
                          >
                            Unassign Salesman
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => (!open ? resetDialog() : setIsDialogOpen(open))}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {dialogAction === 'assign' ? 'Assign Salesman' : 'Unassign Salesman'}
            </DialogTitle>
            <DialogDescription>
              Select salesman users to {dialogAction === 'assign' ? 'assign to' : 'unassign from'}{' '}
              <span className="font-medium">{selectedManager?.fullName}</span>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {dialogAction === 'assign' &&
              selectedManager &&
              selectedManager.assignedSalesmen.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Currently Assigned</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedManager.assignedSalesmen.map((salesman) => (
                      <Badge key={salesman.id} variant="outline">
                        {salesman.fullName}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

            <div>
              <Input
                placeholder={
                  dialogAction === 'assign'
                    ? 'Search available salesman...'
                    : 'Search assigned salesman...'
                }
                value={salesmanSearch}
                onChange={(event) => setSalesmanSearch(event.target.value)}
              />
            </div>

            <div className="border rounded-md max-h-72 overflow-y-auto">
              {filteredDialogSalesmen.length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground">
                  {dialogAction === 'assign'
                    ? 'No available salesman found.'
                    : 'No assigned salesman found for this manager.'}
                </div>
              ) : (
                filteredDialogSalesmen.map((salesman) => (
                  <label
                    key={salesman.id}
                    className="flex items-start gap-3 p-3 border-b last:border-b-0 cursor-pointer hover:bg-muted/40"
                  >
                    <Checkbox
                      checked={selectedSalesmanIds.includes(salesman.id)}
                      onCheckedChange={(checked) =>
                        toggleSalesmanSelection(salesman.id, checked === true)
                      }
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{salesman.fullName}</p>
                      <p className="text-xs text-muted-foreground">
                        {salesman.email || salesman.username || salesman.id}
                      </p>
                    </div>
                  </label>
                ))
              )}
            </div>

            <p className="text-sm text-muted-foreground">
              {selectedSalesmanIds.length} salesman selected
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={resetDialog} disabled={isUpdatingSalesmanAssignment}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitDialog}
              disabled={
                isUpdatingSalesmanAssignment || selectedSalesmanIds.length === 0 || !selectedManager
              }
            >
              {isUpdatingSalesmanAssignment ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {dialogAction === 'assign' ? 'Assigning...' : 'Unassigning...'}
                </>
              ) : (
                <>
                  <Users className="h-4 w-4 mr-2" />
                  {dialogAction === 'assign' ? 'Assign' : 'Unassign'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function ManageSalesman({ className }: ManageSalesmanProps) {
  const {
    organizationId,
    organizationName,
    availableOrganizations,
    switchOrganization,
    isLoading: isOrganizationLoading,
  } = useOrganizationContext();

  if (isOrganizationLoading) {
    return (
      <div className={`flex items-center justify-center min-h-[300px] ${className || ''}`}>
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
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
                You do not appear to be associated with any organization.
              </p>
            </div>
            {availableOrganizations.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Available organizations:</p>
                {availableOrganizations.map((organization) => (
                  <Button
                    key={organization.id}
                    variant="outline"
                    onClick={() => switchOrganization(organization.id)}
                    className="mr-2"
                  >
                    <Building2 className="h-4 w-4 mr-2" />
                    {organization.name}
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
      <div className={className}>
        <ManageSalesmanContent
          organizationId={organizationId}
          organizationName={organizationName}
        />
      </div>
    </PermissionGuard>
  );
}
