'use client';

import type { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function FormSection({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <Card className="gap-3 py-4">
      {title ? (
        <CardHeader className="px-4 py-0">
          <CardTitle className="text-sm">{title}</CardTitle>
        </CardHeader>
      ) : null}
      <CardContent className="px-4">{children}</CardContent>
    </Card>
  );
}
