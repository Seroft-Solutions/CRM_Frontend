'use client';

import { useMemo, useState } from 'react';
import type { WizardStepConfig } from '@/entity-library/config';

export function useFormWizard<TEntity extends object>(
  steps: Array<WizardStepConfig<TEntity>>
) {
  const [stepIndex, setStepIndex] = useState(0);

  const max = steps.length ? steps.length - 1 : 0;
  const currentStep = useMemo(() => steps[Math.min(stepIndex, max)], [max, stepIndex, steps]);

  return {
    stepIndex,
    currentStep,
    isFirst: stepIndex <= 0,
    isLast: stepIndex >= max,
    goTo: (index: number) => setStepIndex(Math.max(0, Math.min(index, max))),
    next: () => setStepIndex((i) => Math.min(i + 1, max)),
    prev: () => setStepIndex((i) => Math.max(i - 1, 0)),
  };
}
