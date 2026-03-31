import React, { useState, useRef, useCallback } from 'react';
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Camera, Upload, Link, X, RotateCcw, Check } from 'lucide-react';

// ─── Crop helper: canvas extraction ─────────────────────────────────────────
function getCroppedImageDataUrl(
  image: HTMLImageElement,
  crop: PixelCrop,
  maxSize = 512
): string {
  const canvas = document.createElement('canvas');
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  const srcW = crop.width * scaleX;
  const srcH = crop.height * scaleY;

  // Scale output to maxSize to keep the data URL manageable
  const ratio = Math.min(maxSize / srcW, maxSize / srcH, 1);
  canvas.width = Math.round(srcW * ratio);
  canvas.height = Math.round(srcH * ratio);

  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    srcW,
    srcH,
    0,
    0,
    canvas.width,
    canvas.height
  );

  return canvas.toDataURL('image/jpeg', 0.85);
}

// ─── Props ───────────────────────────────────────────────────────────────────
interface ImageUploadCropperProps {
  value?: string;               // current image URL or data URL
  onChange: (url: string) => void;
  size?: number;                // px dimension of the placeholder (default 80)
  className?: string;
}

type Step = 'idle' | 'pick' | 'crop';

export const ImageUploadCropper: React.FC<ImageUploadCropperProps> = ({
  value,
  onChange,
  size = 80,
  className = '',
}) => {
  const [step, setStep] = useState<Step>('idle');
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [urlError, setUrlError] = useState('');
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [loadError, setLoadError] = useState(false);

  const imgRef = useRef<HTMLImageElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Open picker dialog ──
  const handleOpen = () => {
    setStep('pick');
    setImageSrc(null);
    setUrlInput('');
    setUrlError('');
    setLoadError(false);
    setCrop(undefined);
    setCompletedCrop(undefined);
  };

  // ── File selected ──
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/^image\/(jpeg|png|jpg)$/)) {
      setUrlError('Please select a JPEG or PNG image.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUrlError('Image must be under 10 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
      setStep('crop');
      setUrlError('');
    };
    reader.readAsDataURL(file);

    // Reset input so the same file can be selected again
    e.target.value = '';
  };

  // ── URL submitted ──
  const handleUrlSubmit = () => {
    const url = urlInput.trim();
    if (!url) return;

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      setUrlError('Please enter a valid URL.');
      return;
    }

    // Test that the URL actually loads as an image
    const testImg = new Image();
    testImg.crossOrigin = 'anonymous';
    testImg.onload = () => {
      setImageSrc(url);
      setStep('crop');
      setUrlError('');
    };
    testImg.onerror = () => {
      setUrlError('Could not load image from that URL. Make sure it is a direct link to a publicly accessible image.');
    };
    testImg.src = url;
  };

  // ── When the crop image loads, set a default center crop ──
  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    imgRef.current = e.currentTarget;
    const { width, height } = e.currentTarget;
    const cropSize = Math.min(width, height) * 0.8;
    setCrop({
      unit: 'px',
      x: (width - cropSize) / 2,
      y: (height - cropSize) / 2,
      width: cropSize,
      height: cropSize,
    });
  }, []);

  // ── Save cropped image ──
  const handleSaveCrop = () => {
    if (!imgRef.current || !completedCrop) {
      // If no crop was made, use the full image
      if (imageSrc) {
        onChange(imageSrc);
      }
      setStep('idle');
      return;
    }

    const dataUrl = getCroppedImageDataUrl(imgRef.current, completedCrop);
    if (dataUrl) {
      onChange(dataUrl);
    }
    setStep('idle');
  };

  // ── Use full image without cropping ──
  const handleSkipCrop = () => {
    if (imageSrc) {
      onChange(imageSrc);
    }
    setStep('idle');
  };

  // ── Remove image ──
  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setStep('idle');
  };

  // ── Close dialog ──
  const handleClose = () => {
    setStep('idle');
    setImageSrc(null);
    setUrlInput('');
    setUrlError('');
  };

  return (
    <>
      {/* ── Clickable Photo Placeholder ── */}
      <div className={`relative group ${className}`}>
        <button
          type="button"
          onClick={handleOpen}
          className="relative overflow-hidden rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center transition-all hover:border-blue-400 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          style={{ width: size, height: size }}
          title="Click to upload or change photo"
        >
          {value && !loadError ? (
            <>
              <img
                src={value}
                alt="Equipment"
                className="w-full h-full object-cover"
                onError={() => setLoadError(true)}
              />
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="w-5 h-5 text-white" />
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-1">
              <Camera className="w-6 h-6 text-gray-300 group-hover:text-blue-400 transition-colors" />
              <span className="text-[9px] text-gray-400 group-hover:text-blue-500 transition-colors font-medium">Add Photo</span>
            </div>
          )}
        </button>

        {/* Remove button */}
        {value && !loadError && (
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-600"
            title="Remove photo"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/jpg"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* ── Picker Modal Overlay ── */}
      {step !== 'idle' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50" onClick={handleClose} />

          {/* Dialog */}
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">
                {step === 'pick' ? 'Add Equipment Photo' : 'Crop Image'}
              </h3>
              <button onClick={handleClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* ── Step 1: Pick Source ── */}
            {step === 'pick' && (
              <div className="p-5 space-y-4">
                {/* Upload from computer */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center gap-4 px-4 py-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-blue-400 hover:bg-blue-50/50 transition-all group"
                >
                  <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                    <Upload className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-gray-900">Upload from Computer</p>
                    <p className="text-xs text-gray-500 mt-0.5">JPEG or PNG, up to 10 MB</p>
                  </div>
                </button>

                {/* Divider */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 border-t border-gray-200" />
                  <span className="text-xs text-gray-400 font-medium">OR</span>
                  <div className="flex-1 border-t border-gray-200" />
                </div>

                {/* Paste URL */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-12 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                      <Link className="w-5 h-5 text-gray-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900 mb-1.5">Paste Image URL</p>
                      <div className="flex gap-2">
                        <input
                          value={urlInput}
                          onChange={e => { setUrlInput(e.target.value); setUrlError(''); }}
                          onKeyDown={e => e.key === 'Enter' && handleUrlSubmit()}
                          placeholder="https://example.com/photo.jpg"
                          className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                        />
                        <button
                          type="button"
                          onClick={handleUrlSubmit}
                          disabled={!urlInput.trim()}
                          className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          Load
                        </button>
                      </div>
                    </div>
                  </div>
                  {urlError && (
                    <p className="text-xs text-red-600 ml-14">{urlError}</p>
                  )}
                </div>
              </div>
            )}

            {/* ── Step 2: Crop ── */}
            {step === 'crop' && imageSrc && (
              <div className="p-5 space-y-4">
                <p className="text-xs text-gray-500">
                  Drag to adjust the crop area, then click <strong>Save</strong>.
                </p>

                {/* Crop area */}
                <div className="flex justify-center bg-gray-100 rounded-xl p-2 max-h-[400px] overflow-auto">
                  <ReactCrop
                    crop={crop}
                    onChange={(c) => setCrop(c)}
                    onComplete={(c) => setCompletedCrop(c)}
                    aspect={1}
                    circularCrop={false}
                    className="max-w-full"
                  >
                    <img
                      src={imageSrc}
                      alt="Crop preview"
                      onLoad={onImageLoad}
                      crossOrigin="anonymous"
                      style={{ maxHeight: '360px', maxWidth: '100%' }}
                    />
                  </ReactCrop>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => { setStep('pick'); setImageSrc(null); setCrop(undefined); setCompletedCrop(undefined); }}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Choose Different
                  </button>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleSkipCrop}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Use Full Image
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveCrop}
                      className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Save
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
