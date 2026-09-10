import React, { useRef, useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Download,
  Video as VideoIcon,
  Youtube,
  Globe,
  Sliders,
  Sparkles,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { FileItem } from '../../types';
import { formatDuration, formatBytes } from '../../utils/formatters';
import { getMediaUrl } from '../../services/api';
import Hls from 'hls.js';

interface VideoPlayerModalProps {
  video: FileItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({
  video,
  isOpen,
  onClose,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.9);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState('4K Ultra HD');
  const [showQualityMenu, setShowQualityMenu] = useState(false);

  // Extract YouTube ID if applicable
  const youtubeId = useMemo(() => {
    if (!video) return null;
    const url =
      video.externalUrl ||
      (video.storageKey?.startsWith('ext:') ? video.storageKey.slice(4) : '') ||
      (video.streamUrl?.includes('http') ? video.streamUrl : '');
    const match = url?.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i
    );
    return match ? match[1] : null;
  }, [video]);

  const isDirectStream = useMemo(() => {
    if (!video) return false;
    return !youtubeId && (video.isExternal || video.storageKey?.startsWith('ext:'));
  }, [video, youtubeId]);

  const streamSrc = useMemo(() => {
    if (!video) return '';
    if (youtubeId) return '';
    if (video.storageKey?.startsWith('ext:')) {
      return video.storageKey.slice(4);
    }
    return getMediaUrl(video.streamUrl);
  }, [video, youtubeId]);

  useEffect(() => {
    if (!isOpen && videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
    if (isOpen) {
      setSelectedQuality('4K Ultra HD');
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !videoRef.current || !streamSrc || youtubeId) return;

    let hls: Hls | null = null;
    const isHls = streamSrc.includes('.m3u8') || streamSrc.includes('application/x-mpegURL');

    if (isHls && Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });
      hls.loadSource(streamSrc);
      hls.attachMedia(videoRef.current);
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          console.warn('Fatal HLS error in modal:', data);
          hls?.destroy();
        }
      });
    } else if (isHls && videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
      videoRef.current.src = streamSrc;
    } else {
      videoRef.current.src = streamSrc;
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [isOpen, streamSrc, youtubeId]);

  if (!isOpen || !video) return null;

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(() => {});
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const newTime = pos * duration;
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (vol: number) => {
    setVolume(vol);
    if (videoRef.current) {
      videoRef.current.volume = vol;
      videoRef.current.muted = vol === 0;
      setIsMuted(vol === 0);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const changeSpeed = (rate: number) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-xl flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      {/* Video Container */}
      <div
        ref={containerRef}
        className="relative w-full max-w-5xl bg-slate-950 border border-white/[0.12] rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-white/[0.08] bg-slate-900/80 backdrop-blur-md z-20">
          <div className="flex items-center gap-3 min-w-0 pr-4">
            {youtubeId ? (
              <div className="p-1.5 rounded-xl bg-red-500/20 text-red-400 shrink-0 border border-red-500/30">
                <Youtube className="w-4 h-4" />
              </div>
            ) : isDirectStream ? (
              <div className="p-1.5 rounded-xl bg-purple-500/20 text-purple-400 shrink-0 border border-purple-500/30">
                <Globe className="w-4 h-4" />
              </div>
            ) : (
              <div className="p-1.5 rounded-xl bg-brand-500/20 text-brand-400 shrink-0 border border-brand-500/30">
                <VideoIcon className="w-4 h-4" />
              </div>
            )}

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white truncate max-w-[280px] sm:max-w-md">
                  {video.originalName}
                </h3>
                {/* Quality Badge in Header */}
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-purple-950/80 text-purple-300 border border-purple-500/30">
                  <Sparkles className="w-3 h-3 text-purple-400" />
                  {selectedQuality}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 flex items-center gap-2">
                {youtubeId ? (
                  <span className="text-red-400 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> In-App YouTube Cinema (No Redirection)
                  </span>
                ) : isDirectStream ? (
                  <span className="text-purple-400 font-semibold">Direct Online Stream</span>
                ) : (
                  <span>Cloud Vault Recording • {formatBytes(video.size)}</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Download if not YouTube */}
            {!youtubeId && (
              <a
                href={getMediaUrl(video.downloadUrl)}
                download={video.originalName}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/80 transition"
                title="Download Video File"
              >
                <Download className="w-4 h-4" />
              </a>
            )}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/80 transition"
              title="Close Player"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Video Canvas */}
        <div className="relative bg-black flex items-center justify-center aspect-video max-h-[68vh] w-full overflow-hidden">
          {youtubeId ? (
            /* Embedded YouTube Player with Zero Redirection */
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&enablejsapi=1&controls=1&modestbranding=1&rel=0&playsinline=1`}
              title={video.originalName}
              className="w-full h-full border-0 aspect-video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          ) : (
            /* HTML5 Video Player for Vault & Direct Links */
            <video
              ref={videoRef}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onClick={togglePlay}
              className="w-full h-full object-contain cursor-pointer"
              playsInline
              controls={false}
            />
          )}
        </div>

        {/* Video Controls / Quality Footer */}
        <div className="p-3.5 sm:p-4 bg-slate-950/90 border-t border-white/[0.08] space-y-3">
          {/* If not YouTube: render Seek Bar */}
          {!youtubeId && (
            <div
              onClick={handleSeek}
              className="group relative w-full h-2 bg-slate-800 rounded-full cursor-pointer transition-all hover:h-2.5"
            >
              <div
                className="bg-gradient-to-r from-purple-500 to-brand-500 group-hover:from-purple-400 group-hover:to-brand-400 h-full rounded-full transition-all relative"
                style={{ width: `${progressPercent}%` }}
              >
                <div className="opacity-0 group-hover:opacity-100 absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-lg" />
              </div>
            </div>
          )}

          {/* Controls row */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Left controls */}
            <div className="flex items-center gap-3">
              {!youtubeId && (
                <>
                  {/* Play / Pause */}
                  <button
                    onClick={togglePlay}
                    className="p-2.5 bg-gradient-to-tr from-brand-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 text-white rounded-xl transition shadow-lg shadow-purple-600/20 active:scale-95"
                  >
                    {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                  </button>

                  {/* Volume */}
                  <div className="flex items-center gap-2">
                    <button onClick={toggleMute} className="text-slate-400 hover:text-white p-1">
                      {isMuted || volume === 0 ? (
                        <VolumeX className="w-4 h-4 text-rose-400" />
                      ) : (
                        <Volume2 className="w-4 h-4" />
                      )}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={isMuted ? 0 : volume}
                      onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                      className="w-16 sm:w-20 accent-purple-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Time display */}
                  <div className="text-xs text-slate-400 font-mono font-medium">
                    {formatDuration(currentTime)} / {formatDuration(duration)}
                  </div>
                </>
              )}

              {youtubeId && (
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                  <span>YouTube Theater Active</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-400 font-normal">Full native player controls enabled</span>
                </div>
              )}
            </div>

            {/* Right controls: Quality Selector + Speed + Fullscreen */}
            <div className="flex items-center gap-2">
              {/* Display Quality Selector Popover */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowQualityMenu(!showQualityMenu)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-purple-500/30 hover:border-purple-500/60 text-xs font-bold text-purple-300 hover:text-white transition shadow-sm"
                >
                  <Sliders className="w-3.5 h-3.5 text-purple-400" />
                  <span>{selectedQuality}</span>
                </button>

                {showQualityMenu && (
                  <div className="absolute right-0 bottom-full mb-2 w-44 bg-slate-900 border border-slate-700 rounded-2xl p-1.5 shadow-2xl z-30 space-y-1">
                    <div className="px-2.5 py-1 text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                      Streaming Quality
                    </div>
                    {['4K Ultra HD', '1080p Full HD', '720p HD', 'Auto Stream'].map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => {
                          setSelectedQuality(q);
                          setShowQualityMenu(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                          selectedQuality === q
                            ? 'bg-purple-600 text-white shadow'
                            : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <span>{q}</span>
                        {selectedQuality === q && <Check className="w-3.5 h-3.5" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Playback speed selector (if not YouTube) */}
              {!youtubeId && (
                <div className="hidden sm:flex items-center bg-slate-900 border border-slate-800 rounded-xl p-0.5 text-xs">
                  {[0.75, 1, 1.25, 1.5, 2].map((rate) => (
                    <button
                      key={rate}
                      onClick={() => changeSpeed(rate)}
                      className={`px-2 py-0.5 rounded-lg transition font-medium ${
                        playbackRate === rate
                          ? 'bg-purple-600 text-white'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              )}

              {/* Fullscreen */}
              <button
                onClick={toggleFullscreen}
                className="p-2 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-xl transition"
                title="Toggle Fullscreen"
              >
                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
