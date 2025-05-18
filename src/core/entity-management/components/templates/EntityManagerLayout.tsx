import React, { ReactNode } from 'react';
import { ErrorBoundary } from '../ErrorBoundary';
import { EntityNoAccess } from '../atoms';
import { useEntityManager } from '../../context';

interface EntityManagerLayoutProps {
  children: ReactNode;
}

/**
 * Layout template for the EntityManager component
 */
export function EntityManagerLayout({ children }: EntityManagerLayoutProps) {
  const { canView, labels } = useEntityManager();
  
  // If no permissions, don't render the component
  if (!canView) {
    return <EntityNoAccess entityNamePlural={labels.entityNamePlural} />;
  }
  
  return (
    <ErrorBoundary 
      onError={(error) => console.error('Error in EntityManager:', error.message)}
      resetOnPropsChange
    >
      <div className="space-y-6 w-full">
        {children}
      </div>
    </ErrorBoundary>
  );
}
