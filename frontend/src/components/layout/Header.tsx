import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Menu,
  Search,
  UploadCloud,
  Moon,
  Sun,
  LogOut,
  User as UserIcon,
  Settings,
  Shield,
  X,
  MapPin,
  Home,
  Image,
  Video,
  Music,
  FolderClosed,
  ListMusic,
  KeyRound,
  BookUser,
  Heart,
  Trash2,
  Calendar,
  Cloud,
  Sparkles,
  CheckCircle2,
  Share2,
  ShieldCheck,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useAudioPlayer } from '../../contexts/AudioPlayerContext';
import { getMediaUrl } from '../../services/api';
import { searchApi } from '../../services/searchApi';
import { calculateAge } from '../../utils/formatters';
import { GlobalSearchDropdown } from '../search/GlobalSearchDropdown';
import { GlobalSearchResponse, FileItem } from '../../types';
import { VideoPlayerModal } from '../video/VideoPlayerModal';
import { ImageLightbox } from '../gallery/ImageLightbox';
import { FilePreviewModal } from '../files/FilePreviewModal';
import { HeaderNotificationBell } from '../notifications/HeaderNotificationBell';
import { Logo3D } from '../common/Logo3D';

const getSectionInfo = (pathname: string) => {
  if (pathname === '/') return { label: 'Dashboard', icon: Home, color: 'text-cyan-400' };
  if (pathname.startsWith('/gallery')) return { label: 'Photos Studio', icon: Image, color: 'text-blue-400' };
  if (pathname.startsWith('/videos')) return { label: 'Cinema & 4K Video', icon: Video, color: 'text-purple-400' };
  if (pathname.startsWith('/music')) return { label: 'Lossless Audio', icon: Music, color: 'text-amber-400' };
  if (pathname.startsWith('/playlists')) return { label: 'Hi-Fi Playlists', icon: ListMusic, color: 'text-amber-400' };
  if (pathname.startsWith('/files')) return { label: 'Files Drive', icon: FolderClosed, color: 'text-cyan-400' };
  if (pathname.startsWith('/vault')) return { label: 'Secret Vault', icon: KeyRound, color: 'text-amber-400' };
  if (pathname.startsWith('/contacts')) return { label: 'Secure Contacts', icon: BookUser, color: 'text-cyan-400' };
  if (pathname.startsWith('/favorites')) return { label: 'Favorites', icon: Heart, color: 'text-rose-400' };
  if (pathname.startsWith('/shared-links')) return { label: 'Shared Links', icon: Share2, color: 'text-cyan-400' };
  if (pathname.startsWith('/trash')) return { label: 'Trash Bin', icon: Trash2, color: 'text-rose-400' };
  if (pathname.startsWith('/calendar')) return { label: 'Calendar', icon: Calendar, color: 'text-indigo-400' };
  if (pathname.startsWith('/settings')) return { label: 'Vault Settings', icon: Settings, color: 'text-slate-400' };
  if (pathname.startsWith('/admin')) return { label: 'Admin Console', icon: Shield, color: 'text-purple-400' };
  return { label: 'VaultMedia', icon: Sparkles, color: 'text-cyan-400' };
};

interface HeaderProps {
  onToggleSidebar: () => void;
  onOpenUpload: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, onOpenUpload }) => {
  const { user, logout, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  let currentTrack: any = null;
  let isPlaying = false;
  let isOnline = true;
  let isOfflinePlayback = false;
  try {
    const audio = useAudioPlayer();
    currentTrack = audio.currentTrack;
    isPlaying = audio.isPlaying;
    isOnline = audio.isOnline;
    isOfflinePlayback = audio.isOfflinePlayback;
  } catch {
    // Graceful fallback if rendered outside AudioPlayerProvider
  }

  const sectionInfo = getSectionInfo(location.pathname);
  const SectionIcon = sectionInfo.icon;

  const [searchTerm, setSearchTerm] = useState('');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Global Search state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<GlobalSearchResponse | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Modals for direct preview from header search
  const [selectedVideo, setSelectedVideo] = useState<FileItem | null>(null);
  const [previewImages, setPreviewImages] = useState<FileItem[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);

  const userAge = user?.dob ? calculateAge(user.dob) : null;
  const locationDisplay = [user?.village, user?.pincode].filter(Boolean).join(', ');

  // Reset image error if user avatarUrl changes
  useEffect(() => {
    setImageError(false);
  }, [user?.avatarUrl]);

  // Close profile dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Global Ctrl+K / Cmd+K shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        setIsSearchOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Debounced search effect
  useEffect(() => {
    const trimmed = searchTerm.trim();
    if (!trimmed) {
      setSearchResults(null);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await searchApi.globalSearch(trimmed, { limit: 20 });
        setSearchResults(res);
      } catch (err) {
        console.error('Failed to search:', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    setIsSearchOpen(false);
    navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
  };

  const handleSelectRecentQuery = (q: string) => {
    setSearchTerm(q);
    setIsSearchOpen(true);
  };

  const handlePreviewPhoto = (photo: FileItem) => {
    setPreviewImages([photo]);
    setLightboxIndex(0);
    setIsLightboxOpen(true);
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-slate-950/90 backdrop-blur-3xl border-b border-white/[0.08] shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)] px-3 sm:px-6 flex items-center justify-between gap-2.5 sm:gap-4 relative select-none">
      {/* Luminous Neon Cyber Animated Bottom Laser Streak */}
      <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-400 via-indigo-500 to-transparent animate-laser-sweep pointer-events-none opacity-85" />

      {/* Left section: Hamburger & Mobile 3D Logo / Desktop Section Breadcrumb */}
      <div className="flex items-center gap-2 sm:gap-3 flex-1 max-w-2xl min-w-0">
        {/* Mobile View: Hamburger + 3D Logo */}
        <div className="flex items-center gap-2 lg:hidden shrink-0">
          <button
            onClick={onToggleSidebar}
            className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-900/80 border border-white/10 hover:border-cyan-500/40 transition active:scale-95 cursor-pointer"
            aria-label="Toggle Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Logo3D size="xs" withText badge="3D" to="/" />
        </div>

        {/* Desktop View: Live Section Status Badge */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-900/80 border border-white/[0.08] backdrop-blur-md shadow-inner shadow-cyan-950/30 shrink-0">
          <div className="p-1 rounded-lg bg-slate-800/90 border border-white/5">
            <SectionIcon className={`w-3.5 h-3.5 ${sectionInfo.color}`} />
          </div>
          <span className="text-xs font-bold text-white tracking-wide">{sectionInfo.label}</span>
          <div className="flex items-center gap-1.5 pl-2 border-l border-white/10">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] font-mono font-black text-emerald-400 tracking-wider uppercase">Online</span>
          </div>
        </div>

        {/* Quantum Military Encryption Badge */}
        <div className="hidden 2xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl bg-slate-900/70 border border-white/[0.06] text-[11px] shadow-sm shrink-0" title="Quantum Military Grade AES-256 GCM Cloud Storage">
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-mono text-[10px] font-bold text-slate-300 tracking-wider">AES-256 GCM</span>
        </div>

        {/* Live Audio Equalizer & Online/Offline Telemetry Pill */}
        {isPlaying && currentTrack && (
          <button
            type="button"
            onClick={() => navigate('/music')}
            className={`hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-2xl border text-xs shadow-inner cursor-pointer group transition-all shrink-0 active:scale-95 ${
              !isOnline || isOfflinePlayback
                ? 'bg-amber-950/40 border-amber-500/40 text-amber-200 hover:border-amber-300'
                : 'bg-cyan-950/40 border-cyan-500/40 text-cyan-200 hover:border-cyan-300'
            }`}
            title={`Now Playing: ${currentTrack.title} (${!isOnline || isOfflinePlayback ? 'OFFLINE LOCAL CACHE' : 'ONLINE LOSSLESS STREAM'})`}
          >
            <div className="flex items-end gap-0.5 h-3.5 w-3.5 pb-0.5">
              <span className={`w-0.5 rounded-full animate-eq-1 ${!isOnline || isOfflinePlayback ? 'bg-amber-400' : 'bg-cyan-400'}`} />
              <span className={`w-0.5 rounded-full animate-eq-2 ${!isOnline || isOfflinePlayback ? 'bg-amber-300' : 'bg-cyan-300'}`} />
              <span className={`w-0.5 rounded-full animate-eq-3 ${!isOnline || isOfflinePlayback ? 'bg-yellow-400' : 'bg-sky-400'}`} />
              <span className={`w-0.5 rounded-full animate-eq-4 ${!isOnline || isOfflinePlayback ? 'bg-orange-400' : 'bg-indigo-400'}`} />
            </div>
            <span className="text-[11px] font-bold truncate max-w-[110px] group-hover:text-white transition">
              {currentTrack.title}
            </span>

            {/* Online / Offline status indicator pill */}
            <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-mono font-black uppercase border ${
              !isOnline || isOfflinePlayback
                ? 'bg-amber-500/20 text-amber-300 border-amber-400/30'
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
            }`}>
              {!isOnline || isOfflinePlayback ? (
                <>
                  <WifiOff className="w-2.5 h-2.5 text-amber-400" />
                  <span>OFFLINE</span>
                </>
              ) : (
                <>
                  <Wifi className="w-2.5 h-2.5 text-emerald-400" />
                  <span>ONLINE</span>
                </>
              )}
            </div>
          </button>
        )}

        {/* Global Command Search Bar Container */}
        <div ref={searchContainerRef} className="relative w-full min-w-0">
          <form onSubmit={handleSearchSubmit} className="relative w-full group">
            <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-cyan-500/0 via-cyan-500/35 to-indigo-500/0 opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 blur-sm pointer-events-none" />
            <div className="relative flex items-center">
              <Search className="absolute left-3.5 w-4 h-4 text-slate-400 group-focus-within:text-cyan-400 transition-colors pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onFocus={() => setIsSearchOpen(true)}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search files, lossless music, 4K videos, documents..."
                className="w-full bg-slate-900/80 border border-white/[0.08] hover:border-slate-700/80 focus:border-cyan-400/80 focus:bg-slate-900/95 rounded-2xl pl-10 pr-20 py-2 text-xs sm:text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all shadow-inner backdrop-blur-md"
              />
              {searchTerm ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setSearchResults(null);
                  }}
                  className="absolute right-3 text-slate-400 hover:text-white p-0.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <div className="absolute right-2.5 hidden sm:flex items-center gap-1 pointer-events-none">
                  <kbd className="px-1.5 py-0.5 text-[9px] font-mono font-bold text-cyan-300 bg-slate-800/90 border border-cyan-500/25 rounded-md shadow-sm">
                    Ctrl K
                  </kbd>
                </div>
              )}
            </div>
          </form>

          {/* Floating Live Categorized Dropdown */}
          <GlobalSearchDropdown
            isOpen={isSearchOpen}
            onClose={() => setIsSearchOpen(false)}
            query={searchTerm}
            searchResults={searchResults}
            isLoading={isSearching}
            onSelectRecentQuery={handleSelectRecentQuery}
            onPreviewFile={(f) => setSelectedFile(f)}
            onPreviewVideo={(v) => setSelectedVideo(v)}
            onPreviewPhoto={handlePreviewPhoto}
          />
        </div>
      </div>

      {/* Right section: Cloud Sync, 3D Upload, Theme, Profile */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        {/* Cloud Sync Capsule */}
        <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-900/70 border border-white/[0.07] text-xs shadow-sm" title="Vault Cloud Storage Active & Synchronized">
          <div className="relative flex items-center justify-center">
            <Cloud className="w-3.5 h-3.5 text-cyan-400" />
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400 ring-2 ring-slate-900 animate-pulse"></span>
          </div>
          <span className="text-[11px] font-medium text-slate-300">Vault Synced</span>
        </div>

        {/* 3D Tactile Upload Button */}
        <button
          onClick={onOpenUpload}
          className="group relative flex items-center gap-2 px-3.5 sm:px-4 py-2 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-extrabold rounded-2xl transition shadow-[0_4px_18px_rgba(6,182,212,0.3)] hover:shadow-[0_6px_25px_rgba(6,182,212,0.45)] border border-cyan-300/40 active:translate-y-0.5 active:scale-95 shrink-0 cursor-pointer overflow-hidden"
        >
          {/* Top Specular Edge Highlight Ribbon */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/60 to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
          <UploadCloud className="w-4 h-4 transition-transform group-hover:-translate-y-0.5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]" />
          <span className="hidden sm:inline tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">Upload</span>
        </button>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2 text-slate-400 hover:text-white bg-slate-900/80 border border-white/[0.08] hover:border-cyan-500/40 rounded-2xl transition cursor-pointer shadow-sm hover:shadow-[0_0_15px_rgba(6,182,212,0.2)] active:scale-95"
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-400" />
          )}
        </button>

        {/* Calendar & Smart Reminders Bell */}
        <HeaderNotificationBell />

        {/* Luxury User Profile Capsule */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setIsProfileOpen((prev) => !prev)}
            className="flex items-center gap-2.5 p-1 sm:px-2 sm:py-1 rounded-2xl hover:bg-slate-900/90 border border-transparent hover:border-white/10 transition cursor-pointer group"
          >
            <div className="relative w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center text-white text-sm font-black shadow-md shadow-cyan-500/25 overflow-hidden border border-cyan-300/40 ring-2 ring-cyan-500/20 group-hover:ring-cyan-400/40 transition shrink-0">
              {user?.avatarUrl && !imageError ? (
                <img
                  src={getMediaUrl(user.avatarUrl)}
                  alt={user.name}
                  onError={() => setImageError(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{user?.name ? user.name.charAt(0).toUpperCase() : 'U'}</span>
              )}
            </div>

            <div className="hidden md:flex flex-col text-left">
              <div className="flex items-center gap-1.5 leading-tight">
                <span className="text-xs font-bold text-white leading-tight">
                  {user?.name || 'User'}
                </span>
                <span className="text-[9px] font-mono font-black uppercase px-1 py-0.2 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-400/30">
                  {isAdmin ? 'ADMIN' : 'VIP'}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 leading-tight">
                @{user?.username || 'user'}
              </span>
            </div>
          </button>

          {/* Profile Menu Popup */}
          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-slate-900/95 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100 divide-y divide-slate-800/80">
              <div className="p-2 space-y-1">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shadow-md overflow-hidden shrink-0">
                    {user?.avatarUrl && !imageError ? (
                      <img
                        src={getMediaUrl(user.avatarUrl)}
                        alt={user.name}
                        onError={() => setImageError(true)}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{user?.name ? user.name.charAt(0).toUpperCase() : 'U'}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{user?.name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
                  </div>
                </div>

                {locationDisplay && (
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 pt-1">
                    <MapPin className="w-3 h-3 text-brand-400" />
                    <span className="truncate">{locationDisplay}</span>
                  </div>
                )}
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    navigate('/settings');
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800/80 transition text-left cursor-pointer"
                >
                  <Settings className="w-4 h-4 text-slate-400" />
                  Account Settings
                </button>

                {isAdmin && (
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      navigate('/admin');
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-purple-300 hover:text-purple-200 hover:bg-slate-800/80 transition text-left cursor-pointer"
                  >
                    <Shield className="w-4 h-4 text-purple-400" />
                    Admin Console
                  </button>
                )}
              </div>

              <div className="pt-1 border-t border-slate-800/80">
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 transition text-left cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Video Player Modal */}
      {selectedVideo && (
        <VideoPlayerModal
          video={selectedVideo}
          isOpen={!!selectedVideo}
          onClose={() => setSelectedVideo(null)}
        />
      )}

      {/* Image Lightbox */}
      {isLightboxOpen && previewImages.length > 0 && (
        <ImageLightbox
          images={previewImages}
          currentIndex={lightboxIndex}
          isOpen={isLightboxOpen}
          onClose={() => setIsLightboxOpen(false)}
          onNavigate={(newIdx) => setLightboxIndex(newIdx)}
        />
      )}

      {/* File Preview Modal */}
      {selectedFile && (
        <FilePreviewModal
          file={selectedFile}
          isOpen={!!selectedFile}
          onClose={() => setSelectedFile(null)}
        />
      )}
    </header>
  );
};
