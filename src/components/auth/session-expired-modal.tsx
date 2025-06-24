'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSessionManager } from '@/providers/session-manager';

interface SessionExpiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRetryAuth: () => void;
  type?: 'expired' | 'warning';
  minutesLeft?: number;
}

export function SessionExpiredModal({
  isOpen,
  onClose,
  onRetryAuth,
  type = 'expired',
  minutesLeft,
}: SessionExpiredModalProps) {
  const [isReauthorizing, setIsReauthorizing] = useState(false);
  const { refreshSession } = useSessionManager();

  const handleContinue = async () => {
    setIsReauthorizing(true);
    try {
      await signIn('keycloak', {
        callbackUrl: window.location.href,
        redirect: true,
      });
    } catch (error) {
      console.error('Re-authentication failed:', error);
      onRetryAuth();
    } finally {
      setIsReauthorizing(false);
    }
  };

  const handleRefreshSession = async () => {
    setIsReauthorizing(true);
    try {
      const success = await refreshSession();
      if (success) {
        onClose();
      } else {
        await handleContinue();
      }
    } catch (error) {
      console.error('Session refresh failed:', error);
      await handleContinue();
    } finally {
      setIsReauthorizing(false);
    }
  };

  useEffect(() => {
    // Automatically attempt re-authentication when expired modal opens
    if (isOpen && type === 'expired') {
      handleContinue();
    }

    // Prevent closing modal with escape key for expired sessions
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && type === 'expired') {
        event.preventDefault();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, type]);

  if (type === 'warning') {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Session Expiring Soon
            </DialogTitle>
            <DialogDescription>
              Your session will expire in {minutesLeft} minute{minutesLeft !== 1 ? 's' : ''}. Would
              you like to extend your session?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={isReauthorizing}>
              Dismiss
            </Button>
            <Button onClick={handleRefreshSession} disabled={isReauthorizing}>
              {isReauthorizing && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
              Extend Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={type === 'expired' ? undefined : onClose}>
      <DialogContent
        className={cn(
          'sm:max-w-md',
          type === 'expired' && '[&>button]:hidden' // Hide close button for expired sessions
        )}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Session Expired
          </DialogTitle>
          <DialogDescription>
            Your session has expired for security reasons. Please sign in again to continue.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <div className="flex w-full items-center justify-center gap-2 py-2">
            {isReauthorizing && <RefreshCw className="h-4 w-4 animate-spin" />}
            <span>Re-authenticating...</span>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
