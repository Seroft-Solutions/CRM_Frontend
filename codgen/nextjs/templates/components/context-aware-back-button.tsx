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