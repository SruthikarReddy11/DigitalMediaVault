import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { MusicItem } from '../types';
import { getMediaUrl } from '../services/api';

export type RepeatMode = 'off' | 'all' | 'one';
export type EqualizerPreset = 'flat' | 'bass' | 'vocal' | 'treble' | 'electronic' | 'pop' | 'rock' | 'custom';

// 5 Equalizer Frequency Bands (Hz): 60, 230, 910, 3600, 14000
export type EqGains = [number, number, number, number, number];

interface AudioPlayerContextType {
  currentTrack: MusicItem | null;
  queue: MusicItem[];
  queueIndex: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  playbackRate: number;
  repeatMode: RepeatMode;
  isShuffle: boolean;
  isPlayerOpen: boolean;
  isExpanded: boolean;
  equalizerPreset: EqualizerPreset;
  eqGains: EqGains;
  sleepTimerMinutes: number | null;
  sleepTimerSeconds: number | null;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  playSongNow: (song: MusicItem, newQueue?: MusicItem[]) => void;
  playPlaylistNow: (songs: MusicItem[], startIndex?: number) => void;
  addToQueue: (song: MusicItem) => void;
  nextTrack: () => void;
  prevTrack: () => void;
  seek: (seconds: number) => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  setPlaybackRate: (rate: number) => void;
  toggleShuffle: () => void;
  cycleRepeatMode: () => void;
  setIsPlayerOpen: (open: boolean) => void;
  setIsExpanded: (expanded: boolean) => void;
  setEqualizerPreset: (preset: EqualizerPreset) => void;
  setEqBandGain: (index: number, gainDb: number) => void;
  setSleepTimer: (mins: number | null) => void;
  removeQueueItem: (index: number) => void;
  clearQueue: () => void;
}

const PRESET_GAINS: Record<Exclude<EqualizerPreset, 'custom'>, EqGains> = {
  flat: [0, 0, 0, 0, 0],
  bass: [8, 5, 0, -2, -4],
  vocal: [-3, 1, 6, 4, 1],
  treble: [-4, -2, 0, 5, 8],
  electronic: [6, 3, -1, 4, 6],
  pop: [-1, 2, 5, 3, -2],
  rock: [5, 3, -1, 3, 6],
};

const FREQUENCIES = [60, 230, 910, 3600, 14000];

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(undefined);

export const AudioPlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState<MusicItem | null>(null);
  const [queue, setQueue] = useState<MusicItem[]>([]);
  const [queueIndex, setQueueIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolumeState] = useState<number>(0.8);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [playbackRate, setPlaybackRateState] = useState<number>(1);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off');
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [isPlayerOpen, setIsPlayerOpen] = useState<boolean>(true);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // Equalizer State
  const [equalizerPreset, setEqualizerPresetState] = useState<EqualizerPreset>('flat');
  const [eqGains, setEqGains] = useState<EqGains>([0, 0, 0, 0, 0]);

  // Sleep Timer state
  const [sleepTimerMinutes, setSleepTimerMinutes] = useState<number | null>(null);
  const [sleepTimerSeconds, setSleepTimerSeconds] = useState<number | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const filtersRef = useRef<BiquadFilterNode[]>([]);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);

  // Initialize HTML5 Audio element & Web Audio Equalizer Nodes
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'metadata';
    audio.crossOrigin = 'anonymous';
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
    };

    const handleEnded = () => {
      if (repeatMode === 'one') {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      } else {
        handleNext();
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, []);

  // Lazy initialize Web Audio API Equalizer Graph on first play gesture
  const initWebAudio = () => {
    if (!audioRef.current || audioCtxRef.current) return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const filters = FREQUENCIES.map((freq, i) => {
        const filter = ctx.createBiquadFilter();
        if (i === 0) {
          filter.type = 'lowshelf';
        } else if (i === FREQUENCIES.length - 1) {
          filter.type = 'highshelf';
        } else {
          filter.type = 'peaking';
          filter.Q.value = 1.0;
        }
        filter.frequency.value = freq;
        filter.gain.value = eqGains[i];
        return filter;
      });

      filtersRef.current = filters;

      // Connect HTML5 Audio -> Filter 0 -> Filter 1 -> Filter 2 -> Filter 3 -> Filter 4 -> Speakers
      const source = ctx.createMediaElementSource(audioRef.current);
      sourceNodeRef.current = source;

      let current: AudioNode = source;
      for (const filter of filters) {
        current.connect(filter);
        current = filter;
      }
      current.connect(ctx.destination);
    } catch (err) {
      console.warn('Web Audio API Equalizer initialization warning:', err);
    }
  };

  // Sync EQ gains with Web Audio BiquadFilterNodes
  useEffect(() => {
    if (filtersRef.current.length === 5) {
      filtersRef.current.forEach((filter, i) => {
        if (filter) {
          filter.gain.setTargetAtTime(eqGains[i], audioCtxRef.current?.currentTime || 0, 0.05);
        }
      });
    }
  }, [eqGains]);

  const setEqualizerPreset = (preset: EqualizerPreset) => {
    setEqualizerPresetState(preset);
    if (preset !== 'custom' && PRESET_GAINS[preset]) {
      setEqGains(PRESET_GAINS[preset]);
    }
  };

  const setEqBandGain = (index: number, gainDb: number) => {
    const clampedGain = Math.max(-12, Math.min(12, gainDb));
    setEqGains((prev) => {
      const next = [...prev] as EqGains;
      next[index] = clampedGain;
      return next;
    });
    setEqualizerPresetState('custom');
  };

  // Sleep Timer interval countdown
  useEffect(() => {
    if (sleepTimerSeconds === null) return;

    if (sleepTimerSeconds <= 0) {
      pause();
      setSleepTimerMinutes(null);
      setSleepTimerSeconds(null);
      return;
    }

    const timer = setInterval(() => {
      setSleepTimerSeconds((prev) => (prev && prev > 1 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [sleepTimerSeconds]);

  const setSleepTimer = (mins: number | null) => {
    setSleepTimerMinutes(mins);
    if (mins === null) {
      setSleepTimerSeconds(null);
    } else {
      setSleepTimerSeconds(mins * 60);
    }
  };

  // Update audio source when current track changes
  useEffect(() => {
    if (!audioRef.current || !currentTrack) return;

    audioRef.current.src = getMediaUrl(currentTrack.streamUrl);
    audioRef.current.playbackRate = playbackRate;
    audioRef.current.volume = isMuted ? 0 : volume;

    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }

    audioRef.current.play().catch((err) => {
      console.warn('Playback error or autoplay prevented:', err);
      setIsPlaying(false);
    });
  }, [currentTrack]);

  const play = () => {
    initWebAudio();
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    if (audioRef.current && currentTrack) {
      audioRef.current.play().catch(() => {});
    }
  };

  const pause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  const togglePlay = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  const playSongNow = (song: MusicItem, newQueue?: MusicItem[]) => {
    initWebAudio();
    if (newQueue && newQueue.length > 0) {
      setQueue(newQueue);
      const idx = newQueue.findIndex((s) => s.id === song.id);
      setQueueIndex(idx >= 0 ? idx : 0);
    } else {
      setQueue((prev) => {
        const exists = prev.some((s) => s.id === song.id);
        if (!exists) return [...prev, song];
        return prev;
      });
      setQueueIndex(0);
    }
    setCurrentTrack(song);
    setIsPlayerOpen(true);
  };

  const playPlaylistNow = (songs: MusicItem[], startIndex = 0) => {
    if (!songs || songs.length === 0) return;
    initWebAudio();
    setQueue(songs);
    setQueueIndex(startIndex);
    setCurrentTrack(songs[startIndex]);
    setIsPlayerOpen(true);
  };

  const addToQueue = (song: MusicItem) => {
    setQueue((prev) => [...prev, song]);
    if (!currentTrack) {
      setCurrentTrack(song);
      setQueueIndex(0);
    }
  };

  const handleNext = useCallback(() => {
    if (queue.length === 0) return;

    if (isShuffle) {
      const nextRandom = Math.floor(Math.random() * queue.length);
      setQueueIndex(nextRandom);
      setCurrentTrack(queue[nextRandom]);
      return;
    }

    if (queueIndex < queue.length - 1) {
      const nextIdx = queueIndex + 1;
      setQueueIndex(nextIdx);
      setCurrentTrack(queue[nextIdx]);
    } else if (repeatMode === 'all') {
      setQueueIndex(0);
      setCurrentTrack(queue[0]);
    } else {
      pause();
    }
  }, [queue, queueIndex, isShuffle, repeatMode]);

  const handlePrev = () => {
    if (queue.length === 0) return;

    if (currentTime > 3) {
      seek(0);
      return;
    }

    if (queueIndex > 0) {
      const prevIdx = queueIndex - 1;
      setQueueIndex(prevIdx);
      setCurrentTrack(queue[prevIdx]);
    } else {
      seek(0);
    }
  };

  const seek = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = seconds;
      setCurrentTime(seconds);
    }
  };

  const setVolume = (vol: number) => {
    const clamped = Math.max(0, Math.min(1, vol));
    setVolumeState(clamped);
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : clamped;
    }
  };

  const toggleMute = () => {
    setIsMuted((prev) => {
      const nextMuted = !prev;
      if (audioRef.current) {
        audioRef.current.volume = nextMuted ? 0 : volume;
      }
      return nextMuted;
    });
  };

  const setPlaybackRate = (rate: number) => {
    setPlaybackRateState(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  };

  const toggleShuffle = () => {
    setIsShuffle((prev) => !prev);
  };

  const cycleRepeatMode = () => {
    setRepeatMode((prev) => {
      if (prev === 'off') return 'all';
      if (prev === 'all') return 'one';
      return 'off';
    });
  };

  const removeQueueItem = (index: number) => {
    setQueue((prev) => prev.filter((_, i) => i !== index));
    if (index === queueIndex) {
      handleNext();
    } else if (index < queueIndex) {
      setQueueIndex((prev) => prev - 1);
    }
  };

  const clearQueue = () => {
    setQueue([]);
    setQueueIndex(-1);
    setCurrentTrack(null);
    pause();
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowLeft' && e.shiftKey) {
        e.preventDefault();
        seek(Math.max(0, currentTime - 10));
      } else if (e.code === 'ArrowRight' && e.shiftKey) {
        e.preventDefault();
        seek(Math.min(duration, currentTime + 10));
      } else if (e.key === 'n' || e.key === 'N') {
        handleNext();
      } else if (e.key === 'p' || e.key === 'P') {
        handlePrev();
      } else if (e.key === 'm' || e.key === 'M') {
        toggleMute();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTime, duration, isPlaying, handleNext]);

  return (
    <AudioPlayerContext.Provider
      value={{
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
        isPlayerOpen,
        isExpanded,
        equalizerPreset,
        eqGains,
        sleepTimerMinutes,
        sleepTimerSeconds,
        play,
        pause,
        togglePlay,
        playSongNow,
        playPlaylistNow,
        addToQueue,
        nextTrack: handleNext,
        prevTrack: handlePrev,
        seek,
        setVolume,
        toggleMute,
        setPlaybackRate,
        toggleShuffle,
        cycleRepeatMode,
        setIsPlayerOpen,
        setIsExpanded,
        setEqualizerPreset,
        setEqBandGain,
        setSleepTimer,
        removeQueueItem,
        clearQueue,
      }}
    >
      {children}
    </AudioPlayerContext.Provider>
  );
};

export const useAudioPlayer = () => {
  const context = useContext(AudioPlayerContext);
  if (!context) throw new Error('useAudioPlayer must be used within an AudioPlayerProvider');
  return context;
};
