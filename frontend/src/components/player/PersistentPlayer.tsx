import React, { useState } from 'react';
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
} from 'lucide-react';
import { useAudioPlayer, EqualizerPreset } from '../../contexts/AudioPlayerContext';
import { formatDuration } from '../../utils/formatters';

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
  } = useAudioPlayer();

  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [isSleepTimerOpen, setIsSleepTimerOpen] = useState(false);
  const [isEqOpen, setIsEqOpen] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [hoverScrubTime, setHoverScrubTime] = useState<number | null>(null);
  const [hoverScrubPos, setHoverScrubPos] = useState<number | null>(null);
  const [isHoveringScrub, setIsHoveringScrub] = useState(false);
  const [isHoveringVolume, setIsHoveringVolume] = useState(false);

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
      {/* 1. Fullscreen / Expanded Visualizer Overlay Modal */}
      {isExpanded && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-2xl flex flex-col justify-between p-4 sm:p-8 animate-in fade-in zoom-in-95 duration-200 overflow-y-auto">
          {/* Top Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 text-xs font-semibold border border-brand-500/30 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Now Playing • Lossless
              </span>
              {equalizerPreset !== 'flat' && (
                <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-medium border border-amber-500/30 uppercase">
                  EQ: {equalizerPreset}
                </span>
              )}
            </div>

            <button
              onClick={() => setIsExpanded(false)}
              className="p-2.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
              title="Minimize player"
            >
              <Minimize2 className="w-5 h-5" />
            </button>
          </div>

          {/* Center: Modern Album Art Showcase & Soundwave Visualizer */}
          <div className="flex flex-col items-center justify-center my-auto max-w-md mx-auto w-full text-center space-y-6 py-4">
            {/* Album Artwork with Soft Ambient Glow */}
            <div className="relative group">
              {/* Soft ambient aura based on track */}
              <div className="absolute -inset-4 bg-brand-500/20 rounded-3xl blur-2xl opacity-60 group-hover:opacity-90 transition duration-500 pointer-events-none" />

              <div className="relative w-60 h-60 sm:w-72 sm:h-72 rounded-3xl overflow-hidden bg-slate-900 border border-slate-700/60 shadow-2xl flex items-center justify-center">
                {currentTrack.coverUrl ? (
                  <img
                    src={getMediaUrl(currentTrack.coverUrl)}
                    alt={currentTrack.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                    <Music className="w-20 h-20 text-brand-400/80" />
                  </div>
                )}
              </div>
            </div>

            {/* Track Info */}
            <div className="space-y-1 w-full px-4">
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight truncate">
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

            {/* Clean Soundwave Equalizer Bars */}
            <div className="flex items-center justify-center gap-1.5 h-9 w-full px-6">
              {[35, 65, 45, 85, 55, 95, 60, 80, 40, 90, 60, 75, 50, 85, 65, 35].map((h, i) => (
                <span
                  key={i}
                  className={`w-1 rounded-full bg-brand-400 transition-all duration-200 ${
                    isPlaying ? 'animate-pulse' : 'opacity-25'
                  }`}
                  style={{
                    height: isPlaying ? `${Math.max(20, h)}%` : '15%',
                    animationDelay: `${(i * 0.07).toFixed(2)}s`,
                  }}
                />
              ))}
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
      <div className="fixed bottom-2 sm:bottom-3.5 left-2 sm:left-4 right-2 sm:right-4 max-w-7xl mx-auto z-40">
        {/* Soft Ambient Underglow */}
        <div className="absolute -inset-1 bg-gradient-to-r from-brand-500/20 via-cyan-500/15 to-indigo-500/20 rounded-3xl blur-xl pointer-events-none opacity-60 group-hover:opacity-90 transition duration-700" />

        {/* Main Floating Island Glass Container */}
        <div className="relative bg-slate-950/90 backdrop-blur-2xl border border-white/10 rounded-2xl sm:rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.85),0_1px_1px_rgba(255,255,255,0.15)] px-3.5 sm:px-6 py-2.5 sm:py-3 flex flex-col gap-2">
          {/* Upper Rim Specular Sheen */}
          <div className="absolute top-0 left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

          {/* Precision Interactive Timeline Scrubber */}
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

              {/* Gradient Progress Fill */}
              <div
                className="bg-gradient-to-r from-brand-500 via-cyan-400 to-indigo-400 h-full rounded-full transition-all relative"
                style={{ width: `${progressPercent}%` }}
              >
                {/* Glowing Playhead Thumb */}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-[0_0_12px_rgba(56,189,248,0.9)] border-2 border-slate-950 opacity-0 group-hover/scrub:opacity-100 group-hover/scrub:scale-125 transition-all duration-150" />
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
              {/* Artwork with Micro Equalizer & Hover Expand */}
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

                {/* Animated Spectrum Waveform Overlay */}
                {isPlaying && (
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center gap-0.5">
                    <span className="w-0.5 h-3 bg-brand-400 rounded-full animate-pulse" />
                    <span className="w-0.5 h-4.5 bg-brand-400 rounded-full animate-pulse [animation-delay:0.2s]" />
                    <span className="w-0.5 h-2.5 bg-brand-400 rounded-full animate-pulse [animation-delay:0.4s]" />
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
    </>
  );
};
