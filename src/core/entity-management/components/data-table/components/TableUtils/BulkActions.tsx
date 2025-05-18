import React from 'react';
import { Users } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { BulkAction } from '../../../../types/data-table';
import { useTableContext } from '../../context/TableContext';
import { UserCircle2 } from 'lucide-react';

export interface BulkActionsProps<TData> {
  bulkAction: BulkAction<TData>;
  column: string;
  selectedCount: number;
  className?: string;
}

export function BulkActions<TData>({ 
  bulkAction, 
  column, 
  selectedCount, 
  className 
}: BulkActionsProps<TData>) {
  const { table, setRowSelection } = useTableContext<TData>();

  return (
    <div className="min-w-[250px]">
      <Select
        onValueChange={async (value) => {
          if (value && bulkAction) {
            const selectedRows = table
              .getSelectedRowModel()
              .rows.map((row) => row.original);
            await bulkAction.onUpdate(selectedRows, value);
            setRowSelection({});
          }
        }}
      >
        <SelectTrigger className="h-9 w-full bg-blue-50 border-blue-200 hover:bg-blue-100 transition-colors">
          <div className="flex items-center gap-2 text-blue-700">
            <Users className="h-4 w-4"/>
            <span className="font-medium">
              Assign {selectedCount} selected
            </span>
          </div>
        </SelectTrigger>
        <SelectContent className="max-h-[300px]">
          <div className="px-2 py-1.5">
            <h4 className="text-sm font-medium text-gray-900 mb-0.5">
              Select Assignee
            </h4>
            <p className="text-xs text-gray-500">
              {selectedCount} items will be assigned
            </p>
          </div>
          <SelectGroup>
            {bulkAction?.options.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                className="flex items-center gap-2 py-2"
              >
                <div className="flex items-center gap-2 text-sm">
                  <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center">
                    <UserCircle2 className="h-4 w-4 text-blue-600"/>
                  </div>
                  {option.label}
                </div>
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
