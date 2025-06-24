'use client';

import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface SpinnerProps {
  className?: string;
  size?: number;
}

export function Spinner({ className, size = 24 }: SpinnerProps) {
  return (
    <Loader2 className={cn('h-6 w-6 animate-spin', className)} size={size} aria-hidden="true" />
  );
}

export default Spinner;
