/**
 * UserAvatar component
 *
 * Displays the user's avatar with fallback to initials.
 */
import React from 'react';
import { User } from '../../types';

export interface UserAvatarProps {
  user: User | null;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  size = 'medium',
  className = '',
}) => {
  if (!user) {
    return null;
  }

  // Size classes
  const sizeClasses = {
    small: 'h-8 w-8 text-xs',
    medium: 'h-10 w-10 text-sm',
    large: 'h-16 w-16 text-xl',
  };

  // Get user initials
  const getUserInitials = (): string => {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }

    if (user.displayName) {
      // Get first letters of each word in display name
      return user.displayName
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
    }

    // Fallback to email
    return user.email.substring(0, 2).toUpperCase();
  };

  // If user has an avatar image
  if (user.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={user.displayName || user.email}
        className={`rounded-full object-cover ${sizeClasses[size]} ${className}`}
      />
    );
  }

  // Default avatar with initials
  return (
    <div
      className={`flex items-center justify-center rounded-full bg-primary text-white ${sizeClasses[size]} ${className}`}
    >
      {getUserInitials()}
    </div>
  );
};
