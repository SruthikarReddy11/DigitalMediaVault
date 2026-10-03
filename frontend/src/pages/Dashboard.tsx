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
  Tablet,
  Globe,
  FileArchive,
  ChevronRight,
  Sparkles,
  User as UserIcon,
  Activity,
  Layers,
  Laptop,
} from 'lucide-react';
import { filesApi } from '../services/filesApi';
import { calendarApi } from '../services/calendarApi';
import { foldersApi } from '../services/foldersApi';
import { authApi, UserSession } from '../services/authApi';
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
import { DayPeriodIndicator } from '../components/common/DayPeriodIndicator';

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

  // Exact data states
  const [foldersCount, setFoldersCount] = useState<number>(0);
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);

  // Modals state
  const [lightboxIndex, setLightboxIndex] = useState<number>(-1);
  const [selectedVideo, setSelectedVideo] = useState<FileItem | null>(null);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);

  // Recent files category filter: 'ALL' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT'
  const [recentFilter, setRecentFilter] = useState<'ALL' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT'>('ALL');

  const fetchDashboardData = async () => {
    try {
      const [statsData, upcomingData, foldersData, sessionsData] = await Promise.all([
        filesApi.getDashboardStats().catch(() => null),
        calendarApi.getUpcomingEvents(4).catch(() => []),
        foldersApi.getFolders().catch(() => []),
        authApi.getSessions().catch(() => []),
      ]);

      if (statsData) {
        setStats(statsData);
        try {
          localStorage.setItem('pdl_dashboard_stats', JSON.stringify(statsData));
        } catch {}
        browserCache.preloadImages();
      }

      setUpcomingEvents(upcomingData || []);
      setFoldersCount(Array.isArray(foldersData) ? foldersData.length : 0);
      setSessions(Array.isArray(sessionsData) ? sessionsData : []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    const handleUpdate = () => {
      fetchDashboardData();
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
    if (hour >= 5 && hour < 12) return 'Good morning';
    if (hour >= 12 && hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const imagesOnly = stats?.recentFiles?.filter((f) => f.fileType === 'IMAGE') || [];

  const handleFileClick = (file: FileItem) => {
    if (file.fileType === 'IMAGE') {
      const idx = imagesOnly.findIndex((img) => img.id === file.id);
      setLightboxIndex(idx >= 0 ? idx : 0);
    } else if (file.fileType === 'VIDEO') {
      setSelectedVideo(file);
    } else if (file.fileType === 'AUDIO') {
      const musicItem = fileItemToMusicItem(file);
      if (musicItem) {
        playSongNow(musicItem);
      } else {
        setPreviewFile(file);
      }
    } else {
      setPreviewFile(file);
    }
  };

  const handleSaveEvent = async (payload: CreateEventPayload | UpdateEventPayload) => {
    try {
      await calendarApi.createEvent(payload as CreateEventPayload);
      success('Event scheduled successfully');
      const updated = await calendarApi.getUpcomingEvents(4).catch(() => []);
      setUpcomingEvents(updated || []);
    } catch (err) {
      console.error('Failed to create event:', err);
    }
  };

  // Format real activities
  const formatActivityItem = (act: { id: string; action: string; resourceType?: string; createdAt: string; metadata?: any }) => {
    let title = 'Activity logged';
    let subtitle = act.resourceType || 'Vault System';
    let IconComp = Activity;
    let colorClass = 'text-blue-400 bg-blue-500/15 border-blue-500/30';

    const actionUpper = (act.action || '').toUpperCase();
    if (actionUpper.includes('UPLOAD')) {
      title = `Uploaded ${act.metadata?.fileName || 'media file'}`;
      subtitle = act.metadata?.mimeType || 'Vault Storage';
      IconComp = Image;
      colorClass = 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30';
    } else if (actionUpper.includes('FOLDER')) {
      title = `Created folder "${act.metadata?.name || 'Folder'}"`;
      subtitle = 'File Directory';
      IconComp = FolderPlus;
      colorClass = 'text-amber-400 bg-amber-500/15 border-amber-500/30';
    } else if (actionUpper.includes('MUSIC') || actionUpper.includes('PLAYLIST') || actionUpper.includes('AUDIO')) {
      title = act.metadata?.title ? `Added track "${act.metadata.title}"` : 'Updated music playlist';
      subtitle = 'Music Studio';
      IconComp = Music;
      colorClass = 'text-purple-400 bg-purple-500/15 border-purple-500/30';
    } else if (actionUpper.includes('DELETE') || actionUpper.includes('TRASH')) {
      title = `Moved item to trash`;
      subtitle = act.metadata?.fileName || 'File action';
      IconComp = FileText;
      colorClass = 'text-red-400 bg-red-500/15 border-red-500/30';
    } else if (actionUpper.includes('PROFILE') || actionUpper.includes('LOGIN')) {
      title = `Security Session Active`;
      subtitle = act.metadata?.client || 'Authorized Access';
      IconComp = UserIcon;
      colorClass = 'text-cyan-400 bg-cyan-500/15 border-cyan-500/30';
    }

    return { title, subtitle, IconComp, colorClass };
  };

  const formatRelativeTime = (dateStr?: string) => {
    if (!dateStr) return 'Just now';
    try {
      const diffMs = Date.now() - new Date(dateStr).getTime();
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHour = Math.floor(diffMin / 60);
      const diffDays = Math.floor(diffHour / 24);

      if (diffMin < 1) return 'Just now';
      if (diffMin < 60) return `${diffMin}m ago`;
      if (diffHour < 24) return `${diffHour}h ago`;
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;
      return new Date(dateStr).toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return 'Recent';
    }
  };

  // Filter recent files
  const filteredRecentFiles = (stats?.recentFiles || []).filter((file) => {
    if (recentFilter === 'ALL') return true;
    if (recentFilter === 'IMAGE') return file.fileType === 'IMAGE';
    if (recentFilter === 'VIDEO') return file.fileType === 'VIDEO';
    if (recentFilter === 'AUDIO') return file.fileType === 'AUDIO';
    if (recentFilter === 'DOCUMENT') {
      return (
        file.fileType === 'DOCUMENT' ||
        file.fileType === 'PDF' ||
        file.fileType === 'SPREADSHEET' ||
        file.fileType === 'ARCHIVE' ||
        file.fileType === 'OTHER'
      );
    }
    return true;
  });

  // Accurate storage numbers
  const totalStorageLimit = stats?.storageLimitBytes || 100 * 1024 * 1024 * 1024;
  const totalStorageUsed = stats?.storageUsedBytes || 0;
  const usedPercent = Math.min(100, Math.max(0, (totalStorageUsed / totalStorageLimit) * 100));

  // Storage category bytes
  const photoBytes = stats?.storageByType?.images ?? 0;
  const videoBytes = stats?.storageByType?.videos ?? 0;
  const musicBytes = stats?.storageByType?.music ?? 0;
  const docBytes = stats?.storageByType?.documents ?? 0;
  const otherBytes = stats?.storageByType?.others ?? 0;

  // Formatted date string for banner
  const formattedDayDate = currentDate.toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  // Formatted live time string
  const formattedTime = currentDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn pb-12">
      {/* 1. TOP WELCOME HERO BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-white/[0.08] shadow-2xl">
        {/* Background Photo & Atmosphere */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1600&q=80"
            alt=""
            className="w-full h-full object-cover object-center opacity-30 scale-105 transform hover:scale-100 transition duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-indigo-950/60" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent" />
        </div>

        {/* Content Wrapper */}
        <div className="relative z-10 p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Left Greeting & Subtitle */}
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <span>{getGreeting()}, {user?.name?.split(' ')[0] || 'Sruthikar'}!</span>
              <DayPeriodIndicator currentDate={currentDate} size="md" />
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
              {stats?.countsByType.images ?? 0}
            </p>
            <p className="text-[10px] font-semibold text-emerald-400 truncate">
              {stats?.countsByType.images ? `${stats.countsByType.images} photos` : 'No photos yet'}
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
              {stats?.countsByType.videos ?? 0}
            </p>
            <p className="text-[10px] font-semibold text-cyan-400 truncate">
              {stats?.countsByType.videos ? `${stats.countsByType.videos} videos` : 'No videos yet'}
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
              {stats?.countsByType.music ?? 0}
            </p>
            <p className="text-[10px] font-semibold text-purple-400 truncate">
              {stats?.countsByType.music ? `${stats.countsByType.music} songs` : 'No tracks yet'}
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
                : (stats?.totalFiles ?? 0)}
            </p>
            <p className="text-[10px] font-semibold text-blue-400 truncate">
              {stats?.totalFiles ? `${stats.totalFiles} items stored` : 'No documents'}
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
              {foldersCount}
            </p>
            <p className="text-[10px] text-amber-400 truncate">
              {foldersCount > 0 ? `${foldersCount} directories` : 'No folders'}
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
              {stats?.favorites ?? 0}
            </p>
            <p className="text-[10px] text-rose-400 truncate">
              {stats?.favorites ? `${stats.favorites} starred items` : 'No favorites'}
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
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mb-2 transition-transform group-hover:scale-110">
                <FolderPlus className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-white leading-tight">Create Folder</span>
              <span className="text-[9px] text-slate-400 mt-0.5 leading-tight">Organize files</span>
            </button>

            {/* Action 3: Open Vault */}
            <button
              type="button"
              onClick={() => navigate('/vault')}
              className="p-3 rounded-2xl bg-slate-950/70 hover:bg-slate-950 border border-white/[0.06] hover:border-emerald-500/40 transition flex flex-col items-center justify-center text-center group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mb-2 transition-transform group-hover:scale-110">
                <KeyRound className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-white leading-tight">Secret Vault</span>
              <span className="text-[9px] text-slate-400 mt-0.5 leading-tight">PIN protected</span>
            </button>

            {/* Action 4: View All Files */}
            <button
              type="button"
              onClick={() => navigate('/files')}
              className="p-3 rounded-2xl bg-slate-950/70 hover:bg-slate-950 border border-white/[0.06] hover:border-purple-500/40 transition flex flex-col items-center justify-center text-center group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center mb-2 transition-transform group-hover:scale-110">
                <Grid className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-white leading-tight">View All Files</span>
              <span className="text-[9px] text-slate-400 mt-0.5 leading-tight">Browse drive</span>
            </button>
          </div>
        </div>

        {/* PANEL 2: Storage Usage with Circular Gauge (4 Cols on LG) */}
        <div className="lg:col-span-4 p-5 rounded-3xl bg-slate-900/80 border border-white/[0.08] shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-white">Storage Usage</h3>
            <span className="text-xs font-semibold text-cyan-400 font-mono">
              {formatBytes(totalStorageUsed)} / {formatBytes(totalStorageLimit)}
            </span>
          </div>

          <div className="flex items-center gap-4 my-auto">
            {/* SVG Circular Donut Meter */}
            <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
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
                  {formatBytes(totalStorageUsed)}
                </span>
              </div>
            </div>

            {/* Right Legend Items with Exact Category Bytes */}
            <div className="space-y-1 text-xs text-slate-300 font-medium flex-1">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Photos
                </span>
                <span className="text-[11px] font-bold text-white">{formatBytes(photoBytes)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-red-400" />
                  Videos
                </span>
                <span className="text-[11px] font-bold text-white">{formatBytes(videoBytes)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-purple-400" />
                  Music
                </span>
                <span className="text-[11px] font-bold text-white">{formatBytes(musicBytes)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-blue-400" />
                  Files
                </span>
                <span className="text-[11px] font-bold text-white">{formatBytes(docBytes)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-slate-500" />
                  Others
                </span>
                <span className="text-[11px] font-bold text-white">{formatBytes(otherBytes)}</span>
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

        {/* Real File Cards Grid or Clean Empty State */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {filteredRecentFiles.length > 0 ? (
            filteredRecentFiles.slice(0, 6).map((file) => {
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
                        <div className="w-10 h-10 rounded-full bg-red-600/80 border border-white/30 flex items-center justify-center text-white shadow-lg">
                          <Play className="w-4 h-4 fill-white ml-0.5" />
                        </div>
                      </div>
                    ) : isAud ? (
                      <div className="relative w-full h-full bg-gradient-to-tr from-purple-950/80 to-slate-900 flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-purple-600/80 border border-white/30 flex items-center justify-center text-white shadow-lg">
                          <Music className="w-5 h-5" />
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
          ) : (
            <div className="col-span-full py-10 flex flex-col items-center justify-center text-center rounded-2xl bg-slate-950/40 border border-white/5 p-6">
              <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-white/10 flex items-center justify-center text-slate-400 mb-3">
                <FolderPlus className="w-6 h-6 text-cyan-400" />
              </div>
              <p className="text-sm font-bold text-white">
                {recentFilter === 'ALL'
                  ? 'No files stored yet'
                  : `No ${recentFilter.toLowerCase()} files found`}
              </p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Upload photos, videos, music, or documents to store and view them in your vault.
              </p>
              <button
                type="button"
                onClick={openUpload}
                className="mt-4 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 transition flex items-center gap-2 cursor-pointer"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Upload Files Now</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 5. BOTTOM ROW: 3 PANELS (Activity Feed, Upcoming Schedule, Sync Across Devices) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* PANEL 1: Activity Feed */}
        <div className="p-5 rounded-3xl bg-slate-900/80 border border-white/[0.08] shadow-xl flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Activity Feed</h3>
            <Link to="/files" className="text-[10px] font-bold text-cyan-400 hover:underline">
              View All
            </Link>
          </div>

          <div className="space-y-3">
            {stats?.recentActivity && stats.recentActivity.length > 0 ? (
              stats.recentActivity.slice(0, 4).map((act) => {
                const { title, subtitle, IconComp, colorClass } = formatActivityItem(act);
                return (
                  <div key={act.id} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${colorClass}`}>
                        <IconComp className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">{title}</p>
                        <p className="text-[10px] text-slate-400 truncate">{subtitle}</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-500 shrink-0 font-mono">
                      {formatRelativeTime(act.createdAt)}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-7 px-4 text-center rounded-2xl bg-slate-950/40 border border-white/5">
                <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-white/10 text-slate-400 flex items-center justify-center mb-2.5">
                  <Activity className="w-5 h-5 text-cyan-400" />
                </div>
                <p className="text-xs font-bold text-white">No activity yet</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Upload a file or organize media to record logs</p>
                <button
                  type="button"
                  onClick={openUpload}
                  className="mt-3 px-3 py-1.5 rounded-lg text-[10px] font-bold text-cyan-300 bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 transition flex items-center gap-1 cursor-pointer"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Upload Media</span>
                </button>
              </div>
            )}
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
                        {evt.allDay ? 'All Day' : dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-7 px-4 text-center rounded-2xl bg-slate-950/40 border border-white/5">
                <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-white/10 text-slate-400 flex items-center justify-center mb-2.5">
                  <Calendar className="w-5 h-5 text-cyan-400" />
                </div>
                <p className="text-xs font-bold text-white">No upcoming events</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Keep track of your schedule, meetings & plans</p>
                <button
                  type="button"
                  onClick={() => setIsEventModalOpen(true)}
                  className="mt-3 px-3 py-1.5 rounded-lg text-[10px] font-bold text-cyan-300 bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 transition flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Event</span>
                </button>
              </div>
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
            {sessions.length > 0 ? (
              sessions.slice(0, 3).map((sess) => {
                const isMob = sess.deviceType === 'MOBILE';
                const isTab = sess.deviceType === 'TABLET';
                const DeviceIcon = isMob ? Smartphone : isTab ? Tablet : Laptop;

                return (
                  <div key={sess.id} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0">
                        <DeviceIcon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">{sess.deviceName || 'Personal Device'}</p>
                        <p className="text-[10px] text-slate-400 truncate font-mono">
                          {sess.browser || 'Web'} • {sess.os || 'Connected'}
                        </p>
                      </div>
                    </div>
                    {sess.isCurrent ? (
                      <span className="text-[10px] text-emerald-400 font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 shrink-0">
                        Active now
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">
                        {formatRelativeTime(sess.lastUsedAt || sess.createdAt)}
                      </span>
                    )}
                  </div>
                );
              })
            ) : (
              /* Fallback to Current Browser Client */
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0">
                    <Monitor className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">Current Workstation</p>
                    <p className="text-[10px] text-slate-400 truncate font-mono">Web Browser Session</p>
                  </div>
                </div>
                <span className="text-[10px] text-emerald-400 font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 shrink-0">
                  Active now
                </span>
              </div>
            )}

            {/* Option to pair additional devices if only 1 device is active */}
            {sessions.length <= 1 && (
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-dashed border-white/10 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Smartphone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="text-[10px] text-slate-300 truncate">Connect mobile or tablet</span>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/settings')}
                  className="text-[9px] font-bold text-cyan-400 hover:text-cyan-300 border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 rounded-md shrink-0 cursor-pointer"
                >
                  Pair Device
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => navigate('/settings')}
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
