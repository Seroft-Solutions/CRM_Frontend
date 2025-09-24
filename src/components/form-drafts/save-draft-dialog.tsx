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
import { Save, Loader2, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';

export interface DraftDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: string;
  onSaveDraft: () => Promise<boolean>;
  onDiscardChanges: () => void;
  onCancel: () => void;
  isDirty: boolean;
}

/**
 * Dialog component that asks users whether to save form data as draft
 * when navigating away from a form with unsaved changes
 */
export function SaveDraftDialog({
  open,
  onOpenChange,
  entityType,
  onSaveDraft,
  onDiscardChanges,
  onCancel,
  isDirty,
}: DraftDialogProps) {
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      const success = await onSaveDraft();
      if (success) {
        onOpenChange(false);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscardChanges = () => {
    onDiscardChanges();
    onOpenChange(false);
  };

  const handleCancel = () => {
    onCancel();
    onOpenChange(false);
  };

  if (!isDirty) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="h-5 w-5 text-amber-500" />
            Save as Draft?
          </DialogTitle>
          <DialogDescription>
            You have unsaved changes in your {entityType.toLowerCase()} form. What would you like to
            do?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Card className="p-4">
            <Button
              onClick={handleSaveDraft}
              disabled={isSaving}
              className="w-full"
              variant="default"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving Draft...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save as Draft
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              You can continue editing this form later
            </p>
          </Card>

          <Card className="p-4">
            <Button
              onClick={handleDiscardChanges}
              disabled={isSaving}
              className="w-full"
              variant="destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Discard Changes
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              All changes will be lost permanently
            </p>
          </Card>
          <Button onClick={handleCancel} disabled={isSaving} className="w-full" variant="outline">
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
