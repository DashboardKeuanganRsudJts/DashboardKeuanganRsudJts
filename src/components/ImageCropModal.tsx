import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  X, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Move, 
  Check, 
  RefreshCw, 
  Circle, 
  Square,
  Crop as CropIcon,
  Sparkles
} from 'lucide-react';

interface ImageCropModalProps {
  isOpen: boolean;
  imageSrc: string;
  onClose: () => void;
  onCropComplete: (croppedDataUrl: string) => void;
  isDark?: boolean;
}

const VIEWPORT_SIZE = 300; // px of the crop preview square
const OUTPUT_SIZE = 400; // px of the final crisp avatar image

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  isOpen,
  imageSrc,
  onClose,
  onCropComplete,
  isDark = true,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [initialOffset, setInitialOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [maskShape, setMaskShape] = useState<'circle' | 'square'>('circle');

  const imgRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Reset parameters when imageSrc changes or modal opens
  useEffect(() => {
    if (isOpen && imageSrc) {
      setImageLoaded(false);
      setZoom(1);
      setRotation(0);
      setOffset({ x: 0, y: 0 });
      setIsDragging(false);

      const img = new Image();
      img.onload = () => {
        setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
        setImageLoaded(true);
      };
      img.src = imageSrc;
      imgRef.current = img;
    }
  }, [isOpen, imageSrc]);

  // Calculate base scale to ensure image covers the crop viewport
  const getBaseScale = useCallback(() => {
    if (!naturalSize.width || !naturalSize.height) return 1;
    const isSideways = rotation === 90 || rotation === 270;
    const w = isSideways ? naturalSize.height : naturalSize.width;
    const h = isSideways ? naturalSize.width : naturalSize.height;
    return Math.max(VIEWPORT_SIZE / w, VIEWPORT_SIZE / h);
  }, [naturalSize, rotation]);

  // Handle Drag Start
  const handlePointerDown = (clientX: number, clientY: number) => {
    setIsDragging(true);
    setDragStart({ x: clientX, y: clientY });
    setInitialOffset({ ...offset });
  };

  // Handle Drag Move
  const handlePointerMove = (clientX: number, clientY: number) => {
    if (!isDragging) return;
    const dx = clientX - dragStart.x;
    const dy = clientY - dragStart.y;
    setOffset({
      x: initialOffset.x + dx,
      y: initialOffset.y + dy,
    });
  };

  // Handle Drag End
  const handlePointerUp = () => {
    setIsDragging(false);
  };

  // Handle Mouse Wheel Zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY * -0.0015;
    setZoom((prev) => Math.min(3, Math.max(1, prev + delta)));
  };

  // Handle Rotate 90deg
  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
    setOffset({ x: 0, y: 0 }); // Center after rotation
  };

  // Handle Reset to Center
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setOffset({ x: 0, y: 0 });
  };

  // Generate Cropped Image onto high-res Canvas
  const handleApplyCrop = () => {
    if (!imgRef.current || !naturalSize.width) return;

    const canvas = document.createElement('canvas');
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const baseScale = getBaseScale();
    const totalScale = baseScale * zoom;
    const renderScale = OUTPUT_SIZE / VIEWPORT_SIZE;

    ctx.save();
    // Translate to center of output canvas
    ctx.translate(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2);

    // Apply user translation scaled to output
    ctx.translate(offset.x * renderScale, offset.y * renderScale);

    // Apply rotation
    ctx.rotate((rotation * Math.PI) / 180);

    // Apply scaling
    const drawWidth = naturalSize.width * totalScale * renderScale;
    const drawHeight = naturalSize.height * totalScale * renderScale;

    // Draw image centered
    ctx.drawImage(
      imgRef.current,
      -drawWidth / 2,
      -drawHeight / 2,
      drawWidth,
      drawHeight
    );

    ctx.restore();

    // Export as high-quality JPEG
    const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.90);
    onCropComplete(croppedDataUrl);
    onClose();
  };

  if (!isOpen) return null;

  const baseScale = getBaseScale();
  const currentTotalScale = baseScale * zoom;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className={`w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden flex flex-col ${
          isDark 
            ? 'bg-[#0f151b] border-emerald-950/80 text-zinc-100' 
            : 'bg-white border-slate-200 text-slate-800'
        }`}
      >
        {/* MODAL HEADER */}
        <div className={`flex items-center justify-between px-5 py-4 border-b ${
          isDark ? 'border-emerald-950/80 bg-[#090d10]' : 'border-slate-200 bg-slate-50'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CropIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base">Sesuaikan & Crop Foto Profil</h3>
              <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                Geser dan atur perbesaran untuk memilih area foto yang diinginkan
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition ${
              isDark ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white' : 'hover:bg-slate-200 text-slate-500'
            }`}
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CROP WORKSPACE */}
        <div className="p-5 flex flex-col items-center space-y-4">
          {/* Interactive Viewport Area */}
          <div 
            ref={containerRef}
            className="relative select-none overflow-hidden touch-none cursor-grab active:cursor-grabbing rounded-2xl border-2 border-dashed border-emerald-500/40 shadow-inner bg-black/60 flex items-center justify-center"
            style={{ width: VIEWPORT_SIZE, height: VIEWPORT_SIZE }}
            onMouseDown={(e) => handlePointerDown(e.clientX, e.clientY)}
            onMouseMove={(e) => handlePointerMove(e.clientX, e.clientY)}
            onMouseUp={handlePointerUp}
            onMouseLeave={handlePointerUp}
            onTouchStart={(e) => {
              if (e.touches[0]) handlePointerDown(e.touches[0].clientX, e.touches[0].clientY);
            }}
            onTouchMove={(e) => {
              if (e.touches[0]) handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
            }}
            onTouchEnd={handlePointerUp}
            onWheel={handleWheel}
          >
            {/* The Scaled & Translated Image */}
            {imageLoaded && (
              <img
                src={imageSrc}
                alt="Crop Target"
                draggable={false}
                className="pointer-events-none absolute max-w-none transition-transform duration-75"
                style={{
                  width: naturalSize.width * currentTotalScale,
                  height: naturalSize.height * currentTotalScale,
                  transform: `translate(${offset.x}px, ${offset.y}px) rotate(${rotation}deg)`,
                  transformOrigin: 'center center',
                }}
              />
            )}

            {/* Dark Mask Vignette with Circle / Square Cutout */}
            <div className="absolute inset-0 pointer-events-none">
              <svg width={VIEWPORT_SIZE} height={VIEWPORT_SIZE} className="w-full h-full">
                <defs>
                  <mask id="crop-mask">
                    {/* Fill white (opaque) */}
                    <rect width={VIEWPORT_SIZE} height={VIEWPORT_SIZE} fill="white" />
                    {/* Cut out black (transparent) */}
                    {maskShape === 'circle' ? (
                      <circle
                        cx={VIEWPORT_SIZE / 2}
                        cy={VIEWPORT_SIZE / 2}
                        r={VIEWPORT_SIZE / 2 - 8}
                        fill="black"
                      />
                    ) : (
                      <rect
                        x={8}
                        y={8}
                        width={VIEWPORT_SIZE - 16}
                        height={VIEWPORT_SIZE - 16}
                        rx={16}
                        fill="black"
                      />
                    )}
                  </mask>
                </defs>
                {/* Dark overlay outside the mask */}
                <rect
                  width={VIEWPORT_SIZE}
                  height={VIEWPORT_SIZE}
                  fill="rgba(0, 0, 0, 0.65)"
                  mask="url(#crop-mask)"
                />
                {/* Border outline for the crop aperture */}
                {maskShape === 'circle' ? (
                  <circle
                    cx={VIEWPORT_SIZE / 2}
                    cy={VIEWPORT_SIZE / 2}
                    r={VIEWPORT_SIZE / 2 - 8}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2"
                    strokeDasharray="4 2"
                  />
                ) : (
                  <rect
                    x={8}
                    y={8}
                    width={VIEWPORT_SIZE - 16}
                    height={VIEWPORT_SIZE - 16}
                    rx={16}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2"
                    strokeDasharray="4 2"
                  />
                )}
              </svg>
            </div>

            {/* Rule of Thirds Guide Lines (subtle) */}
            <div 
              className={`absolute inset-2 pointer-events-none grid grid-cols-3 grid-rows-3 opacity-20 border border-white/30 ${
                maskShape === 'circle' ? 'rounded-full' : 'rounded-xl'
              }`}
            >
              <div className="border-r border-b border-white/40"></div>
              <div className="border-r border-b border-white/40"></div>
              <div className="border-b border-white/40"></div>
              <div className="border-r border-b border-white/40"></div>
              <div className="border-r border-b border-white/40"></div>
              <div className="border-b border-white/40"></div>
              <div className="border-r border-white/40"></div>
              <div className="border-r border-white/40"></div>
              <div></div>
            </div>

            {/* Move helper badge */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-xs text-[10px] font-medium text-emerald-300 pointer-events-none flex items-center gap-1 shadow-xs">
              <Move className="w-3 h-3" />
              <span>Tahan & Geser Foto</span>
            </div>
          </div>

          {/* CONTROLS BAR */}
          <div className="w-full max-w-sm space-y-3">
            {/* Zoom Slider */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setZoom((prev) => Math.max(1, +(prev - 0.1).toFixed(2)))}
                className={`p-1.5 rounded-lg border transition ${
                  isDark 
                    ? 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-300' 
                    : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700'
                }`}
                title="Perkecil (-)"
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              <div className="flex-1 flex items-center gap-2">
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.05"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer h-2 bg-zinc-700 rounded-lg appearance-none"
                />
                <span className="text-xs font-mono w-10 text-right text-emerald-400 font-bold">
                  {Math.round(zoom * 100)}%
                </span>
              </div>

              <button
                type="button"
                onClick={() => setZoom((prev) => Math.min(3, +(prev + 0.1).toFixed(2)))}
                className={`p-1.5 rounded-lg border transition ${
                  isDark 
                    ? 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-300' 
                    : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700'
                }`}
                title="Perbesar (+)"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Action Tools */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleRotate}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition ${
                    isDark 
                      ? 'bg-zinc-850 hover:bg-zinc-800 border-zinc-700 text-zinc-200' 
                      : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700'
                  }`}
                  title="Putar 90 Derajat"
                >
                  <RotateCw className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Putar</span>
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition ${
                    isDark 
                      ? 'bg-zinc-850 hover:bg-zinc-800 border-zinc-700 text-zinc-300' 
                      : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-600'
                  }`}
                  title="Kembalikan Posisi Normal"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              </div>

              {/* Mask Preview Toggle */}
              <div className="flex items-center gap-1 border rounded-lg p-0.5 border-zinc-700/60 bg-black/20">
                <button
                  type="button"
                  onClick={() => setMaskShape('circle')}
                  className={`p-1.5 rounded transition ${
                    maskShape === 'circle' 
                      ? 'bg-emerald-600 text-white shadow-2xs' 
                      : (isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-slate-500 hover:text-slate-900')
                  }`}
                  title="Preview Bulat"
                >
                  <Circle className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setMaskShape('square')}
                  className={`p-1.5 rounded transition ${
                    maskShape === 'square' 
                      ? 'bg-emerald-600 text-white shadow-2xs' 
                      : (isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-slate-500 hover:text-slate-900')
                  }`}
                  title="Preview Kotak"
                >
                  <Square className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className={`flex items-center justify-end gap-3 px-5 py-3.5 border-t ${
          isDark ? 'border-emerald-950/80 bg-[#090d10]' : 'border-slate-200 bg-slate-50'
        }`}>
          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-2 rounded-xl text-xs font-semibold border transition ${
              isDark 
                ? 'border-zinc-700 hover:bg-zinc-800 text-zinc-300' 
                : 'border-slate-300 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleApplyCrop}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-md transition transform active:scale-95"
          >
            <Check className="w-4 h-4" />
            <span>Terapkan Crop & Gunakan</span>
          </button>
        </div>
      </div>
    </div>
  );
};
