import React from 'react';

interface EntityNoAccessProps {
  entityNamePlural: string;
}

/**
 * Component displayed when user doesn't have permission to view the entity
 */
export function EntityNoAccess({ entityNamePlural }: EntityNoAccessProps) {
  return (
    <div className="p-8 text-center bg-white dark:bg-gray-950 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800">
      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className="text-gray-500 dark:text-gray-400"
        >
          <path d="M2 11.5a7.5 7.5 0 0 0 15 0 7.5 7.5 0 0 0-15 0Z"/>
          <path d="M14.5 14.5 20 20"/>
          <path d="m15 11-6-6"/>
          <path d="M9 11H3"/>
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Access Denied</h2>
      <p className="text-gray-500 dark:text-gray-400 mt-2">
        You don't have permission to view {entityNamePlural.toLowerCase()}.
      </p>
    </div>
  );
}
