/**
 * Clickable Roles Badge Component
 * Displays role count with progressive data loading and enhanced UX
 */

'use client';

import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Shield, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useUserRoleGroupCounts } from '@/features/user-management/hooks/client';
import type { RoleRepresentation } from '@/core/api/generated/keycloak';

interface ClickableRolesBadgeProps {
  userId: string;
  organizationId: string;
  roles?: RoleRepresentation[];
  variant?: 'default' | 'secondary' | 'outline';
  size?: 'sm' | 'md';
  className?: string;
  enableProgressiveLoading?: boolean;
}

export function ClickableRolesBadge({
  userId,
  organizationId,
  roles = [],
  variant = 'secondary',
  size = 'sm',
  className,
  enableProgressiveLoading = true,
}: ClickableRolesBadgeProps) {
  const router = useRouter();
  const hasInitialData = roles && Array.isArray(roles) && roles.length > 0;

  // Only fetch additional data if we don't have initial data and progressive loading is enabled
  const {
    roleCount: fetchedRoleCount,
    roles: fetchedRoles,
    hasData: hasFetchedData,
    isLoading,
  } = useUserRoleGroupCounts(organizationId, userId, enableProgressiveLoading && !hasInitialData);

  // Determine which data to use
  const finalRoles = hasInitialData ? roles : fetchedRoles || [];
  const finalRoleCount = hasInitialData ? roles.length : fetchedRoleCount;
  const hasAnyData = hasInitialData || hasFetchedData;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-0.5',
  };

  const handleClick = () => {
    router.push(`/user-management/users/${userId}?tab=roles`);
  };

  // Show loading state
  if (enableProgressiveLoading && !hasInitialData && isLoading) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="outline"
              className={cn(
                sizeClasses[size],
                'cursor-pointer transition-all duration-200 hover:shadow-sm hover:border-blue-300 hover:bg-blue-50',
                className
              )}
              onClick={handleClick}
            >
              <Loader2 className="h-3 w-3 mr-1 animate-spin text-blue-500" />
              <span className="text-blue-600">Loading...</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="bg-white border-2 border-blue-200 shadow-lg">
            <div className="p-2">
              <p className="text-blue-900 font-medium">Loading role information...</p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // When we don't have role data or it's empty
  if (!hasAnyData || finalRoleCount === 0) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="outline"
              className={cn(
                sizeClasses[size],
                'cursor-pointer transition-all duration-200 hover:shadow-md hover:border-blue-400 hover:bg-blue-50 hover:scale-105',
                'border-slate-300 text-slate-600 hover:text-blue-700',
                className
              )}
              onClick={handleClick}
            >
              <Shield className="h-3 w-3 mr-1" />
              {hasAnyData ? 'No roles' : 'View roles'}
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="bg-white border-2 border-slate-200 shadow-lg">
            <div className="p-2">
              <p className="text-slate-800 font-medium">
                Click to {hasAnyData ? 'manage' : 'view'} roles
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={cn(
              sizeClasses[size],
              'cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105',
              'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-400 hover:text-blue-800',
              'font-medium',
              className
            )}
            onClick={handleClick}
          >
            <Shield className="h-3 w-3 mr-1" />
            {finalRoleCount} role{finalRoleCount > 1 ? 's' : ''}
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="bg-white border-2 border-blue-200 shadow-xl max-w-sm">
          <div className="p-2">
            <p className="font-semibold mb-3 text-blue-900 flex items-center">
              <Shield className="w-4 h-4 mr-2 text-blue-600" />
              {finalRoleCount} Role{finalRoleCount > 1 ? 's' : ''} Assigned
            </p>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {finalRoles.slice(0, 5).map((role) => (
                <div key={role.id} className="bg-blue-50 border border-blue-200 rounded-md p-2">
                  <span className="font-medium text-blue-900 text-sm">{role.name}</span>
                  {role.description && (
                    <p className="text-blue-700 text-xs mt-1 leading-relaxed">{role.description}</p>
                  )}
                </div>
              ))}
              {finalRoleCount > 5 && (
                <div className="text-xs text-blue-800 bg-blue-100 border border-blue-200 rounded-md p-2 text-center">
                  <span className="font-medium">+ {finalRoleCount - 5} more roles</span>
                </div>
              )}
            </div>
            <div className="mt-3 pt-2 border-t border-blue-200">
              <p className="text-xs text-blue-800 flex items-center justify-center">
                <span className="mr-1">👆</span>
                <span className="font-medium">Click to manage roles</span>
              </p>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
