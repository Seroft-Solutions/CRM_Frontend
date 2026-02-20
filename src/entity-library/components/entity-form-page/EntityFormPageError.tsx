'use client';

import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function EntityFormPageError({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
    </Card>
  );
}
