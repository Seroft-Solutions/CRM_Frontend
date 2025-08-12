// Generated step exports for Customer
export { CustomerBasicStep } from './basic-step';
export { CustomerGeographicStep } from './geographic-step';
export { CustomerReviewStep } from './review-step';

// Import components for the mapping
import { CustomerBasicStep } from '@/app/(protected)/(features)/customers/components/form/steps/basic-step';
import { CustomerGeographicStep } from '@/app/(protected)/(features)/customers/components/form/steps/geographic-step';
import { CustomerReviewStep } from '@/app/(protected)/(features)/customers/components/form/steps/review-step';

// Step mapping for dynamic imports
export const stepComponents = {
  basic: CustomerBasicStep,
  geographic: CustomerGeographicStep,
  review: CustomerReviewStep,
} as const;

export type StepId = keyof typeof stepComponents;
