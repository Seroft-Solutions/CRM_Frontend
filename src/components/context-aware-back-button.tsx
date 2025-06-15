"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ContextAwareBackButtonProps {
  defaultRoute: string;
  defaultLabel?: string;
  entityName: string;
}

export function ContextAwareBackButton({ 
  defaultRoute, 
  defaultLabel = "Back to Previous Page", 
  entityName 
}: ContextAwareBackButtonProps) {
  const [backRoute, setBackRoute] = useState(defaultRoute);

  useEffect(() => {
    const returnUrl = localStorage.getItem('returnUrl');
    if (returnUrl) {
      setBackRoute(returnUrl);
    }
  }, []);

  const handleBackClick = () => {
    // Clean up form state if coming from a form
    const currentPath = window.location.pathname;
    const isFromForm = currentPath.includes('/new') || currentPath.includes('/edit');
    
    if (isFromForm && entityName) {
      // Get current session ID and clean up form state
      const formSession = sessionStorage.getItem(`${entityName}FormSession`);
      if (formSession) {
        localStorage.removeItem(`${entityName}FormState_${formSession}`);
        sessionStorage.removeItem(`${entityName}FormSession`);
        
        // Clean up all old form states for this entity
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.startsWith(`${entityName}FormState_`)) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
      }
    }
    
    // Clean up navigation context
    localStorage.removeItem('entityCreationContext');
    localStorage.removeItem('referrerInfo');
    localStorage.removeItem('returnUrl');
  };

  return (
    <Button variant="ghost" size="sm" asChild>
      <Link href={backRoute} onClick={handleBackClick}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Previous Page
      </Link>
    </Button>
  );
}