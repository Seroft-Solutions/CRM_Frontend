'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';

interface ClickableIdProps {
  id: string | number;
  entityType: string;
  className?: string;
}

/**
 * ClickableId component renders an ID value as a clickable link that navigates to the entity's view page.
 * The routing pattern follows: /{entityType}/{id}
 *
 * @param id - The ID value to display and link to
 * @param entityType - The entity type (plural form, e.g., 'products', 'customers', 'groups')
 * @param className - Optional CSS classes
 */
export function ClickableId({ id, entityType, className }: ClickableIdProps) {
  const href = `/${entityType}/${id}`;

  return (
    <Link
      href={href}
      className={cn(
        'text-blue-600 hover:text-blue-800 underline hover:no-underline transition-colors cursor-pointer',
        className
      )}
      title={`View ${entityType.slice(0, -1)} details`}
    >
      {id}
    </Link>
  );
}