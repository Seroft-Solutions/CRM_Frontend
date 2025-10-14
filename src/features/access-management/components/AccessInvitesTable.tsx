'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAccessInvitations } from '@/features/access-management/hooks';
import type {
  AccessInviteMetadata,
  AccessInviteType,
  PartnerAccessMetadata,
  StaffAccessMetadata,
} from '@/features/access-management/types';

interface AccessInvitesTableProps {
  type: AccessInviteType;
  organizationId: string;
  className?: string;
}

function renderMetadata(
  type: AccessInviteType,
  metadata: AccessInviteMetadata | undefined
) {
  if (!metadata) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  if (type === 'user') {
    const staffMetadata = metadata as StaffAccessMetadata;
    return (
      <div className="flex flex-wrap gap-1">
        {staffMetadata.roles?.map((role) => (
          <Badge variant="outline" key={role.id}>
            Role • {role.name ?? role.id}
          </Badge>
        ))}
        {staffMetadata.groups.map((group) => (
          <Badge variant="secondary" key={group.id}>
            Group • {group.name ?? group.id}
          </Badge>
        ))}
      </div>
    );
  }

  const partnerMetadata = metadata as PartnerAccessMetadata;
  return (
    <div className="flex flex-wrap gap-1">
      <Badge variant="outline">
        Channel • {partnerMetadata.channelType.name ?? partnerMetadata.channelType.id}
      </Badge>
      {partnerMetadata.commissionPercent !== undefined ? (
        <Badge variant="secondary">
          Commission • {partnerMetadata.commissionPercent}%
        </Badge>
      ) : null}
      {partnerMetadata.groups?.map((group) => (
        <Badge variant="secondary" key={group.id}>
          Group • {group.name ?? group.id}
        </Badge>
      ))}
    </div>
  );
}

export function AccessInvitesTable({
  type,
  organizationId,
  className,
}: AccessInvitesTableProps) {
  const [search, setSearch] = useState('');
  const { invitations, isLoading } = useAccessInvitations<AccessInviteMetadata>({
    type,
    organizationId,
    search: search || undefined,
    size: 10,
  });

  return (
    <div className={className}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">
            {type === 'user' ? 'Staff Invitations' : 'Partner Invitations'}
          </h3>
          <p className="text-sm text-muted-foreground">
            Track invitation status and resend when needed.
          </p>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Search by name or email"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-64"
          />
        </div>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Metadata</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Email Verified</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                  Loading invitations...
                </TableCell>
              </TableRow>
            ) : invitations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                  No invitations yet. Send one using the form above.
                </TableCell>
              </TableRow>
            ) : (
              invitations.map((invite) => (
                <TableRow key={invite.id}>
                  <TableCell>
                    <div className="font-medium">
                      {invite.firstName} {invite.lastName}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {invite.email}
                  </TableCell>
                  <TableCell>{renderMetadata(type, invite.metadata)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        invite.status === 'ACCEPTED'
                          ? 'default'
                          : invite.status === 'PENDING'
                            ? 'secondary'
                            : 'outline'
                      }
                    >
                      {invite.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={invite.emailVerified ? 'default' : 'destructive'}
                    >
                      {invite.emailVerified ? 'Verified' : 'Unverified'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {invite.joinedAt ? new Date(invite.joinedAt).toLocaleDateString() : '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm">
                      Manage
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
