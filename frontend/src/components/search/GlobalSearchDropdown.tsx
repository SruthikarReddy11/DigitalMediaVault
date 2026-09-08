import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Music as MusicIcon,
  Film,
  Image as ImageIcon,
  Folder as FolderIcon,
  Play,
  Pause,
  Eye,
  Download,
  ExternalLink,
  Search,
  Clock,
  Trash2,
  Sparkles,
  ChevronRight,
  Archive,
  FileSpreadsheet,
  FileCode,
  File as FileDefaultIcon,
} from 'lucide-react';
import {
  GlobalSearchResponse,
  SearchFileResult,
  SearchMusicResult,
  SearchFolderResult,
  FileItem,
  MusicItem,
} from '../../types';
import { formatBytes, formatDuration } from '../../utils/formatters';
import { getMediaUrl } from '../../services/api';
import { useAudioPlayer } from '../../contexts/AudioPlayerContext';

interface GlobalSearchDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  query: string;
  searchResults: GlobalSearchResponse | null;
  isLoading: boolean;
  onSelectRecentQuery: (q: string) => void;
  onPreviewFile?: (file: FileItem) => void;
  onPreviewVideo?: (video: FileItem) => void;
  onPreviewPhoto?: (photo: FileItem) => void;
}

type CategoryTab = 'all' | 'files' | 'music' | 'videos' | 'photos' | 'folders';

export const GlobalSearchDropdown: React.FC<GlobalSearchDropdownProps> = ({
  isOpen,
  onClose,
  query,
  searchResults,
  isLoading,
  onSelectRecentQuery,
  onPreviewFile,
  onPreviewVideo,
  onPreviewPhoto,
}) => {
  const navigate = useNavigate();
  const { currentTrack, isPlaying, playSongNow, togglePlay } = useAudioPlayer();
  const [activeCategory, setActiveCategory] = useState<CategoryTab>('all');
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load recent searches on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('pdl_recent_searches');
      if (saved) {
        setRecentSearches(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, []);

  const clearRecentSearches = () => {
    localStorage.removeItem('pdl_recent_searches');
    setRecentSearches([]);
  };

  const removeRecentSearch = (item: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = recentSearches.filter((s) => s !== item);
    localStorage.setItem('pdl_recent_searches', JSON.stringify(updated));
    setRecentSearches(updated);
  };

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [searchResults, activeCategory]);

  const categories = searchResults?.categories;
  const totalMatches = searchResults?.totalMatches || 0;

  // Flatten currently visible items for keyboard navigation
  const visibleItems = useMemo(() => {
    if (!categories) return [];

    const items: Array<{
      type: 'folder' | 'music' | 'video' | 'photo' | 'file';
      data: any;
    }> = [];

    if (activeCategory === 'all' || activeCategory === 'folders') {
      categories.folders.items.forEach((f) => items.push({ type: 'folder', data: f }));
    }
    if (activeCategory === 'all' || activeCategory === 'music') {
      categories.music.items.forEach((m) => items.push({ type: 'music', data: m }));
    }
    if (activeCategory === 'all' || activeCategory === 'videos') {
      categories.videos.items.forEach((v) => items.push({ type: 'video', data: v }));
    }
    if (activeCategory === 'all' || activeCategory === 'photos') {
      categories.photos.items.forEach((p) => items.push({ type: 'photo', data: p }));
    }
    if (activeCategory === 'all' || activeCategory === 'files') {
      categories.files.items.forEach((f) => items.push({ type: 'file', data: f }));
    }

    return items;
  }, [categories, activeCategory]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < visibleItems.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : visibleItems.length - 1));
      } else if (e.key === 'Enter') {
        if (selectedIndex >= 0 && selectedIndex < visibleItems.length) {
          e.preventDefault();
          const item = visibleItems[selectedIndex];
          handleItemClick(item.type, item.data);
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, visibleItems]);

  const handlePlayMusic = (song: SearchMusicResult, e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentTrack?.fileId === song.fileId) {
      togglePlay();
      return;
    }

    // Convert to MusicItem
    const musicItem: MusicItem = {
      id: song.id,
      fileId: song.fileId,
      title: song.title,
      artist: song.artist,
      album: song.album,
      albumArtist: song.albumArtist,
      genre: song.genre,
      year: song.year,
      duration: song.duration,
      coverUrl: song.coverUrl,
      streamUrl: song.streamUrl,
      downloadUrl: song.downloadUrl,
      file: song.file,
    };

    playSongNow(musicItem);
  };

  const handleItemClick = (type: string, data: any) => {
    // Save to recent searches
    if (query.trim()) {
      const q = query.trim();
      const updated = [q, ...recentSearches.filter((s) => s.toLowerCase() !== q.toLowerCase())].slice(0, 8);
      localStorage.setItem('pdl_recent_searches', JSON.stringify(updated));
      setRecentSearches(updated);
    }

    if (type === 'folder') {
      navigate(`/files?folder=${data.id}`);
      onClose();
    } else if (type === 'music') {
      const musicItem: MusicItem = {
        id: data.id,
        fileId: data.fileId,
        title: data.title,
        artist: data.artist,
        album: data.album,
        albumArtist: data.albumArtist,
        genre: data.genre,
        year: data.year,
        duration: data.duration,
        coverUrl: data.coverUrl,
        streamUrl: data.streamUrl,
        downloadUrl: data.downloadUrl,
        file: data.file,
      };
      playSongNow(musicItem);
      onClose();
    } else if (type === 'video') {
      if (onPreviewVideo) {
        onPreviewVideo(data as FileItem);
      } else {
        navigate(`/videos`);
      }
      onClose();
    } else if (type === 'photo') {
      if (onPreviewPhoto) {
        onPreviewPhoto(data as FileItem);
      } else {
        navigate(`/gallery`);
      }
      onClose();
    } else if (type === 'file') {
      if (onPreviewFile) {
        onPreviewFile(data as FileItem);
      } else {
        navigate(`/files`);
      }
      onClose();
    }
  };

  // Helper to highlight matching text
  const highlightMatch = (text: string | null | undefined, q: string) => {
    if (!text) return '';
    if (!q || !q.trim()) return text;

    const queryTrim = q.trim();
    const regex = new RegExp(`(${queryTrim.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);

    return (
      <span>
        {parts.map((part, i) =>
          regex.test(part) ? (
            <span key={i} className="text-brand-400 font-bold bg-brand-500/20 px-0.5 rounded">
              {part}
            </span>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </span>
    );
  };

  const renderFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'DOCUMENT':
      case 'PDF':
        return <FileText className="w-4 h-4 text-blue-400" />;
      case 'SPREADSHEET':
        return <FileSpreadsheet className="w-4 h-4 text-emerald-400" />;
      case 'ARCHIVE':
        return <Archive className="w-4 h-4 text-orange-400" />;
      case 'VIDEO':
        return <Film className="w-4 h-4 text-rose-400" />;
      case 'IMAGE':
        return <ImageIcon className="w-4 h-4 text-cyan-400" />;
      case 'AUDIO':
        return <MusicIcon className="w-4 h-4 text-amber-400" />;
      default:
        return <FileDefaultIcon className="w-4 h-4 text-slate-400" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute top-full left-0 right-0 mt-2 bg-slate-950/95 border border-slate-800/90 rounded-2xl shadow-2xl backdrop-blur-2xl z-50 overflow-hidden text-slate-200 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[560px]"
    >
      {/* Category Pills Bar (when query has content) */}
      {query.trim().length > 0 && categories && (
        <div className="px-3 pt-3 pb-2 border-b border-slate-800/80 bg-slate-900/40 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          <button
            type="button"
            onClick={() => setActiveCategory('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeCategory === 'all'
                ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <span>All</span>
            <span className="text-[10px] opacity-80 font-mono">({totalMatches})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('files')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeCategory === 'files'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <FileText className="w-3 h-3" />
            <span>Files</span>
            <span className="text-[10px] opacity-80 font-mono">({categories.files.count})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('music')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeCategory === 'music'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <MusicIcon className="w-3 h-3" />
            <span>Music</span>
            <span className="text-[10px] opacity-80 font-mono">({categories.music.count})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('videos')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeCategory === 'videos'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Film className="w-3 h-3" />
            <span>Videos</span>
            <span className="text-[10px] opacity-80 font-mono">({categories.videos.count})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('photos')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeCategory === 'photos'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <ImageIcon className="w-3 h-3" />
            <span>Photos</span>
            <span className="text-[10px] opacity-80 font-mono">({categories.photos.count})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('folders')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeCategory === 'folders'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <FolderIcon className="w-3 h-3" />
            <span>Folders</span>
            <span className="text-[10px] opacity-80 font-mono">({categories.folders.count})</span>
          </button>
        </div>
      )}

      {/* Main Results Body */}
      <div className="flex-1 overflow-y-auto p-2 space-y-4 divide-y divide-slate-800/40">
        {/* Loading State */}
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3">
            <div className="w-7 h-7 border-3 border-brand-500/20 border-t-brand-500 rounded-full animate-spin" />
            <span className="text-xs text-slate-400 font-medium">
              Searching files, music, videos, photos & folders...
            </span>
          </div>
        ) : query.trim().length === 0 ? (
          /* Empty / Recent Searches State */
          <div className="py-3 px-2 space-y-3">
            {recentSearches.length > 0 ? (
              <div>
                <div className="flex items-center justify-between px-2 pb-2">
                  <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Recent Searches</span>
                  </span>
                  <button
                    type="button"
                    onClick={clearRecentSearches}
                    className="text-[11px] text-slate-500 hover:text-rose-400 transition"
                  >
                    Clear History
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 px-1">
                  {recentSearches.map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => onSelectRecentQuery(s)}
                      className="group px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 hover:text-white flex items-center gap-2 transition"
                    >
                      <Search className="w-3 h-3 text-slate-500 group-hover:text-brand-400" />
                      <span>{s}</span>
                      <span
                        onClick={(e) => removeRecentSearch(s, e)}
                        className="text-slate-500 hover:text-rose-400 p-0.5 rounded ml-0.5"
                      >
                        ×
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Quick Suggestions */}
            <div className="px-2 pt-2 text-xs text-slate-400 space-y-2">
              <div className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                <span>Search Anything in Your Vault</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/60">
                  <div className="font-bold text-slate-200">By Media & Content</div>
                  <p className="text-slate-500 text-[10px] mt-0.5">
                    Search files, song titles, artists, albums, or full videos
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/60">
                  <div className="font-bold text-slate-200">By Extension & Folder</div>
                  <p className="text-slate-500 text-[10px] mt-0.5">
                    Type .pdf, .mp3, .mp4, or folder names like Movies/Bahubali
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : totalMatches === 0 ? (
          /* No Results State */
          <div className="py-12 px-4 text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 text-slate-500 flex items-center justify-center mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-white">No results found for &ldquo;{query}&rdquo;</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Check for typos or try searching by filename, extension (.pdf, .mp4), artist, album, folder, or tag.
            </p>
          </div>
        ) : (
          /* CATEGORIZED RESULTS */
          <div className="space-y-4">
            {/* 1. FOLDERS */}
            {(activeCategory === 'all' || activeCategory === 'folders') &&
              categories &&
              categories.folders.items.length > 0 && (
                <div className="space-y-1.5">
                  <div className="px-3 pt-1 text-[11px] font-black uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                    <FolderIcon className="w-3.5 h-3.5" />
                    <span>FOLDERS</span>
                    <span className="text-slate-500 font-normal">({categories.folders.count})</span>
                  </div>

                  <div className="space-y-1">
                    {categories.folders.items.map((folder) => (
                      <div
                        key={folder.id}
                        onClick={() => handleItemClick('folder', folder)}
                        className="group p-2.5 rounded-xl hover:bg-indigo-500/10 border border-transparent hover:border-indigo-500/30 flex items-center justify-between gap-3 cursor-pointer transition"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-400 group-hover:scale-105 transition">
                            <FolderIcon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs sm:text-sm font-bold text-white truncate">
                              {highlightMatch(folder.path || folder.name, query)}
                            </div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                              <span>{folder.itemCount} items</span>
                              <span>•</span>
                              <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-mono">
                                {folder.matchReason}
                              </span>
                            </div>
                          </div>
                        </div>

                        <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 transition shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* 2. MUSIC */}
            {(activeCategory === 'all' || activeCategory === 'music') &&
              categories &&
              categories.music.items.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  <div className="px-3 pt-1 text-[11px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <MusicIcon className="w-3.5 h-3.5" />
                    <span>MUSIC</span>
                    <span className="text-slate-500 font-normal">({categories.music.count})</span>
                  </div>

                  <div className="space-y-1">
                    {categories.music.items.map((song) => {
                      const isCurrentPlaying = currentTrack?.fileId === song.fileId && isPlaying;

                      return (
                        <div
                          key={song.id}
                          onClick={() => handleItemClick('music', song)}
                          className="group p-2.5 rounded-xl hover:bg-amber-500/10 border border-transparent hover:border-amber-500/30 flex items-center justify-between gap-3 cursor-pointer transition"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Album Cover / Disc */}
                            <div className="relative w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                              {song.coverUrl ? (
                                <img
                                  src={getMediaUrl(song.coverUrl)}
                                  alt={song.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <MusicIcon className="w-4 h-4 text-amber-400" />
                              )}
                              {isCurrentPlaying && (
                                <div className="absolute inset-0 bg-amber-500/40 backdrop-blur-xs flex items-center justify-center">
                                  <div className="w-2 h-2 rounded-full bg-white animate-ping" />
                                </div>
                              )}
                            </div>

                            <div className="min-w-0">
                              <div className="text-xs sm:text-sm font-bold text-white truncate flex items-center gap-2">
                                <span>{highlightMatch(song.title, query)}</span>
                                <span className="text-[10px] text-amber-400/80 font-mono">
                                  {formatDuration(song.duration)}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-400 truncate mt-0.5 flex items-center gap-1.5">
                                <span>{highlightMatch(song.artist, query)}</span>
                                {song.album && (
                                  <>
                                    <span>•</span>
                                    <span>{highlightMatch(song.album, query)}</span>
                                  </>
                                )}
                                <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-mono ml-1">
                                  {song.matchReason}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Quick Play Button */}
                          <button
                            type="button"
                            onClick={(e) => handlePlayMusic(song, e)}
                            className="p-2 rounded-xl bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-white transition cursor-pointer shrink-0"
                            title={isCurrentPlaying ? 'Pause' : 'Play Song'}
                          >
                            {isCurrentPlaying ? (
                              <Pause className="w-3.5 h-3.5" />
                            ) : (
                              <Play className="w-3.5 h-3.5 fill-current" />
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            {/* 3. VIDEOS */}
            {(activeCategory === 'all' || activeCategory === 'videos') &&
              categories &&
              categories.videos.items.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  <div className="px-3 pt-1 text-[11px] font-black uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                    <Film className="w-3.5 h-3.5" />
                    <span>VIDEOS</span>
                    <span className="text-slate-500 font-normal">({categories.videos.count})</span>
                  </div>

                  <div className="space-y-1">
                    {categories.videos.items.map((video) => (
                      <div
                        key={video.id}
                        onClick={() => handleItemClick('video', video)}
                        className="group p-2.5 rounded-xl hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30 flex items-center justify-between gap-3 cursor-pointer transition"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-2 rounded-xl bg-rose-500/15 text-rose-400 group-hover:scale-105 transition shrink-0">
                            <Film className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs sm:text-sm font-bold text-white truncate">
                              {highlightMatch(video.name, query)}
                            </div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                              <span className="font-mono">{formatBytes(video.size)}</span>
                              <span>•</span>
                              <span className="uppercase font-mono">{video.extension}</span>
                              <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 text-[9px] font-mono">
                                {video.matchReason}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px] font-bold text-rose-400 bg-rose-500/15 px-2 py-1 rounded-lg">
                            Watch
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* 4. PHOTOS / IMAGES */}
            {(activeCategory === 'all' || activeCategory === 'photos') &&
              categories &&
              categories.photos.items.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  <div className="px-3 pt-1 text-[11px] font-black uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>PHOTOS</span>
                    <span className="text-slate-500 font-normal">({categories.photos.count})</span>
                  </div>

                  <div className="space-y-1">
                    {categories.photos.items.map((photo) => (
                      <div
                        key={photo.id}
                        onClick={() => handleItemClick('photo', photo)}
                        className="group p-2.5 rounded-xl hover:bg-cyan-500/10 border border-transparent hover:border-cyan-500/30 flex items-center justify-between gap-3 cursor-pointer transition"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Thumbnail preview */}
                          <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                            <img
                              src={getMediaUrl(photo.streamUrl)}
                              alt={photo.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs sm:text-sm font-bold text-white truncate">
                              {highlightMatch(photo.name, query)}
                            </div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                              <span className="font-mono">{formatBytes(photo.size)}</span>
                              <span>•</span>
                              <span className="uppercase font-mono">{photo.extension}</span>
                              <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 text-[9px] font-mono">
                                {photo.matchReason}
                              </span>
                            </div>
                          </div>
                        </div>

                        <Eye className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 transition shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* 5. FILES / DOCUMENTS */}
            {(activeCategory === 'all' || activeCategory === 'files') &&
              categories &&
              categories.files.items.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  <div className="px-3 pt-1 text-[11px] font-black uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    <span>FILES</span>
                    <span className="text-slate-500 font-normal">({categories.files.count})</span>
                  </div>

                  <div className="space-y-1">
                    {categories.files.items.map((file) => (
                      <div
                        key={file.id}
                        onClick={() => handleItemClick('file', file)}
                        className="group p-2.5 rounded-xl hover:bg-blue-500/10 border border-transparent hover:border-blue-500/30 flex items-center justify-between gap-3 cursor-pointer transition"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-blue-400 group-hover:scale-105 transition shrink-0">
                            {renderFileIcon(file.fileType)}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs sm:text-sm font-bold text-white truncate">
                              {highlightMatch(file.name, query)}
                            </div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                              <span className="font-mono">{formatBytes(file.size)}</span>
                              <span>•</span>
                              <span className="uppercase font-mono">{file.extension}</span>
                              {file.folderPath && (
                                <>
                                  <span>•</span>
                                  <span className="truncate">in {file.folderPath}</span>
                                </>
                              )}
                              <span className="px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 text-[9px] font-mono">
                                {file.matchReason}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <Eye className="w-4 h-4 text-slate-600 group-hover:text-blue-400 transition" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>
        )}
      </div>

      {/* Footer bar */}
      <div className="px-4 py-2.5 bg-slate-900/80 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 text-[9px] font-mono bg-slate-800 border border-slate-700 rounded text-slate-300">
              ↑↓
            </kbd>
            <span>navigate</span>
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 text-[9px] font-mono bg-slate-800 border border-slate-700 rounded text-slate-300">
              Enter
            </kbd>
            <span>open</span>
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 text-[9px] font-mono bg-slate-800 border border-slate-700 rounded text-slate-300">
              Esc
            </kbd>
            <span>close</span>
          </span>
        </div>

        {totalMatches > 0 && (
          <button
            type="button"
            onClick={() => {
              navigate(`/search?q=${encodeURIComponent(query)}`);
              onClose();
            }}
            className="text-brand-400 hover:text-brand-300 font-bold flex items-center gap-1 transition cursor-pointer"
          >
            <span>View all {totalMatches} results</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
