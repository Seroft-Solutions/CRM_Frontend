import React from 'react';
import {
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { FormMode } from '@/features/core/tanstack-query-api';
import { generateTitle, generateDescription } from './FormUtils';

export interface EntityFormHeaderProps {
  formMode: FormMode;
  title?: string | ((mode: FormMode) => string);
  description?: string | ((mode: FormMode) => string);
  data?: any;
  renderHeader?: (props: {
    formMode: FormMode;
    title?: string;
    description?: string;
  }) => React.ReactNode;
}

export function EntityFormHeader({
  formMode,
  title,
  description,
  data,
  renderHeader
}: EntityFormHeaderProps) {
  // Render custom or default header
  const renderDefaultHeader = () => {
    if (renderHeader) {
      return renderHeader({
        formMode,
        title: generateTitle(title, formMode),
        description: generateDescription(description, formMode)
      });
    }
    
    return (
      <>
        <DialogTitle className="text-xl font-semibold text-gray-800 dark:text-gray-100 tracking-tight">
          {generateTitle(title, formMode)}
        </DialogTitle>
        <DialogDescription className="text-gray-500 dark:text-gray-400 opacity-90">
          {generateDescription(description, formMode)}
        </DialogDescription>
        {formMode === 'view' && data?.isActive !== undefined && (
          <div className="mt-3 flex items-center">
            <span className="text-sm text-gray-500 dark:text-gray-400 mr-2">Status:</span>
            <span className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center shadow-sm transition-all ${data.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-900/50' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700'}`}>
              <span className={`mr-1.5 w-2 h-2 rounded-full ${data.isActive ? 'bg-green-500 dark:bg-green-400 animate-pulse' : 'bg-gray-400 dark:bg-gray-500'}`}></span>
              {data.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        )}
      </>
    );
  };
  
  return (
    <DialogHeader className="space-y-2 bg-gray-50 dark:bg-gray-900 border-b px-6 py-5">
      {renderDefaultHeader()}
    </DialogHeader>
  );
}
