/**
 * Session Expired Modal Component
 * Handles session expiry with full background blur and interaction prevention
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { signIn } from 'next-auth/react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, LogOut } from 'lucide-react';

interface SessionExpiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRetryAuth: () => void;
  type?: 'expired' | 'warning' | 'idle';
  minutesLeft?: number;
  refreshSession?: () => Promise<boolean>;
  onLogout?: () => void;
  isIdleTimeout?: boolean;
}

export function SessionExpiredModal({
  isOpen,
  onClose,
  onRetryAuth,
  type = 'expired',
  minutesLeft,
  refreshSession,
  onLogout,
  isIdleTimeout = false,
}: SessionExpiredModalProps) {
  const [isReauthorizing, setIsReauthorizing] = useState(false);

  // Safety wrapper to prevent closing expired/idle modals
  const safeOnClose = useCallback(() => {
    // Only allow closing for warning modals
    if (type === 'warning') {
      onClose();
    }
    // For expired/idle modals, do nothing - they can only be closed via logout
  }, [type, onClose]);

  // Apply blur and prevent interactions when session expired or idle
  useEffect(() => {
    if (isOpen && (type === 'expired' || type === 'idle')) {
      // Store original styles to restore later
      const originalBodyStyle = {
        overflow: document.body.style.overflow,
        pointerEvents: document.body.style.pointerEvents,
        userSelect: document.body.style.userSelect,
      };

      // Apply styles to prevent all interactions
      document.body.style.overflow = 'hidden';
      document.body.style.pointerEvents = 'none';
      document.body.style.userSelect = 'none';
      document.body.classList.add('session-locked');

      // Create and add blur overlay with high z-index
      const blurOverlay = document.createElement('div');
      blurOverlay.id = 'session-blur-overlay';
      blurOverlay.setAttribute('aria-hidden', 'true');
      blurOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        -moz-backdrop-filter: blur(12px);
        z-index: 98;
        pointer-events: all;
      `;
      document.body.appendChild(blurOverlay);

      // Focus trap - ensure focus stays within modal
      const modalElement = document.querySelector('[data-session-modal="true"]') as HTMLElement;
      const focusableElements = modalElement?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as NodeListOf<HTMLElement>;
      const firstFocusableElement = focusableElements?.[0];
      const lastFocusableElement = focusableElements?.[focusableElements.length - 1];

      // Comprehensive event blocking
      const preventKeyboard = (e: KeyboardEvent) => {
        const target = e.target as HTMLElement;
        const isInModal = target.closest('[data-session-modal="true"]');

        // Handle focus trap for Tab key within modal
        if (e.key === 'Tab' && isInModal) {
          if (e.shiftKey) {
            if (document.activeElement === firstFocusableElement) {
              lastFocusableElement?.focus();
              e.preventDefault();
            }
          } else {
            if (document.activeElement === lastFocusableElement) {
              firstFocusableElement?.focus();
              e.preventDefault();
            }
          }
        }
        // Block everything else except allowed keys in modal
        else if (!isInModal || !['Enter', 'Space'].includes(e.key)) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
        }
      };

      // Prevent all mouse interactions outside modal
      const preventMouse = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        const modalElement = document.querySelector('[data-session-modal="true"]');
        if (!modalElement?.contains(target)) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
        }
      };

      // Prevent context menu everywhere
      const preventContextMenu = (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
      };

      // Add event listeners with highest priority
      const eventOptions = { capture: true, passive: false };
      document.addEventListener('keydown', preventKeyboard, eventOptions);
      document.addEventListener('keyup', preventKeyboard, eventOptions);
      document.addEventListener('click', preventMouse, eventOptions);
      document.addEventListener('mousedown', preventMouse, eventOptions);
      document.addEventListener('mouseup', preventMouse, eventOptions);
      document.addEventListener('contextmenu', preventContextMenu, eventOptions);
      document.addEventListener('touchstart', preventMouse as any, eventOptions);
      document.addEventListener('touchend', preventMouse as any, eventOptions);

      // Auto-focus first element in modal
      setTimeout(() => {
        firstFocusableElement?.focus();
      }, 100);

      return () => {
        // Cleanup
        document.body.classList.remove('session-locked');

        // Remove blur overlay
        const existingOverlay = document.getElementById('session-blur-overlay');
        if (existingOverlay) {
          document.body.removeChild(existingOverlay);
        }

        // Restore original body styles
        Object.entries(originalBodyStyle).forEach(([property, value]) => {
          (document.body.style as any)[property] = value;
        });

        // Remove event listeners
        document.removeEventListener('keydown', preventKeyboard, eventOptions);
        document.removeEventListener('keyup', preventKeyboard, eventOptions);
        document.removeEventListener('click', preventMouse, eventOptions);
        document.removeEventListener('mousedown', preventMouse, eventOptions);
        document.removeEventListener('mouseup', preventMouse, eventOptions);
        document.removeEventListener('contextmenu', preventContextMenu, eventOptions);
        document.removeEventListener('touchstart', preventMouse as any, eventOptions);
        document.removeEventListener('touchend', preventMouse as any, eventOptions);
      };
    }
  }, [isOpen, type]);

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
    if (!refreshSession) {
      await handleContinue();
      return;
    }

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

  const handleLogout = async () => {
    if (onLogout) {
      await onLogout();
    } else {
      await handleContinue();
    }
  };

  // Warning modal (dismissible)
  if (type === 'warning') {
    return (
      <Dialog open={isOpen} onOpenChange={safeOnClose}>
        <DialogContent data-session-modal="true" className="sm:max-w-md bg-white">
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
            <Button variant="outline" onClick={safeOnClose} disabled={isReauthorizing}>
              Dismiss
            </Button>
            <Button onClick={handleRefreshSession} disabled={isReauthorizing} autoFocus>
              {isReauthorizing && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
              Extend Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Idle timeout modal (forced action required)
  if (type === 'idle') {
    return (
      <Dialog
        open={isOpen}
        onOpenChange={() => {}} // Prevent closing by any means
      >
        <DialogContent
          data-session-modal="true"
          className="sm:max-w-md z-[100] [&>button]:hidden border-2 border-orange-500/20 shadow-2xl bg-white"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="h-6 w-6 text-orange-500" />
              Session Expired Due to Inactivity
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Your session has been expired due to inactivity. For security reasons, you have been
              automatically logged out and must sign in again.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button
              onClick={handleLogout}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
              size="lg"
              autoFocus
              disabled={isReauthorizing}
            >
              {isReauthorizing ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Redirecting...
                </>
              ) : (
                <>
                  <LogOut className="mr-2 h-4 w-4" />
                  Login Again
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Session expired modal (forced action required)
  return (
    <Dialog
      open={isOpen}
      onOpenChange={() => {}} // Prevent closing
    >
      <DialogContent
        data-session-modal="true"
        className="sm:max-w-md z-[100] [&>button]:hidden border-2 border-red-500/20 shadow-2xl bg-white"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-6 w-6 text-red-500" />
            Session Expired
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Your session has expired for security reasons. Please sign in again to continue.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <div className="flex w-full items-center justify-center gap-2 py-4">
            {isReauthorizing ? (
              <>
                <RefreshCw className="h-5 w-5 animate-spin text-blue-500" />
                <span className="text-gray-600">Re-authenticating...</span>
              </>
            ) : (
              <Button
                onClick={handleContinue}
                className="w-full bg-red-600 hover:bg-red-700 text-white focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                size="lg"
                autoFocus
              >
                <LogOut className="mr-2 h-4 w-4" />
                Login Again
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
