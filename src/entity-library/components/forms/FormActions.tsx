'use client';

import { Button } from '@/components/ui/button';

export function FormActions({
  isFirst,
  isLast,
  onPrev,
  onNext,
  onCancel,
  submitText = 'Submit',
  cancelText = 'Cancel',
  showCancel = true,
  submitting = false,
}: {
  isFirst: boolean;
  isLast: boolean;
  onPrev: () => void;
  onNext: () => void;
  onCancel?: () => void;
  submitText?: string;
  cancelText?: string;
  showCancel?: boolean;
  submitting?: boolean;
}) {
  return (
    <div className="flex items-center justify-end gap-2 pt-2">
      {onCancel && showCancel ? (
        <Button type="button" size="sm" variant="outline" onClick={onCancel} disabled={submitting}>
          {cancelText}
        </Button>
      ) : null}
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={submitting || isFirst}
        onClick={onPrev}
      >
        Back
      </Button>
      <Button
        type={isLast ? 'submit' : 'button'}
        size="sm"
        disabled={submitting}
        onClick={isLast ? undefined : onNext}
      >
        {isLast ? submitText : 'Next'}
      </Button>
    </div>
  );
}
