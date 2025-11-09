'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

const formatSegmentText = (segment: string): string => {
  return segment
    .replace(/-/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const isDynamicSegment = (segment: string): boolean => {
  return segment.startsWith('[') && segment.endsWith(']');
};

export function DynamicBreadcrumbs() {
  const pathname = usePathname();

  if (pathname === '/') {
    return null;
  }

  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) {
    return null;
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {/* Always include Home as the first breadcrumb if not already on home */}
        {segments[0] !== 'dashboard' && (
          <>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink href="/dashboard">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
          </>
        )}

        {segments.map((segment, index) => {
          const href = `/${segments.slice(0, index + 1).join('/')}`;

          const segmentText = isDynamicSegment(segment) ? 'Details' : formatSegmentText(segment);

          const isLastSegment = index === segments.length - 1;

          return (
            <React.Fragment key={segment}>
              <BreadcrumbItem>
                {isLastSegment ? (
                  <BreadcrumbPage>{segmentText}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={href}>{segmentText}</BreadcrumbLink>
                )}
              </BreadcrumbItem>

              {!isLastSegment && <BreadcrumbSeparator />}
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
