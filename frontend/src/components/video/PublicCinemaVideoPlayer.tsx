import React, { useRef, useState, useEffect, useMemo } from 'react';
import {
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
  Tv,
  AlertCircle,
  ExternalLink,
  RotateCcw,
} from 'lucide-react';
import { PublicShareFile } from '../../types';
import { formatDuration, formatBytes } from '../../utils/formatters';
import Hls from 'hls.js';

interface PublicCinemaVideoPlayerProps {
  file: PublicShareFile;
  allowDownload: boolean;
  appendPasswordToUrl: (url: string) => string;
}

export const PublicCinemaVideoPlayer: React.FC<PublicCinemaVideoPlayerProps> = ({
  file,
  allowDownload,
  appendPasswordToUrl,
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
  const [isTheater, setIsTheater] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState('4K Ultra HD');
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [playbackError, setPlaybackError] = useState<string | null>(null);

  // Extract source URL
  const rawUrl = useMemo(() => {
    if (file.externalUrl) return file.externalUrl;
    if (file.storageKey?.startsWith('ext:')) return file.storageKey.slice(4);
    if (file.storageKey?.startsWith('http://') || file.storageKey?.startsWith('https://')) return file.storageKey;
    return '';
  }, [file]);

  // Extract YouTube ID if applicable
  const youtubeId = useMemo(() => {
    const candidate = rawUrl || file.originalName || '';
    const match = candidate.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i
    );
    return match ? match[1] : null;
  }, [rawUrl, file.originalName]);

  // Extract Vimeo ID if applicable
  const vimeoId = useMemo(() => {
    if (!rawUrl) return null;
    const match = rawUrl.match(/vimeo\.com\/(?:video\/)?([0-9]+)/i);
    return match ? match[1] : null;
  }, [rawUrl]);

  // Check if it is a general iframe embed link
  const embedUrl = useMemo(() => {
    if (youtubeId) return `https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&enablejsapi=1&controls=1&modestbranding=1&rel=0&playsinline=1`;
    if (vimeoId) return `https://player.vimeo.com/video/${vimeoId}?autoplay=1`;
    if (rawUrl && (rawUrl.includes('/embed/') || rawUrl.includes('/player/'))) return rawUrl;
    return null;
  }, [youtubeId, vimeoId, rawUrl]);

  // Direct video stream URL
  const streamSrc = useMemo(() => {
    if (embedUrl) return '';
    if (rawUrl && (rawUrl.startsWith('http://') || rawUrl.startsWith('https://'))) {
      return rawUrl;
    }
    return appendPasswordToUrl(file.streamUrl);
  }, [embedUrl, rawUrl, file.streamUrl, appendPasswordToUrl]);

  // Setup HLS / direct stream
  useEffect(() => {
    if (!videoRef.current || !streamSrc || embedUrl) return;

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
          console.warn('Fatal HLS playback error:', data);
          setPlaybackError('Could not stream this HLS media playlist. The remote host may restrict cross-origin access.');
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
  }, [streamSrc, embedUrl]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch((err) => {
        console.warn('Playback error:', err);
        setPlaybackError('The browser could not start streaming this video directly. It may require direct CORS access from the host.');
      });
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
      setPlaybackError(null);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || duration === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const target = pos * duration;
    videoRef.current.currentTime = target;
    setCurrentTime(target);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const next = !isMuted;
    setIsMuted(next);
    videoRef.current.muted = next;
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const handleRateChange = (rate: number) => {
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

  return (
    <div
      ref={containerRef}
      className={`rounded-3xl bg-slate-950/90 border border-slate-800/90 overflow-hidden shadow-2xl transition-all duration-300 ${
        isTheater ? 'max-w-6xl w-full mx-auto ring-2 ring-purple-500/30' : 'w-full'
      }`}
    >
      {/* Top Cinema Bar */}
      <div className="flex flex-wrap items-center justify-between px-4 sm:px-6 py-3 border-b border-slate-800/80 bg-slate-900/70 backdrop-blur-md gap-2">
        <div className="flex items-center gap-3 min-w-0">
          {youtubeId ? (
            <div className="p-2 rounded-xl bg-red-500/20 text-red-400 shrink-0 border border-red-500/30 shadow-lg shadow-red-500/10">
              <Youtube className="w-4 h-4" />
            </div>
          ) : rawUrl ? (
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 shrink-0 border border-purple-500/30 shadow-lg shadow-purple-500/10">
              <Globe className="w-4 h-4" />
            </div>
          ) : (
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 shrink-0 border border-cyan-500/30 shadow-lg shadow-cyan-500/10">
              <VideoIcon className="w-4 h-4" />
            </div>
          )}

          <div className="min-w-0">
            <h3 className="text-sm font-bold text-white truncate max-w-sm sm:max-w-md">
              {file.originalName}
            </h3>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              {youtubeId ? (
                <span className="text-red-400 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> In-App YouTube Cinema (Zero Redirection)
                </span>
              ) : rawUrl ? (
                <span className="text-purple-400 font-semibold flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5" /> Direct Video Stream
                </span>
              ) : (
                <span>Cloud Vault Recording • {formatBytes(file.size)}</span>
              )}
            </div>
          </div>
        </div>

        {/* Quality & Action Badges */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold bg-purple-950/80 text-purple-300 border border-purple-500/30 shadow-sm">
            <Sparkles className="w-3 h-3 text-purple-400" />
            {selectedQuality}
          </span>
          <button
            onClick={() => setIsTheater(!isTheater)}
            className={`p-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
              isTheater
                ? 'bg-purple-600/30 border-purple-500/50 text-purple-300'
                : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:text-white'
            }`}
            title="Toggle Theater Mode"
          >
            <Tv className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Video Viewport */}
      <div className="relative bg-black flex items-center justify-center aspect-video w-full overflow-hidden">
        {embedUrl ? (
          /* Zero-Redirection In-Website Embedded Cinema */
          <iframe
            src={embedUrl}
            title={file.originalName}
            className="w-full h-full border-0 aspect-video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : playbackError ? (
          /* High-Tech Error Recovery Card */
          <div className="p-6 sm:p-8 text-center max-w-md space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Stream Notice</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                {playbackError}
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => {
                  setPlaybackError(null);
                  if (videoRef.current) {
                    videoRef.current.load();
                  }
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retry Stream</span>
              </button>
              {rawUrl && (
                <a
                  href={rawUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white transition shadow-lg shadow-purple-600/20"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Direct Link</span>
                </a>
              )}
            </div>
          </div>
        ) : (
          /* HTML5 Cinema Video Player */
          <video
            ref={videoRef}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onError={() => {
              setPlaybackError('The media stream could not be loaded directly by the browser. If this is a third-party webpage link rather than a raw .mp4 or .m3u8 stream, direct browser decoding is restricted.');
            }}
            onClick={togglePlay}
            className="w-full h-full object-contain cursor-pointer"
            playsInline
            controls={false}
          />
        )}
      </div>

      {/* Media Controls Bar (for Direct Streams & Vault Videos) */}
      {!embedUrl && !playbackError && (
        <div className="p-3.5 sm:p-4 bg-slate-950/95 border-t border-slate-800/80 space-y-3">
          {/* Progress Bar */}
          <div
            onClick={handleSeek}
            className="group relative w-full h-2 bg-slate-800 rounded-full cursor-pointer transition-all hover:h-2.5"
          >
            <div
              className="bg-gradient-to-r from-purple-500 to-cyan-500 group-hover:from-purple-400 group-hover:to-cyan-400 h-full rounded-full transition-all relative"
              style={{ width: `${progressPercent}%` }}
            >
              <div className="opacity-0 group-hover:opacity-100 absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-lg" />
            </div>
          </div>

          {/* Controls Strip */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Left Playback & Volume */}
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlay}
                className="p-2.5 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white rounded-xl transition shadow-lg shadow-purple-600/20 active:scale-95 cursor-pointer"
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
              </button>

              {/* Volume Slider */}
              <div className="flex items-center gap-2">
                <button onClick={toggleMute} className="text-slate-400 hover:text-white p-1 cursor-pointer">
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
                  onChange={handleVolumeChange}
                  className="w-16 sm:w-20 accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>

              {/* Time Tracker */}
              <div className="text-[11px] font-mono text-slate-400 font-medium">
                <span className="text-white">{formatDuration(currentTime)}</span>
                <span className="mx-1">/</span>
                <span>{formatDuration(duration)}</span>
              </div>
            </div>

            {/* Right Speed, Quality & Fullscreen Controls */}
            <div className="flex items-center gap-2">
              {/* Playback Rate Selector */}
              <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-0.5">
                {[1, 1.25, 1.5, 2].map((rate) => (
                  <button
                    key={rate}
                    onClick={() => handleRateChange(rate)}
                    className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded-lg transition cursor-pointer ${
                      playbackRate === rate
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>

              {/* Quality Dropdown Trigger */}
              <div className="relative">
                <button
                  onClick={() => setShowQualityMenu(!showQualityMenu)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5 text-purple-400" />
                  <span className="hidden sm:inline font-mono text-[11px]">{selectedQuality.split(' ')[0]}</span>
                </button>

                {showQualityMenu && (
                  <div className="absolute bottom-full right-0 mb-2 w-44 bg-slate-900/95 border border-slate-700/80 rounded-2xl p-1.5 shadow-2xl backdrop-blur-xl z-30 space-y-1">
                    <div className="text-[10px] font-bold text-slate-400 px-2 py-1 uppercase tracking-wider">
                      Streaming Quality
                    </div>
                    {['4K Ultra HD', '1080p Full HD', '720p HD', 'Auto Stream'].map((q) => (
                      <button
                        key={q}
                        onClick={() => {
                          setSelectedQuality(q);
                          setShowQualityMenu(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between transition cursor-pointer ${
                          selectedQuality === q
                            ? 'bg-purple-600/30 text-purple-300 font-bold'
                            : 'text-slate-300 hover:bg-slate-800/80'
                        }`}
                      >
                        <span>{q}</span>
                        {selectedQuality === q && <Check className="w-3.5 h-3.5 text-purple-400" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Fullscreen Button */}
              <button
                onClick={toggleFullscreen}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-900 transition cursor-pointer"
                title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
              >
                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
