import React, { useState, useEffect } from 'react';
import {
  FolderPlus,
  Images,
  Share2,
  Trash2,
  Edit2,
  Plus,
  ArrowLeft,
  Play,
  Check,
  CheckCircle2,
  Circle,
  X,
  Loader2,
  Download,
  Heart,
  Image as ImageIcon,
} from 'lucide-react';
import { PhotoAlbum, FileItem } from '../../types';
import { galleryApi } from '../../services/galleryApi';
import { getMediaUrl } from '../../services/api';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { ShareAlbumModal } from './ShareAlbumModal';
import { useToast } from '../../contexts/ToastContext';
import { formatBytes } from '../../utils/formatters';

interface AlbumsViewProps {
  allPhotos: FileItem[];
  onOpenLightbox: (photos: FileItem[], index: number) => void;
  onStartSlideshow?: (photos: FileItem[]) => void;
  onToggleFavorite?: (id: string) => void;
}

export const AlbumsView: React.FC<AlbumsViewProps> = ({
  allPhotos,
  onOpenLightbox,
  onStartSlideshow,
  onToggleFavorite,
}) => {
  const { success, error } = useToast();

  const [albums, setAlbums] = useState<PhotoAlbum[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected Album Detail view
  const [selectedAlbum, setSelectedAlbum] = useState<PhotoAlbum | null>(null);
  const [loadingAlbumDetails, setLoadingAlbumDetails] = useState(false);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState('');
  const [newAlbumDesc, setNewAlbumDesc] = useState('');

  const [editAlbumTarget, setEditAlbumTarget] = useState<PhotoAlbum | null>(null);
  const [editAlbumName, setEditAlbumName] = useState('');
  const [editAlbumDesc, setEditAlbumDesc] = useState('');

  const [deleteAlbumTarget, setDeleteAlbumTarget] = useState<PhotoAlbum | null>(null);

  // Add photos to album modal
  const [isAddPhotosModalOpen, setIsAddPhotosModalOpen] = useState(false);
  const [selectedPhotoIdsToAdd, setSelectedPhotoIdsToAdd] = useState<Set<string>>(new Set());

  // Share Album modal
  const [shareAlbumTarget, setShareAlbumTarget] = useState<PhotoAlbum | null>(null);

  const fetchAlbums = async () => {
    setLoading(true);
    try {
      const data = await galleryApi.getAlbums();
      setAlbums(data);
    } catch (err: any) {
      error(err.message || 'Failed to fetch albums.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlbums();
  }, []);

  const openAlbumDetails = async (album: PhotoAlbum) => {
    setLoadingAlbumDetails(true);
    try {
      const detailed = await galleryApi.getAlbum(album.id);
      setSelectedAlbum(detailed);
    } catch (err: any) {
      error(err.message || 'Failed to open album.');
    } finally {
      setLoadingAlbumDetails(false);
    }
  };

  const handleCreateAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlbumName.trim()) return;

    try {
      const created = await galleryApi.createAlbum({
        name: newAlbumName.trim(),
        description: newAlbumDesc.trim() || undefined,
      });
      setAlbums((prev) => [created, ...prev]);
      success('Album created successfully!');
      setIsCreateModalOpen(false);
      setNewAlbumName('');
      setNewAlbumDesc('');
    } catch (err: any) {
      error(err.message || 'Failed to create album.');
    }
  };

  const handleUpdateAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editAlbumTarget || !editAlbumName.trim()) return;

    try {
      const updated = await galleryApi.updateAlbum(editAlbumTarget.id, {
        name: editAlbumName.trim(),
        description: editAlbumDesc.trim() || undefined,
      });

      setAlbums((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      if (selectedAlbum?.id === updated.id) {
        setSelectedAlbum((prev) => (prev ? { ...prev, name: updated.name, description: updated.description } : null));
      }

      success('Album updated successfully!');
      setEditAlbumTarget(null);
    } catch (err: any) {
      error(err.message || 'Failed to update album.');
    }
  };

  const handleDeleteAlbum = async () => {
    if (!deleteAlbumTarget) return;

    try {
      await galleryApi.deleteAlbum(deleteAlbumTarget.id);
      setAlbums((prev) => prev.filter((a) => a.id !== deleteAlbumTarget.id));
      if (selectedAlbum?.id === deleteAlbumTarget.id) {
        setSelectedAlbum(null);
      }
      success('Album deleted.');
      setDeleteAlbumTarget(null);
    } catch (err: any) {
      error(err.message || 'Failed to delete album.');
    }
  };

  const handleAddPhotosToAlbum = async () => {
    if (!selectedAlbum || selectedPhotoIdsToAdd.size === 0) return;

    try {
      const updated = await galleryApi.addPhotosToAlbum(
        selectedAlbum.id,
        Array.from(selectedPhotoIdsToAdd)
      );
      setSelectedAlbum(updated);
      setAlbums((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      success(`Added ${selectedPhotoIdsToAdd.size} photos to album!`);
      setIsAddPhotosModalOpen(false);
      setSelectedPhotoIdsToAdd(new Set());
    } catch (err: any) {
      error(err.message || 'Failed to add photos to album.');
    }
  };

  const handleRemovePhotoFromAlbum = async (fileId: string) => {
    if (!selectedAlbum) return;

    try {
      await galleryApi.removePhotoFromAlbum(selectedAlbum.id, fileId);
      const updatedPhotos = (selectedAlbum.photos || []).filter((p) => p.id !== fileId);
      setSelectedAlbum({
        ...selectedAlbum,
        photoCount: updatedPhotos.length,
        photos: updatedPhotos,
      });
      setAlbums((prev) =>
        prev.map((a) => (a.id === selectedAlbum.id ? { ...a, photoCount: updatedPhotos.length } : a))
      );
      success('Photo removed from album.');
    } catch (err: any) {
      error(err.message || 'Failed to remove photo.');
    }
  };

  // -------------------------------------------------------------
  // Render Album Detail View (Inside an Album)
  // -------------------------------------------------------------
  if (selectedAlbum) {
    const albumPhotos = selectedAlbum.photos || [];

    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        {/* Album Header Bar */}
        <div className="bg-slate-900/80 border border-white/[0.08] rounded-3xl p-6 shadow-xl backdrop-blur-md space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSelectedAlbum(null)}
                className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition"
                title="Back to all albums"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold text-white tracking-tight">{selectedAlbum.name}</h2>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-pink-500/15 text-pink-300 border border-pink-500/20">
                    {selectedAlbum.photoCount} {selectedAlbum.photoCount === 1 ? 'photo' : 'photos'}
                  </span>
                </div>
                {selectedAlbum.description && (
                  <p className="text-xs text-slate-400 mt-1 max-w-xl">{selectedAlbum.description}</p>
                )}
              </div>
            </div>

            {/* Actions for this album */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => {
                  setSelectedPhotoIdsToAdd(new Set());
                  setIsAddPhotosModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-pink-600/20"
              >
                <Plus className="w-4 h-4" />
                <span>Add Photos</span>
              </button>

              <button
                onClick={() => setShareAlbumTarget(selectedAlbum)}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition border border-white/10"
              >
                <Share2 className="w-4 h-4 text-pink-400" />
                <span>Share Album</span>
              </button>

              {albumPhotos.length > 0 && onStartSlideshow && (
                <button
                  onClick={() => onStartSlideshow(albumPhotos)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition border border-white/10"
                >
                  <Play className="w-4 h-4 text-brand-400 fill-current" />
                  <span>Slideshow</span>
                </button>
              )}

              <button
                onClick={() => {
                  setEditAlbumTarget(selectedAlbum);
                  setEditAlbumName(selectedAlbum.name);
                  setEditAlbumDesc(selectedAlbum.description || '');
                }}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                title="Edit Album Info"
              >
                <Edit2 className="w-4 h-4" />
              </button>

              <button
                onClick={() => setDeleteAlbumTarget(selectedAlbum)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white transition"
                title="Delete Album"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Photos in Album Grid */}
        {loadingAlbumDetails ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
            <p className="text-xs">Loading album photos...</p>
          </div>
        ) : albumPhotos.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/50 border border-white/[0.06] rounded-3xl space-y-4">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400">
              <Images className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">This album is empty</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Add photos from your gallery to organize them into this collection.
              </p>
            </div>
            <button
              onClick={() => {
                setSelectedPhotoIdsToAdd(new Set());
                setIsAddPhotosModalOpen(true);
              }}
              className="px-5 py-2.5 bg-pink-600 hover:bg-pink-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-pink-600/25 inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Photos Now</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {albumPhotos.map((photo, idx) => (
              <div
                key={photo.id}
                onClick={() => onOpenLightbox(albumPhotos, idx)}
                className="group relative aspect-square bg-slate-900 border border-white/[0.08] hover:border-pink-500/50 rounded-2xl overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <img
                  src={getMediaUrl(photo.streamUrl)}
                  alt={photo.originalName}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  loading="lazy"
                />

                {/* Hover overlay with remove from album */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/50 opacity-0 group-hover:opacity-100 transition-opacity p-2.5 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    {onToggleFavorite && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite(photo.id);
                        }}
                        className={`p-1.5 rounded-lg backdrop-blur-md transition ${
                          photo.isFavorite
                            ? 'bg-rose-500 text-white'
                            : 'bg-black/60 text-white/80 hover:text-white'
                        }`}
                        title="Favorite"
                      >
                        <Heart className={`w-3.5 h-3.5 ${photo.isFavorite ? 'fill-current' : ''}`} />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemovePhotoFromAlbum(photo.id);
                      }}
                      className="p-1.5 rounded-lg bg-black/60 hover:bg-rose-600 text-white/80 hover:text-white backdrop-blur-md transition ml-auto"
                      title="Remove from album"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="p-1.5 bg-black/50 backdrop-blur-md rounded-lg border border-white/10">
                    <p className="text-[11px] font-semibold text-white truncate">
                      {photo.originalName}
                    </p>
                    <p className="text-[9px] text-slate-300 font-mono">
                      {formatBytes(photo.size)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal: Add Photos to Album */}
        <Modal
          isOpen={isAddPhotosModalOpen}
          onClose={() => setIsAddPhotosModalOpen(false)}
          title={`Add Photos to "${selectedAlbum.name}"`}
          maxWidth="max-w-3xl"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-400">
              Select photos from your library to include in this album ({selectedPhotoIdsToAdd.size} selected).
            </p>

            <div className="max-h-96 overflow-y-auto grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5 p-1">
              {allPhotos.map((photo) => {
                const alreadyInAlbum = albumPhotos.some((p) => p.id === photo.id);
                const isSelected = selectedPhotoIdsToAdd.has(photo.id);

                return (
                  <div
                    key={photo.id}
                    onClick={() => {
                      if (alreadyInAlbum) return;
                      setSelectedPhotoIdsToAdd((prev) => {
                        const next = new Set(prev);
                        if (next.has(photo.id)) next.delete(photo.id);
                        else next.add(photo.id);
                        return next;
                      });
                    }}
                    className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer transition ${
                      alreadyInAlbum
                        ? 'opacity-40 cursor-not-allowed border border-white/10'
                        : isSelected
                        ? 'ring-2 ring-pink-500 scale-[0.98]'
                        : 'border border-white/10 hover:border-pink-500/50'
                    }`}
                  >
                    <img
                      src={getMediaUrl(photo.streamUrl)}
                      alt={photo.originalName}
                      className="w-full h-full object-cover"
                    />

                    {alreadyInAlbum && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-[10px] font-bold text-white uppercase tracking-wider">
                        Added
                      </div>
                    )}

                    {!alreadyInAlbum && (
                      <div className="absolute top-2 left-2">
                        {isSelected ? (
                          <div className="p-0.5 rounded bg-pink-600 text-white">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        ) : (
                          <div className="p-0.5 rounded bg-black/50 text-white/60">
                            <Circle className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-800">
              <span className="text-xs text-slate-400">
                {selectedPhotoIdsToAdd.size} photos chosen
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddPhotosModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={selectedPhotoIdsToAdd.size === 0}
                  onClick={handleAddPhotosToAlbum}
                  className="px-5 py-2 text-xs font-bold text-white bg-pink-600 hover:bg-pink-500 rounded-xl transition shadow-lg shadow-pink-600/20 disabled:opacity-50"
                >
                  Add to Album
                </button>
              </div>
            </div>
          </div>
        </Modal>

        {/* Share Album Modal */}
        <ShareAlbumModal
          isOpen={!!shareAlbumTarget}
          onClose={() => setShareAlbumTarget(null)}
          album={shareAlbumTarget}
        />
      </div>
    );
  }

  // -------------------------------------------------------------
  // Render Albums Grid View
  // -------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Top Bar for Albums */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Photo Albums</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Organize trips, events, favorites, and share custom photo collections.
          </p>
        </div>

        <button
          onClick={() => {
            setNewAlbumName('');
            setNewAlbumDesc('');
            setIsCreateModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-pink-600/20 cursor-pointer"
        >
          <FolderPlus className="w-4 h-4" />
          <span>New Album</span>
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="aspect-square sm:aspect-[4/3] bg-slate-900 border border-slate-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : albums.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/40 border border-white/[0.06] rounded-3xl space-y-4">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400">
            <Images className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">No Photo Albums Yet</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Create your first album to group pictures together for vacations, family events, or projects.
            </p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-5 py-2.5 bg-pink-600 hover:bg-pink-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-pink-600/25 inline-flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Your First Album</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4">
          {albums.map((album) => (
            <div
              key={album.id}
              onClick={() => openAlbumDetails(album)}
              className="group relative bg-slate-900/80 border border-white/[0.08] hover:border-pink-500/40 rounded-2xl p-2.5 cursor-pointer shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between"
            >
              {/* Album Cover Photo with constrained square/4:3 ratio */}
              <div className="relative w-full aspect-square sm:aspect-[4/3] rounded-xl overflow-hidden bg-slate-950/90 border border-white/5 mb-2.5">
                {album.coverUrl ? (
                  <img
                    src={getMediaUrl(album.coverUrl)}
                    alt={album.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 text-slate-500">
                    <ImageIcon className="w-7 h-7 opacity-40" />
                    <span className="text-[10px] font-medium">Empty Album</span>
                  </div>
                )}

                {/* Photo count pill */}
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-white text-[10px] font-bold border border-white/10 shadow-sm flex items-center gap-1">
                  <span>📸</span>
                  <span>{album.photoCount}</span>
                </div>
              </div>

              {/* Album Title & Actions */}
              <div className="flex items-start justify-between gap-1.5 px-0.5">
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-pink-300 transition">
                    {album.name}
                  </h4>
                  {album.description && (
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">{album.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => setShareAlbumTarget(album)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
                    title="Share Album"
                  >
                    <Share2 className="w-3.5 h-3.5 text-pink-400" />
                  </button>
                  <button
                    onClick={() => {
                      setEditAlbumTarget(album);
                      setEditAlbumName(album.name);
                      setEditAlbumDesc(album.description || '');
                    }}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
                    title="Edit Album"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteAlbumTarget(album)}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/10 transition"
                    title="Delete Album"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Create Album */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Photo Album"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreateAlbum} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Album Name *</label>
            <input
              type="text"
              required
              value={newAlbumName}
              onChange={(e) => setNewAlbumName(e.target.value)}
              placeholder="e.g. Summer Road Trip 2026"
              className="w-full bg-slate-950 border border-slate-800 focus:border-pink-500 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Description (Optional)</label>
            <textarea
              value={newAlbumDesc}
              onChange={(e) => setNewAlbumDesc(e.target.value)}
              rows={3}
              placeholder="Add details about this collection..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-pink-500 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none resize-none"
            />
          </div>
          <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-pink-600 hover:bg-pink-500 rounded-xl shadow-lg shadow-pink-600/20"
            >
              Create Album
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Album */}
      <Modal
        isOpen={!!editAlbumTarget}
        onClose={() => setEditAlbumTarget(null)}
        title="Edit Photo Album"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleUpdateAlbum} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Album Name *</label>
            <input
              type="text"
              required
              value={editAlbumName}
              onChange={(e) => setEditAlbumName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-pink-500 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Description</label>
            <textarea
              value={editAlbumDesc}
              onChange={(e) => setEditAlbumDesc(e.target.value)}
              rows={3}
              className="w-full bg-slate-950 border border-slate-800 focus:border-pink-500 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none resize-none"
            />
          </div>
          <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setEditAlbumTarget(null)}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-pink-600 hover:bg-pink-500 rounded-xl shadow-lg shadow-pink-600/20"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteAlbumTarget}
        onClose={() => setDeleteAlbumTarget(null)}
        onConfirm={handleDeleteAlbum}
        title="Delete Photo Album"
        message={`Are you sure you want to delete "${deleteAlbumTarget?.name}"? The photos inside will NOT be deleted from your gallery.`}
        confirmText="Delete Album"
        isDangerous
      />

      {/* Share Album Modal */}
      <ShareAlbumModal
        isOpen={!!shareAlbumTarget}
        onClose={() => setShareAlbumTarget(null)}
        album={shareAlbumTarget}
      />
    </div>
  );
};
