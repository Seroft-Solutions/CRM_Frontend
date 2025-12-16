'use client';

import { Button } from '@/components/ui/button';

export function FormActions({
  isFirst,
  isLast,
  onPrev,
  onNext,
  onCancel,
  submitText = 'Submit',
}: {
  isFirst: boolean;
  isLast: boolean;
  onPrev: () => void;
  onNext: () => void;
  onCancel?: () => void;
  submitText?: string;
}) {
  return (
    <div className="flex items-center justify-end gap-2 pt-2">
      {onCancel ? (
        <Button type="button" size="sm" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      ) : null}
      <Button type="button" size="sm" variant="outline" disabled={isFirst} onClick={onPrev}>
        Back
      </Button>
      <Button type={isLast ? 'submit' : 'button'} size="sm" onClick={isLast ? undefined : onNext}>
        {isLast ? submitText : 'Next'}
      </Button>
    </div>
  );
}
