import React, { useEffect, useState } from 'react';
import { X, ChevronLeft, ChevronRight, ExternalLink, Image as ImageIcon } from 'lucide-react';
import { getMediaUrl } from '../../services/api';

interface ProjectScreenshotLightboxProps {
  images: string[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

export const ProjectScreenshotLightbox: React.FC<ProjectScreenshotLightboxProps> = ({
  images,
  initialIndex = 0,
  isOpen,
  onClose,
  title,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, images.length]);

  if (!isOpen || images.length === 0) return null;

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  const currentImage = images[currentIndex];
  const resolvedUrl = getMediaUrl(currentImage);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/95 backdrop-blur-xl select-none">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-900/60 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400">
            <ImageIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white truncate max-w-md">
              {title || 'UI Screenshot Preview'}
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Screenshot {currentIndex + 1} of {images.length}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {resolvedUrl && (
            <a
              href={resolvedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 rounded-xl text-xs flex items-center gap-1.5 transition-colors"
              title="Open full size in new tab"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden sm:inline">Full Size</span>
            </a>
          )}
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-rose-500/20 hover:text-rose-300 border border-white/10 rounded-xl transition-colors"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Image Viewport */}
      <div className="flex-1 relative flex items-center justify-center p-4 sm:p-8 overflow-hidden">
        {images.length > 1 && (
          <button
            onClick={handlePrev}
            className="absolute left-4 sm:left-8 z-10 p-3 rounded-full bg-slate-900/80 hover:bg-brand-600 text-white border border-white/15 backdrop-blur-md shadow-xl transition-all duration-200 hover:scale-110"
            title="Previous screenshot"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        <div className="max-w-full max-h-full flex items-center justify-center">
          <img
            src={resolvedUrl}
            alt={`${title || 'Screenshot'} ${currentIndex + 1}`}
            className="max-w-full max-h-[75vh] object-contain rounded-2xl shadow-2xl border border-white/15 animate-fade-in"
          />
        </div>

        {images.length > 1 && (
          <button
            onClick={handleNext}
            className="absolute right-4 sm:right-8 z-10 p-3 rounded-full bg-slate-900/80 hover:bg-brand-600 text-white border border-white/15 backdrop-blur-md shadow-xl transition-all duration-200 hover:scale-110"
            title="Next screenshot"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Bottom Thumbnail Strip */}
      {images.length > 1 && (
        <div className="p-4 bg-slate-900/80 border-t border-white/10 flex items-center justify-center gap-3 overflow-x-auto">
          {images.map((img, idx) => {
            const thumbUrl = getMediaUrl(img);
            const isSelected = idx === currentIndex;
            return (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`relative shrink-0 rounded-lg overflow-hidden border-2 transition-all duration-150 h-14 w-24 ${
                  isSelected
                    ? 'border-brand-500 ring-2 ring-brand-500/50 scale-105 opacity-100'
                    : 'border-white/10 opacity-50 hover:opacity-100'
                }`}
              >
                <img
                  src={thumbUrl}
                  alt={`Thumb ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
