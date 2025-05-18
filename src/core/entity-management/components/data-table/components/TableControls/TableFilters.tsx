import React from 'react';
import { Button } from "@/components/ui/button";
import { ListFilter, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { useTableContext } from '../../context/TableContext';

export interface TableFiltersProps {
  className?: string;
}

export const TableFilters: React.FC<TableFiltersProps> = ({ className }) => {
  const { 
    filterableColumns, 
    table, 
    handleFilterChange, 
    columnFilters,
    activeFiltersCount,
    activeSearch,
    searchColumn
  } = useTableContext();

  // If there are no filterable columns, don't render anything
  if (!filterableColumns || filterableColumns.length === 0) {
    return null;
  }

  // Function to check if a column has an active filter that isn't from search
  const hasActiveFilter = (columnId: string) => {
    const filter = table.getColumn(columnId)?.getFilterValue();
    // Exclude the filter if it's from the active search
    if (activeSearch && activeSearch.column === columnId && activeSearch.query === filter) {
      return false;
    }
    return !!filter;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={cn(
          "h-9 border border-gray-200 dark:border-gray-700 transition-all relative",
          activeFiltersCount > 0 && "border-primary/50 text-primary bg-primary/5 hover:bg-primary/10"
        )}>
          <ListFilter className="mr-2 h-4 w-4"/>
          Filters
          {activeFiltersCount > 0 && (
            <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-white">
              {activeFiltersCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[280px] p-2 shadow-md border border-gray-100 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-950 animate-in fade-in-0 zoom-in-95">
        <div className="flex items-center justify-between px-2 py-1.5">
          <DropdownMenuLabel className="text-sm font-medium text-gray-700 dark:text-gray-300 py-0 m-0">Filter by</DropdownMenuLabel>
          {activeFiltersCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={(e) => {
                e.stopPropagation();
                // Reset all filters except the active search filter
                if (activeSearch) {
                  const searchFilter = columnFilters.find(
                    filter => filter.id === activeSearch.column && filter.value === activeSearch.query
                  );
                  table.resetColumnFilters();
                  if (searchFilter) {
                    table.getColumn(searchFilter.id)?.setFilterValue(searchFilter.value);
                  }
                } else {
                  table.resetColumnFilters();
                }
                
                // Close the dropdown after clearing all filters
                const closeEvent = new MouseEvent('click', {
                  bubbles: true,
                  cancelable: true,
                  view: window
                });
                setTimeout(() => document.dispatchEvent(closeEvent), 100);
              }} 
              className="h-8 px-2 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 -mr-1"
            >
              Clear all
            </Button>
          )}
        </div>
        <DropdownMenuSeparator className="my-1 -mx-2"/>
        {filterableColumns.map((column) => (
          <DropdownMenuItem key={column.id} className="p-2 focus:bg-gray-50 dark:focus:bg-gray-900 focus:outline-none cursor-default hover:bg-transparent" onSelect={(e) => e.preventDefault()}>
            <div className="flex flex-col gap-2 w-full">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block flex items-center justify-between">
                {column.title}
                {hasActiveFilter(column.id) && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFilterChange(column.id, "__all__");
                      // Close the dropdown after clearing
                      const closeEvent = new MouseEvent('click', {
                        bubbles: true,
                        cancelable: true,
                        view: window
                      });
                      setTimeout(() => document.dispatchEvent(closeEvent), 100);
                    }} 
                    className="h-6 w-6 p-0 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <X className="h-3 w-3 text-gray-500" />
                  </Button>
                )}
              </label>
              <Select
                value={(table.getColumn(column.id)?.getFilterValue() as string) ?? ""}
                onValueChange={(value) => {
                  handleFilterChange(column.id, value);
                  // Close the dropdown menu after selection
                  const closeEvent = new MouseEvent('click', {
                    bubbles: true,
                    cancelable: true,
                    view: window
                  });
                  setTimeout(() => document.dispatchEvent(closeEvent), 100);
                }}
              >
                <SelectTrigger className="h-9 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-md">
                  <SelectValue placeholder={`All ${column.title.toLowerCase()}`}/>
                </SelectTrigger>
                <SelectContent className="max-h-[240px] overflow-y-auto p-1 rounded-md shadow-md">
                  <SelectItem value="__all__" className="text-sm text-gray-700 dark:text-gray-300">
                    All {column.title.toLowerCase()}
                  </SelectItem>
                  {column.options.map((option) => (
                    <SelectItem key={option.value} value={option.value} className="text-sm text-gray-700 dark:text-gray-300">
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
