import React, { useState, useEffect } from 'react';
import { 
  X, 
  ZoomIn, 
  ZoomOut, 
  Download, 
  Crop as CropIcon, 
  RotateCcw,
  Maximize2,
  Sparkles,
  User as UserIcon
} from 'lucide-react';

interface ImageViewerModalProps {
  isOpen: boolean;
  imageUrl: string;
  title?: string;
  subtitle?: string;
  onClose: () => void;
  onOpenCrop?: () => void;
  isDark?: boolean;
}

export const ImageViewerModal: React.FC<ImageViewerModalProps> = ({
  isOpen,
  imageUrl,
  title = 'Foto Profil',
  subtitle,
  onClose,
  onOpenCrop,
  isDark = true,
}) => {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

  // Reset zoom on open
  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setPosition({ x: 0, y: 0 });
      setIsDragging(false);
    }
  }, [isOpen, imageUrl]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !imageUrl) return null;

  // Handle Drag / Pan when zoomed
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setStartPos({ ...position });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoom <= 1) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    setPosition({
      x: startPos.x + dx,
      y: startPos.y + dy,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Download photo
  const handleDownload = () => {
    try {
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = `foto_profil_${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to download image:', err);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-black/95 backdrop-blur-md animate-in fade-in duration-200 select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* TOP HEADER BAR */}
      <div className="w-full flex items-center justify-between px-6 py-4 bg-gradient-to-b from-black/80 to-transparent z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <UserIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-white text-sm sm:text-base font-bold tracking-wide">
              {title}
            </h2>
            {subtitle && (
              <p className="text-emerald-400 text-xs font-medium">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Top Actions */}
        <div className="flex items-center gap-2">
          {onOpenCrop && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenCrop();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/50 text-emerald-200 text-xs font-semibold transition"
              title="Sesuaikan atau Crop Foto Ini"
            >
              <CropIcon className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Crop / Sesuaikan</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700/80 border border-zinc-700 text-zinc-200 text-xs font-semibold transition"
            title="Unduh Gambar"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Unduh</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-800/80 hover:bg-rose-900/60 hover:text-rose-200 text-zinc-400 transition"
            title="Tutup (ESC)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* CENTER IMAGE DISPLAY AREA */}
      <div 
        className="flex-1 w-full flex items-center justify-center overflow-hidden relative cursor-default"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div 
          className="relative max-w-full max-h-full flex items-center justify-center p-4 transition-transform duration-75"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
            cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
          }}
        >
          <img
            src={imageUrl}
            alt={title}
            className="max-h-[75vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl ring-1 ring-white/10"
            draggable={false}
          />
        </div>
      </div>

      {/* BOTTOM CONTROLS FLOATING BAR */}
      <div className="py-5 z-10">
        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-zinc-900/80 backdrop-blur-md border border-zinc-700/80 shadow-2xl text-white">
          <button
            type="button"
            onClick={() => setZoom((prev) => Math.max(0.5, +(prev - 0.25).toFixed(2)))}
            className="p-2 rounded-xl hover:bg-zinc-800 text-zinc-300 hover:text-white transition"
            title="Perkecil (-)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <span className="text-xs font-mono font-bold text-emerald-400 px-2 min-w-[50px] text-center">
            {Math.round(zoom * 100)}%
          </span>

          <button
            type="button"
            onClick={() => setZoom((prev) => Math.min(4, +(prev + 0.25).toFixed(2)))}
            className="p-2 rounded-xl hover:bg-zinc-800 text-zinc-300 hover:text-white transition"
            title="Perbesar (+)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <div className="w-px h-5 bg-zinc-700 mx-1"></div>

          <button
            type="button"
            onClick={() => {
              setZoom(1);
              setPosition({ x: 0, y: 0 });
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-medium transition"
            title="Kembali ke Ukuran Awal"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>
    </div>
  );
};
