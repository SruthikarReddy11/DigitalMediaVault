import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { filesApi } from '../services/filesApi';
import { favoritesApi } from '../services/favoritesApi';
import { FileItem } from '../types';
import { formatBytes, formatDate } from '../utils/formatters';
import { getMediaUrl } from '../services/api';
import { VideoPlayerModal } from '../components/video/VideoPlayerModal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { Modal } from '../components/common/Modal';
import { EmptyState } from '../components/common/EmptyState';
import { ShareModal } from '../components/share/ShareModal';
import { useToast } from '../contexts/ToastContext';

export const Videos: React.FC = () => {
  const { success, error } = useToast();
  const { openUpload } = useOutletContext<{ openUpload: () => void }>() || { openUpload: () => {} };

  const [videos, setVideos] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearchTerm] = useState('');
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  const [activeVideo, setActiveVideo] = useState<FileItem | null>(null);
  const [shareTarget, setShareTarget] = useState<FileItem | null>(null);
  const [renameTarget, setRenameTarget] = useState<FileItem | null>(null);
  const [newName, setNewName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<FileItem | null>(null);

  const fetchVideos = async () => {
    setIsLoading(true);
    try {
      const res = await filesApi.listFiles({
        fileType: 'VIDEO',
        search: search || undefined,
        favoriteOnly: onlyFavorites,
        limit: 100,
      });
      setVideos(res.data);
    } catch (err) {
      console.error('Failed to load videos:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();

    const handleUpdate = () => fetchVideos();
    window.addEventListener('pdl_files_updated', handleUpdate);
    return () => window.removeEventListener('pdl_files_updated', handleUpdate);
  }, [search, onlyFavorites]);

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

  return (
    <div className="space-y-6">
      {/* Luxury Cinema Theater Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-purple-950/35 border border-white/[0.08] p-6 sm:p-8 shadow-2xl">
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-purple-400 uppercase tracking-wider">
              <Sparkles className="w-4 h-4 animate-pulse" />
              <span>Private Cinema & 4K Streaming Theater</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight flex items-center gap-3">
              Video Theater
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed font-medium">
              Stream personal videos, movie clips, and 4K recordings with instant playback and theater controls.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-start md:self-center">
            <button
              onClick={openUpload}
              className="group relative overflow-hidden flex items-center gap-2.5 px-5 py-2.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white text-xs sm:text-sm font-black rounded-2xl transition-all duration-200 shadow-xl shadow-purple-600/25 hover:shadow-purple-600/40 border border-white/20 active:scale-95 whitespace-nowrap cursor-pointer"
            >
              <div className="p-1 rounded-lg bg-white/20 group-hover:rotate-12 transition-transform duration-300">
                <UploadCloud className="w-4 h-4 text-white" />
              </div>
              <span>Upload Video</span>
            </button>
          </div>
        </div>
      </div>

      {/* Control bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 sm:p-4 bg-slate-900/70 border border-white/[0.08] rounded-2xl backdrop-blur-md">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search videos by title..."
            className="w-full bg-slate-950/80 border border-white/[0.08] focus:border-purple-500 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500/30 transition"
          />
        </div>

        <button
          onClick={() => setOnlyFavorites((prev) => !prev)}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition duration-150 ${
            onlyFavorites
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-sm shadow-rose-500/20'
              : 'bg-slate-950/80 text-slate-400 border-white/[0.08] hover:text-white hover:border-slate-700'
          }`}
        >
          <Heart className={`w-3.5 h-3.5 ${onlyFavorites ? 'fill-current text-rose-500' : ''}`} />
          <span>Favorites Only</span>
        </button>
      </div>

      {/* Videos Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="aspect-video bg-slate-900 border border-slate-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : videos.length === 0 ? (
        <EmptyState
          icon={Film}
          title="No videos found"
          description="Upload MP4, WEBM, or MOV videos to build your private theater."
          actionLabel="Upload Videos"
          onAction={openUpload}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {videos.map((video) => (
            <div
              key={video.id}
              onClick={() => setActiveVideo(video)}
              className="group bg-slate-900/80 border border-white/[0.08] hover:border-purple-500/50 rounded-2xl overflow-hidden cursor-pointer shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 flex flex-col"
            >
              {/* Thumbnail / Video Preview Canvas */}
              <div className="relative aspect-video bg-slate-950 flex items-center justify-center overflow-hidden">
                <video
                  src={getMediaUrl(video.streamUrl)}
                  className="w-full h-full object-cover group-hover:scale-108 transition duration-500"
                  preload="metadata"
                />

                {/* 4K Video Quality Pill Badge */}
                <span className="absolute top-3 left-3 px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-md text-[9px] font-mono font-bold text-purple-300 border border-purple-400/30 shadow-md">
                  4K STREAM
                </span>

                {/* Dark overlay & Play Button */}
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 flex items-center justify-center transition">
                  <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-purple-600 text-white flex items-center justify-center shadow-xl shadow-purple-600/30 transform group-hover:scale-110 transition duration-200 border border-white/20">
                    <Play className="w-6 h-6 fill-current ml-1" />
                  </div>
                </div>

                {/* Top Corner Favorite badge */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleFavorite(video.id);
                  }}
                  className={`absolute top-3 right-3 p-2 rounded-xl backdrop-blur-md transition shadow-md active:scale-75 ${
                    video.isFavorite
                      ? 'bg-rose-500/80 text-white'
                      : 'bg-black/50 text-white/80 hover:text-white'
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${video.isFavorite ? 'fill-current' : ''}`} />
                </button>
              </div>

              {/* Video Info Bar */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white group-hover:text-purple-300 transition truncate">
                    {video.originalName}
                  </h3>
                  <div className="flex items-center gap-2.5 text-xs text-slate-400 mt-1 font-medium">
                    <span className="font-mono text-[11px] text-slate-300">{formatBytes(video.size)}</span>
                    <span>•</span>
                    <span>{formatDate(video.createdAt)}</span>
                  </div>
                </div>

                {/* Action Row */}
                <div className="flex items-center justify-end gap-1.5 mt-3 pt-3 border-t border-white/[0.08]">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShareTarget(video);
                    }}
                    className="p-1.5 text-slate-400 hover:text-brand-400 rounded-lg hover:bg-slate-800 transition"
                    title="Share Video Link"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setRenameTarget(video);
                      setNewName(video.originalName);
                    }}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                    title="Rename"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <a
                    href={getMediaUrl(video.downloadUrl)}
                    download={video.originalName}
                    onClick={(e) => e.stopPropagation()}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                    title="Download"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget(video);
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
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
              className="w-full bg-slate-950 border border-slate-800 focus:border-brand-500 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none"
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
              className="px-5 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-500 rounded-xl shadow-lg shadow-brand-600/20"
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
    </div>
  );
};
