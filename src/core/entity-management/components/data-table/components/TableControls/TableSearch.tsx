import React, { useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { useTableContext } from '../../context/TableContext';

export interface TableSearchProps {
  className?: string;
}

export const TableSearch: React.FC<TableSearchProps> = ({ className }) => {
  const { 
    searchableColumns, 
    searchQuery, 
    setSearchQuery, 
    searchColumn, 
    setSearchColumn, 
    handleSearch, 
    resetSearch 
  } = useTableContext();

  // If there are no searchable columns, don't render anything
  if (!searchableColumns || searchableColumns.length === 0) {
    return null;
  }

  return (
    <div className="flex gap-2">
      {searchableColumns.length > 1 && (
        <Select
          value={searchColumn}
          onValueChange={(value) => {
            setSearchColumn(value);
            // Clear the search when changing columns
            if (searchQuery) {
              setSearchQuery('');
              resetSearch();
            }
          }}
        >
          <SelectTrigger className="h-9 w-[140px] border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-l-md rounded-r-none">
            <SelectValue placeholder="Select column" />
          </SelectTrigger>
          <SelectContent className="max-h-[240px] overflow-y-auto p-1 rounded-md shadow-md">
            {searchableColumns.map((column) => (
              <SelectItem key={column.id} value={column.id} className="text-sm text-gray-700 dark:text-gray-300">
                {column.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      
      <div className="flex">
        <Input
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-9 w-[180px] lg:w-[280px] rounded-r-none border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSearch();
            }
          }}
        />
        <Button 
          variant="default" 
          size="sm" 
          onClick={handleSearch}
          className="h-9 rounded-l-none rounded-r-md bg-primary hover:bg-primary/90 text-white shadow-sm"
        >
          <Search className="h-4 w-4" />
        </Button>
      </div>
      
      {searchQuery && (
        <Button
          variant="ghost"
          size="sm"
          onClick={resetSearch}
          className="h-9 px-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 ml-1 rounded-md"
        >
          Clear
        </Button>
      )}
    </div>
  );
};
