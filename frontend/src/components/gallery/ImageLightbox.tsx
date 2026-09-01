import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  Heart,
  Trash2,
  Info,
} from 'lucide-react';
import { FileItem } from '../../types';
import { formatBytes, formatDate } from '../../utils/formatters';

interface ImageLightboxProps {
  images: FileItem[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (index: number) => void;
  onToggleFavorite?: (fileId: string) => void;
  onDelete?: (fileId: string) => void;
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({
  images,
  currentIndex,
  isOpen,
  onClose,
  onNavigate,
  onToggleFavorite,
  onDelete,
}) => {
  const [zoom, setZoom] = useState<number>(1);
  const [showInfo, setShowInfo] = useState<boolean>(false);

  const currentImage = images[currentIndex];

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.3, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.3, 0.5));
  const handleResetZoom = () => setZoom(1);

  const handleNext = useCallback(() => {
    if (currentIndex < images.length - 1) {
      onNavigate(currentIndex + 1);
      setZoom(1);
    }
  }, [currentIndex, images.length, onNavigate]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      onNavigate(currentIndex - 1);
      setZoom(1);
    }
  }, [currentIndex, onNavigate]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleNext, handlePrev, onClose]);

  if (!isOpen || !currentImage) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col justify-between select-none">
      {/* Top Controls Bar */}
      <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-b from-black/80 to-transparent z-10">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-white/10 text-white">
            {currentIndex + 1} / {images.length}
          </span>
          <p className="text-sm font-medium text-slate-200 truncate max-w-xs sm:max-w-md">
            {currentImage.originalName}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <button
            onClick={handleZoomOut}
            className="p-2 text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl transition"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetZoom}
            className="p-2 text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl transition text-xs font-medium"
            title="Reset Zoom"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomIn}
            className="p-2 text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl transition"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-white/20 mx-1" />

          {/* Favorite */}
          {onToggleFavorite && (
            <button
              onClick={() => onToggleFavorite(currentImage.id)}
              className={`p-2 rounded-xl transition ${
                currentImage.isFavorite
                  ? 'text-rose-500 bg-rose-500/20'
                  : 'text-slate-300 hover:text-white bg-white/10 hover:bg-white/20'
              }`}
              title="Favorite"
            >
              <Heart className={`w-4 h-4 ${currentImage.isFavorite ? 'fill-current' : ''}`} />
            </button>
          )}

          {/* Download */}
          <a
            href={currentImage.downloadUrl}
            download={currentImage.originalName}
            className="p-2 text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl transition"
            title="Download original"
          >
            <Download className="w-4 h-4" />
          </a>

          {/* Info */}
          <button
            onClick={() => setShowInfo((prev) => !prev)}
            className={`p-2 rounded-xl transition ${
              showInfo
                ? 'text-brand-400 bg-brand-500/20'
                : 'text-slate-300 hover:text-white bg-white/10 hover:bg-white/20'
            }`}
            title="View Details"
          >
            <Info className="w-4 h-4" />
          </button>

          {/* Delete */}
          {onDelete && (
            <button
              onClick={() => onDelete(currentImage.id)}
              className="p-2 text-slate-300 hover:text-rose-400 bg-white/10 hover:bg-white/20 rounded-xl transition"
              title="Delete image"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          {/* Close */}
          <button
            onClick={onClose}
            className="p-2 text-slate-300 hover:text-white bg-white/10 hover:bg-rose-600 rounded-xl transition ml-2"
            title="Close viewer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Image Stage */}
      <div className="relative flex-1 flex items-center justify-center p-4 overflow-hidden">
        {/* Prev button */}
        {currentIndex > 0 && (
          <button
            onClick={handlePrev}
            className="absolute left-6 z-20 p-3 bg-black/60 hover:bg-black/80 text-white rounded-full transition shadow-xl"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Display Image */}
        <div
          className="transition-transform duration-200 ease-out max-w-full max-h-full flex items-center justify-center"
          style={{ transform: `scale(${zoom})` }}
        >
          <img
            src={currentImage.streamUrl}
            alt={currentImage.originalName}
            className="max-h-[80vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
          />
        </div>

        {/* Next button */}
        {currentIndex < images.length - 1 && (
          <button
            onClick={handleNext}
            className="absolute right-6 z-20 p-3 bg-black/60 hover:bg-black/80 text-white rounded-full transition shadow-xl"
            aria-label="Next image"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}

        {/* Info Drawer (Overlay on right) */}
        {showInfo && (
          <div className="absolute right-6 top-6 bottom-6 w-80 bg-slate-900/95 border border-slate-800 backdrop-blur-md rounded-2xl p-5 text-xs text-slate-300 shadow-2xl z-30 animate-in slide-in-from-right-4 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h4 className="text-sm font-semibold text-white">Image Information</h4>
              <button onClick={() => setShowInfo(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-slate-500 font-medium">Filename</p>
                <p className="text-slate-200 font-semibold break-all">{currentImage.originalName}</p>
              </div>
              <div>
                <p className="text-slate-500 font-medium">Size</p>
                <p className="text-slate-200 font-semibold">{formatBytes(currentImage.size)}</p>
              </div>
              <div>
                <p className="text-slate-500 font-medium">Format / MIME</p>
                <p className="text-slate-200 font-semibold">{currentImage.mimeType}</p>
              </div>
              <div>
                <p className="text-slate-500 font-medium">Date Uploaded</p>
                <p className="text-slate-200 font-semibold">{formatDate(currentImage.createdAt)}</p>
              </div>
              {currentImage.folder && (
                <div>
                  <p className="text-slate-500 font-medium">Folder</p>
                  <p className="text-slate-200 font-semibold">📁 {currentImage.folder.name}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Thumbnail Strip */}
      <div className="px-6 py-3 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-center gap-2 overflow-x-auto z-10">
        {images.slice(Math.max(0, currentIndex - 4), currentIndex + 5).map((img, i) => {
          const actualIdx = images.indexOf(img);
          const isSelected = actualIdx === currentIndex;
          return (
            <button
              key={img.id}
              onClick={() => onNavigate(actualIdx)}
              className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition shrink-0 ${
                isSelected ? 'border-brand-500 scale-110 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              <img src={img.streamUrl} alt="" className="w-full h-full object-cover" />
            </button>
          );
        })}
      </div>
    </div>
  );
};
