'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type ScanFeedbackVariant = 'idle' | 'success' | 'warning' | 'error';

export type BarcodeScanSource = 'camera' | 'manual';

export type BarcodeScanResult = {
  accepted: boolean;
  message: string;
  variant: ScanFeedbackVariant;
};

export type BarcodeScanFeedback = {
  message: string;
  variant: ScanFeedbackVariant;
};

type UseBarcodeScannerOptions = {
  lockMs?: number;
  onScan: (code: string, source: BarcodeScanSource) => BarcodeScanResult;
};

export function normalizeScannedCode(value: string) {
  return value.trim().replace(/\s+/g, ' ').toUpperCase();
}

function playScanTone(variant: ScanFeedbackVariant) {
  if (typeof window === 'undefined') return;

  const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;

  if (!AudioContextConstructor) return;

  try {
    const context = new AudioContextConstructor();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const frequency =
      variant === 'success' ? 880 : variant === 'warning' ? 440 : variant === 'error' ? 220 : 660;

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, context.currentTime);
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.12, context.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.16);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.18);

    window.setTimeout(() => {
      void context.close();
    }, 240);
  } catch {
    // Browser audio policy can block feedback until a user gesture occurs.
  }
}

export function useBarcodeScanner({ lockMs = 2000, onScan }: UseBarcodeScannerOptions) {
  const [scanLocked, setScanLocked] = useState(false);
  const [lastScan, setLastScan] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<BarcodeScanFeedback>({
    message: 'Ready to scan',
    variant: 'idle',
  });
  const [flashKey, setFlashKey] = useState(0);
  const lockTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (lockTimerRef.current) {
        window.clearTimeout(lockTimerRef.current);
      }
    };
  }, []);

  const clearLockTimer = useCallback(() => {
    if (lockTimerRef.current) {
      window.clearTimeout(lockTimerRef.current);
      lockTimerRef.current = null;
    }
  }, []);

  const submitScan = useCallback(
    (rawCode: string, source: BarcodeScanSource) => {
      if (scanLocked) {
        const result: BarcodeScanResult = {
          accepted: false,
          message: 'Scan lock active',
          variant: 'warning',
        };

        setFeedback(result);
        playScanTone('warning');

        return result;
      }

      const code = normalizeScannedCode(rawCode);

      if (!code) {
        const result: BarcodeScanResult = {
          accepted: false,
          message: 'Enter a barcode or SKU',
          variant: 'warning',
        };

        setFeedback(result);
        playScanTone('warning');

        return result;
      }

      const result = onScan(code, source);

      setLastScan(code);
      setFeedback({
        message: result.message,
        variant: result.variant,
      });
      playScanTone(result.variant);

      if (result.accepted) {
        setFlashKey((current) => current + 1);
        setScanLocked(true);
        clearLockTimer();
        lockTimerRef.current = window.setTimeout(() => {
          setScanLocked(false);
          lockTimerRef.current = null;
        }, lockMs);
      }

      return result;
    },
    [clearLockTimer, lockMs, onScan, scanLocked]
  );

  const resetFeedback = useCallback(() => {
    setFeedback({
      message: 'Ready to scan',
      variant: 'idle',
    });
  }, []);

  return {
    feedback,
    flashKey,
    lastScan,
    resetFeedback,
    scanLocked,
    submitScan,
  };
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}
