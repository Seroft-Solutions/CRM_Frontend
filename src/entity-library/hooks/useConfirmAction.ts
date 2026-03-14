'use client';

import { useMemo, useState } from 'react';

export function useConfirmAction<TAction extends { id: string }>(actions: TAction[]) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const pending = useMemo(
    () => actions.find((a) => a.id === pendingId) ?? null,
    [actions, pendingId]
  );

  return { pending, pendingId, setPendingId };
}
