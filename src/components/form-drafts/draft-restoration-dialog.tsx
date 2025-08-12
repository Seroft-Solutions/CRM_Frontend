'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { FileText, Plus, Loader2, Trash2 } from 'lucide-react';
import type { DraftItem } from '@/core/hooks/use-entity-drafts';

export interface DraftRestorationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: string;
  drafts: DraftItem[];
  onRestoreDraft: (draftId: number) => void;
  onDeleteDraft: (draftId: number) => Promise<boolean>;
  onStartFresh: () => void;
  isLoading?: boolean;
}

/**
 * Dialog component that allows users to restore from existing drafts
 * or start fresh when creating a new form
 */
export function DraftRestorationDialog({
  open,
  onOpenChange,
  entityType,
  drafts,
  onRestoreDraft,
  onDeleteDraft,
  onStartFresh,
  isLoading = false,
}: DraftRestorationDialogProps) {
  const [deletingDraftId, setDeletingDraftId] = useState<number | null>(null);
  const [restoringDraftId, setRestoringDraftId] = useState<number | null>(null);

  const handleDeleteDraft = async (draftId: number, event: React.MouseEvent) => {
    event.stopPropagation();
    setDeletingDraftId(draftId);
    try {
      await onDeleteDraft(draftId);
    } finally {
      setDeletingDraftId(null);
    }
  };

  const handleRestoreDraft = async (draftId: number) => {
    if (restoringDraftId) return; // Prevent multiple clicks
    setRestoringDraftId(draftId);
    try {
      onRestoreDraft(draftId);
      onOpenChange(false);
    } finally {
      setRestoringDraftId(null);
    }
  };

  const handleStartFresh = () => {
    onStartFresh();
    onOpenChange(false);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'Unknown';
    }
  };

  const getStepText = (currentStep?: number, totalSteps = 5) => {
    if (currentStep === undefined) return 'Unknown step';
    return `Step ${currentStep + 1} of ${totalSteps}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-500" />
            Found Existing Drafts
          </DialogTitle>
          <DialogDescription>
            You have {drafts.length} saved draft{drafts.length !== 1 ? 's' : ''} for{' '}
            {entityType.toLowerCase()} forms. Would you like to continue from a draft or start
            fresh?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {drafts.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Available Drafts:</h4>
              <ScrollArea className="h-48 w-full rounded-md border p-3">
                <div className="space-y-2">
                  {drafts.map((draft) => (
                    <div
                      key={draft.id}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                        restoringDraftId
                          ? 'cursor-not-allowed opacity-50'
                          : 'cursor-pointer hover:bg-muted/50'
                      } ${restoringDraftId === draft.id ? 'bg-blue-50 border-blue-200' : ''}`}
                      onClick={() => !restoringDraftId && handleRestoreDraft(draft.id)}
                    >
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {getStepText(draft.data.currentStep)}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Saved {formatDate(draft.lastModifiedDate || draft.createdDate)}
                          </span>
                        </div>
                        <p className="text-sm font-medium">
                          Draft #{draft.id}
                          {restoringDraftId === draft.id && (
                            <span className="ml-2 text-blue-600 text-xs">(Restoring...)</span>
                          )}
                        </p>
                      </div>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => handleDeleteDraft(draft.id, e)}
                        disabled={deletingDraftId === draft.id}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                      >
                        {deletingDraftId === draft.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Button
              onClick={handleStartFresh}
              disabled={isLoading}
              className="w-full"
              variant="default"
            >
              <Plus className="mr-2 h-4 w-4" />
              Start Fresh
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Create a new {entityType.toLowerCase()} form from scratch
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
