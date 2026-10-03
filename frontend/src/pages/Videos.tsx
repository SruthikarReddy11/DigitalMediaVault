import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Video as VideoIcon,
  Search,
  UploadCloud,
  Play,
  Heart,
  Edit2,
  Trash2,
  Download,
  Film,
  Sparkles,
  Share2,
  Link2,
  Youtube,
  Globe,
  Clapperboard,
  Tv,
  User as UserIcon,
  Video,
  LayoutGrid,
  List,
  SlidersHorizontal,
  Calendar,
  HardDrive,
  Check,
  ChevronDown,
  Layers,
  FileCheck,
  MonitorPlay,
  PlaySquare,
  ShieldCheck,
  ListMusic,
} from 'lucide-react';
import { filesApi } from '../services/filesApi';
import { favoritesApi } from '../services/favoritesApi';
import { foldersApi } from '../services/foldersApi';
import { FileItem, FolderItem } from '../types';
import { formatBytes, formatDate } from '../utils/formatters';
import { getMediaUrl } from '../services/api';
import { VideoPlayerModal } from '../components/video/VideoPlayerModal';
import { ImportVideoModal } from '../components/video/ImportVideoModal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { Modal } from '../components/common/Modal';
import { EmptyState } from '../components/common/EmptyState';
import { ShareModal } from '../components/share/ShareModal';
import { useToast } from '../contexts/ToastContext';

type CategoryFilter =
  | 'ALL'
  | 'MOVIES'
  | 'SERIES'
  | 'PERSONAL'
  | 'RECORDINGS'
  | 'DOWNLOADS'
  | 'YOUTUBE'
  | 'FAVORITES';

type SortOption = 'NEWEST' | 'OLDEST' | 'TITLE' | 'SIZE_DESC';

export const Videos: React.FC = () => {
  const { success, error } = useToast();
  const { openUpload } = useOutletContext<{ openUpload: () => void }>() || { openUpload: () => {} };

  const [videos, setVideos] = useState<FileItem[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Search
  const [search, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'LOCAL' | 'YOUTUBE' | 'STREAM'>('ALL');
  const [selectedFolderId, setSelectedFolderId] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('NEWEST');
  const [viewMode, setViewMode] = useState<'GRID' | 'LIST'>('GRID');
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [resolutionFilter, setResolutionFilter] = useState<'ALL' | '4K' | '1080P'>('ALL');

  // Modals state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [activeVideo, setActiveVideo] = useState<FileItem | null>(null);
  const [shareTarget, setShareTarget] = useState<FileItem | null>(null);
  const [renameTarget, setRenameTarget] = useState<FileItem | null>(null);
  const [newName, setNewName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<FileItem | null>(null);

  const fetchVideos = async () => {
    setIsLoading(true);
    try {
      const [resVideos, resFolders] = await Promise.all([
        filesApi.listFiles({
          fileType: 'VIDEO',
          limit: 150,
        }),
        foldersApi.getFolders().catch(() => []),
      ]);
      setVideos(resVideos.data || []);
      setFolders(resFolders || []);
    } catch (err) {
      console.error('Failed to load video theater data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();

    const handleUpdate = () => fetchVideos();
    window.addEventListener('pdl_files_updated', handleUpdate);
    return () => window.removeEventListener('pdl_files_updated', handleUpdate);
  }, []);

  const handleToggleFavorite = async (fileId: string) => {
    try {
      const res = await favoritesApi.toggle(fileId);
      setVideos((prev) =>
        prev.map((v) => (v.id === fileId ? { ...v, isFavorite: res.isFavorite } : v))
      );
      success(res.message);
    } catch (err: any) {
      error(err.message || 'Failed to update favorite.');
    }
  };

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameTarget || !newName.trim()) return;

    try {
      const updated = await filesApi.renameFile(renameTarget.id, newName.trim());
      setVideos((prev) => prev.map((v) => (v.id === updated.id ? updated : v)));
      success('Video renamed!');
      setRenameTarget(null);
    } catch (err: any) {
      error(err.message || 'Failed to rename video.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    try {
      await filesApi.moveToTrash(deleteTarget.id);
      setVideos((prev) => prev.filter((v) => v.id !== deleteTarget.id));
      success('Video moved to trash.');
      setDeleteTarget(null);
    } catch (err: any) {
      error(err.message || 'Failed to delete video.');
    }
  };

  const getYouTubeId = (video: FileItem) => {
    const url =
      video.externalUrl ||
      (video.storageKey?.startsWith('ext:') ? video.storageKey.slice(4) : '') ||
      (video.streamUrl?.includes('http') ? video.streamUrl : '');
    const match = url?.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i
    );
    return match ? match[1] : null;
  };

  // Helper to detect resolution badge
  const getVideoResolution = (video: FileItem) => {
    const nameLower = video.originalName.toLowerCase();
    if (nameLower.includes('4k') || nameLower.includes('2160p') || video.size > 2 * 1024 * 1024 * 1024) {
      return '4K';
    }
    return '1080p';
  };

  // Helper to extract or generate tags based on video filename/location
  const getVideoTags = (video: FileItem): string[] => {
    const nameLower = video.originalName.toLowerCase();
    const tags: string[] = [];

    if (nameLower.includes('vlog') || nameLower.includes('personal') || nameLower.includes('trip') || nameLower.includes('family')) {
      tags.push('Personal');
    }
    if (nameLower.includes('movie') || nameLower.includes('film') || nameLower.includes('cinema')) {
      tags.push('Movie');
    }
    if (nameLower.includes('nature') || nameLower.includes('himalaya') || nameLower.includes('mountain') || nameLower.includes('travel')) {
      tags.push('Nature', 'Travel');
    }
    if (nameLower.includes('car') || nameLower.includes('drive') || nameLower.includes('speed')) {
      tags.push('Cinematic', 'Cars');
    }
    if (nameLower.includes('course') || nameLower.includes('dsa') || nameLower.includes('tutorial') || nameLower.includes('learn')) {
      tags.push('Education', 'Course');
    }
    if (nameLower.includes('action') || nameLower.includes('trailer') || nameLower.includes('clip')) {
      tags.push('Action');
    }

    if (tags.length === 0) {
      if (getYouTubeId(video)) {
        tags.push('Online', 'Stream');
      } else {
        tags.push('Vault', 'Media');
      }
    }

    return tags.slice(0, 2);
  };

  // Helper to estimate video duration based on size or stream info
  const getVideoDurationString = (video: FileItem): string => {
    const isYt = !!getYouTubeId(video);
    if (isYt) return '00:15:30';
    // rough estimation based on ~200MB / 10 mins
    const sizeMb = video.size / (1024 * 1024);
    if (sizeMb <= 10) return '00:03:45';
    if (sizeMb <= 50) return '00:08:32';
    if (sizeMb <= 200) return '00:12:45';
    if (sizeMb <= 800) return '00:45:10';
    if (sizeMb <= 1800) return '01:48:20';
    return '02:15:30';
  };

  // Compute category item counts dynamically from real videos
  const categoryCounts = useMemo(() => {
    const counts = {
      ALL: videos.length,
      MOVIES: 0,
      SERIES: 0,
      PERSONAL: 0,
      RECORDINGS: 0,
      DOWNLOADS: 0,
      YOUTUBE: 0,
      FAVORITES: 0,
    };

    videos.forEach((v) => {
      const name = v.originalName.toLowerCase();
      const isYt = !!getYouTubeId(v);

      if (v.isFavorite) counts.FAVORITES += 1;
      if (isYt) counts.YOUTUBE += 1;
      if (name.includes('movie') || name.includes('film')) counts.MOVIES += 1;
      if (name.includes('series') || name.includes('s0') || name.includes('episode')) counts.SERIES += 1;
      if (name.includes('vlog') || name.includes('personal') || name.includes('trip') || name.includes('family')) counts.PERSONAL += 1;
      if (name.includes('rec') || name.includes('recording') || name.includes('screen')) counts.RECORDINGS += 1;
      if (name.includes('download') || name.includes('dload')) counts.DOWNLOADS += 1;
    });

    return counts;
  }, [videos]);

  // Filter and sort videos
  const filteredVideos = useMemo(() => {
    return videos
      .filter((video) => {
        const nameLower = video.originalName.toLowerCase();
        const isYt = !!getYouTubeId(video);
        const isExt = video.isExternal || video.storageKey?.startsWith('ext:');

        // Search query
        if (search.trim()) {
          const q = search.toLowerCase();
          const matchName = nameLower.includes(q);
          const matchTags = getVideoTags(video).some((t) => t.toLowerCase().includes(q));
          if (!matchName && !matchTags) return false;
        }

        // Active Category
        if (activeCategory === 'MOVIES' && !nameLower.includes('movie') && !nameLower.includes('film')) return false;
        if (activeCategory === 'SERIES' && !nameLower.includes('series') && !nameLower.includes('s0') && !nameLower.includes('episode')) return false;
        if (activeCategory === 'PERSONAL' && !nameLower.includes('vlog') && !nameLower.includes('personal') && !nameLower.includes('trip') && !nameLower.includes('family')) return false;
        if (activeCategory === 'RECORDINGS' && !nameLower.includes('rec') && !nameLower.includes('recording') && !nameLower.includes('screen')) return false;
        if (activeCategory === 'DOWNLOADS' && !nameLower.includes('download')) return false;
        if (activeCategory === 'YOUTUBE' && !isYt) return false;
        if (activeCategory === 'FAVORITES' && !video.isFavorite) return false;

        // Type filter
        if (typeFilter === 'LOCAL' && (isExt || isYt)) return false;
        if (typeFilter === 'YOUTUBE' && !isYt) return false;
        if (typeFilter === 'STREAM' && (!isExt || isYt)) return false;

        // Folder filter
        if (selectedFolderId !== 'ALL') {
          if (video.folderId !== selectedFolderId) return false;
        }

        // Resolution filter
        if (resolutionFilter === '4K' && getVideoResolution(video) !== '4K') return false;
        if (resolutionFilter === '1080P' && getVideoResolution(video) !== '1080p') return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'NEWEST') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        if (sortBy === 'OLDEST') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        if (sortBy === 'TITLE') return a.originalName.localeCompare(b.originalName);
        if (sortBy === 'SIZE_DESC') return b.size - a.size;
        return 0;
      });
  }, [videos, search, activeCategory, typeFilter, selectedFolderId, resolutionFilter, sortBy]);

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn pb-12">
      {/* 1. CINEMATIC LUXURY HOME THEATER HEADER BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-950 border border-white/[0.08] shadow-2xl">
        {/* Background Ultra-Wide Living Room Cinema Setup with Atmospheric Glow */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1595769816263-9b910be24d5f?w=1600&q=80"
            alt="Cinema Theater"
            className="w-full h-full object-cover object-center opacity-35 scale-105 hover:scale-100 transition duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-purple-950/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/40" />
        </div>

        {/* Banner Content Container */}
        <div className="relative z-10 p-6 sm:p-8 space-y-6">
          {/* Top Row: Title, Subtitle, Script Tagline & Main CTAs */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              {/* Top Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/25 text-pink-300 text-[10px] font-bold tracking-widest uppercase">
                <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                <span>PRIVATE CINEMA & 4K STREAMING THEATER</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight flex items-baseline gap-2">
                <span>Video</span>
                <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-pink-500 bg-clip-text text-transparent">
                  Theater
                </span>
              </h1>

              {/* Description */}
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
                Stream, organize and enjoy your personal videos, movies, recordings and online content in a beautiful cinematic experience.
              </p>
            </div>

            {/* Right Action Buttons & Tagline */}
            <div className="flex flex-col items-start lg:items-end justify-between gap-4 shrink-0">
              <span className="text-xs sm:text-sm font-serif italic text-slate-300 tracking-wide select-none">
                “Your Personal Cinema, Anywhere”
              </span>

              <div className="flex items-center gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={openUpload}
                  className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:from-pink-400 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-purple-600/30 flex items-center gap-2 border border-white/20 active:scale-95 transition cursor-pointer"
                >
                  <UploadCloud className="w-4 h-4 text-white" />
                  <span>Upload Video</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(true)}
                  className="px-4 py-2.5 rounded-2xl bg-slate-950/80 hover:bg-slate-900 text-white font-semibold text-xs sm:text-sm border border-white/15 hover:border-cyan-500/40 shadow-lg flex items-center gap-2 active:scale-95 transition cursor-pointer"
                >
                  <Link2 className="w-4 h-4 text-cyan-400" />
                  <span>Import Stream Link</span>
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Row: 4 Feature Capability Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-white/[0.08]">
            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-900/60 border border-white/5">
              <div className="w-7 h-7 rounded-lg bg-pink-500/20 text-pink-400 flex items-center justify-center shrink-0">
                <FileCheck className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-white leading-tight">All Formats</p>
                <p className="text-[9px] text-slate-400 leading-tight">Supported</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-900/60 border border-white/5">
              <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                <MonitorPlay className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-white leading-tight">4K Ultra HD</p>
                <p className="text-[9px] text-slate-400 leading-tight">Playback</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-900/60 border border-white/5">
              <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-white leading-tight">Zero Redirect</p>
                <p className="text-[9px] text-slate-400 leading-tight">In-App Player</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-900/60 border border-white/5">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <ListMusic className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-white leading-tight">Playlists &</p>
                <p className="text-[9px] text-slate-400 leading-tight">Favorites</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. CATEGORY PILL FILTER BAR (Matching Reference UI) */}
      <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar pb-1">
        {/* All Videos Pill */}
        <button
          type="button"
          onClick={() => setActiveCategory('ALL')}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-xs font-bold transition shrink-0 cursor-pointer ${
            activeCategory === 'ALL'
              ? 'bg-blue-600/30 text-white border-2 border-indigo-500 shadow-lg shadow-indigo-500/25'
              : 'bg-slate-900/80 text-slate-300 border border-white/10 hover:border-white/20'
          }`}
        >
          <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
            <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
          </div>
          <div className="text-left">
            <p className="leading-tight">All Videos</p>
            <p className="text-[10px] text-slate-400 leading-tight font-normal">{categoryCounts.ALL} items</p>
          </div>
        </button>

        {/* Movies Pill */}
        <button
          type="button"
          onClick={() => setActiveCategory('MOVIES')}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-xs font-bold transition shrink-0 cursor-pointer ${
            activeCategory === 'MOVIES'
              ? 'bg-cyan-600/30 text-white border-2 border-cyan-500 shadow-lg shadow-cyan-500/25'
              : 'bg-slate-900/80 text-slate-300 border border-white/10 hover:border-white/20'
          }`}
        >
          <div className="w-6 h-6 rounded-lg bg-cyan-600 flex items-center justify-center text-white">
            <Clapperboard className="w-3.5 h-3.5" />
          </div>
          <div className="text-left">
            <p className="leading-tight">Movies</p>
            <p className="text-[10px] text-slate-400 leading-tight font-normal">{categoryCounts.MOVIES} items</p>
          </div>
        </button>

        {/* Series Pill */}
        <button
          type="button"
          onClick={() => setActiveCategory('SERIES')}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-xs font-bold transition shrink-0 cursor-pointer ${
            activeCategory === 'SERIES'
              ? 'bg-purple-600/30 text-white border-2 border-purple-500 shadow-lg shadow-purple-500/25'
              : 'bg-slate-900/80 text-slate-300 border border-white/10 hover:border-white/20'
          }`}
        >
          <div className="w-6 h-6 rounded-lg bg-purple-600 flex items-center justify-center text-white">
            <Tv className="w-3.5 h-3.5" />
          </div>
          <div className="text-left">
            <p className="leading-tight">Series</p>
            <p className="text-[10px] text-slate-400 leading-tight font-normal">{categoryCounts.SERIES} items</p>
          </div>
        </button>

        {/* Personal Pill */}
        <button
          type="button"
          onClick={() => setActiveCategory('PERSONAL')}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-xs font-bold transition shrink-0 cursor-pointer ${
            activeCategory === 'PERSONAL'
              ? 'bg-violet-600/30 text-white border-2 border-violet-500 shadow-lg shadow-violet-500/25'
              : 'bg-slate-900/80 text-slate-300 border border-white/10 hover:border-white/20'
          }`}
        >
          <div className="w-6 h-6 rounded-lg bg-violet-600 flex items-center justify-center text-white">
            <UserIcon className="w-3.5 h-3.5" />
          </div>
          <div className="text-left">
            <p className="leading-tight">Personal</p>
            <p className="text-[10px] text-slate-400 leading-tight font-normal">{categoryCounts.PERSONAL} items</p>
          </div>
        </button>

        {/* Recordings Pill */}
        <button
          type="button"
          onClick={() => setActiveCategory('RECORDINGS')}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-xs font-bold transition shrink-0 cursor-pointer ${
            activeCategory === 'RECORDINGS'
              ? 'bg-red-600/30 text-white border-2 border-red-500 shadow-lg shadow-red-500/25'
              : 'bg-slate-900/80 text-slate-300 border border-white/10 hover:border-white/20'
          }`}
        >
          <div className="w-6 h-6 rounded-lg bg-red-600 flex items-center justify-center text-white">
            <Video className="w-3.5 h-3.5" />
          </div>
          <div className="text-left">
            <p className="leading-tight">Recordings</p>
            <p className="text-[10px] text-slate-400 leading-tight font-normal">{categoryCounts.RECORDINGS} items</p>
          </div>
        </button>

        {/* Downloads Pill */}
        <button
          type="button"
          onClick={() => setActiveCategory('DOWNLOADS')}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-xs font-bold transition shrink-0 cursor-pointer ${
            activeCategory === 'DOWNLOADS'
              ? 'bg-blue-600/30 text-white border-2 border-blue-500 shadow-lg shadow-blue-500/25'
              : 'bg-slate-900/80 text-slate-300 border border-white/10 hover:border-white/20'
          }`}
        >
          <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center text-white">
            <Download className="w-3.5 h-3.5" />
          </div>
          <div className="text-left">
            <p className="leading-tight">Downloads</p>
            <p className="text-[10px] text-slate-400 leading-tight font-normal">{categoryCounts.DOWNLOADS} items</p>
          </div>
        </button>

        {/* YouTube Pill */}
        <button
          type="button"
          onClick={() => setActiveCategory('YOUTUBE')}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-xs font-bold transition shrink-0 cursor-pointer ${
            activeCategory === 'YOUTUBE'
              ? 'bg-rose-600/30 text-white border-2 border-rose-500 shadow-lg shadow-rose-500/25'
              : 'bg-slate-900/80 text-slate-300 border border-white/10 hover:border-white/20'
          }`}
        >
          <div className="w-6 h-6 rounded-lg bg-rose-600 flex items-center justify-center text-white">
            <Youtube className="w-3.5 h-3.5" />
          </div>
          <div className="text-left">
            <p className="leading-tight">YouTube</p>
            <p className="text-[10px] text-slate-400 leading-tight font-normal">{categoryCounts.YOUTUBE} items</p>
          </div>
        </button>

        {/* Favorites Pill */}
        <button
          type="button"
          onClick={() => setActiveCategory('FAVORITES')}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-xs font-bold transition shrink-0 cursor-pointer ${
            activeCategory === 'FAVORITES'
              ? 'bg-pink-600/30 text-white border-2 border-pink-500 shadow-lg shadow-pink-500/25'
              : 'bg-slate-900/80 text-slate-300 border border-white/10 hover:border-white/20'
          }`}
        >
          <div className="w-6 h-6 rounded-lg bg-pink-600 flex items-center justify-center text-white">
            <Heart className="w-3.5 h-3.5 fill-white" />
          </div>
          <div className="text-left">
            <p className="leading-tight">Favorites</p>
            <p className="text-[10px] text-slate-400 leading-tight font-normal">{categoryCounts.FAVORITES} items</p>
          </div>
        </button>
      </div>

      {/* 3. SEARCH & CONTROLS TOOLBAR */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/[0.08] shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search Input Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search videos by title, tags..."
            className="w-full bg-slate-950/80 border border-white/10 focus:border-cyan-500 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 transition"
          />
        </div>

        {/* Dropdowns, View Switcher & More Filters */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Dropdown: All Types */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="px-3 py-2 bg-slate-950/80 text-xs font-semibold text-slate-300 border border-white/10 rounded-xl focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="ALL">All Types</option>
            <option value="LOCAL">Local Vault Files</option>
            <option value="YOUTUBE">YouTube Links</option>
            <option value="STREAM">Direct Stream Links</option>
          </select>

          {/* Dropdown: Date Added */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="px-3 py-2 bg-slate-950/80 text-xs font-semibold text-slate-300 border border-white/10 rounded-xl focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="NEWEST">Date Added (Newest)</option>
            <option value="OLDEST">Date Added (Oldest)</option>
            <option value="TITLE">Title (A - Z)</option>
            <option value="SIZE_DESC">File Size (Largest)</option>
          </select>

          {/* Dropdown: All Folders */}
          <select
            value={selectedFolderId}
            onChange={(e) => setSelectedFolderId(e.target.value)}
            className="px-3 py-2 bg-slate-950/80 text-xs font-semibold text-slate-300 border border-white/10 rounded-xl focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="ALL">All Folders</option>
            {folders.map((f) => (
              <option key={f.id} value={f.id}>
                📁 {f.name}
              </option>
            ))}
          </select>

          {/* View Mode Toggle: Grid / List */}
          <div className="flex items-center p-1 bg-slate-950/80 rounded-xl border border-white/10">
            <button
              type="button"
              onClick={() => setViewMode('GRID')}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                viewMode === 'GRID' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('LIST')}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                viewMode === 'LIST' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* More Filters Toggle */}
          <button
            type="button"
            onClick={() => setShowMoreFilters((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
              showMoreFilters || resolutionFilter !== 'ALL'
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                : 'bg-slate-950/80 text-slate-400 border-white/10 hover:text-white'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>More Filters</span>
          </button>
        </div>
      </div>

      {/* Optional Filter drawer */}
      {showMoreFilters && (
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/10 flex items-center gap-4 flex-wrap animate-fadeIn">
          <span className="text-xs font-bold text-slate-400">Resolution:</span>
          <div className="flex items-center gap-2">
            {(['ALL', '4K', '1080P'] as const).map((res) => (
              <button
                key={res}
                type="button"
                onClick={() => setResolutionFilter(res)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  resolutionFilter === res
                    ? 'bg-amber-500 text-black shadow'
                    : 'bg-slate-900 text-slate-300 border border-white/10'
                }`}
              >
                {res === 'ALL' ? 'All Resolutions' : res}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 4. VIDEO MEDIA CONTENT (Grid or List View) */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="aspect-[16/9] bg-slate-900 border border-white/5 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredVideos.length === 0 ? (
        <div className="py-16 px-6 text-center rounded-3xl bg-slate-900/60 border border-white/10 flex flex-col items-center justify-center max-w-xl mx-auto shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-4 shadow-lg shadow-purple-600/20">
            <Film className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1.5">No Videos Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mb-6 leading-relaxed">
            {search
              ? `No videos match "${search}". Try clearing search or selecting a different category.`
              : activeCategory !== 'ALL'
              ? `No videos categorized under ${activeCategory.toLowerCase()}. Upload a video or import a stream link.`
              : 'Your private Video Theater has no videos yet. Upload MP4/WebM videos or import YouTube streams to start watching.'}
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={openUpload}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg transition flex items-center gap-2 cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload Video</span>
            </button>
            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-slate-950 border border-white/15 hover:border-cyan-500/40 text-white font-bold text-xs transition flex items-center gap-2 cursor-pointer"
            >
              <Link2 className="w-4 h-4 text-cyan-400" />
              <span>Import Stream</span>
            </button>
          </div>
        </div>
      ) : viewMode === 'GRID' ? (
        /* GRID VIEW: Cinema-Grade 16:9 Thumbnail Cards matching Image 3 */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredVideos.map((video) => {
            const ytId = getYouTubeId(video);
            const isExt = video.isExternal || video.storageKey?.startsWith('ext:');
            const resBadge = getVideoResolution(video);
            const durationStr = getVideoDurationString(video);
            const tags = getVideoTags(video);

            return (
              <div
                key={video.id}
                onClick={() => setActiveVideo(video)}
                className="group relative rounded-2xl bg-slate-900/90 border border-white/[0.08] hover:border-cyan-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-500/10 hover:-translate-y-1 overflow-hidden flex flex-col justify-between cursor-pointer"
              >
                {/* 16:9 Media Visual & Badges */}
                <div className="relative aspect-[16/9] bg-slate-950 overflow-hidden flex items-center justify-center">
                  {ytId ? (
                    <img
                      src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`}
                      alt={video.originalName}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                  ) : (
                    <div className="relative w-full h-full flex items-center justify-center bg-slate-950">
                      <video
                        src={getMediaUrl(video.streamUrl)}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500 opacity-80"
                        preload="metadata"
                      />
                    </div>
                  )}

                  {/* Dark Vignette Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40 group-hover:opacity-75 transition" />

                  {/* Top-Left Quality Resolution Badge */}
                  <div className="absolute top-2.5 left-2.5 z-10">
                    {resBadge === '4K' ? (
                      <span className="px-2 py-0.5 rounded-md bg-amber-500 text-black font-black text-[10px] tracking-wider shadow-md uppercase">
                        4K
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white font-extrabold text-[10px] tracking-wider shadow-md uppercase">
                        1080p
                      </span>
                    )}
                  </div>

                  {/* Top-Right Favorite Heart Trigger */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleFavorite(video.id);
                    }}
                    className={`absolute top-2.5 right-2.5 z-10 w-7 h-7 rounded-full flex items-center justify-center backdrop-blur-md transition shadow-md active:scale-75 ${
                      video.isFavorite
                        ? 'bg-rose-600 text-white shadow-rose-600/30'
                        : 'bg-black/50 text-white/80 hover:text-white hover:bg-black/70'
                    }`}
                    title={video.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <Heart className={`w-3.5 h-3.5 ${video.isFavorite ? 'fill-current text-white' : ''}`} />
                  </button>

                  {/* Center Frosted Glass Circular Play Button */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md border border-white/40 flex items-center justify-center text-white transform group-hover:scale-115 transition duration-300 shadow-xl group-hover:bg-white/30">
                      <Play className="w-5 h-5 fill-white ml-0.5" />
                    </div>
                  </div>

                  {/* Bottom-Right Duration Badge */}
                  <div className="absolute bottom-2.5 right-2.5 z-10">
                    <span className="px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-[10px] font-mono text-white font-bold border border-white/10 shadow">
                      {durationStr}
                    </span>
                  </div>
                </div>

                {/* Card Info & Meta Footer */}
                <div className="p-3.5 space-y-2.5">
                  {/* Video Title */}
                  <h3
                    className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-cyan-300 transition"
                    title={video.originalName}
                  >
                    {video.originalName}
                  </h3>

                  {/* Category Tags Pills */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-slate-950 border border-white/10 text-[9px] font-bold text-slate-300 uppercase tracking-wider"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Meta Details Row: Date & Size */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/[0.06] text-[10px] text-slate-400 font-medium">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      <span>{formatDate(video.createdAt)}</span>
                    </div>

                    <div className="flex items-center gap-1 font-mono text-slate-300 font-semibold">
                      <HardDrive className="w-3 h-3 text-slate-500" />
                      <span>{formatBytes(video.size)}</span>
                    </div>
                  </div>

                  {/* Quick Action Buttons Row */}
                  <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-white/[0.04]">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShareTarget(video);
                      }}
                      className="p-1 text-slate-400 hover:text-cyan-400 rounded-md hover:bg-slate-800 transition"
                      title="Share Video"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setRenameTarget(video);
                        setNewName(video.originalName);
                      }}
                      className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition"
                      title="Rename"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <a
                      href={getMediaUrl(video.downloadUrl)}
                      download={video.originalName}
                      onClick={(e) => e.stopPropagation()}
                      className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition"
                      title="Download"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget(video);
                      }}
                      className="p-1 text-slate-400 hover:text-rose-400 rounded-md hover:bg-slate-800 transition"
                      title="Move to Trash"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* LIST VIEW: Detailed Horizontal Rows */
        <div className="space-y-3">
          {filteredVideos.map((video) => {
            const ytId = getYouTubeId(video);
            const resBadge = getVideoResolution(video);
            const durationStr = getVideoDurationString(video);
            const tags = getVideoTags(video);

            return (
              <div
                key={video.id}
                onClick={() => setActiveVideo(video)}
                className="group p-3 rounded-2xl bg-slate-900/80 border border-white/[0.08] hover:border-cyan-500/40 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-800/80"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* 16:9 Mini Thumbnail */}
                  <div className="relative w-32 aspect-[16/9] rounded-xl bg-slate-950 overflow-hidden shrink-0">
                    {ytId ? (
                      <img
                        src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`}
                        alt={video.originalName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <video
                        src={getMediaUrl(video.streamUrl)}
                        className="w-full h-full object-cover"
                        preload="metadata"
                      />
                    )}
                    <span className="absolute bottom-1 right-1 text-[8px] font-mono bg-black/80 px-1 py-0.2 rounded text-white">
                      {durationStr}
                    </span>
                  </div>

                  {/* Title & Tags */}
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {resBadge}
                      </span>
                      <h4 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-cyan-300 transition">
                        {video.originalName}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      <span>{formatBytes(video.size)}</span>
                      <span>•</span>
                      <span>{formatDate(video.createdAt)}</span>
                      {tags.map((t, idx) => (
                        <span key={idx} className="hidden sm:inline px-1.5 py-0.2 rounded bg-slate-800 text-[9px] text-slate-300">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleFavorite(video.id);
                    }}
                    className={`p-2 rounded-xl border transition ${
                      video.isFavorite
                        ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                        : 'border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${video.isFavorite ? 'fill-current' : ''}`} />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShareTarget(video);
                    }}
                    className="p-2 rounded-xl border border-white/10 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget(video);
                    }}
                    className="p-2 rounded-xl border border-white/10 text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Video Player Modal */}
      {activeVideo && (
        <VideoPlayerModal
          video={activeVideo}
          isOpen={!!activeVideo}
          onClose={() => setActiveVideo(null)}
        />
      )}

      {/* Rename Modal */}
      <Modal
        isOpen={!!renameTarget}
        onClose={() => setRenameTarget(null)}
        title="Rename Video"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleRename} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">New Video Name</label>
            <input
              type="text"
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setRenameTarget(null)}
              className="px-4 py-2 text-sm text-slate-300 hover:text-white bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-xl shadow-lg shadow-cyan-600/20"
            >
              Rename
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Move Video to Trash"
        message={`Move "${deleteTarget?.originalName}" to trash?`}
        confirmText="Move to Trash"
        isDangerous
      />

      {/* Share Modal */}
      <ShareModal
        isOpen={!!shareTarget}
        onClose={() => setShareTarget(null)}
        file={shareTarget}
      />

      {/* Import Video Stream Modal */}
      <ImportVideoModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={fetchVideos}
      />
    </div>
  );
};
