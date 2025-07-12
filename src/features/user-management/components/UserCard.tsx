/**
 * User Card Component
 * Reusable card component for displaying user information
 */

'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Settings, UserX, Mail, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserAvatar } from "@/features/user-management/components/UserAvatar";
import { UserStatusBadge } from "@/features/user-management/components/UserStatusBadge";
import { RolesBadgesList } from "@/features/user-management/components/RolesBadgesList";
import { GroupsBadgesList } from "@/features/user-management/components/GroupsBadgesList";
import type { OrganizationUser } from '../types';

interface UserCardProps {
  user: OrganizationUser;
  onManage?: (user: OrganizationUser) => void;
  onRemove?: (user: OrganizationUser) => void;
  showActions?: boolean;
  compact?: boolean;
  className?: string;
}

export function UserCard({
  user,
  onManage,
  onRemove,
  showActions = true,
  compact = false,
  className,
}: UserCardProps) {
  const formatDate = (timestamp?: number) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <Card className={cn('hover:shadow-md transition-shadow', className)}>
      <CardContent className={cn('p-4', compact && 'p-3')}>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <UserAvatar user={user} size={compact ? 'sm' : 'md'} />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className={cn('font-medium truncate', compact ? 'text-sm' : 'text-base')}>
                  {user.firstName} {user.lastName}
                </h3>
                <UserStatusBadge user={user} />
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <span className={cn('truncate', compact ? 'text-xs' : 'text-sm')}>
                    @{user.username}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-muted-foreground">
                  <Mail className="h-3 w-3 flex-shrink-0" />
                  <span className={cn('truncate', compact ? 'text-xs' : 'text-sm')}>
                    {user.email}
                  </span>
                </div>

                {!compact && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Calendar className="h-3 w-3 flex-shrink-0" />
                    <span className="text-xs">Joined {formatDate(user.createdTimestamp)}</span>
                  </div>
                )}
              </div>

              {!compact && (
                <div className="mt-3 space-y-2">
                  <div>
                    <span className="text-xs font-medium text-muted-foreground">Roles:</span>
                    <div className="mt-1">
                      <RolesBadgesList roles={user.assignedRoles || []} maxVisible={3} />
                    </div>
                  </div>

                  <div>
                    <span className="text-xs font-medium text-muted-foreground">Groups:</span>
                    <div className="mt-1">
                      <GroupsBadgesList groups={user.assignedGroups || []} maxVisible={3} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {showActions && (onManage || onRemove) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="ml-2">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                {onManage && (
                  <DropdownMenuItem onClick={() => onManage(user)}>
                    <Settings className="h-4 w-4 mr-2" />
                    Manage User
                  </DropdownMenuItem>
                )}
                {onManage && onRemove && <DropdownMenuSeparator />}
                {onRemove && (
                  <DropdownMenuItem
                    onClick={() => onRemove(user)}
                    className="text-red-600 focus:text-red-600"
                  >
                    <UserX className="h-4 w-4 mr-2" />
                    Remove from Organization
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
