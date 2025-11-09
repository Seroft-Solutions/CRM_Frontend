/**
 * Pending Invitations Component
 * Displays and manages pending organization invitations
 */

'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Calendar, Mail, Search, UserCheck } from 'lucide-react';
import { RefreshButton } from '@/features/user-management/components/LoadingButton';
import { useOrganizationContext, usePendingInvitations } from '@/features/user-management/hooks';
import type { InvitationFilters } from '../types';
import { formatDistanceToNow } from 'date-fns';

interface PendingInvitationsProps {
  className?: string;
}

export function PendingInvitations({ className }: PendingInvitationsProps) {
  const { organizationId } = useOrganizationContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'expired'>('all');

  const filters: InvitationFilters = {
    search: searchTerm || undefined,
    status: statusFilter === 'all' ? undefined : [statusFilter as any],
    page: 1,
    size: 50,
  };

  const {
    invitations = [],
    totalCount = 0,
    isLoading,
    error,
    refetch,
  } = usePendingInvitations(organizationId, filters);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'accepted':
        return (
          <Badge variant="default" className="bg-green-600">
            Accepted
          </Badge>
        );
      case 'expired':
        return <Badge variant="destructive">Expired</Badge>;
      case 'cancelled':
        return <Badge variant="outline">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (timestamp: number) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent" />
            <span className="ml-2">Loading pending invitations...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-destructive">Failed to load pending invitations</p>
            <RefreshButton onClick={() => refetch()} className="mt-2">
              Try Again
            </RefreshButton>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Pending Invitations
          {totalCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {totalCount}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Track and manage user invitations that haven't been accepted yet
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by email or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('all')}
            >
              All
            </Button>
            <Button
              variant={statusFilter === 'pending' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('pending')}
            >
              Pending
            </Button>
            <Button
              variant={statusFilter === 'expired' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('expired')}
            >
              Expired
            </Button>
          </div>
        </div>

        {/* Invitations Table */}
        {invitations.length === 0 ? (
          <div className="text-center py-8">
            <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium">No pending invitations</h3>
            <p className="text-muted-foreground">
              All invitations have been accepted or there are no pending invitations.
            </p>
          </div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned Groups</TableHead>
                  <TableHead>Invited</TableHead>
                  <TableHead>Invited By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((invitation) => (
                  <TableRow key={invitation.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {invitation.firstName} {invitation.lastName}
                        </div>
                        {invitation.invitationNote && (
                          <div className="text-sm text-muted-foreground">
                            {invitation.invitationNote}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        {invitation.email}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(invitation.status)}</TableCell>
                    <TableCell>
                      {invitation.selectedGroups.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {invitation.selectedGroups.slice(0, 2).map((group) => (
                            <Badge key={group.id} variant="outline" className="text-xs">
                              {group.name}
                            </Badge>
                          ))}
                          {invitation.selectedGroups.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{invitation.selectedGroups.length - 2} more
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">No groups</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {formatDate(invitation.invitedAt)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <UserCheck className="h-4 w-4 text-muted-foreground" />
                        {invitation.invitedByName || invitation.invitedBy}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
