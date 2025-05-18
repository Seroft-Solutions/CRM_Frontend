import React from 'react';
import { Button } from '@/components/ui/button';
import { FormMode } from '@/features/core/tanstack-query-api';
import { useEntityManager } from '../../context';

interface EntityFormControlsProps {
  formMode: FormMode;
  onChangeFormMode: (mode: FormMode) => void;
  onSubmit?: () => void;
  onDelete?: () => void;
  onClose: () => void;
  isSubmitting?: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

/**
 * Form control buttons for the entity form (edit, delete, submit, cancel)
 */
export function EntityFormControls({
  formMode,
  onChangeFormMode,
  onSubmit,
  onDelete,
  onClose,
  isSubmitting = false,
  canEdit,
  canDelete,
}: EntityFormControlsProps) {
  const { labels } = useEntityManager();
  
  // View mode controls
  if (formMode === 'view') {
    return (
      <div className="flex justify-between">
        <div>
          {canDelete && onDelete && (
            <Button
              variant="destructive"
              onClick={onDelete}
              className="mr-2"
            >
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
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
              Delete
            </Button>
          )}
        </div>
        <div>
          {canEdit && (
            <Button
              variant="outline"
              onClick={() => onChangeFormMode('edit')}
              className="mr-2"
            >
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
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                <path d="m15 5 4 4" />
              </svg>
              Edit
            </Button>
          )}
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    );
  }
  
  // Edit or Create mode controls
  return (
    <div className="flex justify-end space-x-2">
      <Button
        variant="ghost"
        onClick={formMode === 'edit' ? () => onChangeFormMode('view') : onClose}
        disabled={isSubmitting}
      >
        Cancel
      </Button>
      {onSubmit && (
        <Button
          type="submit"
          onClick={onSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Saving...
            </>
          ) : (
            'Save'
          )}
        </Button>
      )}
    </div>
  );
}
