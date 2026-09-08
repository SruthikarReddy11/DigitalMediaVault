import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Play,
  Pause,
  X,
  ChevronLeft,
  ChevronRight,
  Clock,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { FileItem } from '../../types';
import { getMediaUrl } from '../../services/api';

interface SlideshowModalProps {
  images: FileItem[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
}

export const SlideshowModal: React.FC<SlideshowModalProps> = ({
  images,
  initialIndex = 0,
  isOpen,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState<number>(4000); // 4 seconds default
  const [progress, setProgress] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setIsPlaying(true);
      setProgress(0);
    }
  }, [isOpen, initialIndex]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
    setProgress(0);
  }, [images.length]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    setProgress(0);
  }, [images.length]);

  // Slideshow timer
  useEffect(() => {
    if (!isOpen || !isPlaying || images.length <= 1) return;

    const intervalMs = 50;
    const increment = (intervalMs / speed) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + increment;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isOpen, isPlaying, speed, images.length, handleNext]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        setIsPlaying((p) => !p);
      }
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleNext, handlePrev, onClose]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  if (!isOpen || images.length === 0) return null;

  const currentImage = images[currentIndex];
  const mediaUrl = getMediaUrl(currentImage.streamUrl);

  return createPortal(
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] bg-black select-none flex flex-col justify-between overflow-hidden"
    >
      {/* Ambient background glow */}
      <div
        className="absolute inset-0 opacity-25 filter blur-3xl scale-125 transition-all duration-1000 pointer-events-none bg-cover bg-center"
        style={{ backgroundImage: `url(${mediaUrl})` }}
      />

      {/* Top Header Toolbar */}
      <div className="relative z-20 flex items-center justify-between px-6 py-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
        <div className="flex items-center gap-3">
          <div className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-white text-xs font-semibold tracking-wider">
            SLIDESHOW &bull; {currentIndex + 1} / {images.length}
          </div>
          <span className="text-white/80 text-sm font-medium truncate max-w-sm">
            {currentImage.originalName}
          </span>
        </div>

        {/* Speed & Controls */}
        <div className="flex items-center gap-3">
          {/* Speed Selector */}
          <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-xs text-white">
            <Clock className="w-3.5 h-3.5 text-white/60" />
            <select
              value={speed}
              onChange={(e) => {
                setSpeed(Number(e.target.value));
                setProgress(0);
              }}
              className="bg-transparent text-white focus:outline-none cursor-pointer font-medium"
            >
              <option value={2500} className="bg-slate-900 text-white">
                2.5s fast
              </option>
              <option value={4000} className="bg-slate-900 text-white">
                4.0s normal
              </option>
              <option value={6000} className="bg-slate-900 text-white">
                6.0s slow
              </option>
              <option value={10000} className="bg-slate-900 text-white">
                10.0s relaxed
              </option>
            </select>
          </div>

          {/* Play/Pause */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition backdrop-blur-md"
            title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
          </button>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition backdrop-blur-md"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-rose-600 text-white transition backdrop-blur-md ml-1"
            title="Close Slideshow (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Middle Stage */}
      <div className="relative z-10 flex-1 flex items-center justify-center p-6 sm:p-12 overflow-hidden">
        {/* Left Arrow */}
        <button
          onClick={handlePrev}
          className="absolute left-6 p-4 rounded-full bg-black/40 hover:bg-black/80 text-white/70 hover:text-white transition backdrop-blur-md shadow-2xl group"
          title="Previous Photo"
        >
          <ChevronLeft className="w-7 h-7 group-hover:-translate-x-0.5 transition-transform" />
        </button>

        {/* Central Display Image */}
        <div className="relative max-w-full max-h-full flex items-center justify-center">
          <img
            key={currentImage.id}
            src={mediaUrl}
            alt={currentImage.originalName}
            className="max-h-[82vh] max-w-[88vw] object-contain rounded-xl shadow-2xl transition-all duration-700 animate-in fade-in zoom-in-95"
          />
        </div>

        {/* Right Arrow */}
        <button
          onClick={handleNext}
          className="absolute right-6 p-4 rounded-full bg-black/40 hover:bg-black/80 text-white/70 hover:text-white transition backdrop-blur-md shadow-2xl group"
          title="Next Photo"
        >
          <ChevronRight className="w-7 h-7 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Bottom Progress & Timeline Bar */}
      <div className="relative z-20 flex flex-col bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-2 pb-5 px-8 gap-3">
        {/* Continuous progress bar */}
        <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-500 to-indigo-400 transition-all ease-linear rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-white/60">
          <span>Press Space to {isPlaying ? 'Pause' : 'Resume'} &bull; Arrow keys to navigate</span>
          <span>
            {currentImage.folder ? `📁 ${currentImage.folder.name}` : 'Photos'}
          </span>
        </div>
      </div>
    </div>,
    document.body
  );
};
