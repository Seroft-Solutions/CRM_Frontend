export { SundryCreditorBasicStep } from './basic-step';
export { SundryCreditorGeographicStep } from './geographic-step';
export { SundryCreditorReviewStep } from './review-step';

import { SundryCreditorBasicStep } from './basic-step';
import { SundryCreditorGeographicStep } from './geographic-step';
import { SundryCreditorReviewStep } from './review-step';

export const stepComponents = {
  basic: SundryCreditorBasicStep,
  geographic: SundryCreditorGeographicStep,
  review: SundryCreditorReviewStep,
} as const;

export type StepId = keyof typeof stepComponents;
