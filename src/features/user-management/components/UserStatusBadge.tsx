/**
 * User Status Badge Component
 * Displays user status with appropriate styling
 */

'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { OrganizationUser } from '../types';

interface UserStatusBadgeProps {
  user: Partial<OrganizationUser>;
  className?: string;
}

export function UserStatusBadge({ user, className }: UserStatusBadgeProps) {
  const getStatusInfo = () => {
    if (!user.enabled) {
      return {
        variant: 'destructive' as const,
        label: 'Disabled',
        className: 'bg-red-100 text-red-800 hover:bg-red-100',
      };
    }

    if (!user.emailVerified) {
      return {
        variant: 'outline' as const,
        label: 'Email Unverified',
        className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-300',
      };
    }

    return {
      variant: 'default' as const,
      label: 'Active',
      className: 'bg-green-100 text-green-800 hover:bg-green-100',
    };
  };

  const statusInfo = getStatusInfo();

  return (
    <Badge variant={statusInfo.variant} className={cn(statusInfo.className, className)}>
      {statusInfo.label}
    </Badge>
  );
}
