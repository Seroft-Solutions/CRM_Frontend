'use client';

import type { ReactNode } from 'react';

interface TableContainerProps {
  title?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function TableContainer({ title, actions, children }: TableContainerProps) {
  return (
    <section className="w-full space-y-3">
      {title || actions ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          {title ? <h2 className="text-base font-semibold">{title}</h2> : <span />}
          {actions}
        </div>
      ) : null}
      <div className="w-full rounded-lg border bg-background shadow-lg shadow-muted/50">
        {children}
      </div>
    </section>
  );
}
