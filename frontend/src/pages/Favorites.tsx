import React, { useState, useEffect, useMemo } from 'react';
import {
  Heart,
  Play,
  Download,
  Trash2,
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  Sparkles,
  Search,
  ArrowUpDown,
  Filter,
  ExternalLink,
} from 'lucide-react';
import { favoritesApi } from '../services/favoritesApi';
import { FileItem } from '../types';
import { formatBytes, formatDate } from '../utils/formatters';
import { getMediaUrl } from '../services/api';
import { FileTypeBadge } from '../components/common/Badge';
import { FilePreviewModal } from '../components/files/FilePreviewModal';
import { EmptyState } from '../components/common/EmptyState';
import { useToast } from '../contexts/ToastContext';
import { useAudioPlayer } from '../contexts/AudioPlayerContext';

export const Favorites: React.FC = () => {
  const { success, error } = useToast();
  const { playSongNow } = useAudioPlayer();

  const [favorites, setFavorites] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'IMAGE' | 'AUDIO' | 'VIDEO' | 'DOCUMENT'>('ALL');
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'size'>('recent');

  const fetchFavorites = async () => {
    setIsLoading(true);
    try {
      const data = await favoritesApi.getFavorites();
      setFavorites(data);
    } catch (err) {
      console.error('Failed to load favorites:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();

    const handleUpdate = () => fetchFavorites();
    window.addEventListener('pdl_files_updated', handleUpdate);
    return () => window.removeEventListener('pdl_files_updated', handleUpdate);
  }, []);

  const handleToggle = async (fileId: string) => {
    try {
      await favoritesApi.toggle(fileId);
      setFavorites((prev) => prev.filter((f) => f.id !== fileId));
      success('Removed from favorites.');
    } catch (err: any) {
      error(err.message || 'Failed to toggle favorite.');
    }
  };

  const handleFileClick = (file: FileItem) => {
    if (file.fileType === 'AUDIO' && file.music) {
      playSongNow(file.music);
    } else {
      setPreviewFile(file);
    }
  };

  // Counts by category
  const counts = useMemo(() => {
    const res = { IMAGE: 0, AUDIO: 0, VIDEO: 0, DOCUMENT: 0 };
    favorites.forEach((f) => {
      if (f.fileType in res) {
        res[f.fileType as keyof typeof res]++;
      }
    });
    return res;
  }, [favorites]);

  // Filtered and sorted favorites
  const filteredFavorites = useMemo(() => {
    return favorites
      .filter((item) => {
        const matchesTab = activeTab === 'ALL' || item.fileType === activeTab;
        const matchesSearch =
          !search || item.originalName.toLowerCase().includes(search.toLowerCase());
        return matchesTab && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'name') return a.originalName.localeCompare(b.originalName);
        if (sortBy === 'size') return b.size - a.size;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [favorites, activeTab, search, sortBy]);

  return (
    <div className="space-y-6">
      {/* Luxury Bookmarks & Favorites Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900/95 to-rose-950/40 border border-white/[0.08] p-6 sm:p-8 shadow-2xl">
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-rose-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/2 -top-20 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-rose-400 uppercase tracking-wider">
              <Sparkles className="w-4 h-4 animate-pulse" />
              <span>Personal Collection</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight flex items-center gap-3">
              Curated Favorites
              <span className="text-xs sm:text-sm font-semibold px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                {favorites.length} saved
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed font-medium">
              Instant access to your hand-picked media collection, high-fidelity audio tracks, cinema videos, and essential documents.
            </p>
          </div>

          {/* Media breakdown chips */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/60 border border-white/[0.08] text-slate-300 backdrop-blur-md">
              <ImageIcon className="w-3.5 h-3.5 text-pink-400" />
              <span>{counts.IMAGE} photos</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/60 border border-white/[0.08] text-slate-300 backdrop-blur-md">
              <Music className="w-3.5 h-3.5 text-brand-400" />
              <span>{counts.AUDIO} songs</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/60 border border-white/[0.08] text-slate-300 backdrop-blur-md">
              <Video className="w-3.5 h-3.5 text-purple-400" />
              <span>{counts.VIDEO} videos</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/60 border border-white/[0.08] text-slate-300 backdrop-blur-md">
              <FileText className="w-3.5 h-3.5 text-cyan-400" />
              <span>{counts.DOCUMENT} docs</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 sm:p-4 bg-slate-900/60 border border-white/[0.08] rounded-2xl backdrop-blur-xl">
        {/* Category Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition duration-150 ${
              activeTab === 'ALL'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/25'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            All ({favorites.length})
          </button>
          <button
            onClick={() => setActiveTab('IMAGE')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition duration-150 ${
              activeTab === 'IMAGE'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/25'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Photos ({counts.IMAGE})</span>
          </button>
          <button
            onClick={() => setActiveTab('AUDIO')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition duration-150 ${
              activeTab === 'AUDIO'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/25'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            <span>Music ({counts.AUDIO})</span>
          </button>
          <button
            onClick={() => setActiveTab('VIDEO')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition duration-150 ${
              activeTab === 'VIDEO'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/25'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Videos ({counts.VIDEO})</span>
          </button>
          <button
            onClick={() => setActiveTab('DOCUMENT')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition duration-150 ${
              activeTab === 'DOCUMENT'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/25'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Documents ({counts.DOCUMENT})</span>
          </button>
        </div>

        {/* Search & Sort Controls */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter favorites..."
              className="w-full bg-slate-950/80 border border-white/[0.08] focus:border-rose-500 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-rose-500/30 transition"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-slate-950/80 border border-white/[0.08] text-xs font-medium text-slate-300 rounded-xl px-3 py-1.5 focus:outline-none focus:border-rose-500 transition cursor-pointer"
          >
            <option value="recent">Recently Added</option>
            <option value="name">Name (A-Z)</option>
            <option value="size">File Size</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-48 bg-slate-900/60 border border-white/[0.08] rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredFavorites.length === 0 ? (
        <EmptyState
          icon={Heart}
          title={search ? 'No matching favorites' : 'No favorites in this category'}
          description={
            search
              ? 'Try adjusting your search keywords.'
              : 'Click the heart icon on any photo, track, video, or document across the vault to bookmark it here.'
          }
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredFavorites.map((file) => {
            const isImg = file.fileType === 'IMAGE';
            const isAud = file.fileType === 'AUDIO';
            const isVid = file.fileType === 'VIDEO';

            return (
              <div
                key={file.id}
                onClick={() => handleFileClick(file)}
                className="group relative bg-slate-900/60 backdrop-blur-xl border border-white/[0.08] hover:border-rose-500/50 hover:bg-slate-800/60 rounded-2xl p-3.5 cursor-pointer shadow-md hover:shadow-[0_12px_32px_rgba(244,63,94,0.15)] transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between"
              >
                {/* Thumbnail Stage */}
                <div className="relative aspect-video bg-slate-950/80 rounded-xl flex items-center justify-center overflow-hidden mb-3 border border-white/[0.06] group-hover:border-rose-500/30 transition">
                  {isImg ? (
                    <img
                      src={getMediaUrl(file.streamUrl)}
                      alt={file.originalName}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                  ) : isAud ? (
                    <div className="w-full h-full bg-gradient-to-tr from-brand-950/40 via-slate-900 to-amber-950/30 flex items-center justify-center relative">
                      {file.music?.coverUrl ? (
                        <img
                          src={file.music.coverUrl}
                          alt=""
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-2xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400 group-hover:scale-110 transition-transform">
                          <Music className="w-6 h-6" />
                        </div>
                      )}
                      {/* Audio play indicator pill */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="w-9 h-9 rounded-full bg-brand-500 text-white flex items-center justify-center shadow-lg shadow-brand-500/40">
                          <Play className="w-4 h-4 fill-current ml-0.5" />
                        </div>
                      </div>
                    </div>
                  ) : isVid ? (
                    <div className="w-full h-full bg-gradient-to-tr from-purple-950/40 via-slate-900 to-slate-950 flex items-center justify-center relative">
                      <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                        <Video className="w-6 h-6" />
                      </div>
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="w-9 h-9 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-lg shadow-purple-600/40">
                          <Play className="w-4 h-4 fill-current ml-0.5" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full bg-slate-950 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                        <FileText className="w-6 h-6" />
                      </div>
                    </div>
                  )}

                  {/* Remove Favorite Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggle(file.id);
                    }}
                    className="absolute top-2 right-2 p-1.5 rounded-xl bg-rose-500/90 hover:bg-rose-600 text-white shadow-lg backdrop-blur-md transition active:scale-75"
                    title="Remove Favorite"
                  >
                    <Heart className="w-3.5 h-3.5 fill-current" />
                  </button>
                </div>

                {/* Details */}
                <div>
                  <p className="text-xs font-bold text-white group-hover:text-rose-300 transition truncate leading-snug">
                    {file.originalName}
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1.5">
                    <span className="font-mono text-[10px]">{formatBytes(file.size)}</span>
                    <FileTypeBadge type={file.fileType} />
                  </div>
                </div>

                {/* Bottom Action Strip */}
                <div
                  className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between opacity-0 group-hover:opacity-100 transition"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => handleFileClick(file)}
                    className="flex items-center gap-1 text-[11px] font-semibold text-rose-400 hover:text-rose-300 transition"
                  >
                    {isAud ? (
                      <>
                        <Play className="w-3 h-3 fill-current" />
                        <span>Play</span>
                      </>
                    ) : (
                      <>
                        <ExternalLink className="w-3 h-3" />
                        <span>Open</span>
                      </>
                    )}
                  </button>

                  <a
                    href={getMediaUrl(file.downloadUrl)}
                    download={file.originalName}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-white/[0.08] rounded-lg transition"
                    title="Download File"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Preview Modal */}
      {previewFile && (
        <FilePreviewModal
          file={previewFile}
          isOpen={!!previewFile}
          onClose={() => setPreviewFile(null)}
        />
      )}
    </div>
  );
};
