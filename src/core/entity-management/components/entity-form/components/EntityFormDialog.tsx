import React, { useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent
} from '@/components/ui/dialog';

export interface EntityFormDialogProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function EntityFormDialog({
  open,
  onClose,
  children
}: EntityFormDialogProps) {
  // Create stable refs to avoid hook ordering issues
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
  
  // Safely handle dialog closing with useCallback and guard against multiple executions
  const handleOpenChange = React.useCallback((newOpen: boolean) => {
    // Guard against infinite update loops during close
    if (newOpen === false && !isClosingRef.current) {
      // Set closing state to prevent multiple calls
      isClosingRef.current = true;
      
      // Use requestAnimationFrame instead of setTimeout for better reliability
      requestAnimationFrame(() => {
        if (typeof onCloseRef.current === 'function') {
          onCloseRef.current();
        }
      });
    }
  }, []);

  return (
    <Dialog 
      open={open} 
      onOpenChange={handleOpenChange} 
      modal={true}
    >
      <DialogContent className="entity-management-dialog w-[95vw] sm:w-[90vw] md:max-w-2xl lg:max-w-3xl shadow-lg border-0 dark:bg-gray-950 overflow-hidden rounded-lg p-0 sm:p-6 h-[90vh] sm:max-h-[85vh] flex flex-col">
        {children}
      </DialogContent>
    </Dialog>
  );
}
