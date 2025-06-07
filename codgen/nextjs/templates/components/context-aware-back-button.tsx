"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EntityCreationContext {
  originRoute: string;
  originEntityName: string;
  targetEntityName: string;
  createdFrom: string;
}

interface ContextAwareBackButtonProps {
  defaultRoute: string;
  defaultLabel: string;
  entityName: string;
}

export function ContextAwareBackButton({ 
  defaultRoute, 
  defaultLabel, 
  entityName 
}: ContextAwareBackButtonProps) {
  const [backInfo, setBackInfo] = useState<{ route: string; label: string }>({
    route: defaultRoute,
    label: defaultLabel
  });

  useEffect(() => {
    const contextStr = localStorage.getItem('entityCreationContext');
    if (contextStr) {
      try {
        const context: EntityCreationContext = JSON.parse(contextStr);
        
        if (context.createdFrom === 'relationship' && context.originEntityName) {
          setBackInfo({
            route: localStorage.getItem('returnUrl') || defaultRoute,
            label: `Back to ${context.originEntityName}`
          });
        }
      } catch (error) {
        console.warn('Failed to parse entity creation context:', error);
        localStorage.removeItem('entityCreationContext');
      }
    }

    const referrerInfoStr = localStorage.getItem('referrerInfo');
    if (referrerInfoStr && !contextStr) {
      try {
        const referrerInfo = JSON.parse(referrerInfoStr);
        const isRecent = Date.now() - referrerInfo.timestamp < 10 * 60 * 1000;
        
        if (isRecent && referrerInfo.url && referrerInfo.entityType) {
          const entityDisplayName = getEntityDisplayName(referrerInfo.entityType);
          setBackInfo({
            route: referrerInfo.url,
            label: `Back to ${entityDisplayName}`
          });
        } else {
          localStorage.removeItem('referrerInfo');
        }
      } catch (error) {
        console.warn('Failed to parse referrer info:', error);
        localStorage.removeItem('referrerInfo');
      }
    }
  }, [defaultRoute]);

  const getEntityDisplayName = (entityType: string): string => {
    // Convert from PascalCase to Title Case and pluralize
    const words = entityType.replace(/([A-Z])/g, ' $1').trim();
    const titleCase = words.charAt(0).toUpperCase() + words.slice(1).toLowerCase();
    
    // Simple pluralization
    if (titleCase.endsWith('y')) {
      return titleCase.slice(0, -1) + 'ies';
    } else if (titleCase.endsWith('s') || titleCase.endsWith('ch') || titleCase.endsWith('sh')) {
      return titleCase + 'es';
    } else {
      return titleCase + 's';
    }
  };

  const handleBackClick = () => {
    localStorage.removeItem('entityCreationContext');
    localStorage.removeItem('referrerInfo');
  };

  return (
    <Button variant="ghost" size="sm" asChild>
      <Link href={backInfo.route} onClick={handleBackClick}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        {backInfo.label}
      </Link>
    </Button>
  );
}