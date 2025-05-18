"use client";

import React, { useEffect, useRef } from 'react';
import {
  Sheet,
  SheetContent
} from '@/components/ui/sheet';

export interface EntityFormSheetProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

/**
 * EntityFormSheet component - UI shell for sheet-style forms
 * This is a pure presentational component that renders the UI only
 */
export function EntityFormSheet({
  open,
  onClose,
  children
}: EntityFormSheetProps) {
  // Create stable refs for props and state
  const openRef = useRef(open);
  const onCloseRef = useRef(onClose);
  const isClosingRef = useRef(false);
  
  // Update refs when props change
  useEffect(() => {
    openRef.current = open;
    onCloseRef.current = onClose;
    
    // Reset closing state when form is opened
    if (open) {
      isClosingRef.current = false;
    }
  }, [open, onClose]);
  
  // Enhanced sheet closing with better handling for React 18 concurrency
  const handleOpenChange = React.useCallback((newOpen: boolean) => {
    // Critical: Only handle actual closing events (not opening events)
    if (newOpen === false && !isClosingRef.current) {
      // Set global closing flag immediately
      isClosingRef.current = true;
      console.log('EntityFormSheet: Sheet closing initiated');
      
      // Use setTimeout (macro task) instead of requestAnimationFrame or Promise.resolve
      // This ensures we're completely outside React's concurrent rendering cycle
      setTimeout(() => {
        try {
          // Only call onClose if still mounted and open
          if (openRef.current && typeof onCloseRef.current === 'function') {
            console.log('EntityFormSheet: Executing onClose callback');
            // Execute onClose in another setTimeout to further isolate it
            setTimeout(() => {
              try {
                onCloseRef.current();
              } catch (error) {
                console.error('EntityFormSheet: Error in onClose callback:', error);
              } finally {
                // Reset closing flag after sufficient delay regardless of outcome
                setTimeout(() => {
                  isClosingRef.current = false;
                  console.log('EntityFormSheet: Reset closing flag');
                }, 500);
              }
            }, 10);
          } else {
            // Reset the flag after a delay if no callback was executed
            setTimeout(() => {
              isClosingRef.current = false;
              console.log('EntityFormSheet: No callback executed, reset closing flag');
            }, 300);
          }
        } catch (error) {
          console.error('EntityFormSheet: Error in sheet closing handler:', error);
          // Reset the flag even if an error occurred
          isClosingRef.current = false;
        }
      }, 10);
    }
  }, []);

  return (
    <Sheet 
      open={open} 
      onOpenChange={handleOpenChange} 
      modal={true}
    >
      <SheetContent 
        className="entity-management-sheet w-full sm:max-w-md md:max-w-xl lg:max-w-2xl p-0 overflow-hidden border-0 shadow-lg dark:bg-gray-950"
        side="right"
      >
        <div className="h-full flex flex-col">
          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
}
