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
  Radio,
  Disc,
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
    setSleepTimer,
    removeQueueItem,
    clearQueue,
    playSongNow,
  } = useAudioPlayer();

  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [isSleepTimerOpen, setIsSleepTimerOpen] = useState(false);
  const [isEqOpen, setIsEqOpen] = useState(false);

  if (!currentTrack) return null;

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const eqPresets: { id: EqualizerPreset; label: string; desc: string }[] = [
    { id: 'flat', label: 'Flat', desc: 'Natural balanced sound' },
    { id: 'bass', label: 'Bass Boost', desc: 'Punchy low frequencies' },
    { id: 'vocal', label: 'Vocal Clarity', desc: 'Enhanced vocal presence' },
    { id: 'treble', label: 'Treble Boost', desc: 'Crisp highs & cymbals' },
    { id: 'electronic', label: 'Electronic / Synth', desc: 'Dynamic energetic curve' },
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
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-2xl flex flex-col justify-between p-6 sm:p-10 animate-in fade-in zoom-in-95 duration-200">
          {/* Top Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 text-xs font-semibold border border-brand-500/30 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Now Playing • Lossless
              </span>
              {equalizerPreset !== 'flat' && (
                <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-medium border border-amber-500/30">
                  EQ: {equalizerPreset.toUpperCase()}
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

          {/* Center: Album Artwork & Animated Soundwave */}
          <div className="flex flex-col items-center justify-center my-auto max-w-lg mx-auto w-full text-center space-y-6">
            {/* Vinyl / Cover Art Glow */}
            <div className="relative group">
              <div className="absolute -inset-4 bg-gradient-to-tr from-brand-600/30 via-indigo-600/30 to-amber-600/30 rounded-3xl blur-2xl opacity-75 group-hover:opacity-100 transition duration-500" />
              <div className="relative w-64 h-64 sm:w-80 sm:h-80 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex items-center justify-center">
                {currentTrack.coverUrl ? (
                  <img
                    src={getMediaUrl(currentTrack.coverUrl)}
                    alt={currentTrack.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Disc className={`w-32 h-32 text-slate-700 ${isPlaying ? 'animate-spin [animation-duration:8s]' : ''}`} />
                )}
              </div>
            </div>

            {/* Track Info */}
            <div className="space-y-1 w-full">
              <h2 className="text-2xl sm:text-3xl font-bold text-white truncate">
                {currentTrack.title}
              </h2>
              <p className="text-base text-slate-400 truncate font-medium">
                {currentTrack.artist} {currentTrack.album ? `— ${currentTrack.album}` : ''}
              </p>
              {currentTrack.genre && (
                <p className="text-xs text-brand-400 font-semibold tracking-wide uppercase mt-1">
                  {currentTrack.genre} {currentTrack.year ? `• ${currentTrack.year}` : ''}
                </p>
              )}
            </div>

            {/* Live Audio Visualizer Bars Simulation */}
            <div className="flex items-center justify-center gap-1.5 h-10 w-full px-4">
              {[40, 75, 55, 90, 60, 100, 70, 85, 45, 95, 65, 80, 50, 90, 70, 40].map((h, i) => (
                <span
                  key={i}
                  className={`w-1.5 rounded-full bg-gradient-to-t from-brand-600 to-amber-400 transition-all duration-150 ${
                    isPlaying ? 'animate-pulse' : 'opacity-30'
                  }`}
                  style={{
                    height: isPlaying ? `${Math.max(15, (h * (i % 2 === 0 ? 1 : 0.8)))}%` : '15%',
                    animationDelay: `${(i * 0.1).toFixed(1)}s`,
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
            <div className="flex items-center justify-center gap-6 pt-2">
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
                className="p-5 bg-brand-500 hover:bg-brand-400 text-white rounded-full transition shadow-xl shadow-brand-500/30 active:scale-95"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <Pause className="w-8 h-8 fill-current" />
                ) : (
                  <Play className="w-8 h-8 fill-current ml-1" />
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
            <p>Shortcuts: [Space] Play/Pause • [N] Next • [P] Prev • [M] Mute • [Shift+Left/Right] Seek</p>
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
        <div className="fixed bottom-24 right-16 sm:right-24 z-40 w-64 bg-slate-900/95 border border-slate-800 backdrop-blur-xl rounded-2xl shadow-2xl p-3 animate-in slide-in-from-bottom-3 duration-150">
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
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition ${
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

      {/* 3. Floating Equalizer Popover */}
      {isEqOpen && (
        <div className="fixed bottom-24 right-28 sm:right-44 z-40 w-72 bg-slate-900/95 border border-slate-800 backdrop-blur-xl rounded-2xl shadow-2xl p-3 animate-in slide-in-from-bottom-3 duration-150">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-brand-400" />
              Sound Equalizer Presets
            </span>
            <button onClick={() => setIsEqOpen(false)} className="text-slate-400 hover:text-white p-1">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1.5">
            {eqPresets.map((preset) => {
              const isSelected = equalizerPreset === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => {
                    setEqualizerPreset(preset.id);
                    setIsEqOpen(false);
                  }}
                  className={`w-full text-left p-2 rounded-xl transition ${
                    isSelected
                      ? 'bg-brand-600/20 text-brand-300 border border-brand-500/30'
                      : 'hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">{preset.label}</span>
                    {isSelected && <span className="text-[10px] bg-brand-500 text-white px-1.5 py-0.2 rounded font-mono">Active</span>}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">{preset.desc}</p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Floating Queue Drawer */}
      {isQueueOpen && (
        <div className="fixed bottom-24 right-4 sm:right-6 z-40 w-80 sm:w-96 bg-slate-900/95 border border-slate-800 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
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

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-slate-400">
                      {formatDuration(song.duration)}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeQueueItem(idx);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-400 transition"
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

      {/* 5. Persistent Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/90 px-4 sm:px-6 py-2.5 shadow-2xl">
        {/* Progress Bar (Clickable) */}
        <div
          className="group relative w-full h-1.5 bg-slate-800 rounded-full cursor-pointer -mt-3 mb-2"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const pos = (e.clientX - rect.left) / rect.width;
            seek(pos * duration);
          }}
        >
          <div
            className="bg-brand-500 group-hover:bg-brand-400 h-full rounded-full transition-all relative"
            style={{ width: `${progressPercent}%` }}
          >
            <div className="opacity-0 group-hover:opacity-100 absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow transition" />
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          {/* Left: Track Info & Cover */}
          <div className="flex items-center gap-3 min-w-0 max-w-[30%] sm:max-w-xs">
            <div
              onClick={() => setIsExpanded(true)}
              className="relative w-11 h-11 rounded-xl bg-slate-900 border border-slate-800 shrink-0 overflow-hidden shadow-md flex items-center justify-center cursor-pointer group"
              title="Expand player"
            >
              {currentTrack.coverUrl ? (
                <img
                  src={getMediaUrl(currentTrack.coverUrl)}
                  alt={currentTrack.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition"
                />
              ) : (
                <Music className="w-5 h-5 text-slate-400" />
              )}
              {isPlaying && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-0.5">
                  <span className="w-1 h-3 bg-brand-400 rounded-full animate-bounce" />
                  <span className="w-1 h-4 bg-brand-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1 h-2 bg-brand-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              )}
            </div>

            <div className="min-w-0 cursor-pointer" onClick={() => setIsExpanded(true)}>
              <h4 className="text-sm font-semibold text-white truncate leading-tight hover:text-brand-300 transition">
                {currentTrack.title}
              </h4>
              <p className="text-xs text-slate-400 truncate mt-0.5">
                {currentTrack.artist} {currentTrack.album ? `• ${currentTrack.album}` : ''}
              </p>
            </div>

            {onAddToPlaylist && (
              <button
                onClick={() => onAddToPlaylist(currentTrack.id)}
                className="hidden sm:inline-flex p-1.5 text-slate-400 hover:text-brand-400 hover:bg-slate-900 rounded-lg transition"
                title="Add to playlist"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Center: Main Playback Controls */}
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Shuffle */}
              <button
                onClick={toggleShuffle}
                className={`p-1.5 rounded-lg transition ${
                  isShuffle ? 'text-brand-400 bg-brand-500/10' : 'text-slate-400 hover:text-white'
                }`}
                title={isShuffle ? 'Shuffle on' : 'Shuffle off'}
              >
                <Shuffle className="w-4 h-4" />
              </button>

              {/* Prev */}
              <button
                onClick={prevTrack}
                className="p-1.5 text-slate-300 hover:text-white transition active:scale-95"
                title="Previous track (P)"
              >
                <SkipBack className="w-5 h-5 fill-current" />
              </button>

              {/* Play / Pause */}
              <button
                onClick={togglePlay}
                className="p-2.5 bg-brand-500 hover:bg-brand-400 text-white rounded-full transition shadow-lg shadow-brand-500/30 active:scale-95"
                title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 fill-current" />
                ) : (
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                )}
              </button>

              {/* Next */}
              <button
                onClick={nextTrack}
                className="p-1.5 text-slate-300 hover:text-white transition active:scale-95"
                title="Next track (N)"
              >
                <SkipForward className="w-5 h-5 fill-current" />
              </button>

              {/* Repeat Mode */}
              <button
                onClick={cycleRepeatMode}
                className={`p-1.5 rounded-lg transition ${
                  repeatMode !== 'off'
                    ? 'text-brand-400 bg-brand-500/10'
                    : 'text-slate-400 hover:text-white'
                }`}
                title={`Repeat mode: ${repeatMode}`}
              >
                {repeatMode === 'one' ? (
                  <Repeat1 className="w-4 h-4" />
                ) : (
                  <Repeat className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Time labels */}
            <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-400">
              <span>{formatDuration(currentTime)}</span>
              <span>/</span>
              <span>{formatDuration(duration)}</span>
            </div>
          </div>

          {/* Right: Sound EQ, Sleep Timer, Volume, Queue & Expand */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Equalizer Button */}
            <button
              onClick={() => {
                setIsEqOpen((prev) => !prev);
                setIsSleepTimerOpen(false);
              }}
              className={`p-1.5 rounded-lg border transition ${
                isEqOpen || equalizerPreset !== 'flat'
                  ? 'bg-brand-600/20 text-brand-300 border-brand-500/40'
                  : 'bg-slate-900 text-slate-400 hover:text-white border-slate-800'
              }`}
              title="Sound Equalizer"
            >
              <Sliders className="w-4 h-4" />
            </button>

            {/* Sleep Timer Button */}
            <button
              onClick={() => {
                setIsSleepTimerOpen((prev) => !prev);
                setIsEqOpen(false);
              }}
              className={`p-1.5 rounded-lg border transition flex items-center gap-1 ${
                sleepTimerSeconds !== null
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-900 text-slate-400 hover:text-white border-slate-800'
              }`}
              title="Sleep Timer"
            >
              <Moon className="w-4 h-4" />
              {sleepTimerSeconds !== null && (
                <span className="font-mono text-[10px] hidden md:inline">
                  {formatSleepTimer(sleepTimerSeconds)}
                </span>
              )}
            </button>

            {/* Speed Rate Pill */}
            <button
              onClick={() => {
                const rates = [1, 1.25, 1.5, 2];
                const nextRate = rates[(rates.indexOf(playbackRate) + 1) % rates.length];
                setPlaybackRate(nextRate);
              }}
              className="hidden md:inline-block px-2 py-0.5 text-xs font-semibold bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-md transition"
              title="Playback speed"
            >
              {playbackRate}x
            </button>

            {/* Volume Control */}
            <div className="hidden lg:flex items-center gap-2">
              <button onClick={toggleMute} className="text-slate-400 hover:text-white" title="Mute (M)">
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-rose-400" />
                ) : volume < 0.5 ? (
                  <Volume1 className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-16 sm:w-20 accent-brand-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Queue Toggle Button */}
            <button
              onClick={() => {
                setIsQueueOpen((prev) => !prev);
                setIsSleepTimerOpen(false);
                setIsEqOpen(false);
              }}
              className={`p-2 rounded-xl border transition ${
                isQueueOpen
                  ? 'bg-brand-600 text-white border-brand-500'
                  : 'bg-slate-900 text-slate-400 hover:text-white border-slate-800'
              }`}
              title="View Queue"
            >
              <ListMusic className="w-4 h-4" />
            </button>

            {/* Expand Fullscreen Button */}
            <button
              onClick={() => setIsExpanded(true)}
              className="hidden sm:inline-flex p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white border border-slate-800 transition"
              title="Fullscreen Visualizer"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
