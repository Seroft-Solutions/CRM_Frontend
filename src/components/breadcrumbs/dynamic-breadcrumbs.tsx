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
} from "@/components/ui/breadcrumb";

// Function to format segment text
const formatSegmentText = (segment: string): string => {
  // Replace hyphens with spaces and capitalize each word
  return segment
    .replace(/-/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Check if a segment is dynamic (e.g., [id], [userId])
const isDynamicSegment = (segment: string): boolean => {
  return segment.startsWith('[') && segment.endsWith(']');
};

export function DynamicBreadcrumbs() {
  const pathname = usePathname();
  
  // Skip rendering breadcrumbs on the root path
  if (pathname === '/') {
    return null;
  }

  // Split the pathname into segments and remove empty segments
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
          // Calculate the href for this breadcrumb
          const href = `/${segments.slice(0, index + 1).join('/')}`;
          
          // Format the segment text
          const segmentText = isDynamicSegment(segment) 
            ? 'Details' // Default text for dynamic segments
            : formatSegmentText(segment);
          
          // Determine if this is the last segment (current page)
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
