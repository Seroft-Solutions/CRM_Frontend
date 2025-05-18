import React from 'react';
import { Button } from '@/components/ui/button';
import { useEntityManager } from '../../context';

interface EntityActionBarProps {
  onAdd?: () => void;
  onExport?: () => void;
  enableExport?: boolean;
}

/**
 * Component for the main action buttons (add, export, etc.)
 */
export function EntityActionBar({
  onAdd,
  onExport,
  enableExport = false,
}: EntityActionBarProps) {
  const { labels, canCreate } = useEntityManager();
  
  return (
    <div className="flex justify-end gap-2 mb-4">
      {enableExport && onExport && (
        <Button variant="outline" onClick={onExport}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-2"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Export
        </Button>
      )}
      
      {canCreate && onAdd && (
        <Button onClick={onAdd}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-2"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add {labels.entityName}
        </Button>
      )}
    </div>
  );
}
