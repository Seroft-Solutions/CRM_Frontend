'use client';

import { AlertCircle, Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface FailedCallsHeaderProps {
  totalItems: number;
  hasRows: boolean;
  isClearing: boolean;
  isLoading: boolean;
  onDownloadReport: () => void;
  onClearAllFailedEntries: () => void;
  onSaveValidatedRows: () => void;
  validatedRowCount: number;
  isBulkSaving: boolean;
}

export function FailedCallsHeader({
  totalItems,
  hasRows,
  isClearing,
  isLoading,
  onDownloadReport,
  onClearAllFailedEntries,
  onSaveValidatedRows,
  validatedRowCount,
  isBulkSaving,
}: FailedCallsHeaderProps) {
  return (
    <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between space-y-0">
      <div className="flex items-center gap-2">
        <AlertCircle className="h-5 w-5 text-red-500" />
        <CardTitle className="flex items-center gap-2">
          Failed Import Entries
          <Badge variant="destructive">{totalItems}</Badge>
        </CardTitle>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          onClick={onSaveValidatedRows}
          disabled={validatedRowCount === 0 || isBulkSaving || isLoading}
        >
          {isBulkSaving ? 'Saving...' : `Save All (${validatedRowCount})`}
        </Button>
        <Button variant="outline" size="sm" onClick={onDownloadReport} disabled={!hasRows}>
          <Download className="h-4 w-4 mr-2" />
          Download Report
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" disabled={isClearing || isLoading}>
              {isClearing ? 'Clearing...' : 'Clear All Failed Entries'}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete failed entries?</AlertDialogTitle>
              <AlertDialogDescription>
                It would delete all your history this action cannot be undo.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isClearing}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onClearAllFailedEntries} disabled={isClearing}>
                {isClearing ? 'Clearing...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </CardHeader>
  );
}
