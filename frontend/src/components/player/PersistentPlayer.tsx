import React, { useState, useEffect } from 'react';
import { getMediaUrl } from '../../services/api';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  VolumeX,
  Volume1,
  ListMusic,
  Maximize2,
  Minimize2,
  Music,
  Plus,
  Trash2,
  X,
  Moon,
  Sliders,
  Sparkles,
  Disc,
  RotateCcw,
  ChevronUp,
  ChevronDown,
  Heart,
  Wifi,
  WifiOff,
  Share2,
  CheckCircle,
  Download,
} from 'lucide-react';
import { useAudioPlayer, EqualizerPreset } from '../../contexts/AudioPlayerContext';
import { formatDuration } from '../../utils/formatters';
import { ShareModal } from '../share/ShareModal';
import { FileItem } from '../../types';

export const PersistentPlayer: React.FC<{ onAddToPlaylist?: (musicId: string) => void }> = ({
  onAddToPlaylist,
}) => {
  const {
    currentTrack,
    queue,
    queueIndex,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    playbackRate,
    repeatMode,
    isShuffle,
    isExpanded,
    equalizerPreset,
    eqGains,
    sleepTimerMinutes,
    sleepTimerSeconds,
    togglePlay,
    nextTrack,
    prevTrack,
    seek,
    setVolume,
    toggleMute,
    setPlaybackRate,
    toggleShuffle,
    cycleRepeatMode,
    setIsExpanded,
    setEqualizerPreset,
    setEqBandGain,
    setSleepTimer,
    moveQueueItem,
    removeQueueItem,
    clearQueue,
    playSongNow,
    isOnline,
    isOfflinePlayback,
    isTrackCachedForOffline,
    cacheTrackForOffline,
    removeTrackFromOffline,
  } = useAudioPlayer();

  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [isSleepTimerOpen, setIsSleepTimerOpen] = useState(false);
  const [isEqOpen, setIsEqOpen] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isCaching, setIsCaching] = useState(false);
  const [hoverScrubTime, setHoverScrubTime] = useState<number | null>(null);
  const [hoverScrubPos, setHoverScrubPos] = useState<number | null>(null);
  const [isHoveringScrub, setIsHoveringScrub] = useState(false);
  const [isHoveringVolume, setIsHoveringVolume] = useState(false);

  const isCurrentTrackCached = currentTrack
    ? isTrackCachedForOffline(currentTrack.fileId || currentTrack.id)
    : false;

  const handleToggleOfflineCache = async () => {
    if (!currentTrack || isCaching) return;
    setIsCaching(true);
    try {
      const key = currentTrack.fileId || currentTrack.id;
      if (isCurrentTrackCached) {
        await removeTrackFromOffline(key);
      } else {
        await cacheTrackForOffline(currentTrack);
      }
    } finally {
      setIsCaching(false);
    }
  };

  const shareTargetFile: FileItem | null = currentTrack
    ? {
        id: currentTrack.fileId || currentTrack.id,
        userId: '',
        folderId: null,
        originalName: `${currentTrack.title} - ${currentTrack.artist}.mp3`,
        storageKey: currentTrack.streamUrl,
        mimeType: 'audio/mpeg',
        fileType: 'AUDIO',
        extension: 'mp3',
        size: currentTrack.file?.size || 1024 * 1024 * 6,
        checksum: null,
        createdAt: currentTrack.file?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
        isFavorite: currentTrack.file?.isFavorite || false,
        streamUrl: currentTrack.streamUrl,
        downloadUrl: currentTrack.downloadUrl,
        music: currentTrack,
      }
    : null;

  // Slow-motion Fullscreen Transition States
  const [shouldRenderFullscreen, setShouldRenderFullscreen] = useState(isExpanded);
  const [animateFullscreen, setAnimateFullscreen] = useState(false);

  useEffect(() => {
    if (isExpanded) {
      setShouldRenderFullscreen(true);
      const rafId = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setAnimateFullscreen(true);
        });
      });
      return () => cancelAnimationFrame(rafId);
    } else {
      setAnimateFullscreen(false);
      const timer = setTimeout(() => {
        setShouldRenderFullscreen(false);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [isExpanded]);

  if (!currentTrack) return null;

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const eqPresets: { id: EqualizerPreset; label: string; desc: string }[] = [
    { id: 'flat', label: 'Flat', desc: 'Natural balanced sound' },
    { id: 'bass', label: 'Bass Boost', desc: 'Punchy low frequencies' },
    { id: 'vocal', label: 'Vocal Clarity', desc: 'Enhanced vocal presence' },
    { id: 'treble', label: 'Treble Boost', desc: 'Crisp highs & cymbals' },
    { id: 'electronic', label: 'Electronic', desc: 'Dynamic energetic synth curve' },
    { id: 'pop', label: 'Pop', desc: 'Upbeat vocal & acoustic curve' },
    { id: 'rock', label: 'Rock', desc: 'Driven low & high frequency boost' },
  ];

  const bandLabels = [
    { name: 'Sub-Bass', freq: '60 Hz' },
    { name: 'Bass', freq: '230 Hz' },
    { name: 'Midrange', freq: '910 Hz' },
    { name: 'Upper-Mid', freq: '3.6 kHz' },
    { name: 'Treble', freq: '14 kHz' },
  ];

  const sleepOptions = [
    { label: 'Off', value: null },
    { label: '5 min', value: 5 },
    { label: '15 min', value: 15 },
    { label: '30 min', value: 30 },
    { label: '45 min', value: 45 },
    { label: '60 min', value: 60 },
  ];

  const formatSleepTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <>
      {/* 1. Fullscreen / Expanded Visualizer Overlay Modal with Slow-Motion Transition */}
      {shouldRenderFullscreen && (
        <div
          className={`fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-2xl flex flex-col justify-between p-4 sm:p-8 overflow-y-auto transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            animateFullscreen
              ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
              : 'opacity-0 scale-90 translate-y-16 pointer-events-none'
          }`}
          style={{ transformOrigin: 'bottom center' }}
        >
          {/* Top Bar with Staggered Entrance */}
          <div
            className={`flex items-center justify-between transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              animateFullscreen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
            }`}
          >
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 text-xs font-semibold border border-brand-500/30 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Lossless FLAC
              </span>

              {/* Online / Offline status badge */}
              <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${
                !isOnline || isOfflinePlayback
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
              }`}>
                {!isOnline || isOfflinePlayback ? (
                  <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                )}
                <span>{!isOnline || isOfflinePlayback ? 'OFFLINE CACHE' : 'ONLINE STREAM'}</span>
              </span>

              {/* Cache for offline toggle */}
              {currentTrack && (
                <button
                  type="button"
                  onClick={handleToggleOfflineCache}
                  disabled={isCaching}
                  className={`px-3 py-1 rounded-full text-xs font-semibold border transition flex items-center gap-1.5 ${
                    isCurrentTrackCached
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                  title={isCurrentTrackCached ? 'Cached for offline listening (Click to remove)' : 'Save track for offline listening'}
                >
                  {isCurrentTrackCached ? (
                    <CheckCircle className="w-3.5 h-3.5 text-cyan-400" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  <span>{isCurrentTrackCached ? 'Offline Ready' : 'Cache Offline'}</span>
                </button>
              )}

              {/* Share Music Button */}
              <button
                type="button"
                onClick={() => setIsShareModalOpen(true)}
                className="px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition flex items-center gap-1.5 hover:border-cyan-500/40 cursor-pointer"
                title="Share Music with World-Class Holographic Player"
              >
                <Share2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Share Music</span>
              </button>

              {equalizerPreset !== 'flat' && (
                <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-medium border border-amber-500/30 uppercase">
                  EQ: {equalizerPreset}
                </span>
              )}
            </div>

            <button
              onClick={() => setIsExpanded(false)}
              className="p-2.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition hover:scale-105 active:scale-95 cursor-pointer"
              title="Minimize player"
            >
              <Minimize2 className="w-5 h-5" />
            </button>
          </div>

          {/* Center: Modern Album Art Showcase & Slow-Motion Visualizer Chamber */}
          <div className="flex flex-col items-center justify-center my-auto max-w-lg mx-auto w-full text-center space-y-6 py-4">
            {/* Album Artwork with Concentric Slow-Motion Sonic Waves & Pulsing Aura */}
            <div className="relative flex items-center justify-center">
              {/* Concentric Slow-Motion Sonic Waves (Emits when playing) */}
              {isPlaying && (
                <>
                  <div className="absolute w-64 h-64 sm:w-80 sm:h-80 rounded-full border border-cyan-500/40 animate-slow-ripple pointer-events-none" />
                  <div className="absolute w-64 h-64 sm:w-80 sm:h-80 rounded-full border border-purple-500/35 animate-slow-ripple [animation-delay:1.3s] pointer-events-none" />
                  <div className="absolute w-64 h-64 sm:w-80 sm:h-80 rounded-full border border-pink-500/25 animate-slow-ripple [animation-delay:2.6s] pointer-events-none" />
                </>
              )}

              {/* Ambient Slow-Motion Pulse Glow Aura */}
              <div
                className={`absolute -inset-6 bg-gradient-to-tr from-brand-500/30 via-purple-500/25 to-pink-500/30 rounded-full blur-3xl pointer-events-none transition-all duration-1000 ${
                  isPlaying ? 'animate-slow-pulse-glow opacity-90' : 'opacity-20'
                }`}
              />

              {/* 3D Vinyl Album Cover Showcase */}
              <div className="relative group">
                <div
                  className={`relative w-60 h-60 sm:w-72 sm:h-72 rounded-3xl overflow-hidden bg-slate-900 border border-white/15 shadow-[0_25px_60px_rgba(0,0,0,0.9),0_0_35px_rgba(56,189,248,0.25)] flex items-center justify-center transition-transform duration-700 ${
                    isPlaying ? 'animate-slow-breathe' : ''
                  }`}
                >
                  {currentTrack.coverUrl ? (
                    <img
                      src={getMediaUrl(currentTrack.coverUrl)}
                      alt={currentTrack.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-slate-900 via-purple-950/40 to-slate-900 flex items-center justify-center relative">
                      <Disc
                        className={`w-28 h-28 text-brand-400/70 ${
                          isPlaying ? 'animate-spin-slow' : ''
                        }`}
                      />
                    </div>
                  )}

                  {/* Top-Left Hi-Fi Lossless badge */}
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-xl bg-slate-950/80 backdrop-blur-md border border-white/10 text-[10px] font-mono font-bold text-cyan-300 flex items-center gap-1 shadow-lg">
                    <Sparkles className="w-3 h-3 text-cyan-400 animate-pulse" />
                    HI-FI 24-BIT
                  </div>
                </div>
              </div>
            </div>

            {/* Track Info */}
            <div className="space-y-1 w-full px-4">
              <h2 className="text-xl sm:text-3xl font-black text-white tracking-tight truncate">
                {currentTrack.title}
              </h2>
              <p className="text-sm sm:text-base text-slate-300 truncate font-medium">
                {currentTrack.artist} {currentTrack.album ? `— ${currentTrack.album}` : ''}
              </p>
              {currentTrack.genre && (
                <p className="text-xs text-brand-400 font-semibold tracking-wide uppercase mt-1">
                  {currentTrack.genre} {currentTrack.year ? `• ${currentTrack.year}` : ''}
                </p>
              )}
            </div>

            {/* 32-Bar Hero Slow-Motion Soundwave Visualizer Bar */}
            <div className="w-full max-w-md px-2 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 px-1">
                <span className="flex items-center gap-1.5 text-cyan-300 font-bold">
                  <span className={`w-1.5 h-1.5 rounded-full ${isPlaying ? 'bg-cyan-400 animate-ping' : 'bg-slate-600'}`} />
                  SLOW-MOTION VISUALIZER
                </span>
                <span className="text-purple-300 font-bold">{playbackRate}x LOSSLESS</span>
              </div>

              <div className="flex items-end justify-center gap-1 sm:gap-1.5 h-14 sm:h-18 w-full p-2.5 bg-slate-950/80 border border-white/10 rounded-2xl backdrop-blur-xl shadow-inner">
                {[
                  { anim: 'animate-slow-wave-1', delay: 0.0, bg: 'from-cyan-400 to-sky-500' },
                  { anim: 'animate-slow-wave-2', delay: 0.08, bg: 'from-sky-400 to-blue-500' },
                  { anim: 'animate-slow-wave-3', delay: 0.16, bg: 'from-blue-400 to-indigo-500' },
                  { anim: 'animate-slow-wave-4', delay: 0.24, bg: 'from-indigo-400 to-violet-500' },
                  { anim: 'animate-slow-wave-5', delay: 0.32, bg: 'from-violet-400 to-purple-500' },
                  { anim: 'animate-slow-wave-6', delay: 0.40, bg: 'from-purple-400 to-fuchsia-500' },
                  { anim: 'animate-slow-wave-1', delay: 0.48, bg: 'from-fuchsia-400 to-pink-500' },
                  { anim: 'animate-slow-wave-2', delay: 0.56, bg: 'from-pink-400 to-rose-500' },
                  { anim: 'animate-slow-wave-3', delay: 0.64, bg: 'from-rose-400 to-pink-500' },
                  { anim: 'animate-slow-wave-4', delay: 0.72, bg: 'from-pink-400 to-fuchsia-500' },
                  { anim: 'animate-slow-wave-5', delay: 0.80, bg: 'from-fuchsia-400 to-purple-500' },
                  { anim: 'animate-slow-wave-6', delay: 0.88, bg: 'from-purple-400 to-violet-500' },
                  { anim: 'animate-slow-wave-1', delay: 0.96, bg: 'from-violet-400 to-indigo-500' },
                  { anim: 'animate-slow-wave-2', delay: 1.04, bg: 'from-indigo-400 to-blue-500' },
                  { anim: 'animate-slow-wave-3', delay: 1.12, bg: 'from-blue-400 to-sky-500' },
                  { anim: 'animate-slow-wave-4', delay: 1.20, bg: 'from-sky-400 to-cyan-400' },
                  { anim: 'animate-slow-wave-5', delay: 1.28, bg: 'from-cyan-400 to-teal-400' },
                  { anim: 'animate-slow-wave-6', delay: 1.36, bg: 'from-teal-400 to-emerald-400' },
                  { anim: 'animate-slow-wave-1', delay: 1.44, bg: 'from-emerald-400 to-teal-400' },
                  { anim: 'animate-slow-wave-2', delay: 1.52, bg: 'from-teal-400 to-cyan-400' },
                  { anim: 'animate-slow-wave-3', delay: 1.60, bg: 'from-cyan-400 to-sky-500' },
                  { anim: 'animate-slow-wave-4', delay: 1.68, bg: 'from-sky-400 to-blue-500' },
                  { anim: 'animate-slow-wave-5', delay: 1.76, bg: 'from-blue-400 to-indigo-500' },
                  { anim: 'animate-slow-wave-6', delay: 1.84, bg: 'from-indigo-400 to-purple-500' },
                  { anim: 'animate-slow-wave-1', delay: 1.92, bg: 'from-purple-400 to-fuchsia-500' },
                  { anim: 'animate-slow-wave-2', delay: 2.00, bg: 'from-fuchsia-400 to-pink-500' },
                  { anim: 'animate-slow-wave-3', delay: 2.08, bg: 'from-pink-400 to-purple-400' },
                  { anim: 'animate-slow-wave-4', delay: 2.16, bg: 'from-purple-400 to-indigo-400' },
                ].map((bar, idx) => (
                  <span
                    key={idx}
                    className={`flex-1 min-w-[2px] max-w-[8px] rounded-full bg-gradient-to-t ${bar.bg} transition-all duration-300 ${
                      isPlaying ? bar.anim : 'h-[12%] opacity-30'
                    }`}
                    style={{
                      animationDelay: `${bar.delay}s`,
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Expanded Progress Bar */}
            <div className="w-full space-y-2">
              <div
                className="group relative w-full h-2 bg-slate-800 rounded-full cursor-pointer"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const pos = (e.clientX - rect.left) / rect.width;
                  seek(pos * duration);
                }}
              >
                <div
                  className="bg-brand-500 h-full rounded-full transition-all relative"
                  style={{ width: `${progressPercent}%` }}
                >
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg" />
                </div>
              </div>
              <div className="flex justify-between text-xs font-mono text-slate-400">
                <span>{formatDuration(currentTime)}</span>
                <span>{formatDuration(duration)}</span>
              </div>
            </div>

            {/* Expanded Controls */}
            <div className="flex items-center justify-center gap-4 sm:gap-6 pt-2">
              <button
                onClick={toggleShuffle}
                className={`p-2 rounded-xl transition ${
                  isShuffle ? 'text-brand-400 bg-brand-500/10' : 'text-slate-400 hover:text-white'
                }`}
                title="Shuffle"
              >
                <Shuffle className="w-5 h-5" />
              </button>

              <button
                onClick={prevTrack}
                className="p-3 text-slate-300 hover:text-white transition active:scale-95"
                title="Previous"
              >
                <SkipBack className="w-7 h-7 fill-current" />
              </button>

              <button
                onClick={togglePlay}
                className="w-16 h-16 bg-white hover:bg-slate-100 text-slate-950 rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center shrink-0"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <Pause className="w-7 h-7 fill-current" />
                ) : (
                  <Play className="w-7 h-7 fill-current ml-1" />
                )}
              </button>

              <button
                onClick={nextTrack}
                className="p-3 text-slate-300 hover:text-white transition active:scale-95"
                title="Next"
              >
                <SkipForward className="w-7 h-7 fill-current" />
              </button>

              <button
                onClick={cycleRepeatMode}
                className={`p-2 rounded-xl transition ${
                  repeatMode !== 'off'
                    ? 'text-brand-400 bg-brand-500/10'
                    : 'text-slate-400 hover:text-white'
                }`}
                title={`Repeat: ${repeatMode}`}
              >
                {repeatMode === 'one' ? (
                  <Repeat1 className="w-5 h-5" />
                ) : (
                  <Repeat className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Bottom Keyboard Hint */}
          <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-900 pt-4">
            <p className="hidden sm:block">Shortcuts: [Space] Play/Pause • [N] Next • [P] Prev • [M] Mute • [Shift+Left/Right] Seek</p>
            <p className="sm:hidden">Swipe or tap controls to play</p>
            {sleepTimerSeconds !== null && (
              <span className="text-amber-400 font-mono flex items-center gap-1.5">
                <Moon className="w-3.5 h-3.5" />
                Sleep in: {formatSleepTimer(sleepTimerSeconds)}
              </span>
            )}
          </div>
        </div>
      )}

      {/* 2. Floating Sleep Timer Modal / Popover */}
      {isSleepTimerOpen && (
        <div className="fixed bottom-24 left-4 right-4 sm:left-auto sm:right-24 z-40 w-auto sm:w-64 bg-slate-900/95 border border-slate-800 backdrop-blur-xl rounded-2xl shadow-2xl p-3.5 animate-in slide-in-from-bottom-3 duration-150">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Moon className="w-3.5 h-3.5 text-amber-400" />
              Sleep Timer
            </span>
            <button
              onClick={() => setIsSleepTimerOpen(false)}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1">
            {sleepOptions.map((opt) => {
              const isSelected = sleepTimerMinutes === opt.value;
              return (
                <button
                  key={opt.label}
                  onClick={() => {
                    setSleepTimer(opt.value);
                    setIsSleepTimerOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition ${
                    isSelected
                      ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30'
                      : 'hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <span>{opt.label}</span>
                  {isSelected && sleepTimerSeconds !== null && (
                    <span className="font-mono text-[10px] text-amber-400">
                      {formatSleepTimer(sleepTimerSeconds)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Floating 5-Band Web Audio Equalizer Popover */}
      {isEqOpen && (
        <div className="fixed bottom-24 left-4 right-4 sm:left-auto sm:right-24 z-40 max-w-sm sm:w-96 bg-slate-900/95 border border-slate-800 backdrop-blur-2xl rounded-3xl shadow-2xl p-4 animate-in slide-in-from-bottom-3 duration-150">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <span className="text-xs font-extrabold text-white flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-brand-400" />
                5-Band Web Audio Equalizer
              </span>
              <p className="text-[10px] text-slate-400">Real-time BiquadFilter frequency shaping</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setEqualizerPreset('flat')}
                className="p-1 text-[11px] text-slate-400 hover:text-white transition flex items-center gap-1"
                title="Reset to Flat"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
              <button onClick={() => setIsEqOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Equalizer Presets Pills */}
          <div className="py-3 border-b border-slate-800/80">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-2">
              Presets
            </span>
            <div className="flex flex-wrap gap-1.5">
              {eqPresets.map((preset) => {
                const isSelected = equalizerPreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => setEqualizerPreset(preset.id)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold transition ${
                      isSelected
                        ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30 border border-brand-500'
                        : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5-Band Interactive Frequency Sliders */}
          <div className="pt-3 space-y-2.5">
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
              <span>Bands</span>
              <span>Gain (dB)</span>
            </div>

            {bandLabels.map((band, idx) => {
              const gainVal = eqGains[idx];
              return (
                <div key={band.freq} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200">
                      {band.name} <span className="text-[10px] text-slate-400 font-mono">({band.freq})</span>
                    </span>
                    <span
                      className={`font-mono text-xs font-bold ${
                        gainVal > 0
                          ? 'text-emerald-400'
                          : gainVal < 0
                          ? 'text-amber-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {gainVal > 0 ? `+${gainVal}` : gainVal} dB
                    </span>
                  </div>

                  <input
                    type="range"
                    min="-12"
                    max="12"
                    step="1"
                    value={gainVal}
                    onChange={(e) => setEqBandGain(idx, parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-950 accent-brand-500 rounded-lg cursor-pointer"
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Floating Queue Drawer */}
      {isQueueOpen && (
        <div className="fixed bottom-24 left-4 right-4 sm:left-auto sm:right-6 z-40 w-auto sm:w-96 bg-slate-900/95 border border-slate-800 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/60">
            <div className="flex items-center gap-2">
              <ListMusic className="w-4 h-4 text-brand-400" />
              <h4 className="text-sm font-semibold text-white">Playback Queue</h4>
              <span className="text-xs text-slate-400">({queue.length})</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={clearQueue}
                className="p-1 text-xs text-slate-400 hover:text-rose-400 transition"
                title="Clear queue"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsQueueOpen(false)}
                className="p-1 text-slate-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="max-h-72 overflow-y-auto p-2 space-y-1">
            {queue.map((song, idx) => {
              const isCurrent = idx === queueIndex;
              return (
                <div
                  key={`${song.id}-${idx}`}
                  onClick={() => playSongNow(song)}
                  className={`group flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer transition ${
                    isCurrent
                      ? 'bg-brand-600/20 text-brand-300 border border-brand-500/30'
                      : 'hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <div className="w-7 h-7 rounded bg-slate-800 flex items-center justify-center shrink-0 overflow-hidden">
                      {song.coverUrl ? (
                        <img src={getMediaUrl(song.coverUrl)} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Music className="w-3.5 h-3.5 text-slate-400" />
                      )}
                    </div>
                    <div className="truncate">
                      <p className="font-medium truncate">{song.title}</p>
                      <p className="text-[10px] text-slate-400 truncate">{song.artist}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[10px] text-slate-400 mr-1">
                      {formatDuration(song.duration)}
                    </span>
                    {idx > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          moveQueueItem(idx, idx - 1);
                        }}
                        className="p-1 text-slate-500 hover:text-white transition rounded hover:bg-slate-700/50"
                        title="Move Up"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {idx < queue.length - 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          moveQueueItem(idx, idx + 1);
                        }}
                        className="p-1 text-slate-500 hover:text-white transition rounded hover:bg-slate-700/50"
                        title="Move Down"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeQueueItem(idx);
                      }}
                      className="p-1 text-slate-400 hover:text-rose-400 transition ml-0.5"
                      title="Remove from Queue"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. Persistent Bottom Bar (World-Class Floating Glass Island Deck) */}
      <div
        className={`fixed bottom-2 sm:bottom-3.5 left-2 sm:left-4 right-2 sm:right-4 max-w-7xl mx-auto z-40 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isExpanded
            ? 'opacity-0 pointer-events-none translate-y-8 scale-95'
            : 'opacity-100 pointer-events-auto translate-y-0 scale-100'
        }`}
        style={{ transformOrigin: 'bottom center' }}
      >
        {/* Soft Ambient Slow-Motion Pulsing Underglow */}
        <div
          className={`absolute -inset-1.5 bg-gradient-to-r from-brand-500/30 via-cyan-500/20 to-purple-500/30 rounded-3xl blur-2xl pointer-events-none transition-all duration-1000 ${
            isPlaying ? 'animate-slow-pulse-glow opacity-90' : 'opacity-30'
          }`}
        />

        {/* Main Floating Island Glass Container */}
        <div className="relative bg-slate-950/90 backdrop-blur-2xl border border-white/10 rounded-2xl sm:rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.85),0_1px_1px_rgba(255,255,255,0.15)] px-3.5 sm:px-6 py-2.5 sm:py-3 flex flex-col gap-2">
          {/* Upper Rim Specular Sheen */}
          <div className="absolute top-0 left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />

          {/* Precision Interactive Timeline Scrubber with Slow-Motion Flow */}
          <div className="relative w-full flex items-center gap-3 pt-0.5">
            {/* Dual Time: Current Time */}
            <span className="text-[11px] font-mono font-medium text-slate-400 min-w-[36px] text-right select-none">
              {formatDuration(currentTime)}
            </span>

            {/* Interactive Scrub Track */}
            <div
              className="group/scrub relative flex-1 h-1.5 hover:h-2.5 bg-slate-800/80 hover:bg-slate-800 rounded-full cursor-pointer transition-all duration-150 flex items-center"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                seek(pos * duration);
              }}
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                setHoverScrubPos(pos);
                setHoverScrubTime(pos * duration);
              }}
              onMouseEnter={() => setIsHoveringScrub(true)}
              onMouseLeave={() => {
                setIsHoveringScrub(false);
                setHoverScrubTime(null);
                setHoverScrubPos(null);
              }}
            >
              {/* Floating Hover Time Tooltip */}
              {isHoveringScrub && hoverScrubTime !== null && hoverScrubPos !== null && (
                <div
                  className="absolute -top-7 transform -translate-x-1/2 px-2 py-0.5 bg-slate-900/95 border border-slate-700/80 text-[10px] font-mono font-bold text-white rounded-md shadow-xl pointer-events-none z-50 backdrop-blur-md"
                  style={{ left: `${hoverScrubPos * 100}%` }}
                >
                  {formatDuration(hoverScrubTime)}
                </div>
              )}

              {/* Gradient Progress Fill with Slow-Motion Shimmer */}
              <div
                className={`h-full rounded-full transition-all relative ${
                  isPlaying
                    ? 'bg-gradient-to-r from-brand-500 via-cyan-400 to-purple-400 animate-slow-shimmer'
                    : 'bg-gradient-to-r from-brand-500 via-cyan-400 to-indigo-400'
                }`}
                style={{ width: `${progressPercent}%` }}
              >
                {/* Glowing Playhead Thumb */}
                <div
                  className={`absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full border-2 border-slate-950 transition-all duration-150 ${
                    isPlaying
                      ? 'shadow-[0_0_14px_rgba(56,189,248,0.9)] opacity-100 scale-110'
                      : 'shadow-[0_0_10px_rgba(56,189,248,0.7)] opacity-0 group-hover/scrub:opacity-100'
                  } group-hover/scrub:scale-125`}
                />
              </div>
            </div>

            {/* Dual Time: Total Duration / Remaining */}
            <span className="text-[11px] font-mono font-medium text-slate-400 min-w-[36px] select-none">
              {formatDuration(duration)}
            </span>
          </div>

          {/* Main Controls Dock Row */}
          <div className="flex items-center justify-between gap-3 sm:gap-6">
            {/* Left: Artwork, Track Info, Audiophile Badges, & Heart */}
            <div className="flex items-center gap-3 min-w-0 max-w-[45%] sm:max-w-xs md:max-w-sm">
              {/* Artwork with Micro Slow-Motion Equalizer & Hover Expand */}
              <div
                onClick={() => setIsExpanded(true)}
                className="relative w-12 h-12 sm:w-13 sm:h-13 rounded-2xl bg-slate-900 border border-white/10 shrink-0 shadow-lg overflow-hidden flex items-center justify-center cursor-pointer group/art transition-transform duration-200 active:scale-95"
                title="Expand fullscreen player"
              >
                {currentTrack.coverUrl ? (
                  <img
                    src={getMediaUrl(currentTrack.coverUrl)}
                    alt={currentTrack.title}
                    className="w-full h-full object-cover group-hover/art:scale-110 transition duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                    <Music className="w-6 h-6 text-brand-400" />
                  </div>
                )}

                {/* Animated Slow-Motion Spectrum Waveform Overlay */}
                {isPlaying && (
                  <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px] flex items-end justify-center gap-0.5 pb-1.5 px-1">
                    <span className="w-0.5 rounded-full bg-cyan-400 animate-slow-wave-1" style={{ animationDelay: '0s' }} />
                    <span className="w-0.5 rounded-full bg-indigo-400 animate-slow-wave-2" style={{ animationDelay: '0.15s' }} />
                    <span className="w-0.5 rounded-full bg-purple-400 animate-slow-wave-3" style={{ animationDelay: '0.3s' }} />
                    <span className="w-0.5 rounded-full bg-pink-400 animate-slow-wave-4" style={{ animationDelay: '0.45s' }} />
                  </div>
                )}

                {/* Expand Hint on Hover */}
                <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover/art:opacity-100 transition duration-200 flex items-center justify-center">
                  <Maximize2 className="w-4 h-4 text-white" />
                </div>
              </div>

              {/* Title, Artist, & Audiophile Pill */}
              <div className="min-w-0 cursor-pointer" onClick={() => setIsExpanded(true)}>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs sm:text-sm font-bold text-white tracking-tight truncate leading-tight hover:text-brand-300 transition">
                    {currentTrack.title}
                  </h4>
                  <span className="hidden xl:inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[9px] font-mono font-bold tracking-wider shrink-0">
                    <Sparkles className="w-2.5 h-2.5" /> LOSSLESS
                  </span>

                  {/* Online / Offline status in mini dock */}
                  <span className={`hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold tracking-wider shrink-0 border ${
                    !isOnline || isOfflinePlayback
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  }`}>
                    {!isOnline || isOfflinePlayback ? 'OFFLINE' : 'ONLINE'}
                  </span>

                  {isCurrentTrackCached && (
                    <span className="hidden sm:inline-flex text-cyan-400 shrink-0" title="Offline ready">
                      <CheckCircle className="w-3 h-3" />
                    </span>
                  )}
                </div>
                <p className="text-[11px] sm:text-xs text-slate-400 truncate mt-0.5 font-medium">
                  {currentTrack.artist} {currentTrack.album ? `• ${currentTrack.album}` : ''}
                </p>
              </div>

              {/* Like / Heart Toggle Button */}
              <button
                onClick={() => setIsLiked(!isLiked)}
                className={`p-1.5 rounded-full transition-all duration-200 active:scale-75 shrink-0 ${
                  isLiked ? 'text-rose-500 hover:text-rose-400 scale-105' : 'text-slate-400 hover:text-white'
                }`}
                title={isLiked ? 'Liked' : 'Like'}
              >
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
              </button>

              {/* Add to Playlist Shortcut */}
              {onAddToPlaylist && (
                <button
                  onClick={() => onAddToPlaylist(currentTrack.id)}
                  className="hidden md:inline-flex p-1.5 text-slate-400 hover:text-brand-400 hover:bg-slate-900 rounded-lg transition shrink-0"
                  title="Add to playlist"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Embedded Slow-Motion Soundwave Visualizer Bar Widget (Small Screen / Dock) */}
            <div
              onClick={() => setIsExpanded(true)}
              className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-900/60 border border-white/[0.06] backdrop-blur-md cursor-pointer hover:border-brand-500/30 transition group/vis shrink-0 shadow-inner"
              title="Click to open Fullscreen Visualizer"
            >
              <div className="flex items-end gap-1 h-6 w-24">
                {[
                  { anim: 'animate-slow-wave-1', delay: 0.0, bg: 'from-cyan-400 to-sky-500' },
                  { anim: 'animate-slow-wave-2', delay: 0.1, bg: 'from-sky-400 to-blue-500' },
                  { anim: 'animate-slow-wave-3', delay: 0.2, bg: 'from-blue-400 to-indigo-500' },
                  { anim: 'animate-slow-wave-4', delay: 0.3, bg: 'from-indigo-400 to-purple-500' },
                  { anim: 'animate-slow-wave-5', delay: 0.4, bg: 'from-purple-400 to-fuchsia-500' },
                  { anim: 'animate-slow-wave-6', delay: 0.5, bg: 'from-fuchsia-400 to-pink-500' },
                  { anim: 'animate-slow-wave-1', delay: 0.6, bg: 'from-pink-400 to-purple-500' },
                  { anim: 'animate-slow-wave-2', delay: 0.7, bg: 'from-purple-400 to-indigo-500' },
                  { anim: 'animate-slow-wave-3', delay: 0.8, bg: 'from-indigo-400 to-cyan-400' },
                  { anim: 'animate-slow-wave-4', delay: 0.9, bg: 'from-cyan-400 to-teal-400' },
                ].map((bar, idx) => (
                  <span
                    key={idx}
                    className={`w-1 rounded-full bg-gradient-to-t ${bar.bg} transition-all duration-300 ${
                      isPlaying ? bar.anim : 'h-1.5 opacity-30'
                    }`}
                    style={{
                      animationDelay: `${bar.delay}s`,
                    }}
                  />
                ))}
              </div>
              <span className="text-[10px] font-mono text-cyan-300/80 group-hover/vis:text-cyan-200 transition font-bold uppercase tracking-wider">
                {isPlaying ? 'SLOW-MO' : 'IDLE'}
              </span>
            </div>

            {/* Center: Hero Playback Deck */}
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Shuffle */}
              <button
                onClick={toggleShuffle}
                className={`p-2 rounded-xl transition relative ${
                  isShuffle
                    ? 'text-brand-400 bg-brand-500/15 shadow-sm shadow-brand-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                }`}
                title={isShuffle ? 'Shuffle on' : 'Shuffle off'}
              >
                <Shuffle className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                {isShuffle && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-brand-400" />
                )}
              </button>

              {/* Prev */}
              <button
                onClick={prevTrack}
                className="p-2 text-slate-300 hover:text-white transition active:scale-90 hover:bg-slate-900/60 rounded-xl"
                title="Previous track (P)"
              >
                <SkipBack className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
              </button>

              {/* Center Hero Play / Pause Button */}
              <button
                onClick={togglePlay}
                className="w-10 h-10 sm:w-11 sm:h-11 bg-white hover:bg-slate-100 text-slate-950 rounded-full shadow-[0_0_20px_rgba(255,255,255,0.25)] hover:scale-105 active:scale-95 transition-all duration-150 flex items-center justify-center shrink-0"
                title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
                ) : (
                  <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current ml-0.5" />
                )}
              </button>

              {/* Next */}
              <button
                onClick={nextTrack}
                className="p-2 text-slate-300 hover:text-white transition active:scale-90 hover:bg-slate-900/60 rounded-xl"
                title="Next track (N)"
              >
                <SkipForward className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
              </button>

              {/* Repeat Mode */}
              <button
                onClick={cycleRepeatMode}
                className={`p-2 rounded-xl transition relative ${
                  repeatMode !== 'off'
                    ? 'text-brand-400 bg-brand-500/15 shadow-sm shadow-brand-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                }`}
                title={`Repeat: ${repeatMode}`}
              >
                {repeatMode === 'one' ? (
                  <Repeat1 className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                ) : (
                  <Repeat className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                )}
                {repeatMode !== 'off' && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-brand-400" />
                )}
              </button>
            </div>

            {/* Right: Audiophile Utilities & Tools */}
            <div className="flex items-center gap-1.5 sm:gap-2.5">
              {/* Equalizer Preset Pill */}
              <button
                onClick={() => {
                  setIsEqOpen((prev) => !prev);
                  setIsSleepTimerOpen(false);
                }}
                className={`p-2 rounded-xl border transition flex items-center gap-1.5 ${
                  isEqOpen || equalizerPreset !== 'flat'
                    ? 'bg-brand-500/20 text-brand-300 border-brand-500/40 shadow-sm shadow-brand-500/20'
                    : 'bg-slate-900/80 text-slate-400 hover:text-white border-slate-800'
                }`}
                title="Sound Equalizer"
              >
                <Sliders className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                {equalizerPreset !== 'flat' && (
                  <span className="hidden xl:inline text-[10px] font-bold uppercase font-mono">
                    {equalizerPreset}
                  </span>
                )}
              </button>

              {/* Sleep Timer */}
              <button
                onClick={() => {
                  setIsSleepTimerOpen((prev) => !prev);
                  setIsEqOpen(false);
                }}
                className={`p-2 rounded-xl border transition flex items-center gap-1.5 ${
                  sleepTimerSeconds !== null
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm shadow-amber-500/20'
                    : 'bg-slate-900/80 text-slate-400 hover:text-white border-slate-800'
                }`}
                title="Sleep Timer"
              >
                <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                {sleepTimerSeconds !== null && (
                  <span className="font-mono text-[10px] font-bold hidden sm:inline">
                    {formatSleepTimer(sleepTimerSeconds)}
                  </span>
                )}
              </button>

              {/* Playback Speed Switcher */}
              <button
                onClick={() => {
                  const rates = [1, 1.25, 1.5, 2];
                  const nextRate = rates[(rates.indexOf(playbackRate) + 1) % rates.length];
                  setPlaybackRate(nextRate);
                }}
                className="hidden md:inline-flex px-2.5 py-1 text-xs font-semibold font-mono bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-white rounded-xl transition hover:border-slate-700"
                title="Playback speed"
              >
                {playbackRate}x
              </button>

              {/* Volume Slider with Interactive Dynamic Speaker & Percentage */}
              <div
                className="hidden lg:flex items-center gap-2 pl-1 group/vol relative"
                onMouseEnter={() => setIsHoveringVolume(true)}
                onMouseLeave={() => setIsHoveringVolume(false)}
              >
                <button
                  onClick={toggleMute}
                  className="text-slate-400 hover:text-white transition"
                  title="Mute (M)"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-4 h-4 text-rose-400" />
                  ) : volume < 0.35 ? (
                    <Volume1 className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>

                <div className="relative flex items-center">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="w-18 sm:w-22 accent-brand-400 h-1.5 bg-slate-800/90 rounded-lg cursor-pointer hover:h-2 transition-all"
                  />
                  {isHoveringVolume && (
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-slate-900 border border-slate-800 text-[9px] font-mono text-white rounded shadow-md pointer-events-none">
                      {isMuted ? '0%' : `${Math.round(volume * 100)}%`}
                    </div>
                  )}
                </div>
              </div>

              {/* Queue Drawer Toggle with Counter Badge */}
              <button
                onClick={() => {
                  setIsQueueOpen((prev) => !prev);
                  setIsSleepTimerOpen(false);
                  setIsEqOpen(false);
                }}
                className={`p-2 rounded-xl border transition relative ${
                  isQueueOpen
                    ? 'bg-brand-600 text-white border-brand-500 shadow-md shadow-brand-500/25'
                    : 'bg-slate-900/80 text-slate-400 hover:text-white border-slate-800'
                }`}
                title="View Queue"
              >
                <ListMusic className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                {queue.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-brand-500 text-white font-bold text-[9px] rounded-full flex items-center justify-center shadow-md">
                    {queue.length}
                  </span>
                )}
              </button>

              {/* Share Music Button */}
              <button
                onClick={() => setIsShareModalOpen(true)}
                className="p-2 rounded-xl bg-slate-900/80 text-slate-400 hover:text-cyan-300 border border-slate-800 hover:border-cyan-500/40 transition"
                title="Share Music Track"
              >
                <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>

              {/* Expand Fullscreen Button */}
              <button
                onClick={() => setIsExpanded(true)}
                className="p-2 rounded-xl bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700 transition"
                title="Fullscreen Visualizer"
              >
                <Maximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Share Music Modal */}
      {shareTargetFile && (
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          file={shareTargetFile}
        />
      )}
    </>
  );
};
