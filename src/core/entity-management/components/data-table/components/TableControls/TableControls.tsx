import React from 'react';
import { TableSearch } from './TableSearch';
import { TableFilters } from './TableFilters';
import { TableActions } from './TableActions';
import { useTableContext } from '../../context/TableContext';

export interface TableControlsProps {
  className?: string;
}

export const TableControls: React.FC<TableControlsProps> = ({ className }) => {
  const { searchableColumns, filterableColumns, onAdd, onExport } = useTableContext();
  
  // Determine if we need to show the search and filters section at all
  const showSearchFilters = (searchableColumns && searchableColumns.length > 0) || 
                            (filterableColumns && filterableColumns.length > 0);
  
  // Determine if we need to show the actions section
  const showActions = onAdd || onExport;
  
  // Apply more responsive styling
  return (
    <div className={`
      flex flex-col gap-4 
      sm:items-center 
      ${showSearchFilters && showActions ? 'lg:flex-row lg:justify-between' : ''}
      rounded-lg bg-gray-50/80 dark:bg-gray-900/50 p-4 
      border border-gray-100 dark:border-gray-800
    `}>
      {/* Search and Filters */}
      {showSearchFilters && (
        <div className="flex flex-col sm:flex-row w-full sm:flex-wrap sm:items-center gap-2">
          <TableSearch />
          <TableFilters />
        </div>
      )}

      {/* Table Actions */}
      {showActions && (
        <div className="flex self-start sm:self-auto">
          <TableActions />
        </div>
      )}
    </div>
  );
};
