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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <ImageIcon className="w-7 h-7 text-pink-400" />
            Image Gallery
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Browse, zoom, organize, and manage your photos and graphics
          </p>
        </div>

        <button
          onClick={openUpload}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold rounded-xl transition shadow-lg shadow-brand-600/25 active:scale-95 self-start sm:self-auto"
        >
          <UploadCloud className="w-4 h-4" />
          Upload Images
        </button>
      </div>

      {/* Filter and Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-900/80 border border-slate-800 rounded-2xl">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search images..."
            className="w-full bg-slate-950 border border-slate-800 focus:border-brand-500 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 focus:outline-none"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Folder filter */}
          <select
            value={selectedFolder}
            onChange={(e) => setSelectedFolder(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-xl px-3 py-2 focus:outline-none"
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
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition ${
              onlyFavorites
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${onlyFavorites ? 'fill-current text-rose-500' : ''}`} />
            Favorites
          </button>

          {/* Sort */}
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [by, order] = e.target.value.split('-');
              setSortBy(by as any);
              setSortOrder(order as any);
            }}
            className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-xl px-3 py-2 focus:outline-none"
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
              className="group relative aspect-square bg-slate-900 border border-slate-800 hover:border-brand-500/60 rounded-2xl overflow-hidden cursor-pointer shadow-md hover:shadow-2xl transition-all duration-300"
            >
              <img
                src={getMediaUrl(image.streamUrl)}

                alt={image.originalName}
                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                loading="lazy"
              />

              {/* Gradient Overlay with actions */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-between">
                {/* Top actions */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleFavorite(image.id);
                    }}
                    className={`p-1.5 rounded-lg backdrop-blur-md transition ${
                      image.isFavorite
                        ? 'bg-rose-500/40 text-rose-300'
                        : 'bg-black/40 text-white/80 hover:text-white hover:bg-black/60'
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${image.isFavorite ? 'fill-current' : ''}`} />
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setRenameTarget(image);
                        setNewName(image.originalName);
                      }}
                      className="p-1.5 bg-black/40 hover:bg-black/60 text-white/80 hover:text-white rounded-lg backdrop-blur-md transition"
                      title="Rename"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget(image);
                      }}
                      className="p-1.5 bg-black/40 hover:bg-rose-600 text-white/80 hover:text-white rounded-lg backdrop-blur-md transition"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Bottom title info */}
                <div>
                  <p className="text-xs font-semibold text-white truncate drop-shadow">
                    {image.originalName}
                  </p>
                  <p className="text-[10px] text-slate-300 drop-shadow mt-0.5">
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
