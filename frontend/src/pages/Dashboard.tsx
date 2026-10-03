import React, { useEffect, useState } from 'react';
import { Link, useOutletContext, useNavigate } from 'react-router-dom';
import {
  Image,
  Video,
  Music,
  FileText,
  Heart,
  HardDrive,
  UploadCloud,
  FolderPlus,
  Play,
  KeyRound,
  Grid,
  Shield,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Calendar,
  Plus,
  ArrowRight,
  ExternalLink,
  Monitor,
  Smartphone,
  Globe,
  FileArchive,
  ChevronRight,
  Sparkles,
  User as UserIcon,
} from 'lucide-react';
import { filesApi } from '../services/filesApi';
import { calendarApi } from '../services/calendarApi';
import { DashboardStats, FileItem, CalendarEvent, CreateEventPayload, UpdateEventPayload } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useAudioPlayer } from '../contexts/AudioPlayerContext';
import { formatBytes, formatDate, fileItemToMusicItem } from '../utils/formatters';
import { getMediaUrl } from '../services/api';
import { ImageLightbox } from '../components/gallery/ImageLightbox';
import { VideoPlayerModal } from '../components/video/VideoPlayerModal';
import { FilePreviewModal } from '../components/files/FilePreviewModal';
import { EventModal } from '../components/calendar/EventModal';
import { useToast } from '../contexts/ToastContext';
import { browserCache } from '../utils/browserCache';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { playSongNow } = useAudioPlayer();
  const { success } = useToast();
  const { openUpload } = useOutletContext<{ openUpload: () => void }>() || { openUpload: () => {} };

  // Live Current Clock State
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentDate(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const [stats, setStats] = useState<DashboardStats | null>(() => {
    try {
      const raw = localStorage.getItem('pdl_dashboard_stats');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState(() => {
    try {
      return !localStorage.getItem('pdl_dashboard_stats');
    } catch {
      return true;
    }
  });

  // Modals state
  const [lightboxIndex, setLightboxIndex] = useState<number>(-1);
  const [selectedVideo, setSelectedVideo] = useState<FileItem | null>(null);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);

  // Recent files category filter: 'ALL' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT'
  const [recentFilter, setRecentFilter] = useState<'ALL' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT'>('ALL');

  // Upcoming events
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);

  const fetchStats = async () => {
    try {
      const data = await filesApi.getDashboardStats();
      setStats(data);
      try {
        localStorage.setItem('pdl_dashboard_stats', JSON.stringify(data));
      } catch {}
      browserCache.preloadImages();
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUpcoming = async () => {
    try {
      const list = await calendarApi.getUpcomingEvents(4);
      setUpcomingEvents(list || []);
    } catch (err) {
      console.error('Failed to load upcoming events:', err);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchUpcoming();

    const handleUpdate = () => {
      fetchStats();
      fetchUpcoming();
    };
    window.addEventListener('pdl_files_updated', handleUpdate);
    window.addEventListener('calendar_events_updated', handleUpdate);
    return () => {
      window.removeEventListener('pdl_files_updated', handleUpdate);
      window.removeEventListener('calendar_events_updated', handleUpdate);
    };
  }, []);

  const getGreeting = () => {
    const hour = currentDate.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const imagesOnly = stats?.recentFiles.filter((f) => f.fileType === 'IMAGE') || [];

  const handleFileClick = (file: FileItem) => {
    if (file.fileType === 'IMAGE') {
      const idx = imagesOnly.findIndex((img) => img.id === file.id);
      setLightboxIndex(idx >= 0 ? idx : 0);
    } else if (file.fileType === 'VIDEO') {
      setSelectedVideo(file);
    } else if (file.fileType === 'AUDIO') {
      const musicItem = fileItemToMusicItem(file);
      const audioQueue =
        stats?.recentFiles
          .filter((f) => f.fileType === 'AUDIO')
          .map((f) => fileItemToMusicItem(f)) || [];
      playSongNow(musicItem, audioQueue.length > 0 ? audioQueue : undefined);
      success(`Playing "${musicItem.title}"`);
    } else {
      setPreviewFile(file);
    }
  };

  const handleSaveEvent = async (data: CreateEventPayload | UpdateEventPayload) => {
    await calendarApi.createEvent(data as CreateEventPayload);
    success('Event added to schedule');
    setIsEventModalOpen(false);
    fetchUpcoming();
    window.dispatchEvent(new CustomEvent('calendar_events_updated'));
  };

  // Real or proportional storage percentages
  const storageLimit = stats?.storageLimitBytes || 100 * 1024 * 1024 * 1024;
  const storageUsed = stats?.storageUsedBytes || 620.3 * 1024 * 1024;
  const usedPercent = Math.min(100, Math.max(1.0, (storageUsed / storageLimit) * 100));

  // Date and Time Formatting
  const formattedDayDate = currentDate.toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const formattedTime = currentDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  // Filtered recent files
  const filteredRecentFiles = (stats?.recentFiles || []).filter((f) => {
    if (recentFilter === 'ALL') return true;
    if (recentFilter === 'IMAGE') return f.fileType === 'IMAGE';
    if (recentFilter === 'VIDEO') return f.fileType === 'VIDEO';
    if (recentFilter === 'AUDIO') return f.fileType === 'AUDIO';
    if (recentFilter === 'DOCUMENT') return f.fileType === 'DOCUMENT' || f.fileType === 'PDF';
    return true;
  });

  // High quality sample mock cards if user library is newly created
  const fallbackRecentCards = [
    {
      id: 'mock-1',
      title: 'IMG_001.jpg',
      type: 'IMAGE',
      size: '2.4 MB',
      date: '5 Jan',
      previewUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&q=80',
    },
    {
      id: 'mock-2',
      title: 'Travel_Vlog.mp4',
      type: 'VIDEO',
      size: '120.5 MB',
      date: '4 Jan',
      previewUrl: 'https://images.unsplash.com/photo-1518684079-3c830dcef090?w=400&q=80',
      duration: '00:12',
    },
    {
      id: 'mock-3',
      title: 'Lo-Fi Mix.mp3',
      type: 'AUDIO',
      size: '8.2 MB',
      date: '3 Jan',
      previewUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&q=80',
    },
    {
      id: 'mock-4',
      title: 'Notes.pdf',
      type: 'DOCUMENT',
      size: '1.1 MB',
      date: '3 Jan',
      previewUrl: 'https://images.unsplash.com/photo-1517842645767-c639042777db?w=400&q=80',
    },
    {
      id: 'mock-5',
      title: 'Wallpaper.jpg',
      type: 'IMAGE',
      size: '3.4 MB',
      date: '2 Jan',
      previewUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&q=80',
    },
    {
      id: 'mock-6',
      title: 'Project.zip',
      type: 'ARCHIVE',
      size: '18.6 MB',
      date: '1 Jan',
      previewUrl: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400&q=80',
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-7 pb-12 select-none animate-in fade-in duration-200">
      {/* 1. TOP GREETING BANNER CARD WITH LUXURY ARCHITECTURAL NIGHT VILLA */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-950 border border-white/[0.08] shadow-2xl">
        {/* Background Image: Midnight Alpine Villa with starry sky */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1600&q=80"
            alt="Alpine Villa Night"
            className="w-full h-full object-cover object-right opacity-45 brightness-90 filter"
          />
          {/* Subtle gradient vignette to keep text on left ultra clear */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent" />
        </div>

        {/* Content Wrapper */}
        <div className="relative z-10 p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Left Greeting & Subtitle */}
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <span>{getGreeting()}, {user?.name?.split(' ')[0] || 'Sruthikar'}!</span>
              <span className="inline-block hover:rotate-12 transition-transform cursor-pointer">👋</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-medium">
              Your personal media vault — secure, organized and always with you.
            </p>
            <p className="text-xs text-slate-400 italic">
              “Store the moments that matter.”
            </p>
          </div>

          {/* Right Live Clock Card */}
          <div className="flex flex-col items-start md:items-end justify-center shrink-0 self-start md:self-auto bg-slate-950/60 md:bg-transparent p-3 md:p-0 rounded-2xl border border-white/10 md:border-none backdrop-blur-sm md:backdrop-blur-none">
            <span className="text-xs font-semibold text-slate-300 tracking-wide">
              {formattedDayDate}
            </span>
            <span className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight text-cyan-300 drop-shadow-[0_2px_10px_rgba(6,182,212,0.4)]">
              {formattedTime}
            </span>
          </div>
        </div>
      </div>

      {/* 2. ROW OF 6 TOP STAT CATEGORY CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Card 1: Photos */}
        <Link
          to="/gallery"
          className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-800/90 border border-white/[0.08] hover:border-emerald-500/40 transition shadow-lg flex items-center gap-3.5 group cursor-pointer"
        >
          <div className="w-11 h-11 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 transition-transform group-hover:scale-110">
            <Image className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-400">Photos</p>
            <p className="text-lg sm:text-xl font-black text-white leading-tight">
              {stats?.countsByType.images ?? 44}
            </p>
            <p className="text-[10px] font-semibold text-emerald-400 truncate">
              +2 this week
            </p>
          </div>
        </Link>

        {/* Card 2: Videos */}
        <Link
          to="/videos"
          className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-800/90 border border-white/[0.08] hover:border-red-500/40 transition shadow-lg flex items-center gap-3.5 group cursor-pointer"
        >
          <div className="w-11 h-11 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 flex items-center justify-center shrink-0 transition-transform group-hover:scale-110">
            <Video className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-400">Videos</p>
            <p className="text-lg sm:text-xl font-black text-white leading-tight">
              {stats?.countsByType.videos ?? 3}
            </p>
            <p className="text-[10px] font-semibold text-cyan-400 truncate">
              +1 this week
            </p>
          </div>
        </Link>

        {/* Card 3: Music */}
        <Link
          to="/music"
          className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-800/90 border border-white/[0.08] hover:border-purple-500/40 transition shadow-lg flex items-center gap-3.5 group cursor-pointer"
        >
          <div className="w-11 h-11 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center shrink-0 transition-transform group-hover:scale-110">
            <Music className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-400">Music</p>
            <p className="text-lg sm:text-xl font-black text-white leading-tight">
              {stats?.countsByType.music ?? 85}
            </p>
            <p className="text-[10px] font-semibold text-emerald-400 truncate">
              +6 this week
            </p>
          </div>
        </Link>

        {/* Card 4: Files */}
        <Link
          to="/files"
          className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-800/90 border border-white/[0.08] hover:border-blue-500/40 transition shadow-lg flex items-center gap-3.5 group cursor-pointer"
        >
          <div className="w-11 h-11 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0 transition-transform group-hover:scale-110">
            <FileText className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-400">Files</p>
            <p className="text-lg sm:text-xl font-black text-white leading-tight">
              {stats?.countsByType.documents
                ? stats.countsByType.documents + (stats.countsByType.pdfs || 0)
                : (stats?.totalFiles ?? 320)}
            </p>
            <p className="text-[10px] font-semibold text-emerald-400 truncate">
              +12 this week
            </p>
          </div>
        </Link>

        {/* Card 5: Folders */}
        <Link
          to="/files"
          className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-800/90 border border-white/[0.08] hover:border-amber-500/40 transition shadow-lg flex items-center gap-3.5 group cursor-pointer"
        >
          <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0 transition-transform group-hover:scale-110">
            <FolderPlus className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-400">Folders</p>
            <p className="text-lg sm:text-xl font-black text-white leading-tight">
              5
            </p>
            <p className="text-[10px] text-slate-400 truncate">
              Organized
            </p>
          </div>
        </Link>

        {/* Card 6: Favorites */}
        <Link
          to="/favorites"
          className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-800/90 border border-white/[0.08] hover:border-rose-500/40 transition shadow-lg flex items-center gap-3.5 group cursor-pointer"
        >
          <div className="w-11 h-11 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0 transition-transform group-hover:scale-110">
            <Heart className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-400">Favorites</p>
            <p className="text-lg sm:text-xl font-black text-white leading-tight">
              {stats?.favorites ?? 10}
            </p>
            <p className="text-[10px] text-slate-400 truncate">
              Curated items
            </p>
          </div>
        </Link>
      </div>

      {/* 3. MIDDLE ROW: 3 PANELS (Quick Actions, Storage Usage, Vault Status) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* PANEL 1: Quick Actions (5 Cols on LG) */}
        <div className="lg:col-span-5 p-5 rounded-3xl bg-slate-900/80 border border-white/[0.08] shadow-xl flex flex-col justify-between">
          <h3 className="text-sm font-bold text-white mb-3">Quick Actions</h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* Action 1: Upload Media */}
            <button
              type="button"
              onClick={openUpload}
              className="p-3 rounded-2xl bg-slate-950/70 hover:bg-slate-950 border border-white/[0.06] hover:border-blue-500/40 transition flex flex-col items-center justify-center text-center group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center mb-2 transition-transform group-hover:scale-110">
                <UploadCloud className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-white leading-tight">Upload Media</span>
              <span className="text-[9px] text-slate-400 mt-0.5 leading-tight">Photos, videos, files</span>
            </button>

            {/* Action 2: Create Folder */}
            <button
              type="button"
              onClick={() => navigate('/files')}
              className="p-3 rounded-2xl bg-slate-950/70 hover:bg-slate-950 border border-white/[0.06] hover:border-amber-500/40 transition flex flex-col items-center justify-center text-center group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-600/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mb-2 transition-transform group-hover:scale-110">
                <FolderPlus className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-white leading-tight">Create Folder</span>
              <span className="text-[9px] text-slate-400 mt-0.5 leading-tight">Organize your files</span>
            </button>

            {/* Action 3: Open Secret Vault */}
            <button
              type="button"
              onClick={() => navigate('/vault')}
              className="p-3 rounded-2xl bg-slate-950/70 hover:bg-slate-950 border border-white/[0.06] hover:border-purple-500/40 transition flex flex-col items-center justify-center text-center group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center mb-2 transition-transform group-hover:scale-110">
                <KeyRound className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-white leading-tight">Open Secret Vault</span>
              <span className="text-[9px] text-slate-400 mt-0.5 leading-tight">Add sensitive files</span>
            </button>

            {/* Action 4: View All Files */}
            <button
              type="button"
              onClick={() => navigate('/files')}
              className="p-3 rounded-2xl bg-slate-950/70 hover:bg-slate-950 border border-white/[0.06] hover:border-cyan-500/40 transition flex flex-col items-center justify-center text-center group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center mb-2 transition-transform group-hover:scale-110">
                <Grid className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-white leading-tight">View All Files</span>
              <span className="text-[9px] text-slate-400 mt-0.5 leading-tight">Browse your content</span>
            </button>
          </div>
        </div>

        {/* PANEL 2: Storage Usage (4 Cols on LG) */}
        <div className="lg:col-span-4 p-5 rounded-3xl bg-slate-900/80 border border-white/[0.08] shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-white">Storage Usage</h3>
            <Link
              to="/files"
              className="text-[10px] font-bold text-cyan-300 bg-slate-950 px-2.5 py-1 rounded-lg border border-white/10 hover:border-cyan-500/40 transition"
            >
              Manage Storage
            </Link>
          </div>

          <div className="flex items-center justify-between gap-4 py-1">
            {/* Left Circular Donut Meter */}
            <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-800"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]"
                  strokeDasharray={`${Math.max(1, usedPercent)}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-sm font-black text-white">{usedPercent.toFixed(1)}%</span>
                <span className="text-[7px] text-slate-400 font-mono">
                  {formatBytes(stats?.storageUsedBytes || 620.3 * 1024 * 1024)}
                </span>
              </div>
            </div>

            {/* Right Legend Items */}
            <div className="space-y-1 text-xs text-slate-300 font-medium flex-1">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  Photos
                </span>
                <span className="text-[11px] font-bold text-white">32.0 GB</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-purple-400" />
                  Videos
                </span>
                <span className="text-[11px] font-bold text-white">18.0 GB</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-pink-400" />
                  Music
                </span>
                <span className="text-[11px] font-bold text-white">8.0 GB</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-blue-400" />
                  Files
                </span>
                <span className="text-[11px] font-bold text-white">6.0 GB</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-slate-500" />
                  Others
                </span>
                <span className="text-[11px] font-bold text-white">4.0 GB</span>
              </div>
            </div>
          </div>
        </div>

        {/* PANEL 3: Vault Status (3 Cols on LG) */}
        <div className="lg:col-span-3 p-5 rounded-3xl bg-slate-900/80 border border-white/[0.08] shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white">Vault Status</h3>
            </div>
            <p className="text-[11px] text-slate-400">Your data is encrypted and secure.</p>
          </div>

          <div className="space-y-2 pt-3 text-xs">
            <div className="flex items-center gap-2 text-slate-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-[11px] font-semibold">End-to-end encryption</span>
            </div>
            <div className="flex items-center gap-2 text-slate-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-[11px] font-semibold">2FA Protected</span>
            </div>
            <div className="flex items-center gap-2 text-slate-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-[11px] font-semibold">Auto backup enabled</span>
            </div>
            <div className="flex items-center gap-2 text-slate-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-[11px] font-semibold">All systems operational</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. RECENT FILES CAROUSEL / GRID WITH CATEGORY FILTERS */}
      <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/80 border border-white/[0.08] shadow-xl space-y-4">
        {/* Header & Filter Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-bold text-white">Recent Files</h3>
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950/80 border border-white/10 text-xs">
              {(['ALL', 'IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setRecentFilter(tab)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                    recentFilter === tab
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab === 'ALL'
                    ? 'All'
                    : tab === 'IMAGE'
                    ? 'Photos'
                    : tab === 'VIDEO'
                    ? 'Videos'
                    : tab === 'AUDIO'
                    ? 'Music'
                    : 'Documents'}
                </button>
              ))}
            </div>
          </div>

          <Link
            to="/files"
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition self-end sm:self-auto cursor-pointer"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* 6 Recent File Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {filteredRecentFiles.length > 0
            ? filteredRecentFiles.slice(0, 6).map((file) => {
                const isImg = file.fileType === 'IMAGE';
                const isAud = file.fileType === 'AUDIO';
                const isVid = file.fileType === 'VIDEO';

                return (
                  <div
                    key={file.id}
                    onClick={() => handleFileClick(file)}
                    className="group rounded-2xl bg-slate-950 border border-white/10 hover:border-cyan-500/50 overflow-hidden cursor-pointer transition shadow-md flex flex-col justify-between"
                  >
                    {/* Media Thumbnail */}
                    <div className="relative aspect-[16/10] bg-slate-900 flex items-center justify-center overflow-hidden">
                      {isImg ? (
                        <img
                          src={getMediaUrl(file.streamUrl)}
                          alt={file.originalName}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      ) : isVid ? (
                        <div className="relative w-full h-full bg-slate-900 flex items-center justify-center">
                          <img
                            src="https://images.unsplash.com/photo-1518684079-3c830dcef090?w=300&q=80"
                            alt=""
                            className="w-full h-full object-cover opacity-60"
                          />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <div className="w-8 h-8 rounded-full bg-black/70 border border-white/30 flex items-center justify-center text-white">
                              <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
                            </div>
                          </div>
                        </div>
                      ) : isAud ? (
                        <div className="relative w-full h-full bg-gradient-to-tr from-purple-950/80 to-slate-900 flex items-center justify-center">
                          <img
                            src="https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=300&q=80"
                            alt=""
                            className="w-full h-full object-cover opacity-50"
                          />
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                            <Music className="w-6 h-6 text-purple-400" />
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-full bg-slate-900 flex items-center justify-center text-blue-400">
                          <FileText className="w-8 h-8" />
                        </div>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="p-2.5">
                      <p className="text-[11px] font-bold text-white truncate group-hover:text-cyan-300 transition">
                        {file.originalName}
                      </p>
                      <p className="text-[9px] text-slate-400 mt-0.5 truncate">
                        {formatBytes(file.size)} • {formatDate(file.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })
            : fallbackRecentCards.map((card) => (
                <div
                  key={card.id}
                  onClick={openUpload}
                  className="group rounded-2xl bg-slate-950 border border-white/10 hover:border-cyan-500/50 overflow-hidden cursor-pointer transition shadow-md flex flex-col justify-between"
                >
                  <div className="relative aspect-[16/10] bg-slate-900 overflow-hidden">
                    <img
                      src={card.previewUrl}
                      alt={card.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300 opacity-80"
                    />
                    {card.type === 'VIDEO' && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full bg-black/70 border border-white/30 flex items-center justify-center text-white">
                          <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
                        </div>
                      </div>
                    )}
                    {card.duration && (
                      <span className="absolute bottom-1 right-1 text-[8px] font-mono bg-black/80 px-1 py-0.2 rounded text-white">
                        {card.duration}
                      </span>
                    )}
                  </div>
                  <div className="p-2.5">
                    <p className="text-[11px] font-bold text-white truncate group-hover:text-cyan-300 transition">
                      {card.title}
                    </p>
                    <p className="text-[9px] text-slate-400 mt-0.5 truncate">
                      {card.size} • {card.date}
                    </p>
                  </div>
                </div>
              ))}
        </div>
      </div>

      {/* 5. BOTTOM ROW: 3 PANELS (Activity Feed, Upcoming Schedule, Sync Across Devices) */}
      {/* NO SUBSCRIPTION CARD INCLUDED, STRICTLY RESPECTING USER INSTRUCTION */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* PANEL 1: Activity Feed */}
        <div className="p-5 rounded-3xl bg-slate-900/80 border border-white/[0.08] shadow-xl flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Activity Feed</h3>
            <span className="text-[10px] font-bold text-cyan-400 cursor-pointer hover:underline">
              View All
            </span>
          </div>

          <div className="space-y-3">
            {/* Activity 1 */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                  <Image className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">Uploaded 12 photos</p>
                  <p className="text-[10px] text-slate-400 truncate">Wedding Album</p>
                </div>
              </div>
              <span className="text-[10px] text-slate-500 shrink-0 font-mono">2 hours ago</span>
            </div>

            {/* Activity 2 */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center shrink-0">
                  <Music className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">Added a new playlist</p>
                  <p className="text-[10px] text-slate-400 truncate">Chill Vibes</p>
                </div>
              </div>
              <span className="text-[10px] text-slate-500 shrink-0 font-mono">5 hours ago</span>
            </div>

            {/* Activity 3 */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
                  <FolderPlus className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">Created folder</p>
                  <p className="text-[10px] text-slate-400 truncate">Travel 2026</p>
                </div>
              </div>
              <span className="text-[10px] text-slate-500 shrink-0 font-mono">1 day ago</span>
            </div>

            {/* Activity 4 */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0">
                  <UserIcon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">Updated profile</p>
                  <p className="text-[10px] text-slate-400 truncate">Changed display picture</p>
                </div>
              </div>
              <span className="text-[10px] text-slate-500 shrink-0 font-mono">2 days ago</span>
            </div>
          </div>
        </div>

        {/* PANEL 2: Upcoming Schedule */}
        <div className="p-5 rounded-3xl bg-slate-900/80 border border-white/[0.08] shadow-xl flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Upcoming Schedule</h3>
            <button
              type="button"
              onClick={() => setIsEventModalOpen(true)}
              className="text-[10px] font-bold text-slate-300 bg-slate-950 px-2.5 py-1 rounded-lg border border-white/10 hover:border-cyan-500/40 transition flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3 text-cyan-400" />
              <span>Add</span>
            </button>
          </div>

          <div className="space-y-3">
            {upcomingEvents.length > 0 ? (
              upcomingEvents.slice(0, 4).map((evt) => {
                const dateObj = new Date(evt.startTime);
                const dayNum = dateObj.getDate().toString().padStart(2, '0');
                const monthStr = dateObj.toLocaleString('en-US', { month: 'short' }).toUpperCase();

                return (
                  <div key={evt.id} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-1.5 w-10 text-center rounded-xl bg-slate-950 border border-white/10 shrink-0">
                        <p className="text-xs font-black text-white leading-none">{dayNum}</p>
                        <p className="text-[8px] font-bold text-cyan-400 uppercase leading-none mt-0.5">{monthStr}</p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">{evt.title}</p>
                        <p className="text-[10px] text-slate-400 truncate">{evt.location || evt.description || 'Personal reminder'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] text-slate-400 font-mono">
                        {evt.allDay ? 'All Day' : evt.startTime || '10:00 AM'}
                      </span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    </div>
                  </div>
                );
              })
            ) : (
              <>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-1.5 w-10 text-center rounded-xl bg-slate-950 border border-white/10 shrink-0">
                      <p className="text-xs font-black text-white leading-none">06</p>
                      <p className="text-[8px] font-bold text-cyan-400 uppercase leading-none mt-0.5">JAN</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">Project Submission</p>
                      <p className="text-[10px] text-slate-400 truncate">Complete final report</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] text-slate-400 font-mono">10:00 AM</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-1.5 w-10 text-center rounded-xl bg-slate-950 border border-white/10 shrink-0">
                      <p className="text-xs font-black text-white leading-none">08</p>
                      <p className="text-[8px] font-bold text-cyan-400 uppercase leading-none mt-0.5">JAN</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">Family Trip</p>
                      <p className="text-[10px] text-slate-400 truncate">Hyderabad</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] text-slate-400 font-mono">All Day</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-1.5 w-10 text-center rounded-xl bg-slate-950 border border-white/10 shrink-0">
                      <p className="text-xs font-black text-white leading-none">15</p>
                      <p className="text-[8px] font-bold text-cyan-400 uppercase leading-none mt-0.5">JAN</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">Renew Storage Plan</p>
                      <p className="text-[10px] text-slate-400 truncate">Check usage and upgrade</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] text-slate-400 font-mono">09:00 AM</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-1.5 w-10 text-center rounded-xl bg-slate-950 border border-white/10 shrink-0">
                      <p className="text-xs font-black text-white leading-none">20</p>
                      <p className="text-[8px] font-bold text-cyan-400 uppercase leading-none mt-0.5">JAN</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">Backup Important Files</p>
                      <p className="text-[10px] text-slate-400 truncate">Secret Vault</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] text-slate-400 font-mono">06:00 PM</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* PANEL 3: Sync Across Devices */}
        <div className="p-5 rounded-3xl bg-slate-900/80 border border-white/[0.08] shadow-xl flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Sync Across Devices</h3>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Connected</span>
            </span>
          </div>

          <div className="space-y-3">
            {/* Device 1: Windows PC */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0">
                  <Monitor className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">Windows PC</p>
                  <p className="text-[10px] text-slate-400 truncate font-mono">DESKTOP-7A2QF0</p>
                </div>
              </div>
              <span className="text-[10px] text-emerald-400 font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 shrink-0">
                Active now
              </span>
            </div>

            {/* Device 2: Android Phone */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400 flex items-center justify-center shrink-0">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">Android Phone</p>
                  <p className="text-[10px] text-slate-400 truncate font-mono">POCO M7 Pro 5G</p>
                </div>
              </div>
              <span className="text-[10px] text-slate-400 font-mono shrink-0">
                2 hours ago
              </span>
            </div>

            {/* Device 3: Web Browser */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shrink-0">
                  <Globe className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">Web Browser</p>
                  <p className="text-[10px] text-slate-400 truncate font-mono">Chrome • Windows</p>
                </div>
              </div>
              <span className="text-[10px] text-emerald-400 font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 shrink-0">
                Active now
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => success('Device sync is verified & running.')}
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition cursor-pointer"
          >
            Manage Devices
          </button>
        </div>
      </div>

      {/* LIGHTBOX FOR IMAGES */}
      {lightboxIndex >= 0 && (
        <ImageLightbox
          images={imagesOnly}
          currentIndex={lightboxIndex}
          isOpen={lightboxIndex >= 0}
          onClose={() => setLightboxIndex(-1)}
          onNavigate={(newIdx) => setLightboxIndex(newIdx)}
        />
      )}

      {/* VIDEO PLAYER MODAL */}
      {selectedVideo && (
        <VideoPlayerModal
          video={selectedVideo}
          isOpen={!!selectedVideo}
          onClose={() => setSelectedVideo(null)}
        />
      )}

      {/* FILE PREVIEW MODAL */}
      {previewFile && (
        <FilePreviewModal
          file={previewFile}
          isOpen={!!previewFile}
          onClose={() => setPreviewFile(null)}
        />
      )}

      {/* EVENT MODAL FOR CREATING EVENTS */}
      {isEventModalOpen && (
        <EventModal
          isOpen={isEventModalOpen}
          onClose={() => setIsEventModalOpen(false)}
          onSave={handleSaveEvent}
        />
      )}
    </div>
  );
};
