'use client';

import { useGetSundryLedger } from '@/core/api/sundry-ledger';
import { LedgerView } from '@/components/ledger/ledger-view';

interface SundryLedgerProps {
  id: number;
}

export function SundryLedger({ id }: SundryLedgerProps) {
  const { data, isLoading, isError } = useGetSundryLedger(id, {
    query: {
      enabled: Number.isFinite(id) && id > 0,
    },
  });

  return (
    <LedgerView
      partyLabel="Sundry Creditor"
      partyName={data?.creditorName}
      email={data?.email}
      mobile={data?.mobile}
      summary={data?.summary}
      entries={data?.entries}
      isLoading={isLoading}
      isError={isError}
      emptyMessage="No purchase order ledger entries found for this sundry creditor."
    />
  );
}
