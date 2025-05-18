import React from 'react';
import {
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { useTableContext } from '../../context/TableContext';

export interface TableHeaderProps {
  className?: string;
}

export const TableHeader: React.FC<TableHeaderProps> = ({ className }) => {
  const { title, description } = useTableContext();
  
  // If there's no title or description, don't render anything
  if (!title && !description) {
    return null;
  }
  
  return (
    <CardHeader className="bg-gray-50 dark:bg-gray-900 border-b pb-4">
      {title && <CardTitle className="text-xl font-semibold text-gray-800 dark:text-gray-100">{title}</CardTitle>}
      {description && <CardDescription className="text-gray-500 dark:text-gray-400">{description}</CardDescription>}
    </CardHeader>
  );
};
