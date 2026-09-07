import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Image as ImageIcon,
  Search,
  UploadCloud,
  Filter,
  Heart,
  Download,
  Trash2,
  Edit2,
  FolderClosed,
  MoreVertical,
  Sparkles,
} from 'lucide-react';
import { filesApi } from '../services/filesApi';
import { foldersApi } from '../services/foldersApi';
import { favoritesApi } from '../services/favoritesApi';
import { FileItem, FolderItem } from '../types';
import { formatBytes, formatDate } from '../utils/formatters';
import { getMediaUrl } from '../services/api';
import { ImageLightbox } from '../components/gallery/ImageLightbox';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { Modal } from '../components/common/Modal';
import { EmptyState } from '../components/common/EmptyState';
import { useToast } from '../contexts/ToastContext';

export const Gallery: React.FC = () => {
  const { success, error } = useToast();
  const { openUpload } = useOutletContext<{ openUpload: () => void }>() || { openUpload: () => {} };

  const [images, setImages] = useState<FileItem[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Sorting
  const [search, setSearchTerm] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [onlyFavorites, setOnlyFavorites] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'createdAt' | 'name' | 'size'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Lightbox
  const [lightboxIndex, setLightboxIndex] = useState<number>(-1);

  // Rename modal
  const [renameTarget, setRenameTarget] = useState<FileItem | null>(null);
  const [newName, setNewName] = useState('');

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<FileItem | null>(null);

  const fetchImages = async () => {
    setIsLoading(true);
    try {
      const res = await filesApi.listFiles({
        fileType: 'IMAGE',
        search: search || undefined,
        folderId: selectedFolder === 'all' ? undefined : selectedFolder === 'root' ? null : selectedFolder,
        favoriteOnly: onlyFavorites,
        sortBy,
        sortOrder,
        limit: 100,
      });
      setImages(res.data);
    } catch (err) {
      console.error('Failed to load gallery images:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    foldersApi.getFolders().then(setFolders).catch(console.error);
  }, []);

  useEffect(() => {
    fetchImages();

    const handleUpdate = () => fetchImages();
    window.addEventListener('pdl_files_updated', handleUpdate);
    return () => window.removeEventListener('pdl_files_updated', handleUpdate);
  }, [search, selectedFolder, onlyFavorites, sortBy, sortOrder]);

  const handleToggleFavorite = async (fileId: string) => {
    try {
      const res = await favoritesApi.toggle(fileId);
      setImages((prev) =>
        prev.map((img) => (img.id === fileId ? { ...img, isFavorite: res.isFavorite } : img))
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
      setImages((prev) => prev.map((img) => (img.id === updated.id ? updated : img)));
      success('Image renamed successfully!');
      setRenameTarget(null);
    } catch (err: any) {
      error(err.message || 'Failed to rename image.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    try {
      await filesApi.moveToTrash(deleteTarget.id);
      setImages((prev) => prev.filter((img) => img.id !== deleteTarget.id));
      success('Image moved to trash.');
      setDeleteTarget(null);
      if (lightboxIndex >= 0) setLightboxIndex(-1);
    } catch (err: any) {
      error(err.message || 'Failed to delete image.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Luxury Photo Studio Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-pink-950/35 border border-white/[0.08] p-6 sm:p-8 shadow-2xl">
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-pink-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-pink-400 uppercase tracking-wider">
              <Sparkles className="w-4 h-4 animate-pulse" />
              <span>Photo & Graphics Studio</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight flex items-center gap-3">
              Image Gallery
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed font-medium">
              High-resolution photo library with immersive lightbox zoom, smart albums, and instant curation.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-start md:self-center">
            <button
              onClick={openUpload}
              className="group relative overflow-hidden flex items-center gap-2.5 px-5 py-2.5 bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 hover:from-pink-500 hover:to-rose-500 text-white text-xs sm:text-sm font-black rounded-2xl transition-all duration-200 shadow-xl shadow-pink-600/25 hover:shadow-pink-600/40 border border-white/20 active:scale-95 whitespace-nowrap cursor-pointer"
            >
              <div className="p-1 rounded-lg bg-white/20 group-hover:rotate-12 transition-transform duration-300">
                <UploadCloud className="w-4 h-4 text-white" />
              </div>
              <span>Upload Photos</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 sm:p-4 bg-slate-900/70 border border-white/[0.08] rounded-2xl backdrop-blur-md">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search photos by filename..."
            className="w-full bg-slate-950/80 border border-white/[0.08] focus:border-pink-500 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-pink-500/30 transition"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Folder filter */}
          <select
            value={selectedFolder}
            onChange={(e) => setSelectedFolder(e.target.value)}
            className="bg-slate-950/80 border border-white/[0.08] text-xs font-medium text-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:border-pink-500 transition cursor-pointer"
          >
            <option value="all">All Folders</option>
            <option value="root">Root only</option>
            {folders.map((f) => (
              <option key={f.id} value={f.id}>
                📁 {f.name}
              </option>
            ))}
          </select>

          {/* Favorites filter */}
          <button
            onClick={() => setOnlyFavorites((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition duration-150 ${
              onlyFavorites
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-sm shadow-rose-500/20'
                : 'bg-slate-950/80 text-slate-400 border-white/[0.08] hover:text-white hover:border-slate-700'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${onlyFavorites ? 'fill-current text-rose-500' : ''}`} />
            <span>Favorites</span>
          </button>

          {/* Sort */}
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [by, order] = e.target.value.split('-');
              setSortBy(by as any);
              setSortOrder(order as any);
            }}
            className="bg-slate-950/80 border border-white/[0.08] text-xs font-medium text-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:border-pink-500 transition cursor-pointer"
          >
            <option value="createdAt-desc">Newest First</option>
            <option value="createdAt-asc">Oldest First</option>
            <option value="name-asc">Name (A-Z)</option>
            <option value="size-desc">Largest Size</option>
          </select>
        </div>
      </div>

      {/* Gallery Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
            <div key={i} className="aspect-square bg-slate-900 border border-slate-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : images.length === 0 ? (
        <EmptyState
          icon={ImageIcon}
          title="No images found"
          description="Upload photos, artwork, or screenshots to start building your gallery."
          actionLabel="Upload Images"
          onAction={openUpload}
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {images.map((image, idx) => (
            <div
              key={image.id}
              onClick={() => setLightboxIndex(idx)}
              className="group relative aspect-square bg-slate-900/80 border border-white/[0.08] hover:border-pink-500/50 rounded-2xl overflow-hidden cursor-pointer shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
            >
              <img
                src={getMediaUrl(image.streamUrl)}
                alt={image.originalName}
                className="w-full h-full object-cover group-hover:scale-108 transition duration-500"
                loading="lazy"
              />

              {/* Gradient Overlay with actions */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-black/50 opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-between">
                {/* Top actions */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleFavorite(image.id);
                    }}
                    className={`p-2 rounded-xl backdrop-blur-md transition shadow-md active:scale-75 ${
                      image.isFavorite
                        ? 'bg-rose-500/80 text-white'
                        : 'bg-black/50 text-white/80 hover:text-white hover:bg-black/70'
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${image.isFavorite ? 'fill-current' : ''}`} />
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setRenameTarget(image);
                        setNewName(image.originalName);
                      }}
                      className="p-2 bg-black/50 hover:bg-black/70 text-white/80 hover:text-white rounded-xl backdrop-blur-md transition shadow-md"
                      title="Rename"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget(image);
                      }}
                      className="p-2 bg-black/50 hover:bg-rose-600 text-white/80 hover:text-white rounded-xl backdrop-blur-md transition shadow-md"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Bottom title info */}
                <div className="p-2 bg-black/40 backdrop-blur-md rounded-xl border border-white/10">
                  <p className="text-xs font-bold text-white truncate drop-shadow">
                    {image.originalName}
                  </p>
                  <p className="text-[10px] text-slate-300 font-mono drop-shadow mt-0.5">
                    {formatBytes(image.size)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox Viewer */}
      {lightboxIndex >= 0 && (
        <ImageLightbox
          images={images}
          currentIndex={lightboxIndex}
          isOpen={lightboxIndex >= 0}
          onClose={() => setLightboxIndex(-1)}
          onNavigate={(newIdx: number) => setLightboxIndex(newIdx)}
          onToggleFavorite={handleToggleFavorite}
          onDelete={(id: string) => {
            const target = images.find((img) => img.id === id);
            if (target) setDeleteTarget(target);
          }}
        />
      )}

      {/* Rename Modal */}
      <Modal
        isOpen={!!renameTarget}
        onClose={() => setRenameTarget(null)}
        title="Rename Image"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleRename} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">New Image Name</label>
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

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Move Image to Trash"
        message={`Are you sure you want to move "${deleteTarget?.originalName}" to trash? You can restore it anytime from Trash.`}
        confirmText="Move to Trash"
        isDangerous
      />
    </div>
  );
};
