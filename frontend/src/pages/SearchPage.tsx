import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Search,
  FileText,
  Music as MusicIcon,
  Film,
  Image as ImageIcon,
  Folder as FolderIcon,
  Play,
  Pause,
  Eye,
  ChevronRight,
} from 'lucide-react';
import { searchApi } from '../services/searchApi';
import {
  GlobalSearchResponse,
  SearchFileResult,
  SearchMusicResult,
  SearchFolderResult,
  FileItem,
  MusicItem,
} from '../types';
import { formatBytes, formatDuration } from '../utils/formatters';
import { getMediaUrl } from '../services/api';
import { useAudioPlayer } from '../contexts/AudioPlayerContext';
import { VideoPlayerModal } from '../components/video/VideoPlayerModal';
import { ImageLightbox } from '../components/gallery/ImageLightbox';
import { FilePreviewModal } from '../components/files/FilePreviewModal';

type CategoryTab = 'all' | 'files' | 'music' | 'videos' | 'photos' | 'folders';

export const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const navigate = useNavigate();

  const { currentTrack, isPlaying, playSongNow, togglePlay } = useAudioPlayer();

  const [activeTab, setActiveTab] = useState<CategoryTab>('all');
  const [searchResponse, setSearchResponse] = useState<GlobalSearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState(query);

  // Modals for preview
  const [selectedVideo, setSelectedVideo] = useState<FileItem | null>(null);
  const [previewImages, setPreviewImages] = useState<FileItem[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);

  const fetchResults = async (q: string) => {
    if (!q.trim()) {
      setSearchResponse(null);
      return;
    }

    setLoading(true);
    try {
      const res = await searchApi.globalSearch(q.trim(), { limit: 50 });
      setSearchResponse(res);
    } catch (err) {
      console.error('Failed to fetch search results:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSearchInput(query);
    fetchResults(query);
  }, [query]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    setSearchParams({ q: searchInput.trim() });
  };

  const handlePlayMusic = (song: SearchMusicResult) => {
    if (currentTrack?.fileId === song.fileId) {
      togglePlay();
      return;
    }

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

  const handleOpenPhoto = (_photo: SearchFileResult, index: number) => {
    const photos = searchResponse?.categories.photos.items || [];
    const fileItems: FileItem[] = photos.map((p: SearchFileResult) => ({
      id: p.id,
      userId: '',
      folderId: p.folderId,
      originalName: p.name,
      storageKey: '',
      mimeType: p.mimeType,
      fileType: 'IMAGE',
      extension: p.extension,
      size: p.size,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      isFavorite: p.isFavorite,
      streamUrl: p.streamUrl,
      downloadUrl: p.downloadUrl,
    }));

    setPreviewImages(fileItems);
    setLightboxIndex(index);
    setIsLightboxOpen(true);
  };

  const handleOpenVideo = (video: SearchFileResult) => {
    const item: FileItem = {
      id: video.id,
      userId: '',
      folderId: video.folderId,
      originalName: video.name,
      storageKey: '',
      mimeType: video.mimeType,
      fileType: 'VIDEO',
      extension: video.extension,
      size: video.size,
      createdAt: video.createdAt,
      updatedAt: video.updatedAt,
      isFavorite: video.isFavorite,
      streamUrl: video.streamUrl,
      downloadUrl: video.downloadUrl,
    };
    setSelectedVideo(item);
  };

  const handleOpenFile = (file: SearchFileResult) => {
    const item: FileItem = {
      id: file.id,
      userId: '',
      folderId: file.folderId,
      originalName: file.name,
      storageKey: '',
      mimeType: file.mimeType,
      fileType: file.fileType,
      extension: file.extension,
      size: file.size,
      createdAt: file.createdAt,
      updatedAt: file.updatedAt,
      isFavorite: file.isFavorite,
      streamUrl: file.streamUrl,
      downloadUrl: file.downloadUrl,
    };
    setSelectedFile(item);
  };

  const categories = searchResponse?.categories;
  const totalMatches = searchResponse?.totalMatches || 0;

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 shadow-xl backdrop-blur-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-brand-400 uppercase tracking-wider">
            <Search className="w-4 h-4" />
            <span>Universal Search Engine</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {query ? (
              <>
                Results for &ldquo;<span className="text-brand-400">{query}</span>&rdquo;
              </>
            ) : (
              'Global Vault Search'
            )}
          </h1>
          <p className="text-xs text-slate-400">
            {loading ? (
              'Searching your vault...'
            ) : searchResponse ? (
              <span>Found <strong className="text-white">{totalMatches}</strong> items across all files, music, videos, photos, and folders</span>
            ) : (
              'Search across filenames, extensions, artists, albums, folders, and tags'
            )}
          </p>
        </div>

        {/* Refined Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative max-w-md w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search files, lossless music, 4K videos, documents..."
            className="w-full bg-slate-950/80 border border-slate-800 focus:border-brand-500 rounded-xl pl-10 pr-24 py-2.5 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition shadow-md shadow-brand-600/20 cursor-pointer"
          >
            Search
          </button>
        </form>
      </div>

      {/* Category Tabs */}
      {searchResponse && (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'all'
                ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/25'
                : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <span>All Results</span>
            <span className="px-1.5 py-0.5 rounded-md bg-black/20 text-[10px] font-mono">
              {totalMatches}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('files')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'files'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Files</span>
            <span className="px-1.5 py-0.5 rounded-md bg-black/20 text-[10px] font-mono">
              {categories?.files.count || 0}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('music')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'music'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/25'
                : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <MusicIcon className="w-3.5 h-3.5" />
            <span>Music</span>
            <span className="px-1.5 py-0.5 rounded-md bg-black/20 text-[10px] font-mono">
              {categories?.music.count || 0}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('videos')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'videos'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/25'
                : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Videos</span>
            <span className="px-1.5 py-0.5 rounded-md bg-black/20 text-[10px] font-mono">
              {categories?.videos.count || 0}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('photos')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'photos'
                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/25'
                : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Photos</span>
            <span className="px-1.5 py-0.5 rounded-md bg-black/20 text-[10px] font-mono">
              {categories?.photos.count || 0}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('folders')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'folders'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <FolderIcon className="w-3.5 h-3.5" />
            <span>Folders</span>
            <span className="px-1.5 py-0.5 rounded-md bg-black/20 text-[10px] font-mono">
              {categories?.folders.count || 0}
            </span>
          </button>
        </div>
      )}

      {/* Main Results View */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <div className="w-9 h-9 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-medium">Scanning vault...</p>
        </div>
      ) : totalMatches === 0 ? (
        <div className="py-20 text-center space-y-3 bg-slate-900/40 border border-slate-800 rounded-3xl p-8">
          <div className="w-14 h-14 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto shadow-xl">
            <Search className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-white">No results found</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            We couldn&apos;t find anything matching &ldquo;{query}&rdquo;. Try searching for another keyword, extension (e.g. .pdf), artist name, or folder.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* 1. FOLDERS SECTION */}
          {(activeTab === 'all' || activeTab === 'folders') &&
            categories &&
            categories.folders.items.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <FolderIcon className="w-4 h-4 text-indigo-400" />
                    <span>Folders ({categories.folders.count})</span>
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {categories.folders.items.map((folder: SearchFolderResult) => (
                    <div
                      key={folder.id}
                      onClick={() => navigate(`/files?folder=${folder.id}`)}
                      className="group p-4 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-indigo-500/40 hover:bg-slate-900 shadow-lg cursor-pointer transition flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2.5 rounded-xl bg-indigo-500/15 text-indigo-400 group-hover:scale-105 transition shrink-0">
                          <FolderIcon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs sm:text-sm font-bold text-white truncate">
                            {folder.name}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate mt-0.5">
                            {folder.path}
                          </div>
                          <div className="text-[10px] text-indigo-400 mt-1 font-mono">
                            {folder.itemCount} items
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 transition shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* 2. MUSIC SECTION */}
          {(activeTab === 'all' || activeTab === 'music') &&
            categories &&
            categories.music.items.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <MusicIcon className="w-4 h-4 text-amber-400" />
                    <span>Music ({categories.music.count})</span>
                  </h2>
                </div>

                <div className="divide-y divide-slate-800/60 rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
                  {categories.music.items.map((song: SearchMusicResult) => {
                    const isCurrentPlaying = currentTrack?.fileId === song.fileId && isPlaying;

                    return (
                      <div
                        key={song.id}
                        className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-800/40 transition group"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          {/* Cover or Play button */}
                          <div
                            onClick={() => handlePlayMusic(song)}
                            className="relative w-11 h-11 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0 cursor-pointer group/cover shadow-md"
                          >
                            {song.coverUrl ? (
                              <img
                                src={getMediaUrl(song.coverUrl)}
                                alt={song.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <MusicIcon className="w-5 h-5 text-amber-400" />
                            )}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/cover:opacity-100 flex items-center justify-center transition">
                              {isCurrentPlaying ? (
                                <Pause className="w-4 h-4 text-white" />
                              ) : (
                                <Play className="w-4 h-4 text-white fill-current" />
                              )}
                            </div>
                            {isCurrentPlaying && (
                              <div className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="text-xs sm:text-sm font-bold text-white truncate flex items-center gap-2">
                              <span>{song.title}</span>
                              <span className="text-[10px] text-amber-400 font-mono">
                                {formatDuration(song.duration)}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 truncate mt-0.5 flex items-center gap-2">
                              <strong className="text-slate-300 font-semibold">{song.artist}</strong>
                              {song.album && (
                                <>
                                  <span>•</span>
                                  <span>{song.album}</span>
                                </>
                              )}
                              <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-mono">
                                {song.matchReason}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handlePlayMusic(song)}
                            className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500 text-amber-300 hover:text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                          >
                            {isCurrentPlaying ? (
                              <>
                                <Pause className="w-3.5 h-3.5" />
                                <span>Pause</span>
                              </>
                            ) : (
                              <>
                                <Play className="w-3.5 h-3.5 fill-current" />
                                <span>Play</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          {/* 3. VIDEOS SECTION */}
          {(activeTab === 'all' || activeTab === 'videos') &&
            categories &&
            categories.videos.items.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <Film className="w-4 h-4 text-rose-400" />
                    <span>Videos ({categories.videos.count})</span>
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {categories.videos.items.map((video: SearchFileResult) => (
                    <div
                      key={video.id}
                      onClick={() => handleOpenVideo(video)}
                      className="group p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-rose-500/40 shadow-lg cursor-pointer transition flex flex-col justify-between space-y-3"
                    >
                      <div className="space-y-3">
                        <div className="h-32 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-center relative overflow-hidden group-hover:scale-[1.02] transition">
                          <Film className="w-10 h-10 text-rose-400/60" />
                          <div className="absolute inset-0 bg-rose-950/20 group-hover:bg-rose-950/40 flex items-center justify-center transition">
                            <div className="w-10 h-10 rounded-full bg-rose-600/90 text-white flex items-center justify-center shadow-lg shadow-rose-600/30 group-hover:scale-110 transition">
                              <Play className="w-4 h-4 fill-current ml-0.5" />
                            </div>
                          </div>
                        </div>

                        <div>
                          <div className="text-xs sm:text-sm font-bold text-white truncate">
                            {video.name}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono mt-1">
                            {formatBytes(video.size)} • {video.extension.toUpperCase()}
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500">
                        <span className="px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-300 font-mono">
                          {video.matchReason}
                        </span>
                        <span className="text-rose-400 font-semibold group-hover:underline">
                          Watch Video →
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* 4. PHOTOS SECTION */}
          {(activeTab === 'all' || activeTab === 'photos') &&
            categories &&
            categories.photos.items.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-cyan-400" />
                    <span>Photos ({categories.photos.count})</span>
                  </h2>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {categories.photos.items.map((photo: SearchFileResult, idx: number) => (
                    <div
                      key={photo.id}
                      onClick={() => handleOpenPhoto(photo, idx)}
                      className="group rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-lg cursor-pointer hover:border-cyan-500/40 transition"
                    >
                      <div className="aspect-square bg-slate-950 overflow-hidden relative">
                        <img
                          src={getMediaUrl(photo.streamUrl)}
                          alt={photo.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent opacity-0 group-hover:opacity-100 transition flex items-end p-2">
                          <Eye className="w-4 h-4 text-cyan-400" />
                        </div>
                      </div>
                      <div className="p-2 space-y-0.5">
                        <div className="text-xs font-bold text-white truncate">
                          {photo.name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {formatBytes(photo.size)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* 5. FILES / DOCUMENTS SECTION */}
          {(activeTab === 'all' || activeTab === 'files') &&
            categories &&
            categories.files.items.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-400" />
                    <span>Files & Documents ({categories.files.count})</span>
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {categories.files.items.map((file: SearchFileResult) => (
                    <div
                      key={file.id}
                      onClick={() => handleOpenFile(file)}
                      className="group p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-blue-500/40 hover:bg-slate-900 shadow-lg cursor-pointer transition flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2.5 rounded-xl bg-slate-800 text-blue-400 group-hover:scale-105 transition shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs sm:text-sm font-bold text-white truncate">
                            {file.name}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                            {formatBytes(file.size)} • {file.extension.toUpperCase()}
                          </div>
                          <div className="text-[10px] text-blue-400/80 font-mono mt-0.5">
                            {file.matchReason}
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
          onNavigate={(newIdx: number) => setLightboxIndex(newIdx)}
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
    </div>
  );
};
