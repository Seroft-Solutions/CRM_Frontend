/**
 * Clickable Groups Badge Component
 * Displays group count with progressive data loading and enhanced UX
 */

'use client';

import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Loader2, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useUserRoleGroupCounts } from '@/features/user-management/hooks';
import type { GroupRepresentation } from '@/core/api/generated/keycloak';

interface ClickableGroupsBadgeProps {
  userId: string;
  organizationId: string;
  groups?: GroupRepresentation[];
  variant?: 'default' | 'secondary' | 'outline';
  size?: 'sm' | 'md';
  className?: string;
  enableProgressiveLoading?: boolean;
}

export function ClickableGroupsBadge({
  userId,
  organizationId,
  groups = [],
  variant = 'outline',
  size = 'sm',
  className,
  enableProgressiveLoading = true,
}: ClickableGroupsBadgeProps) {
  const router = useRouter();
  const hasInitialData = groups && Array.isArray(groups) && groups.length > 0;

  const {
    groupCount: fetchedGroupCount,
    groups: fetchedGroups,
    hasData: hasFetchedData,
    isLoading,
  } = useUserRoleGroupCounts(organizationId, userId, enableProgressiveLoading && !hasInitialData);

  const finalGroups = hasInitialData ? groups : fetchedGroups || [];
  const finalGroupCount = hasInitialData ? groups.length : fetchedGroupCount;
  const hasAnyData = hasInitialData || hasFetchedData;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-0.5',
  };

  const handleClick = () => {
    router.push(`/user-management/users/${userId}?tab=groups`);
  };

  if (enableProgressiveLoading && !hasInitialData && isLoading) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="outline"
              className={cn(
                sizeClasses[size],
                'cursor-pointer transition-all duration-200 hover:shadow-sm hover:border-green-300 hover:bg-green-50',
                className
              )}
              onClick={handleClick}
            >
              <Loader2 className="h-3 w-3 mr-1 animate-spin text-green-500" />
              <span className="text-green-600">Loading...</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="bg-white border-2 border-green-200 shadow-lg">
            <div className="p-2">
              <p className="text-green-900 font-medium">Loading group information...</p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (!hasAnyData || finalGroupCount === 0) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="outline"
              className={cn(
                sizeClasses[size],
                'cursor-pointer transition-all duration-200 hover:shadow-md hover:border-green-400 hover:bg-green-50 hover:scale-105',
                'border-slate-300 text-slate-600 hover:text-green-700',
                className
              )}
              onClick={handleClick}
            >
              <Users className="h-3 w-3 mr-1" />
              {hasAnyData ? 'No groups' : 'View groups'}
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="bg-white border-2 border-slate-200 shadow-lg">
            <div className="p-2">
              <p className="text-slate-800 font-medium">
                Click to {hasAnyData ? 'manage' : 'view'} groups
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
              'bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:border-green-400 hover:text-green-800',
              'font-medium',
              className
            )}
            onClick={handleClick}
          >
            <Users className="h-3 w-3 mr-1" />
            {finalGroupCount} group{finalGroupCount > 1 ? 's' : ''}
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="bg-white border-2 border-green-200 shadow-xl max-w-sm">
          <div className="p-2">
            <p className="font-semibold mb-3 text-green-900 flex items-center">
              <Users className="w-4 h-4 mr-2 text-green-600" />
              {finalGroupCount} Group{finalGroupCount > 1 ? 's' : ''} Assigned
            </p>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {finalGroups.slice(0, 5).map((group) => (
                <div key={group.id} className="bg-green-50 border border-green-200 rounded-md p-2">
                  <span className="font-medium text-green-900 text-sm">{group.name}</span>
                  {group.path && (
                    <p className="text-green-700 text-xs mt-1 leading-relaxed flex items-center">
                      <span className="mr-1">📁</span>
                      {group.path}
                    </p>
                  )}
                </div>
              ))}
              {finalGroupCount > 5 && (
                <div className="text-xs text-green-800 bg-green-100 border border-green-200 rounded-md p-2 text-center">
                  <span className="font-medium">+ {finalGroupCount - 5} more groups</span>
                </div>
              )}
            </div>
            <div className="mt-3 pt-2 border-t border-green-200">
              <p className="text-xs text-green-800 flex items-center justify-center">
                <span className="mr-1">👆</span>
                <span className="font-medium">Click to manage groups</span>
              </p>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
