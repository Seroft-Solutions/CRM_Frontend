"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReferrerInfo {
  url: string;
  title: string;
  entityType: string;
  timestamp: number;
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
  const router = useRouter();

  useEffect(() => {
    // Check if we have referrer information
    const referrerInfoStr = localStorage.getItem('referrerInfo');
    if (referrerInfoStr) {
      try {
        const referrerInfo: ReferrerInfo = JSON.parse(referrerInfoStr);
        
        // Check if the referrer info is recent (within last 10 minutes)
        const isRecent = Date.now() - referrerInfo.timestamp < 10 * 60 * 1000;
        
        if (isRecent && referrerInfo.url && referrerInfo.entityType) {
          // Determine the entity display name
          const entityDisplayName = getEntityDisplayName(referrerInfo.entityType);
          
          setBackInfo({
            route: referrerInfo.url,
            label: `Back to ${entityDisplayName}`
          });
        } else {
          // Clean up old referrer info
          localStorage.removeItem('referrerInfo');
        }
      } catch (error) {
        console.warn('Failed to parse referrer info:', error);
        localStorage.removeItem('referrerInfo');
      }
    }
  }, []);

  const getEntityDisplayName = (entityType: string): string => {
    // Convert entity class names to human-readable display names
    const displayNames: Record<string, string> = {
      'Call': 'Calls',
      'Party': 'Parties', 
      'CallType': 'Call Types',
      'SubCallType': 'Sub Call Types',
      'Priority': 'Priorities',
      'Source': 'Sources',
      'Area': 'Areas',
      'CallCategory': 'Call Categories',
      'CallStatus': 'Call Status',
      'ChannelType': 'Channel Types',
      'Product': 'Products',
      'State': 'States',
      'District': 'Districts',
      'City': 'Cities',
    };

    return displayNames[entityType] || `${entityType}s`;
  };

  const handleBackClick = () => {
    // Clear referrer info after using it
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
