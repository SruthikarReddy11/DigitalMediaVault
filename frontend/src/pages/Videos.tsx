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
import { useToast } from '../contexts/ToastContext';

export const Videos: React.FC = () => {
  const { success, error } = useToast();
  const { openUpload } = useOutletContext<{ openUpload: () => void }>() || { openUpload: () => {} };

  const [videos, setVideos] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearchTerm] = useState('');
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  const [activeVideo, setActiveVideo] = useState<FileItem | null>(null);
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <VideoIcon className="w-7 h-7 text-purple-400" />
            Video Library
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Watch, stream, and organize your personal videos and clips
          </p>
        </div>

        <button
          onClick={openUpload}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold rounded-xl transition shadow-lg shadow-brand-600/25 active:scale-95 self-start sm:self-auto"
        >
          <UploadCloud className="w-4 h-4" />
          Upload Videos
        </button>
      </div>

      {/* Control bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-900/80 border border-slate-800 rounded-2xl">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search videos..."
            className="w-full bg-slate-950 border border-slate-800 focus:border-brand-500 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 focus:outline-none"
          />
        </div>

        <button
          onClick={() => setOnlyFavorites((prev) => !prev)}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition ${
            onlyFavorites
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
              : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
          }`}
        >
          <Heart className={`w-3.5 h-3.5 ${onlyFavorites ? 'fill-current text-rose-500' : ''}`} />
          Favorites Only
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
              className="group bg-slate-900 border border-slate-800 hover:border-purple-500/60 rounded-2xl overflow-hidden cursor-pointer shadow-md hover:shadow-2xl transition-all duration-300 flex flex-col"
            >
              {/* Thumbnail / Video Preview Canvas */}
              <div className="relative aspect-video bg-slate-950 flex items-center justify-center overflow-hidden">
                <video
                  src={getMediaUrl(video.streamUrl)}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  preload="metadata"
                />

                {/* Dark overlay & Play Button */}
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 flex items-center justify-center transition">
                  <div className="w-14 h-14 rounded-2xl bg-brand-500/90 group-hover:bg-brand-500 text-white flex items-center justify-center shadow-xl transform group-hover:scale-110 transition duration-200">
                    <Play className="w-6 h-6 fill-current ml-1" />
                  </div>
                </div>

                {/* Top Corner Favorite badge */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleFavorite(video.id);
                  }}
                  className={`absolute top-3 right-3 p-2 rounded-xl backdrop-blur-md transition ${
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
                  <h3 className="text-sm font-semibold text-white group-hover:text-purple-300 transition truncate">
                    {video.originalName}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                    <span>{formatBytes(video.size)}</span>
                    <span>•</span>
                    <span>{formatDate(video.createdAt)}</span>
                  </div>
                </div>

                {/* Action Row */}
                <div className="flex items-center justify-end gap-1.5 mt-3 pt-3 border-t border-slate-800/80">
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
    </div>
  );
};
