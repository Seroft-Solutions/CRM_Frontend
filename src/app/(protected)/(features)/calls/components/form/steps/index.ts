// Generated step exports for Call
export { CallClassificationStep } from './classification-step';
export { CallBusinessStep } from './business-step';
export { CallChannelStep } from './channel-step';
export { CallAssignmentStep } from './assignment-step';
export { CallRemarksStep } from './remarks-step';
export { CallReviewStep } from './review-step';

// Import components for the mapping
import { CallClassificationStep } from "@/app/(protected)/(features)/calls/components/form/steps/classification-step";
import { CallBusinessStep } from "@/app/(protected)/(features)/calls/components/form/steps/business-step";
import { CallChannelStep } from "@/app/(protected)/(features)/calls/components/form/steps/channel-step";
import { CallAssignmentStep } from "@/app/(protected)/(features)/calls/components/form/steps/assignment-step";
import { CallRemarksStep } from "@/app/(protected)/(features)/calls/components/form/steps/remarks-step";
import { CallReviewStep } from "@/app/(protected)/(features)/calls/components/form/steps/review-step";

// Step mapping for dynamic imports
export const stepComponents = {
  'classification': CallClassificationStep,
  'business': CallBusinessStep,
  'channel': CallChannelStep,
  'assignment': CallAssignmentStep,
  'remarks': CallRemarksStep, // Assuming CallRemarksStep is also a step
  'review': CallReviewStep,
} as const;

export type StepId = keyof typeof stepComponents;
