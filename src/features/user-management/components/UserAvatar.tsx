/**
 * User Avatar Component
 * Displays user avatar with fallback to initials
 */

'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { OrganizationUser } from '../types';

interface UserAvatarProps {
  user: Partial<OrganizationUser>;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function UserAvatar({ user, size = 'md', className }: UserAvatarProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.charAt(0) || '';
    const last = lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || '?';
  };

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      <AvatarImage
        src={user.email ? `https://avatar.vercel.sh/${user.email}` : undefined}
        alt={`${user.firstName} ${user.lastName}`}
      />
      <AvatarFallback className="text-xs font-medium">
        {getInitials(user.firstName, user.lastName)}
      </AvatarFallback>
    </Avatar>
  );
}
