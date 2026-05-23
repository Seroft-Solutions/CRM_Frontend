'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { AlertTriangle, Camera, CameraOff, Keyboard, ScanBarcode, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { BarcodeScanFeedback } from './use-barcode-scanner';

type BarcodeFormat =
  | 'aztec'
  | 'code_128'
  | 'code_39'
  | 'code_93'
  | 'data_matrix'
  | 'ean_13'
  | 'ean_8'
  | 'itf'
  | 'pdf417'
  | 'qr_code'
  | 'upc_a'
  | 'upc_e';

type BarcodeDetectorInstance = {
  detect: (source: CanvasImageSource) => Promise<Array<{ rawValue?: string }>>;
};

type BarcodeDetectorConstructor = new (options?: {
  formats?: BarcodeFormat[];
}) => BarcodeDetectorInstance;

const BARCODE_FORMATS: BarcodeFormat[] = [
  'ean_13',
  'ean_8',
  'upc_a',
  'upc_e',
  'code_128',
  'code_39',
  'code_93',
  'qr_code',
  'data_matrix',
];

function getBarcodeDetector() {
  if (typeof window === 'undefined') return null;

  return (window as unknown as { BarcodeDetector?: BarcodeDetectorConstructor }).BarcodeDetector;
}

export function isNativeBarcodeDetectorAvailable() {
  return Boolean(getBarcodeDetector());
}

type BarcodeScannerProps = {
  className?: string;
  compact?: boolean;
  disabled?: boolean;
  feedback: BarcodeScanFeedback;
  flashKey: number;
  manualButtonLabel?: string;
  onScan: (code: string, source: 'camera' | 'manual') => void;
  open: boolean;
  scanLocked: boolean;
  showHeader?: boolean;
  showManualEntry?: boolean;
  showSupportedTargets?: boolean;
};

export function BarcodeScanner({
  className,
  compact = false,
  disabled,
  feedback,
  flashKey,
  manualButtonLabel = 'Enter',
  onScan,
  open,
  scanLocked,
  showHeader = true,
  showManualEntry = true,
  showSupportedTargets = true,
}: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectingRef = useRef(false);
  const lastCameraCodeRef = useRef<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [detectorWarning, setDetectorWarning] = useState<string | null>(null);
  const [manualValue, setManualValue] = useState('');
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!open || disabled) {
      setCameraReady(false);
      setCameraError(null);
      setDetectorWarning(null);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;

      return;
    }

    let cancelled = false;
    const Detector = getBarcodeDetector();

    setDetectorWarning(
      Detector
        ? null
        : 'Native barcode detection is not available in this browser. Use manual entry while the camera preview remains active.'
    );

    async function startCamera() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error(
            'Camera access is not available in this browser or this page is not running in a secure context.'
          );
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: 'environment' },
          },
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());

          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        setCameraReady(true);
        setCameraError(null);
      } catch (error) {
        setCameraReady(false);
        setCameraError(
          error instanceof Error && error.message
            ? error.message
            : 'Camera permission was denied or the camera could not be opened.'
        );
      }
    }

    void startCamera();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setCameraReady(false);
    };
  }, [disabled, open, retryKey]);

  useEffect(() => {
    if (!open || disabled || !cameraReady || scanLocked) return;

    let cancelled = false;
    const Detector = getBarcodeDetector();

    if (!Detector) return;

    const detector = new Detector({ formats: BARCODE_FORMATS });

    async function detectFrame() {
      if (cancelled) return;

      const video = videoRef.current;

      if (!video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || detectingRef.current) {
        window.setTimeout(detectFrame, 250);

        return;
      }

      detectingRef.current = true;

      try {
        const detections = await detector.detect(video);
        const code = detections.find((entry) => entry.rawValue)?.rawValue?.trim();

        if (code && code !== lastCameraCodeRef.current) {
          lastCameraCodeRef.current = code;
          onScan(code, 'camera');
        }
      } catch {
        // Individual detection failures are non-fatal; keep the camera session alive.
      } finally {
        detectingRef.current = false;
        window.setTimeout(detectFrame, 350);
      }
    }

    void detectFrame();

    return () => {
      cancelled = true;
      detectingRef.current = false;
    };
  }, [cameraReady, disabled, onScan, open, scanLocked]);

  useEffect(() => {
    if (!scanLocked) {
      lastCameraCodeRef.current = null;
    }
  }, [scanLocked]);

  const handleManualSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onScan(manualValue, 'manual');
    setManualValue('');
  };

  if (!open) return null;

  return (
    <div
      className={cn(
        'overflow-hidden rounded-lg border border-slate-800 bg-slate-950 text-white shadow-sm',
        className
      )}
    >
      {showHeader ? (
        <div className="flex min-w-0 flex-col gap-3 border-b border-slate-800 px-3 py-2 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-400 text-slate-950">
              <ScanBarcode className="h-4 w-4" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold">Receiving Scanner</div>
              <div className="text-xs text-slate-400 max-sm:line-clamp-2">
                Camera scans and manual entries use the same matching path.
              </div>
            </div>
          </div>
          <div
            className={cn(
              'w-fit max-w-full rounded-full px-3 py-1 text-xs font-semibold',
              feedback.variant === 'success' && 'bg-emerald-400 text-emerald-950',
              feedback.variant === 'warning' && 'bg-amber-300 text-amber-950',
              feedback.variant === 'error' && 'bg-rose-300 text-rose-950',
              feedback.variant === 'idle' && 'bg-slate-800 text-slate-200'
            )}
          >
            {feedback.message}
          </div>
        </div>
      ) : null}

      <div className={cn('grid gap-3 p-2 sm:p-3', compact && 'p-0 sm:p-0')}>
        <div
          className={cn(
            'relative h-[220px] w-full overflow-hidden rounded-md border border-slate-700 bg-black sm:h-[240px]',
            compact && 'h-[150px] sm:h-[170px]'
          )}
        >
          {cameraError ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-4 text-center sm:p-6">
              <CameraOff className="h-9 w-9 text-amber-300" aria-hidden="true" />
              <div className="space-y-1">
                <div className="text-sm font-semibold">Camera permission required</div>
                <div className="text-xs text-slate-400">{cameraError}</div>
              </div>
              <Button
                type="button"
                size="sm"
                className="min-h-11 bg-amber-300 text-amber-950 hover:bg-amber-200 sm:min-h-9"
                onClick={() => {
                  setCameraError(null);
                  setRetryKey((current) => current + 1);
                }}
              >
                Retry Camera
              </Button>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                muted
                playsInline
                className="h-full w-full object-cover"
                aria-label="Barcode scanner camera preview"
              />
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="h-24 w-64 max-w-[82%] rounded-md border-2 border-emerald-300/80 shadow-[0_0_0_999px_rgba(2,6,23,0.42)]" />
              </div>
              {flashKey > 0 ? (
                <div
                  key={flashKey}
                  className="pointer-events-none absolute inset-0 animate-ping bg-emerald-300/20"
                />
              ) : null}
            </>
          )}
          <div className="absolute left-2 top-2 flex max-w-[calc(100%-1rem)] items-center gap-2 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white backdrop-blur sm:left-3 sm:top-3">
            <Camera className="h-3.5 w-3.5" aria-hidden="true" />
            {cameraReady ? 'Camera active' : 'Starting camera'}
          </div>
          {scanLocked ? (
            <div className="absolute bottom-2 left-2 rounded-full bg-amber-300 px-3 py-1 text-xs font-bold text-amber-950 sm:bottom-3 sm:left-3">
              2s scan lock
            </div>
          ) : null}
        </div>

        {showManualEntry || showSupportedTargets || detectorWarning ? (
          <div className="space-y-3">
            {showManualEntry ? (
              <form
                onSubmit={handleManualSubmit}
                className="rounded-md border border-slate-800 bg-slate-900 p-3"
              >
                <label
                  htmlFor="receiving-scanner-manual-code"
                  className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-200"
                >
                  <Keyboard className="h-4 w-4 text-emerald-300" aria-hidden="true" />
                  Manual barcode or SKU
                </label>
                <div className="flex flex-col gap-2 min-[420px]:flex-row">
                  <Input
                    id="receiving-scanner-manual-code"
                    name="receivingScannerManualCode"
                    value={manualValue}
                    onChange={(event) => setManualValue(event.target.value)}
                    placeholder="Scan or type code…"
                    autoComplete="off"
                    spellCheck={false}
                    className="min-h-11 border-slate-700 bg-slate-950 text-base text-white placeholder:text-slate-500 sm:min-h-9 sm:text-sm"
                    disabled={disabled || scanLocked}
                  />
                  <Button
                    type="submit"
                    className="min-h-11 bg-emerald-400 text-slate-950 hover:bg-emerald-300 sm:min-h-9"
                    disabled={disabled || scanLocked}
                  >
                    {manualButtonLabel}
                  </Button>
                </div>
              </form>
            ) : null}

            {showSupportedTargets ? (
              <div className="rounded-md border border-slate-800 bg-slate-900 p-3 text-xs text-slate-300">
                <div className="mb-2 flex items-center gap-2 font-semibold text-slate-100">
                  <ShieldCheck className="h-4 w-4 text-emerald-300" aria-hidden="true" />
                  Supported targets
                </div>
                <div className="grid grid-cols-2 gap-1">
                  <span>EAN-13</span>
                  <span>EAN-8</span>
                  <span>UPC-A</span>
                  <span>UPC-E</span>
                  <span>Code128</span>
                  <span>Code39</span>
                  <span>Code93</span>
                  <span>QR</span>
                  <span>DataMatrix</span>
                </div>
              </div>
            ) : null}

            {detectorWarning ? (
              <div className="flex gap-2 rounded-md border border-amber-300/30 bg-amber-300/10 p-3 text-xs text-amber-100">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                {detectorWarning}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
