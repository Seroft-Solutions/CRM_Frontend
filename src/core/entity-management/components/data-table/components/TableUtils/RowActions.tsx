import React from 'react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTableContext } from '../../context/TableContext';
import { Row } from '@tanstack/react-table';
import { Lock } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";

export interface RowActionsProps<TData> {
  row: Row<TData>;
  className?: string;
}

export function RowActions<TData>({ row, className }: RowActionsProps<TData>) {
  const { actions, hasRole } = useTableContext<TData>();

  // If no actions, return null
  if (!actions || actions.length === 0) {
    return null;
  }

  return (
    <div className="flex justify-end gap-1" data-action-cell="true">
      {actions.map((action, index) => {
        // Check permissions
        const hasPermission = !action.permission || hasRole(action.permission.feature, action.permission.action);
        
        // Check if action should be shown based on row data
        const isVisible = !action.showWhen || action.showWhen(row.original);
        
        // If action shouldn't be visible at all, skip it
        if (!isVisible) {
          return null;
        }
        
        // Check if action is disabled
        const isDisabled = typeof action.disabled === 'function'
          ? action.disabled(row.original)
          : action.disabled;

        // If no permission, show locked button
        if (!hasPermission) {
          return (
            <TooltipProvider key={index}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled
                    className="h-8 w-8 p-0 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors opacity-50"
                  >
                    <Lock className="h-4 w-4 text-gray-400" />
                    <span className="sr-only">{action.label} (No Permission)</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>You don't have permission for this action</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        }

        const ActionButton = ({onClick}: { onClick: (e: React.MouseEvent<HTMLButtonElement>) => void }) => (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={action.variant || "ghost"}
                  size="sm"
                  onClick={onClick}
                  disabled={isDisabled}
                  className={cn(
                    "h-8 w-8 p-0 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-primary transition-colors",
                    action.variant === 'destructive' && "hover:bg-red-100 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400",
                    action.className
                  )}
                >
                  {action.icon}
                  <span className="sr-only">{action.label}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{action.tooltip || action.label}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );

        if (action.showConfirm) {
          return (
            <AlertDialog key={index}>
              <AlertDialogTrigger asChild>
                <ActionButton onClick={(e) => {
                  // Stop the click event from propagating to the row
                  e.stopPropagation();
                }}/>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{action.confirmTitle}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {action.confirmDescription}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={(e) => {
                      // Prevent event propagation to avoid triggering row click
                      e.stopPropagation();
                      // Call the action's onClick handler
                      action.onClick(row.original);
                    }}
                  >
                    {action.confirmActionLabel || 'Continue'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          );
        }

        return (
          <ActionButton
            key={index}
            onClick={(e) => {
              // Prevent event propagation to avoid triggering row click
              e.stopPropagation();
              // Call the action's onClick handler
              action.onClick(row.original);
            }}
          />
        );
      })}
    </div>
  );
}
