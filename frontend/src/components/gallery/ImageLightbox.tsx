import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  Play,
  Camera,
  Maximize,
  Compass,
  Calendar,
  Loader2,
} from 'lucide-react';
import { FileItem, ExifMetadataResult } from '../../types';
import { formatBytes, formatDate } from '../../utils/formatters';
import { getMediaUrl } from '../../services/api';
import { galleryApi } from '../../services/galleryApi';

interface ImageLightboxProps {
  images: FileItem[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (index: number) => void;
  onToggleFavorite?: (fileId: string) => void;
  onDelete?: (fileId: string) => void;
  onStartSlideshow?: () => void;
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({
  images,
  currentIndex,
  isOpen,
  onClose,
  onNavigate,
  onToggleFavorite,
  onDelete,
  onStartSlideshow,
}) => {
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const [showInfo, setShowInfo] = useState<boolean>(false);
  const [exifData, setExifData] = useState<Record<string, ExifMetadataResult>>({});
  const [loadingExif, setLoadingExif] = useState<boolean>(false);

  const currentImage = images[currentIndex];
  const imageContainerRef = useRef<HTMLDivElement>(null);

  const resetTransform = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const handleZoomIn = () => setZoom((prev) => Math.min(Number((prev + 0.25).toFixed(2)), 4));
  const handleZoomOut = () => {
    setZoom((prev) => {
      const next = Math.max(Number((prev - 0.25).toFixed(2)), 0.5);
      if (next <= 1) setPan({ x: 0, y: 0 });
      return next;
    });
  };

  const handleToggle100 = () => {
    if (zoom === 1) {
      setZoom(2);
    } else {
      resetTransform();
    }
  };

  const handleNext = useCallback(() => {
    if (currentIndex < images.length - 1) {
      onNavigate(currentIndex + 1);
      resetTransform();
    }
  }, [currentIndex, images.length, onNavigate, resetTransform]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      onNavigate(currentIndex - 1);
      resetTransform();
    }
  }, [currentIndex, onNavigate, resetTransform]);

  // Load EXIF data when Info drawer is opened
  useEffect(() => {
    if (!showInfo || !currentImage) return;

    if (!exifData[currentImage.id]) {
      setLoadingExif(true);
      galleryApi
        .getExif(currentImage.id)
        .then((data) => {
          setExifData((prev) => ({ ...prev, [currentImage.id]: data }));
        })
        .catch(() => {})
        .finally(() => setLoadingExif(false));
    }
  }, [showInfo, currentImage, exifData]);

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setZoom((prev) => Math.min(Number((prev + 0.15).toFixed(2)), 4));
    } else {
      setZoom((prev) => {
        const next = Math.max(Number((prev - 0.15).toFixed(2)), 0.5);
        if (next <= 1) setPan({ x: 0, y: 0 });
        return next;
      });
    }
  };

  // Drag to pan when zoomed
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === '+' || e.key === '=') handleZoomIn();
      if (e.key === '-') handleZoomOut();
      if (e.key === '0') resetTransform();
      if (e.key === 'i' || e.key === 'I') setShowInfo((p) => !p);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleNext, handlePrev, onClose, resetTransform]);

  if (!isOpen || !currentImage) return null;

  const currentExif = exifData[currentImage.id];

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-xl flex flex-col justify-between select-none overflow-hidden"
      onMouseUp={handleMouseUp}
    >
      {/* Top Controls Bar */}
      <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-b from-black/80 to-transparent z-20">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-white/10 text-white">
            {currentIndex + 1} / {images.length}
          </span>
          <p className="text-sm font-medium text-slate-200 truncate max-w-xs sm:max-w-md">
            {currentImage.originalName}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Slideshow button */}
          {onStartSlideshow && (
            <button
              onClick={onStartSlideshow}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-500/20 hover:bg-brand-500/30 text-brand-400 border border-brand-500/30 rounded-xl text-xs font-medium transition"
              title="Start Slideshow"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span className="hidden sm:inline">Slideshow</span>
            </button>
          )}

          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-white/10 rounded-xl p-0.5 border border-white/10">
            <button
              onClick={handleZoomOut}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition"
              title="Zoom Out (-)"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleToggle100}
              className="px-2 py-1 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition text-xs font-mono font-medium"
              title="Toggle Zoom / 1:1"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              onClick={handleZoomIn}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition"
              title="Zoom In (+)"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={resetTransform}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition"
              title="Reset Zoom & Pan (0)"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

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
            href={getMediaUrl(currentImage.downloadUrl)}
            download={currentImage.originalName}
            className="p-2 text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl transition"
            title="Download original"
          >
            <Download className="w-4 h-4" />
          </a>

          {/* EXIF Info */}
          <button
            onClick={() => setShowInfo((prev) => !prev)}
            className={`p-2 rounded-xl transition ${
              showInfo
                ? 'text-brand-400 bg-brand-500/20 border border-brand-500/30'
                : 'text-slate-300 hover:text-white bg-white/10 hover:bg-white/20'
            }`}
            title="EXIF & File Info (I)"
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
            title="Close viewer (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Image Stage */}
      <div
        ref={imageContainerRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        className={`relative flex-1 flex items-center justify-center p-4 overflow-hidden ${
          zoom > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
        }`}
      >
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

        {/* Display Image with Scale and Pan */}
        <div
          className="transition-transform duration-100 ease-out max-w-full max-h-full flex items-center justify-center pointer-events-auto"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          }}
        >
          <img
            src={getMediaUrl(currentImage.streamUrl)}
            alt={currentImage.originalName}
            draggable={false}
            className="max-h-[80vh] max-w-[90vw] object-contain rounded-lg shadow-2xl select-none"
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
          <div className="absolute right-6 top-6 bottom-6 w-84 sm:w-96 bg-slate-900/95 border border-slate-800 backdrop-blur-xl rounded-2xl p-5 text-xs text-slate-300 shadow-2xl z-30 overflow-y-auto animate-in slide-in-from-right-4 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2 text-white font-semibold text-sm">
                <Camera className="w-4 h-4 text-brand-400" />
                <span>EXIF & Photo Details</span>
              </div>
              <button onClick={() => setShowInfo(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {loadingExif ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
                <p>Reading EXIF metadata...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Camera & Lens */}
                {currentExif?.camera?.make || currentExif?.camera?.model ? (
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1.5">
                    <p className="text-slate-400 font-medium text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-brand-400" /> Camera Details
                    </p>
                    <p className="text-white font-semibold text-sm">
                      {[currentExif.camera.make, currentExif.camera.model].filter(Boolean).join(' ')}
                    </p>
                    {currentExif.camera.lens && (
                      <p className="text-slate-400 text-xs">Lens: {currentExif.camera.lens}</p>
                    )}
                  </div>
                ) : null}

                {/* Exposure details */}
                {currentExif?.exposure && (
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-2">
                    <p className="text-slate-400 font-medium text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                      <Maximize className="w-3.5 h-3.5 text-emerald-400" /> Exposure Parameters
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {currentExif.exposure.aperture && (
                        <div>
                          <span className="text-slate-500">Aperture:</span>{' '}
                          <span className="text-white font-medium">{currentExif.exposure.aperture}</span>
                        </div>
                      )}
                      {currentExif.exposure.shutterSpeed && (
                        <div>
                          <span className="text-slate-500">Shutter:</span>{' '}
                          <span className="text-white font-medium">{currentExif.exposure.shutterSpeed}</span>
                        </div>
                      )}
                      {currentExif.exposure.iso && (
                        <div>
                          <span className="text-slate-500">ISO:</span>{' '}
                          <span className="text-white font-medium">{currentExif.exposure.iso}</span>
                        </div>
                      )}
                      {currentExif.exposure.focalLength && (
                        <div>
                          <span className="text-slate-500">Focal Length:</span>{' '}
                          <span className="text-white font-medium">{currentExif.exposure.focalLength}</span>
                        </div>
                      )}
                      {currentExif.exposure.flash && (
                        <div>
                          <span className="text-slate-500">Flash:</span>{' '}
                          <span className="text-white font-medium">{currentExif.exposure.flash}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Dimensions */}
                {currentExif?.dimensions && (
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
                    <p className="text-slate-500 font-medium">Dimensions & Aspect</p>
                    <p className="text-slate-200 font-semibold">
                      {currentExif.dimensions.width} &times; {currentExif.dimensions.height}{' '}
                      <span className="text-brand-400 font-normal">({currentExif.dimensions.aspectRatio})</span>
                    </p>
                  </div>
                )}

                {/* GPS Coordinates */}
                {currentExif?.gps && (
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
                    <p className="text-slate-400 font-medium text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                      <Compass className="w-3.5 h-3.5 text-blue-400" /> GPS Location
                    </p>
                    <p className="text-slate-200 font-mono text-xs">
                      {currentExif.gps.latitude?.toFixed(5)}, {currentExif.gps.longitude?.toFixed(5)}
                    </p>
                  </div>
                )}

                {/* Standard File Metadata */}
                <div className="space-y-2.5 pt-2 border-t border-slate-800">
                  <div>
                    <p className="text-slate-500 font-medium">Filename</p>
                    <p className="text-slate-200 font-semibold break-all">{currentImage.originalName}</p>
                  </div>
                  <div className="flex justify-between">
                    <div>
                      <p className="text-slate-500 font-medium">Size</p>
                      <p className="text-slate-200 font-semibold">{formatBytes(currentImage.size)}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 font-medium">Format</p>
                      <p className="text-slate-200 font-semibold">{currentImage.mimeType}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-slate-500 font-medium flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" /> Date Taken / Added
                    </p>
                    <p className="text-slate-200 font-semibold">
                      {currentExif?.dateTaken ? formatDate(currentExif.dateTaken) : formatDate(currentImage.createdAt)}
                    </p>
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
        )}
      </div>

      {/* Bottom Thumbnail Strip */}
      <div className="px-6 py-3 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-center gap-2 overflow-x-auto z-20">
        {images.slice(Math.max(0, currentIndex - 4), currentIndex + 5).map((img) => {
          const actualIdx = images.indexOf(img);
          const isSelected = actualIdx === currentIndex;
          return (
            <button
              key={img.id}
              onClick={() => {
                onNavigate(actualIdx);
                resetTransform();
              }}
              className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition shrink-0 ${
                isSelected ? 'border-brand-500 scale-110 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              <img src={getMediaUrl(img.streamUrl)} alt="" className="w-full h-full object-cover" />
            </button>
          );
        })}
      </div>
    </div>,
    document.body
  );
};
