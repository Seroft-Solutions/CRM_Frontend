// Generated step exports for Call
export { CallClassificationStep } from './classification-step';
export { CallBusinessStep } from './business-step';
export { CallChannelStep } from './channel-step';
export { CallAssignmentStep } from './assignment-step';
export { CallReviewStep } from './review-step';

// Import components for the mapping
import { CallClassificationStep } from './classification-step';
import { CallBusinessStep } from './business-step';
import { CallChannelStep } from './channel-step';
import { CallAssignmentStep } from './assignment-step';
import { CallReviewStep } from './review-step';

// Step mapping for dynamic imports
export const stepComponents = {
  'classification': CallClassificationStep,
  'business': CallBusinessStep,
  'channel': CallChannelStep,
  'assignment': CallAssignmentStep,
  'review': CallReviewStep,
} as const;

export type StepId = keyof typeof stepComponents;
