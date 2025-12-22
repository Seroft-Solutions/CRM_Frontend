'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import type { OrderFormState } from './order-form-types';

type OrderFormFooterProps = {
  formState: OrderFormState;
  submitting: boolean;
  onBusyFlagChange: (checked: boolean) => void;
};

export function OrderFormFooter({ formState, submitting, onBusyFlagChange }: OrderFormFooterProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-4">
      <div className="inline-flex items-center gap-2">
        <Checkbox
          id="busyFlag"
          checked={formState.busyFlag}
          onCheckedChange={(checked) => onBusyFlagChange(Boolean(checked))}
        />
        <Label htmlFor="busyFlag">Busy / voucher applied</Label>
        {formState.discountCode ? (
          <Badge variant="secondary" className="bg-amber-50 text-amber-800">
            Discount {formState.discountCode}
          </Badge>
        ) : null}
        {formState.busyVoucherId ? (
          <Badge variant="secondary" className="bg-emerald-50 text-emerald-800">
            Voucher {formState.busyVoucherId}
          </Badge>
        ) : null}
      </div>

      <Button type="submit" disabled={submitting} className="px-8">
        {submitting ? 'Saving...' : 'Save order'}
      </Button>
    </div>
  );
}
