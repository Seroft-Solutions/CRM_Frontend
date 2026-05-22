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
  disabled?: boolean;
  feedback: BarcodeScanFeedback;
  flashKey: number;
  onScan: (code: string, source: 'camera' | 'manual') => void;
  open: boolean;
  scanLocked: boolean;
};

export function BarcodeScanner({
  disabled,
  feedback,
  flashKey,
  onScan,
  open,
  scanLocked,
}: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectingRef = useRef(false);
  const lastCameraCodeRef = useRef<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [manualValue, setManualValue] = useState('');

  useEffect(() => {
    if (!open || disabled) {
      setCameraReady(false);
      setCameraError(null);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;

      return;
    }

    let cancelled = false;
    const Detector = getBarcodeDetector();

    if (!Detector) {
      setCameraError(
        'Native barcode detection is not available in this browser. Use manual entry.'
      );

      return;
    }

    async function startCamera() {
      try {
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
  }, [disabled, open]);

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
    <div className="overflow-hidden rounded-lg border border-slate-300 bg-slate-950 text-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-800 px-4 py-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-cyan-400 text-slate-950">
            <ScanBarcode className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-semibold">Pick & Pack scanner</div>
            <div className="text-xs text-slate-400">
              Camera scans and manual entries use the same matching path.
            </div>
          </div>
        </div>
        <div
          className={cn(
            'rounded-full px-3 py-1 text-xs font-semibold',
            feedback.variant === 'success' && 'bg-emerald-400 text-emerald-950',
            feedback.variant === 'warning' && 'bg-amber-300 text-amber-950',
            feedback.variant === 'error' && 'bg-rose-300 text-rose-950',
            feedback.variant === 'idle' && 'bg-slate-800 text-slate-200'
          )}
        >
          {feedback.message}
        </div>
      </div>

      <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="relative aspect-video overflow-hidden rounded-md border border-slate-700 bg-black">
          {cameraError ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
              <CameraOff className="h-9 w-9 text-amber-300" />
              <div className="space-y-1">
                <div className="text-sm font-semibold">Camera scanner unavailable</div>
                <div className="text-xs text-slate-400">{cameraError}</div>
              </div>
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
                <div className="h-28 w-72 max-w-[82%] rounded-md border-2 border-cyan-300/80 shadow-[0_0_0_999px_rgba(2,6,23,0.42)]" />
              </div>
              {flashKey > 0 ? (
                <div
                  key={flashKey}
                  className="pointer-events-none absolute inset-0 animate-ping bg-emerald-300/20"
                />
              ) : null}
            </>
          )}
          <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
            <Camera className="h-3.5 w-3.5" />
            {cameraReady ? 'Camera active' : 'Starting camera'}
          </div>
          {scanLocked ? (
            <div className="absolute bottom-3 left-3 rounded-full bg-amber-300 px-3 py-1 text-xs font-bold text-amber-950">
              2s scan lock
            </div>
          ) : null}
        </div>

        <div className="space-y-4">
          <form
            onSubmit={handleManualSubmit}
            className="rounded-md border border-slate-800 bg-slate-900 p-3"
          >
            <label className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-200">
              <Keyboard className="h-4 w-4 text-cyan-300" />
              Manual barcode or SKU
            </label>
            <div className="flex gap-2">
              <Input
                value={manualValue}
                onChange={(event) => setManualValue(event.target.value)}
                placeholder="Scan or type code"
                className="border-slate-700 bg-slate-950 text-white placeholder:text-slate-500"
                disabled={disabled || scanLocked}
              />
              <Button
                type="submit"
                className="bg-cyan-400 text-slate-950 hover:bg-cyan-300"
                disabled={disabled || scanLocked}
              >
                Enter
              </Button>
            </div>
          </form>

          <div className="rounded-md border border-slate-800 bg-slate-900 p-3 text-xs text-slate-300">
            <div className="mb-2 flex items-center gap-2 font-semibold text-slate-100">
              <ShieldCheck className="h-4 w-4 text-emerald-300" />
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

          {!isNativeBarcodeDetectorAvailable() ? (
            <div className="flex gap-2 rounded-md border border-amber-300/30 bg-amber-300/10 p-3 text-xs text-amber-100">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              This browser does not expose native BarcodeDetector. Manual entry remains available.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
