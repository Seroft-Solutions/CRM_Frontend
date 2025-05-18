import React from 'react';
import { Button } from "@/components/ui/button";
import { Download, Plus, Settings2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTableContext } from '../../context/TableContext';

export interface TableActionsProps {
  className?: string;
}

export const TableActions: React.FC<TableActionsProps> = ({ className }) => {
  const { 
    onAdd, 
    onExport, 
    addPermission, 
    hasRole, 
    table 
  } = useTableContext();

  // Wrap the onAdd function to prevent infinite loops
  const handleAddClick = React.useCallback((e: React.MouseEvent) => {
    // Prevent event bubbling
    e.preventDefault();
    e.stopPropagation();
    
    // Use requestAnimationFrame and setTimeout to break potential update cycles
    requestAnimationFrame(() => {
      setTimeout(() => {
        // Now it's safe to call onAdd
        if (onAdd) onAdd();
      }, 0);
    });
  }, [onAdd]);

  return (
    <div className="flex items-center gap-2">
      {onAdd && (!addPermission || hasRole(addPermission.feature, addPermission.action)) && (
        <Button
          variant="default"
          size="sm"
          onClick={handleAddClick}
          className="h-9 bg-primary hover:bg-primary/90 text-white transition-colors shadow-sm"
        >
          <Plus className="mr-2 h-4 w-4"/>
          Add New
        </Button>
      )}
      {onExport && (
        <Button
          variant="outline"
          size="sm"
          onClick={onExport}
          className="h-9 border border-gray-200 dark:border-gray-700"
        >
          <Download className="mr-2 h-4 w-4"/>
          Export
        </Button>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-9 border border-gray-200 dark:border-gray-700">
            <Settings2 className="mr-2 h-4 w-4"/>
            View
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[150px]">
          <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
          <DropdownMenuSeparator/>
          {table
            .getAllColumns()
            .filter(
              (column) =>
                typeof column.accessorFn !== "undefined" && column.getCanHide()
            )
            .map((column) => {
              return (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  className="capitalize"
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) =>
                    column.toggleVisibility(!!value)
                  }
                >
                  {column.id}
                </DropdownMenuCheckboxItem>
              );
            })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
