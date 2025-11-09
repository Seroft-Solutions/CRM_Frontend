export { CallClassificationStep } from './classification-step';
export { CallBusinessStep } from './business-step';
export { CallChannelStep } from './channel-step';
export { CallAssignmentStep } from './assignment-step';
export { CallRemarksStep } from './remarks-step';
export { CallReviewStep } from './review-step';

import { CallBasicStep } from './basic-step';
import { CallClassificationStep } from './classification-step';
import { CallBusinessStep } from './business-step';
import { CallChannelStep } from './channel-step';
import { CallRemarksStep } from './remarks-step';
import { CallReviewStep } from './review-step';

export const stepComponents = {
  basic: CallBasicStep,
  classification: CallClassificationStep,
  business: CallBusinessStep,
  channel: CallChannelStep,
  'assignment and remarks': CallRemarksStep,
  review: CallReviewStep,
} as const;

export type StepId = keyof typeof stepComponents;
