import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Camera, CheckCircle2, AlertCircle, ScanLine, Keyboard, ArrowLeft } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../../store';
import { Button, Card, Input } from '../../components/ui';

type ScanStatus = 'idle' | 'scanning' | 'success' | 'error';

declare global {
  interface Window {
    BarcodeDetector?: {
      new (options?: { formats?: string[] }): BarcodeDetectorInstance;
      getSupportedFormats?: () => Promise<string[]>;
    };
  }

  interface BarcodeDetectorInstance {
    detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue?: string }>>;
  }
}

export const ScannerPage: React.FC = () => {
  const { deviceCode = '' } = useParams<{ deviceCode: string }>();
  const navigate = useNavigate();
  const { trackingDevices, workflows, orders, processTrackingDeviceOrderScan } = useStore();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const detectorRef = useRef<BarcodeDetectorInstance | null>(null);
  const processingRef = useRef(false);

  const [status, setStatus] = useState<ScanStatus>('idle');
  const [message, setMessage] = useState('Point the camera at a Work Order QR code.');
  const [manualValue, setManualValue] = useState('');
  const [lastOrderNumber, setLastOrderNumber] = useState('');
  const [cameraReady, setCameraReady] = useState(false);

  const normalizedCode = deviceCode.trim().toUpperCase();
  const device = trackingDevices.find((item) => item.code.toUpperCase() === normalizedCode) || null;
  const workflow = workflows.find((item) => item.id === device?.workflowId) || null;
  const stage = workflow?.stages.find((item) => item.id === device?.stageId) || null;

  const canUseBarcodeDetector = useMemo(
    () => typeof window !== 'undefined' && 'BarcodeDetector' in window,
    [],
  );

  useEffect(() => {
    if (!device || !device.isActive) {
      setStatus('error');
      setMessage('This tracking device is invalid or inactive.');
      return;
    }

    if (!canUseBarcodeDetector) {
      setStatus('idle');
      setMessage('Camera scanning is not available on this browser. Use manual entry below.');
      return;
    }

    let cancelled = false;

    const startScanner = async () => {
      try {
        detectorRef.current = new window.BarcodeDetector!({ formats: ['qr_code'] });
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
          },
          audio: false,
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
        setStatus('scanning');
        setMessage('Scanning for Work Order QR codes...');

        const scanLoop = async () => {
          if (cancelled || !videoRef.current || !detectorRef.current) return;

          if (!processingRef.current && videoRef.current.readyState >= 2) {
            try {
              const results = await detectorRef.current.detect(videoRef.current);
              const rawValue = results[0]?.rawValue;
              if (rawValue) {
                processingRef.current = true;
                await handleScannedValue(rawValue);
                processingRef.current = false;
              }
            } catch {
              // Ignore frame-level detector errors and continue scanning.
            }
          }

          animationFrameRef.current = window.requestAnimationFrame(scanLoop);
        };

        animationFrameRef.current = window.requestAnimationFrame(scanLoop);
      } catch (error) {
        setStatus('error');
        setMessage('Unable to access the camera. Use manual entry below.');
      }
    };

    startScanner();

    return () => {
      cancelled = true;
      if (animationFrameRef.current) window.cancelAnimationFrame(animationFrameRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach((track) => track.stop());
    };
  }, [canUseBarcodeDetector, device]);

  const extractOrderNumber = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return '';

    const directMatch = trimmed.match(/\bO\d{6}\b/i);
    if (directMatch) return directMatch[0].toUpperCase();

    try {
      const url = new URL(trimmed, window.location.origin);
      const pathMatch = url.pathname.match(/\/OrderTracker\/([^/?#]+)/i);
      if (pathMatch?.[1]) return decodeURIComponent(pathMatch[1]).toUpperCase();
    } catch {
      // Non-URL raw values are handled by direct match above.
    }

    return '';
  };

  const handleScannedValue = async (rawValue: string) => {
    if (!device) return;

    const orderNumber = extractOrderNumber(rawValue);
    if (!orderNumber) {
      setStatus('error');
      setMessage('Scanned QR code did not contain a valid Work Order number.');
      return;
    }

    const result = processTrackingDeviceOrderScan(device.id, orderNumber);
    if (!result.success) {
      setStatus('error');
      setMessage(result.message);
      return;
    }

    setLastOrderNumber(orderNumber);
    setStatus('success');
    setMessage(result.message);
    setManualValue('');

    window.setTimeout(() => {
      setStatus(cameraReady ? 'scanning' : 'idle');
      setMessage(cameraReady ? 'Scanning for Work Order QR codes...' : 'Point the camera at a Work Order QR code.');
    }, 1600);
  };

  const handleManualSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await handleScannedValue(manualValue);
  };

  const scannedOrder = orders.find((item) => item.number === lastOrderNumber) || null;

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-md space-y-4">
        <div className="flex items-center justify-between">
          <Link to="/settings" className="inline-flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-900">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          {device && (
            <button
              type="button"
              onClick={() => navigate(`/tracker?order=${encodeURIComponent(lastOrderNumber || '')}&device=${encodeURIComponent(device.code)}`)}
              className="text-xs font-medium text-blue-600 hover:text-blue-700"
            >
              Open Tracker
            </button>
          )}
        </div>

        <Card className="overflow-hidden border border-gray-200 bg-white/95 shadow-lg">
          <div className="border-b border-gray-100 px-5 py-4">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">Tracking Device Scanner</div>
            <h1 className="mt-1 text-xl font-semibold text-gray-900">{device?.name || 'Unknown Device'}</h1>
            <p className="mt-1 text-sm text-gray-500">
              {workflow?.name || 'No board assigned'}{stage ? ` • ${stage.name}` : ''}
            </p>
          </div>

          <div className="p-5 space-y-4">
            <div className="relative overflow-hidden rounded-2xl bg-gray-950">
              <video ref={videoRef} playsInline muted className="aspect-[3/4] w-full object-cover" />
              {!cameraReady && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gray-950/90 text-center text-white">
                  <Camera className="h-8 w-8 text-gray-300" />
                  <p className="max-w-xs text-sm text-gray-200">Allow camera access to scan Work Order QR codes from this device.</p>
                </div>
              )}
              <div className="pointer-events-none absolute inset-x-8 top-12 bottom-12 rounded-[28px] border-2 border-white/70 shadow-[0_0_0_999px_rgba(15,23,42,0.18)]" />
              <div className="absolute bottom-4 left-4 right-4 rounded-xl bg-black/45 px-4 py-3 text-xs text-white backdrop-blur">
                Scan mode moves the entire work order to this device’s configured board and stage.
              </div>
            </div>

            <div className={`rounded-xl border px-4 py-3 text-sm ${
              status === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : status === 'error' ? 'border-red-200 bg-red-50 text-red-700'
                : 'border-gray-200 bg-gray-50 text-gray-600'
            }`}>
              <div className="flex items-center gap-2">
                {status === 'success' && <CheckCircle2 className="h-4 w-4" />}
                {status === 'error' && <AlertCircle className="h-4 w-4" />}
                {(status === 'idle' || status === 'scanning') && <ScanLine className="h-4 w-4" />}
                <span>{message}</span>
              </div>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-3">
              <Input
                label="Manual QR Value / Order Number"
                value={manualValue}
                onChange={e => setManualValue(e.target.value)}
                placeholder="Paste QR URL or enter order number, e.g. O000123"
                prefix={<Keyboard className="h-3.5 w-3.5" />}
              />
              <Button variant="secondary" className="w-full justify-center" type="submit">
                Process Scan
              </Button>
            </form>

            {scannedOrder && (
              <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-500">Last scanned</div>
                <div className="mt-1 text-sm font-semibold text-blue-900">{scannedOrder.number}</div>
                <div className="text-sm text-blue-700">{scannedOrder.title}</div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
