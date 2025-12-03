'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const DEFAULT_WARNING =
  'You have unsaved changes in Failed Import Entries. Leaving now will discard them.';

/**
 * Attaches page-level guards that warn the user before leaving when there are unsaved edits.
 * Covers tab close/refresh (native prompt) and in-app navigation with a styled dialog.
 */
export function useUnsavedChangesWarning(
  hasUnsavedChanges: boolean,
  message: string = DEFAULT_WARNING
) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchKey = useMemo(() => searchParams?.toString() ?? '', [searchParams]);
  const warningRef = useRef(message);
  const hasChangesRef = useRef(hasUnsavedChanges);
  const currentUrlRef = useRef<string>('');
  const pendingHrefRef = useRef<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    warningRef.current = message;
  }, [message]);

  useEffect(() => {
    hasChangesRef.current = hasUnsavedChanges;
  }, [hasUnsavedChanges]);

  useEffect(() => {
    if (!hasUnsavedChanges && dialogOpen) {
      pendingHrefRef.current = null;
      setDialogOpen(false);
    }
  }, [dialogOpen, hasUnsavedChanges]);

  useEffect(() => {
    currentUrlRef.current = window.location.href;
  }, [pathname, searchKey]);

  const closeDialog = () => {
    pendingHrefRef.current = null;
    setDialogOpen(false);
  };

  const proceedNavigation = () => {
    const href = pendingHrefRef.current;

    if (!href) {
      closeDialog();
      return;
    }

    pendingHrefRef.current = null;
    setDialogOpen(false);
    hasChangesRef.current = false;

    try {
      const url = new URL(href, window.location.href);

      if (url.origin === window.location.origin) {
        router.push(`${url.pathname}${url.search}${url.hash}`);
      } else {
        window.location.href = url.href;
      }
    } catch {
      router.push(href);
    }
  };

  useEffect(() => {
    if (!hasUnsavedChanges) {
      return;
    }

    const getMessage = () => warningRef.current || DEFAULT_WARNING;
    const promptNavigation = (href: string) => {
      pendingHrefRef.current = href;
      setDialogOpen(true);
    };

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasChangesRef.current) return;

      event.preventDefault();
      // Modern browsers ignore the custom message but require returnValue to trigger the dialog.
      event.returnValue = getMessage();
    };

    const handleAnchorClick = (event: MouseEvent) => {
      if (!hasChangesRef.current) return;

      const target = event.target as HTMLElement | null;
      const anchor = target?.closest('a');

      if (!anchor || event.defaultPrevented) return;

      // Allow opening in new tab/window or downloads without blocking.
      if (anchor.target && anchor.target !== '_self') return;
      if (anchor.hasAttribute('download')) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0)
        return;

      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#')) return;

      let url: URL;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return;
      }

      const isSameLocation =
        url.origin === window.location.origin &&
        url.pathname === window.location.pathname &&
        url.search === window.location.search &&
        url.hash === window.location.hash;

      if (isSameLocation) return;

      event.preventDefault();
      promptNavigation(url.href);
    };

    const handlePopState = () => {
      if (!hasChangesRef.current) return;

      const targetHref = window.location.href;

      // Restore the previous URL and surface our dialog instead.
      history.pushState(null, '', currentUrlRef.current || targetHref);
      currentUrlRef.current = window.location.href;
      promptNavigation(targetHref);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('click', handleAnchorClick, true);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('click', handleAnchorClick, true);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [hasUnsavedChanges, router]);

  return {
    dialog: (
      <AlertDialog open={dialogOpen} onOpenChange={(open) => (!open ? closeDialog() : null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave without saving?</AlertDialogTitle>
            <AlertDialogDescription>{warningRef.current}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => closeDialog()}>Stay on page</AlertDialogCancel>
            <AlertDialogAction onClick={proceedNavigation}>Leave anyway</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    ),
  };
}
