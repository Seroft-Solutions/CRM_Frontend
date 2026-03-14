'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { OrderFormState } from './order-form-types';

type OrderFormFooterProps = {
  formState: OrderFormState;
  submitting: boolean;
};

export function OrderFormFooter({ formState, submitting }: OrderFormFooterProps) {
  return (
    <div className="space-y-4 rounded-lg border-2 border-slate-200 bg-white p-5 shadow-lg">
      {/* No discount code display for Purchase Orders */}

      <Button
        type="submit"
        disabled={submitting}
        className="w-full bg-gradient-to-r from-yellow-500 to-amber-500 py-6 text-base font-bold text-slate-900 shadow-lg hover:from-yellow-600 hover:to-amber-600 disabled:opacity-50"
      >
        {submitting ? (
          <>
            <svg className="mr-2 h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Saving Purchase Order...
          </>
        ) : (
          <>
            <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Save Purchase Order
          </>
        )}
      </Button>
    </div>
  );
}
