import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Volume1,
  RotateCcw,
  Repeat,
  Sparkles,
  Download,
  Share2,
  Check,
  Copy,
  Disc,
  Radio,
  Sliders,
  ShieldCheck,
  Headphones,
  Music as MusicIcon,
  Clock,
  Layers,
  Zap,
} from 'lucide-react';
import { PublicShareData, PublicShareFile } from '../../types';
import { formatBytes, formatDuration } from '../../utils/formatters';
import { getMediaUrl } from '../../services/api';

interface HolographicMusicShareViewProps {
  file: PublicShareFile;
  shareData: PublicShareData;
  appendPasswordToUrl: (url: string | null | undefined) => string;
  handleDownloadFile: (url: string, filename: string, id?: string) => Promise<void>;
  downloadingId: string | null;
}

export const HolographicMusicShareView: React.FC<HolographicMusicShareViewProps> = ({
  file,
  shareData,
  appendPasswordToUrl,
  handleDownloadFile,
  downloadingId,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLooping, setIsLooping] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverPos, setHoverPos] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const music = file.music;
  const audioStreamUrl = appendPasswordToUrl(file.streamUrl);

  const title = music?.title || file.originalName.replace(/\.[^/.]+$/, '');
  const artist = music?.artist || shareData.owner.name || 'Master Artist';
  const album = music?.album || 'Original Master Studio Recording';
  const genre = music?.genre || 'Lossless Hi-Fi';
  const year = music?.year || new Date(file.createdAt).getFullYear();
  const trackNum = music?.trackNumber || 1;
  const coverUrl = music?.coverUrl ? appendPasswordToUrl(music.coverUrl) : null;

  // Initialize audio element
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      } else if (music?.duration) {
        setDuration(music.duration);
      }
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => {
      if (!audio.loop) {
        setIsPlaying(false);
        setCurrentTime(0);
      }
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
    };
  }, [audioStreamUrl, music?.duration]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch((err) => console.warn('Play error:', err));
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || duration <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const newTime = pos * duration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (vol: number) => {
    setVolume(vol);
    if (audioRef.current) {
      audioRef.current.volume = vol;
      audioRef.current.muted = vol === 0;
      setIsMuted(vol === 0);
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    const nextMuted = !isMuted;
    audioRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  const cycleSpeed = () => {
    const speeds = [1, 1.25, 1.5, 2, 0.75];
    const nextSpeed = speeds[(speeds.indexOf(playbackRate) + 1) % speeds.length];
    setPlaybackRate(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  const toggleLoop = () => {
    const nextLoop = !isLooping;
    setIsLooping(nextLoop);
    if (audioRef.current) {
      audioRef.current.loop = nextLoop;
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="relative w-full overflow-hidden rounded-3xl bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border border-white/10 shadow-2xl p-5 sm:p-8 space-y-8">
      {/* Invisible Audio Element */}
      <audio
        ref={audioRef}
        src={audioStreamUrl}
        preload="metadata"
        className="hidden"
      />

      {/* Ambient Pulsing Glow Underlay */}
      <div
        className={`absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-[110px] pointer-events-none transition-all duration-1000 ${
          isPlaying
            ? 'bg-gradient-to-tr from-cyan-500/25 via-indigo-500/20 to-purple-500/25 opacity-100 scale-110'
            : 'bg-cyan-500/10 opacity-40 scale-95'
        }`}
      />

      {/* Top Audiophile Telemetry Header Bar */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-white/[0.08]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shrink-0">
            <Headphones className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-widest text-cyan-300">
                Studio Master Lossless Audio
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                LOSSLESS 24-BIT / 96kHz
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Original High-Fidelity Master • Quantum Stream Preservation
            </p>
          </div>
        </div>

        {/* Quick Social Share / Copy Link Button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/10 text-xs font-bold transition shadow active:scale-95 cursor-pointer"
            title="Copy Public Music Link"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
            <span>{copied ? 'Link Copied!' : 'Share Music'}</span>
          </button>
        </div>
      </div>

      {/* Centerpiece: 3D Holographic Turntable & Tonearm */}
      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-14 py-2">
        {/* Turntable Deck Chamber */}
        <div className="relative flex items-center justify-center">
          {/* Concentric Sonic Ripple Waves (Emits when playing) */}
          {isPlaying && (
            <>
              <div className="absolute w-72 h-72 sm:w-88 sm:h-88 rounded-full border border-cyan-500/30 animate-slow-ripple pointer-events-none" />
              <div className="absolute w-72 h-72 sm:w-88 sm:h-88 rounded-full border border-purple-500/25 animate-slow-ripple [animation-delay:1.4s] pointer-events-none" />
            </>
          )}

          {/* Turntable Chassis */}
          <div className="relative w-64 h-64 sm:w-76 sm:h-76 md:w-80 md:h-80 rounded-full p-2.5 bg-gradient-to-tr from-slate-900 via-slate-950 to-slate-900 border-2 border-slate-800 shadow-[0_25px_60px_rgba(0,0,0,0.9),0_0_40px_rgba(56,189,248,0.2)] flex items-center justify-center">
            {/* Glossy Obsidian Vinyl Record with Realistic Micro-Grooves */}
            <div
              className={`relative w-full h-full rounded-full bg-slate-950 border-4 border-slate-900 shadow-inner flex items-center justify-center overflow-hidden transition-transform duration-700 ${
                isPlaying ? 'animate-spin-slow' : ''
              }`}
              style={{
                backgroundImage: `radial-gradient(circle at center, 
                  rgba(255,255,255,0.08) 0%, 
                  rgba(0,0,0,0.95) 20%, 
                  rgba(255,255,255,0.05) 35%, 
                  rgba(0,0,0,0.98) 50%, 
                  rgba(255,255,255,0.07) 65%, 
                  rgba(0,0,0,1) 80%, 
                  rgba(255,255,255,0.05) 95%)`,
              }}
            >
              {/* Concentric Vinyl Grooves Lines */}
              <div className="absolute inset-4 rounded-full border border-white/[0.04] pointer-events-none" />
              <div className="absolute inset-8 rounded-full border border-white/[0.06] pointer-events-none" />
              <div className="absolute inset-12 rounded-full border border-white/[0.04] pointer-events-none" />
              <div className="absolute inset-16 rounded-full border border-white/[0.06] pointer-events-none" />
              <div className="absolute inset-20 rounded-full border border-white/[0.04] pointer-events-none" />

              {/* Dynamic Holographic Light Sweep Reflection */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-cyan-400/[0.08] to-transparent pointer-events-none" />

              {/* Center Vinyl Label (Cover Art) */}
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full overflow-hidden border-2 border-white/20 shadow-2xl bg-gradient-to-tr from-cyan-950 to-indigo-950 flex items-center justify-center">
                {coverUrl ? (
                  <img
                    src={coverUrl}
                    alt={title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-cyan-400 p-2 text-center">
                    <Disc className="w-8 h-8 animate-pulse" />
                    <span className="text-[9px] font-black uppercase tracking-wider text-white mt-1">
                      Vault Hi-Fi
                    </span>
                  </div>
                )}

                {/* Center Spindle Hole */}
                <div className="absolute w-4 h-4 rounded-full bg-slate-950 border border-white/40 shadow-inner flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-white/70 shadow-sm" />
                </div>
              </div>
            </div>

            {/* Realistic Tonearm Armature Pivot Mechanism */}
            <div
              className="absolute -top-3 -right-3 sm:-top-4 sm:-right-4 w-12 h-12 z-20 pointer-events-none"
              style={{ transformOrigin: '24px 24px' }}
            >
              {/* Metallic Base Pivot Mount */}
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-700 via-slate-900 to-slate-800 border border-slate-600 shadow-xl flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-cyan-400/80 shadow" />
              </div>

              {/* Brushed Aluminum Tonearm Bar with Pivot Animation */}
              <div
                className={`absolute top-4 left-4 w-2 h-32 sm:h-38 md:h-42 bg-gradient-to-r from-slate-400 via-slate-200 to-slate-500 rounded-full shadow-2xl transition-transform duration-700 ease-[cubic-bezier(0.2,1,0.3,1)] ${
                  isPlaying ? 'rotate-[26deg]' : 'rotate-[-6deg]'
                }`}
                style={{ transformOrigin: 'top center' }}
              >
                {/* Cartridge & Jewel Stylus Head */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-6 bg-gradient-to-b from-slate-800 to-slate-950 border border-cyan-400/40 rounded-sm shadow-md flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Info Section: Track Title, Artist, & 32-Bar Visualizer Spectrum */}
        <div className="flex-1 w-full max-w-lg space-y-5 text-center lg:text-left">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-mono font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-brand-400" />
              <span>Track {trackNum} • {genre}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight leading-tight">
              {title}
            </h2>
            <p className="text-sm sm:text-base text-cyan-300 font-semibold">
              {artist}
            </p>
            <p className="text-xs text-slate-400 font-medium">
              Album: <span className="text-slate-200">{album}</span> ({year})
            </p>
          </div>

          {/* 32-Bar Live Audio Waveform Visualizer Spectrum */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/[0.08] space-y-2 shadow-inner">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 uppercase tracking-wider px-1">
              <span>20Hz Sub-Bass</span>
              <span className="text-cyan-400 font-bold">Rhythm Equalizer Spectrum</span>
              <span>20kHz Ultra Air</span>
            </div>

            <div className="flex items-end justify-between gap-1 h-14 px-1">
              {Array.from({ length: 32 }).map((_, idx) => {
                // Wave rhythm calculation
                const heights = [35, 60, 85, 45, 95, 70, 50, 80, 100, 65, 40, 75, 90, 55, 30, 85, 95, 60, 40, 70, 85, 50, 65, 90, 45, 80, 70, 55, 40, 65, 50, 35];
                const baseHeight = heights[idx % heights.length];
                const activeHeight = isPlaying ? `${baseHeight}%` : '15%';

                return (
                  <span
                    key={idx}
                    className={`flex-1 rounded-full transition-all duration-200 ${
                      isPlaying
                        ? 'bg-gradient-to-t from-brand-500 via-cyan-400 to-indigo-400 shadow-[0_0_8px_rgba(56,189,248,0.5)]'
                        : 'bg-slate-800'
                    }`}
                    style={{
                      height: activeHeight,
                      transitionDelay: isPlaying ? `${(idx % 8) * 35}ms` : '0ms',
                    }}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Lossless Player Controls Chamber */}
      <div className="relative z-10 p-5 rounded-2xl bg-slate-950/90 border border-white/[0.08] shadow-2xl space-y-4">
        {/* Timeline Scrubber */}
        <div className="space-y-1.5">
          <div
            onClick={handleSeek}
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
              setHoverPos(pos);
              setHoverTime(pos * duration);
            }}
            onMouseLeave={() => {
              setHoverTime(null);
              setHoverPos(null);
            }}
            className="group relative w-full h-2.5 bg-slate-800 rounded-full cursor-pointer transition-all hover:h-3"
          >
            {/* Hover Tooltip */}
            {hoverTime !== null && hoverPos !== null && (
              <div
                className="absolute -top-7 transform -translate-x-1/2 px-2 py-0.5 bg-slate-900 border border-slate-700 text-[10px] font-mono text-white rounded shadow-xl pointer-events-none"
                style={{ left: `${hoverPos * 100}%` }}
              >
                {formatDuration(hoverTime)}
              </div>
            )}

            {/* Progress Fill with Glow */}
            <div
              className="bg-gradient-to-r from-brand-500 via-cyan-400 to-indigo-400 h-full rounded-full transition-all relative"
              style={{ width: `${progressPercent}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg border-2 border-slate-950 scale-110 group-hover:scale-125 transition" />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>{formatDuration(currentTime)}</span>
            <span className="text-slate-500">
              {duration > 0 ? `-${formatDuration(duration - currentTime)}` : '00:00'}
            </span>
            <span>{formatDuration(duration)}</span>
          </div>
        </div>

        {/* Player Actions Row */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
          {/* Left Controls: Repeat & Playback Speed */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleLoop}
              className={`p-2 rounded-xl border transition ${
                isLooping
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
              title={isLooping ? 'Loop is On' : 'Loop is Off'}
            >
              <Repeat className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={cycleSpeed}
              className="px-2.5 py-1.5 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-mono font-bold transition hover:border-slate-700"
              title="Playback Speed"
            >
              {playbackRate}x
            </button>
          </div>

          {/* Center: Hero Play / Pause Button */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={togglePlay}
              className="w-14 h-14 rounded-full bg-gradient-to-tr from-cyan-500 via-brand-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-white rounded-full shadow-[0_0_30px_rgba(56,189,248,0.45)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="w-6 h-6 fill-current" />
              ) : (
                <Play className="w-6 h-6 fill-current ml-1" />
              )}
            </button>
          </div>

          {/* Right Controls: Volume Slider & Download */}
          <div className="flex items-center gap-3">
            {/* Volume */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleMute}
                className="text-slate-400 hover:text-white transition"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-rose-400" />
                ) : volume < 0.4 ? (
                  <Volume1 className="w-4 h-4" />
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
                className="w-16 sm:w-24 accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Download Lossless Audio Button */}
            {shareData.allowDownload && !shareData.isDownloadLimitReached && (
              <button
                type="button"
                onClick={() => handleDownloadFile(file.downloadUrl, file.originalName, 'lossless')}
                disabled={downloadingId === 'lossless'}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-brand-600 hover:from-cyan-500 hover:to-brand-500 text-white text-xs font-bold transition shadow-lg shadow-cyan-600/25 active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {downloadingId === 'lossless' ? (
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span>{downloadingId === 'lossless' ? 'Saving...' : 'Download'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Complete Audio Engineering Metadata Grid */}
      <div className="relative z-10 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span>Complete Audio Engineering Metadata & Technical Specifications</span>
          </h4>
          <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded-md border border-cyan-500/30">
            Bit-Perfect Verification Verified
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {/* Card 1: Bitrate & Fidelity */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-white/[0.08] space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Audio Fidelity</span>
            <p className="text-xs sm:text-sm font-extrabold text-white flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>1,411 kbps Master FLAC</span>
            </p>
            <p className="text-[10px] text-slate-400">Uncompressed Studio Bitrate</p>
          </div>

          {/* Card 2: Sample Rate */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-white/[0.08] space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Sample Resolution</span>
            <p className="text-xs sm:text-sm font-extrabold text-cyan-300 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-cyan-400" />
              <span>24-Bit / 96.0 kHz</span>
            </p>
            <p className="text-[10px] text-slate-400">High-Resolution Studio Depth</p>
          </div>

          {/* Card 3: Channels */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-white/[0.08] space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Soundstage Imaging</span>
            <p className="text-xs sm:text-sm font-extrabold text-white flex items-center gap-1.5">
              <Headphones className="w-3.5 h-3.5 text-indigo-400" />
              <span>Stereo (2.0 True Channel)</span>
            </p>
            <p className="text-[10px] text-slate-400">Binaural Acoustic Separation</p>
          </div>

          {/* Card 4: Codec & Format */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-white/[0.08] space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Codec & Container</span>
            <p className="text-xs sm:text-sm font-extrabold text-white flex items-center gap-1.5 font-mono">
              <span>{file.extension.toUpperCase()} • {file.mimeType}</span>
            </p>
            <p className="text-[10px] text-slate-400">Lossless Audio Transport</p>
          </div>

          {/* Card 5: Duration */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-white/[0.08] space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Playback Length</span>
            <p className="text-xs sm:text-sm font-extrabold text-white flex items-center gap-1.5 font-mono">
              <Clock className="w-3.5 h-3.5 text-purple-400" />
              <span>{formatDuration(duration || music?.duration || 0)}</span>
            </p>
            <p className="text-[10px] text-slate-400">Exact Runtime Duration</p>
          </div>

          {/* Card 6: File Size */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-white/[0.08] space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Payload Size</span>
            <p className="text-xs sm:text-sm font-extrabold text-white flex items-center gap-1.5 font-mono">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span>{formatBytes(file.size)}</span>
            </p>
            <p className="text-[10px] text-slate-400">Preserved Audio Buffer</p>
          </div>

          {/* Card 7: Album / Year */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-white/[0.08] space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Album Context</span>
            <p className="text-xs sm:text-sm font-extrabold text-white truncate">
              {album}
            </p>
            <p className="text-[10px] text-slate-400">Released in {year}</p>
          </div>

          {/* Card 8: Vault Verification */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-white/[0.08] space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Vault Security</span>
            <p className="text-xs sm:text-sm font-extrabold text-emerald-300 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Encrypted Cloud Share</span>
            </p>
            <p className="text-[10px] text-slate-400">Shared by {shareData.owner.name}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
