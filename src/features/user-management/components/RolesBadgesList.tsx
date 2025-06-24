/**
 * Roles Badges List Component
 * Displays a list of role badges with overflow handling
 */

'use client';

import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { RoleRepresentation } from '@/core/api/generated/keycloak';

interface RolesBadgesListProps {
  roles: RoleRepresentation[];
  maxVisible?: number;
  variant?: 'default' | 'secondary' | 'outline';
  size?: 'sm' | 'md';
  className?: string;
}

export function RolesBadgesList({
  roles,
  maxVisible = 2,
  variant = 'secondary',
  size = 'sm',
  className,
}: RolesBadgesListProps) {
  const visibleRoles = roles.slice(0, maxVisible);
  const hiddenCount = roles.length - maxVisible;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-0.5',
  };

  if (roles.length === 0) {
    return <span className={cn('text-muted-foreground text-sm', className)}>No roles</span>;
  }

  return (
    <TooltipProvider>
      <div className={cn('flex gap-1 flex-wrap', className)}>
        {visibleRoles.map((role) => (
          <Tooltip key={role.id}>
            <TooltipTrigger asChild>
              <Badge variant={variant} className={cn(sizeClasses[size], 'cursor-help')}>
                {role.name}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <div className="max-w-xs">
                <p className="font-medium">{role.name}</p>
                {role.description && (
                  <p className="text-sm text-muted-foreground mt-1">{role.description}</p>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        ))}

        {hiddenCount > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className={cn(sizeClasses[size], 'cursor-help')}>
                +{hiddenCount}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <div className="max-w-xs">
                <p className="font-medium mb-2">Additional Roles:</p>
                <div className="space-y-1">
                  {roles.slice(maxVisible).map((role) => (
                    <div key={role.id} className="text-sm">
                      <span className="font-medium">{role.name}</span>
                      {role.description && (
                        <p className="text-muted-foreground text-xs">{role.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}
