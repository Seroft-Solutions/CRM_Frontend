'use client';

import * as React from 'react';
import { PinIcon, PinOffIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useSidebarPin } from '@/hooks/use-sidebar-pin';

export function SidebarPinButton() {
  const { isPinned, togglePin } = useSidebarPin();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={togglePin}
          className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          {isPinned ? <PinOffIcon className="size-5" /> : <PinIcon className="size-5" />}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right">
        {isPinned ? 'Unpin Sidebar' : 'Pin Sidebar'}
      </TooltipContent>
    </Tooltip>
  );
}
