'use client';

import { useEffect, useMemo, useState } from 'react';
import type { TableConfig } from '@/entity-library/config';

export function useColumnVisibility<TEntity extends object>(config: TableConfig<TEntity>) {
  const cfg = config.columnVisibility;
  const key = cfg?.storageKey;
  const [hidden, setHidden] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const base = Object.fromEntries((cfg?.defaultHidden ?? []).map((f) => [String(f), true]));
    if (!key || typeof window === 'undefined') return void setHidden(base);
    try {
      const saved = window.localStorage.getItem(key);
      setHidden(saved ? { ...base, ...JSON.parse(saved) } : base);
    } catch {
      setHidden(base);
    }
  }, [cfg?.defaultHidden, key]);

  useEffect(() => {
    if (!key || typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(key, JSON.stringify(hidden));
    } catch {
      /* ignore */
    }
  }, [hidden, key]);

  const visibleColumns = useMemo(
    () => config.columns.filter((c) => !hidden[String(c.field)]),
    [config.columns, hidden]
  );

  return { hidden, setHidden, visibleColumns };
}
