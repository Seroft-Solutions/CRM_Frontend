'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Save, X } from 'lucide-react';
import { useEntityForm } from '../product-form-provider';

interface ProductFormActionsProps {
  onCancel: () => void;
  isSubmitting?: boolean;
  showCancel?: boolean;
}

export function ProductFormActions({
  onCancel,
  isSubmitting = false,
  showCancel = true,
}: ProductFormActionsProps) {
  const { config, state, actions } = useEntityForm();

  const handleCancel = async () => {
    const draftsEnabled = config.behavior?.drafts?.enabled ?? false;
    const hasUnsavedChanges = state.isDirty && draftsEnabled;

    if (hasUnsavedChanges && config.behavior?.drafts?.confirmDialog) {
      if (await actions.saveDraft()) {
        const draftCheckEvent = new CustomEvent('triggerDraftCheck', {
          detail: { onProceed: onCancel },
        });

        window.dispatchEvent(draftCheckEvent);
      } else {
        if (window.confirm('Are you sure you want to cancel? All unsaved changes will be lost.')) {
          onCancel();
        }
      }
    } else if (config.behavior.navigation.confirmOnCancel && state.isDirty) {
      if (window.confirm('Are you sure you want to cancel? All unsaved changes will be lost.')) {
        onCancel();
      }
    } else {
      onCancel();
    }
  };

  return (
    <div className="flex flex-row justify-center gap-2">
      <Button type="submit" disabled={isSubmitting} size="default" className="w-fit text-sm">
        <Save className="mr-1.5 h-4 w-4" />
        {isSubmitting ? 'Saving...' : 'Save Product'}
      </Button>
      {showCancel ? (
        <Button
          type="button"
          onClick={() => void handleCancel()}
          disabled={isSubmitting}
          variant="outline"
          size="default"
          className="w-fit text-sm"
        >
          <X className="mr-1.5 h-4 w-4" />
          Cancel
        </Button>
      ) : null}
    </div>
  );
}
