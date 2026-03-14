export type { FormConfig, FormState, FormActions } from '@/app/(protected)/(features)/call-types/components/form/form-types';

export interface PurchaseOrderFormContextValue {
  config: import('@/app/(protected)/(features)/call-types/components/form/form-types').FormConfig;
  state: {
    isSubmitting: boolean;
    isLoading: boolean;
    currentStep: number;
  };
  actions: {
    setSubmitting: (value: boolean) => void;
    setLoading: (value: boolean) => void;
  };
}
