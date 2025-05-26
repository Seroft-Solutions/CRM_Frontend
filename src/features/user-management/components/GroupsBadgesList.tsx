/**
 * Groups Badges List Component
 * Displays a list of group badges with overflow handling
 */

'use client';

import { Badge } from '@/components/ui/badge';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { GroupRepresentation } from '@/core/api/generated/keycloak';

interface GroupsBadgesListProps {
  groups: GroupRepresentation[];
  maxVisible?: number;
  variant?: 'default' | 'secondary' | 'outline';
  size?: 'sm' | 'md';
  className?: string;
}

export function GroupsBadgesList({ 
  groups, 
  maxVisible = 2, 
  variant = 'outline',
  size = 'sm',
  className 
}: GroupsBadgesListProps) {
  const visibleGroups = groups.slice(0, maxVisible);
  const hiddenCount = groups.length - maxVisible;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-0.5',
  };

  if (groups.length === 0) {
    return (
      <span className={cn('text-muted-foreground text-sm', className)}>
        No groups
      </span>
    );
  }

  return (
    <TooltipProvider>
      <div className={cn('flex gap-1 flex-wrap', className)}>
        {visibleGroups.map((group) => (
          <Tooltip key={group.id}>
            <TooltipTrigger asChild>
              <Badge 
                variant={variant} 
                className={cn(sizeClasses[size], 'cursor-help')}
              >
                {group.name}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <div className="max-w-xs">
                <p className="font-medium">{group.name}</p>
                {group.path && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Path: {group.path}
                  </p>
                )}
                {group.attributes && Object.keys(group.attributes).length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-medium">Attributes:</p>
                    <div className="text-xs text-muted-foreground">
                      {Object.entries(group.attributes).map(([key, value]) => (
                        <div key={key}>
                          <span className="font-medium">{key}:</span> {Array.isArray(value) ? value.join(', ') : value}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        ))}
        
        {hiddenCount > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge 
                variant="outline" 
                className={cn(sizeClasses[size], 'cursor-help')}
              >
                +{hiddenCount}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <div className="max-w-xs">
                <p className="font-medium mb-2">Additional Groups:</p>
                <div className="space-y-1">
                  {groups.slice(maxVisible).map((group) => (
                    <div key={group.id} className="text-sm">
                      <span className="font-medium">{group.name}</span>
                      {group.path && (
                        <p className="text-muted-foreground text-xs">
                          {group.path}
                        </p>
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
