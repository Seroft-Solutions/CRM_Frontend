'use client';

import type { ReactNode } from 'react';

export function FormStep({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div>
        <div className="text-base font-semibold text-foreground">{title}</div>
        {description ? <div className="text-sm text-muted-foreground">{description}</div> : null}
      </div>
      {children}
    </div>
  );
}
