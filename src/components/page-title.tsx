/**
 * Page title component
 */

'use client';

import { ReactNode } from 'react';

interface PageTitleProps {
  children: ReactNode;
  className?: string;
}

export function PageTitle({ children, className = '' }: PageTitleProps) {
  return <h1 className={`text-2xl font-bold tracking-tight ${className}`}>{children}</h1>;
}
