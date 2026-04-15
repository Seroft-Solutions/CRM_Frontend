'use client';

import { useGetCustomerLedger } from '@/core/api/customer-ledger';
import { LedgerView } from '@/components/ledger/ledger-view';

interface CustomerLedgerProps {
  id: number;
}

export function CustomerLedger({ id }: CustomerLedgerProps) {
  const { data, isLoading, isError } = useGetCustomerLedger(id, {
    query: {
      enabled: Number.isFinite(id) && id > 0,
    },
  });

  return (
    <LedgerView
      partyLabel="Customer"
      partyName={data?.customerBusinessName}
      email={data?.email}
      mobile={data?.mobile}
      summary={data?.summary}
      entries={data?.entries}
      isLoading={isLoading}
      isError={isError}
      emptyMessage="No sales order ledger entries found for this customer."
    />
  );
}
