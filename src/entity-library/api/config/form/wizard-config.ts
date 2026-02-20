import type { ComponentType } from 'react';
import type { z } from 'zod';

export interface WizardConfig<TEntity extends object> {
  steps: Array<WizardStepConfig<TEntity>>;
  allowBackwardNavigation?: boolean;
  showProgressIndicator?: boolean;
  progressIndicatorStyle?: 'steps' | 'bar' | 'dots';
  saveProgressOnStep?: boolean;
  onStepComplete?: (stepId: string, data: Partial<TEntity>) => void | Promise<void>;
  enableReviewStep?: boolean;
  allowEditFromReview?: boolean;
}

export interface WizardStepConfig<TEntity extends object> {
  id: string;
  title: string;
  description?: string;
  icon?: ComponentType<{ className?: string }>;
  fields: Array<keyof TEntity>;
  validationSchema: z.ZodType<Partial<TEntity>>;
  condition?: (formData: Partial<TEntity>) => boolean;
}
