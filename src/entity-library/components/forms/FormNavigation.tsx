'use client';

import { Button } from '@/components/ui/button';

export function FormNavigation({
  steps,
  stepIndex,
  onGoTo,
  allowBackwardNavigation = true,
}: {
  steps: Array<{ id: string; title: string }>;
  stepIndex: number;
  onGoTo: (index: number) => void;
  allowBackwardNavigation?: boolean;
}) {
  return (
    <ol className="flex flex-wrap gap-2 text-xs text-muted-foreground">
      {steps.map((s, i) => (
        <li key={s.id}>
          <Button
            type="button"
            variant="link"
            size="sm"
            className={i === stepIndex ? 'font-semibold' : undefined}
            disabled={i > stepIndex || (!allowBackwardNavigation && i < stepIndex)}
            onClick={() => onGoTo(i)}
          >
            {i + 1}. {s.title}
          </Button>
        </li>
      ))}
    </ol>
  );
}
