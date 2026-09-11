import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Image as ImageIcon,
  Search,
  UploadCloud,
  Heart,
  Download,
  Trash2,
  Edit2,
  FolderClosed,
  Sparkles,
  Share2,
  Play,
  Copy,
  LayoutGrid,
  Calendar,
  FolderPlus,
  CheckSquare,
  Square,
  CheckCircle2,
  Circle,
  X,
  Plus,
  ArrowUpDown,
  Archive,
  Loader2,
} from 'lucide-react';
import { filesApi } from '../services/filesApi';
import { foldersApi } from '../services/foldersApi';
import { favoritesApi } from '../services/favoritesApi';
import { galleryApi } from '../services/galleryApi';
import { FileItem, FolderItem, PhotoTimelineGroup, PhotoAlbum } from '../types';
import { formatBytes, formatDate } from '../utils/formatters';
import { getMediaUrl } from '../services/api';
import { ImageLightbox } from '../components/gallery/ImageLightbox';
import { SlideshowModal } from '../components/gallery/SlideshowModal';
import { GalleryTimelineView } from '../components/gallery/GalleryTimelineView';
import { AlbumsView } from '../components/gallery/AlbumsView';
import { DuplicatePhotosModal } from '../components/gallery/DuplicatePhotosModal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { Modal } from '../components/common/Modal';
import { EmptyState } from '../components/common/EmptyState';
import { ShareModal } from '../components/share/ShareModal';
import { useToast } from '../contexts/ToastContext';

type ViewMode = 'grid' | 'timeline' | 'albums' | 'favorites';

export const Gallery: React.FC = () => {
  const { success, error } = useToast();
  const { openUpload } = useOutletContext<{ openUpload: () => void }>() || { openUpload: () => {} };

  // Gallery view mode
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Images state
  const [images, setImages] = useState<FileItem[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Timeline state
  const [timelineGroups, setTimelineGroups] = useState<PhotoTimelineGroup[]>([]);
  const [isLoadingTimeline, setIsLoadingTimeline] = useState(false);

  // Filters & Sorting
  const [search, setSearchTerm] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'createdAt' | 'name' | 'size'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Multi-select mode
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);

  // Lightbox
  const [lightboxImages, setLightboxImages] = useState<FileItem[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number>(-1);

  // Slideshow
  const [isSlideshowOpen, setIsSlideshowOpen] = useState(false);
  const [slideshowImages, setSlideshowImages] = useState<FileItem[]>([]);

  // Duplicate photos modal
  const [isDuplicatesModalOpen, setIsDuplicatesModalOpen] = useState(false);

  // Add to album modal (from multi-select)
  const [isAddToAlbumModalOpen, setIsAddToAlbumModalOpen] = useState(false);
  const [availableAlbums, setAvailableAlbums] = useState<PhotoAlbum[]>([]);
  const [targetAlbumId, setTargetAlbumId] = useState<string>('');

  // Share modal
  const [shareTarget, setShareTarget] = useState<FileItem | null>(null);

  // Rename modal
  const [renameTarget, setRenameTarget] = useState<FileItem | null>(null);
  const [newName, setNewName] = useState('');

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<FileItem | null>(null);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

  // Fetch images for Grid / Favorites
  const fetchImages = async () => {
    setIsLoading(true);
    try {
      const res = await filesApi.listFiles({
        fileType: 'IMAGE',
        search: search || undefined,
        folderId: selectedFolder === 'all' ? undefined : selectedFolder === 'root' ? null : selectedFolder,
        favoriteOnly: viewMode === 'favorites',
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

  // Fetch Timeline groups
  const fetchTimeline = async () => {
    setIsLoadingTimeline(true);
    try {
      const data = await galleryApi.getTimeline({
        folderId: selectedFolder === 'all' ? undefined : selectedFolder === 'root' ? null : selectedFolder,
        favoriteOnly: viewMode === 'favorites',
      });
      setTimelineGroups(data);
    } catch (err) {
      console.error('Failed to load timeline:', err);
    } finally {
      setIsLoadingTimeline(false);
    }
  };

  useEffect(() => {
    foldersApi.getFolders().then(setFolders).catch(console.error);
  }, []);

  useEffect(() => {
    if (viewMode === 'timeline') {
      fetchTimeline();
    } else {
      fetchImages();
    }

    const handleUpdate = () => {
      fetchImages();
      fetchTimeline();
    };
    window.addEventListener('pdl_files_updated', handleUpdate);
    return () => window.removeEventListener('pdl_files_updated', handleUpdate);
  }, [viewMode, search, selectedFolder, sortBy, sortOrder]);

  const handleToggleFavorite = async (fileId: string) => {
    try {
      const res = await favoritesApi.toggle(fileId);
      setImages((prev) =>
        prev.map((img) => (img.id === fileId ? { ...img, isFavorite: res.isFavorite } : img))
      );
      // Also update in timeline
      setTimelineGroups((prev) =>
        prev.map((grp) => ({
          ...grp,
          photos: grp.photos.map((p) =>
            p.id === fileId ? { ...p, isFavorite: res.isFavorite } : p
          ),
        }))
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
      setTimelineGroups((prev) =>
        prev.map((grp) => ({
          ...grp,
          photos: grp.photos.filter((p) => p.id !== deleteTarget.id),
        }))
      );
      success('Image moved to trash.');
      setDeleteTarget(null);
      if (lightboxIndex >= 0) setLightboxIndex(-1);
    } catch (err: any) {
      error(err.message || 'Failed to delete image.');
    }
  };

  // Multi-select helpers
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAllCurrent = () => {
    const activePhotos = viewMode === 'timeline'
      ? timelineGroups.flatMap((g) => g.photos)
      : images;

    if (selectedIds.size === activePhotos.length && activePhotos.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(activePhotos.map((p) => p.id)));
    }
  };

  const handleSelectAllInTimelineMonth = (photos: FileItem[]) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const allSelected = photos.every((p) => next.has(p.id));
      if (allSelected) {
        photos.forEach((p) => next.delete(p.id));
      } else {
        photos.forEach((p) => next.add(p.id));
      }
      return next;
    });
  };

  // Batch download ZIP
  const handleBatchDownloadZip = async () => {
    if (selectedIds.size === 0) return;
    setIsDownloadingZip(true);
    try {
      const ids = Array.from(selectedIds);
      await galleryApi.downloadZip(ids, `photos_export_${Date.now()}.zip`);
      success(`Downloaded ${ids.length} photos as ZIP archive.`);
    } catch (err: any) {
      error(err.message || 'Failed to generate ZIP archive.');
    } finally {
      setIsDownloadingZip(false);
    }
  };

  // Batch delete
  const handleBulkDeleteConfirm = async () => {
    if (selectedIds.size === 0) return;

    try {
      const ids = Array.from(selectedIds);
      for (const id of ids) {
        await filesApi.moveToTrash(id);
      }
      setImages((prev) => prev.filter((img) => !selectedIds.has(img.id)));
      setTimelineGroups((prev) =>
        prev.map((grp) => ({
          ...grp,
          photos: grp.photos.filter((p) => !selectedIds.has(p.id)),
        }))
      );
      success(`Moved ${ids.length} photos to trash.`);
      setSelectedIds(new Set());
      setIsMultiSelectMode(false);
      setIsBulkDeleteModalOpen(false);
    } catch (err: any) {
      error(err.message || 'Failed to move selected photos to trash.');
    }
  };

  // Batch add to album
  const openAddToAlbumModal = async () => {
    try {
      const albums = await galleryApi.getAlbums();
      setAvailableAlbums(albums);
      if (albums.length > 0) setTargetAlbumId(albums[0].id);
      setIsAddToAlbumModalOpen(true);
    } catch (err: any) {
      error(err.message || 'Failed to load albums.');
    }
  };

  const handleConfirmAddToAlbum = async () => {
    if (!targetAlbumId || selectedIds.size === 0) return;

    try {
      await galleryApi.addPhotosToAlbum(targetAlbumId, Array.from(selectedIds));
      success(`Added ${selectedIds.size} photos to album!`);
      setIsAddToAlbumModalOpen(false);
      setSelectedIds(new Set());
      setIsMultiSelectMode(false);
    } catch (err: any) {
      error(err.message || 'Failed to add photos to album.');
    }
  };

  // Lightbox opener
  const openLightboxWithImages = (list: FileItem[], index: number) => {
    setLightboxImages(list);
    setLightboxIndex(index);
  };

  // Slideshow opener
  const startSlideshowWithList = (list: FileItem[], startIdx = 0) => {
    if (list.length === 0) {
      error('No photos available to play slideshow.');
      return;
    }
    setSlideshowImages(list);
    setIsSlideshowOpen(true);
  };

  const activePhotosList = viewMode === 'timeline'
    ? timelineGroups.flatMap((g) => g.photos)
    : images;

  return (
    <div className="space-y-6 pb-20">
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
              High-resolution photo library with interactive deep zoom, chronological timeline, albums, and duplicate cleanup.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start md:self-center">
            {/* Start Slideshow button */}
            <button
              onClick={() => startSlideshowWithList(activePhotosList)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white border border-white/15 text-xs sm:text-sm font-bold rounded-2xl transition cursor-pointer backdrop-blur-md shadow-md active:scale-95"
            >
              <Play className="w-4 h-4 text-brand-400 fill-current" />
              <span>Slideshow</span>
            </button>

            {/* Find Duplicates button */}
            <button
              onClick={() => setIsDuplicatesModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs sm:text-sm font-bold rounded-2xl transition cursor-pointer backdrop-blur-md shadow-md active:scale-95"
            >
              <Copy className="w-4 h-4 text-amber-400" />
              <span>Duplicates</span>
            </button>

            {/* Upload Photos button */}
            <button
              onClick={openUpload}
              className="group relative overflow-hidden flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 hover:from-pink-500 hover:to-rose-500 text-white text-xs sm:text-sm font-black rounded-2xl transition-all duration-200 shadow-xl shadow-pink-600/25 hover:shadow-pink-600/40 border border-white/20 active:scale-95 whitespace-nowrap cursor-pointer"
            >
              <UploadCloud className="w-4 h-4 text-white" />
              <span>Upload Photos</span>
            </button>
          </div>
        </div>
      </div>

      {/* View Mode Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1.5 bg-slate-900/80 border border-white/[0.08] rounded-2xl backdrop-blur-md overflow-x-auto no-scrollbar max-w-full">
          <button
            onClick={() => {
              setViewMode('grid');
              setIsMultiSelectMode(false);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              viewMode === 'grid'
                ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-md shadow-pink-600/20'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>All Photos</span>
          </button>

          <button
            onClick={() => {
              setViewMode('timeline');
              setIsMultiSelectMode(false);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              viewMode === 'timeline'
                ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-md shadow-pink-600/20'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Timeline</span>
          </button>

          <button
            onClick={() => {
              setViewMode('albums');
              setIsMultiSelectMode(false);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              viewMode === 'albums'
                ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-md shadow-pink-600/20'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <FolderPlus className="w-4 h-4" />
            <span>Albums</span>
          </button>

          <button
            onClick={() => {
              setViewMode('favorites');
              setIsMultiSelectMode(false);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              viewMode === 'favorites'
                ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-md shadow-pink-600/20'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Heart className={`w-4 h-4 ${viewMode === 'favorites' ? 'fill-current' : ''}`} />
            <span>Favorites</span>
          </button>
        </div>

        {/* Multi-Select Toggle */}
        {viewMode !== 'albums' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setIsMultiSelectMode(!isMultiSelectMode);
                setSelectedIds(new Set());
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                isMultiSelectMode
                  ? 'bg-pink-600/20 text-pink-300 border-pink-500/40'
                  : 'bg-slate-900/80 text-slate-300 border-white/[0.08] hover:text-white hover:border-white/20'
              }`}
            >
              {isMultiSelectMode ? (
                <>
                  <CheckSquare className="w-4 h-4 text-pink-400" />
                  <span>Exit Select Mode</span>
                </>
              ) : (
                <>
                  <Square className="w-4 h-4 text-slate-400" />
                  <span>Select Photos</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Filter and Control Bar (For Grid, Timeline, and Favorites) */}
      {viewMode !== 'albums' && (
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

          {/* Filters & Sorting */}
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

            {/* Sort (Grid & Favorites) */}
            {viewMode !== 'timeline' && (
              <div className="flex items-center gap-1.5 bg-slate-950/80 border border-white/[0.08] rounded-xl px-2.5 py-1 text-xs text-slate-300">
                <ArrowUpDown className="w-3.5 h-3.5 text-pink-400" />
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [by, order] = e.target.value.split('-');
                    setSortBy(by as any);
                    setSortOrder(order as any);
                  }}
                  className="bg-transparent text-xs font-medium text-slate-300 focus:outline-none cursor-pointer"
                >
                  <option value="createdAt-desc" className="bg-slate-900">Date: Newest First</option>
                  <option value="createdAt-asc" className="bg-slate-900">Date: Oldest First</option>
                  <option value="size-desc" className="bg-slate-900">Size: Largest First</option>
                  <option value="size-asc" className="bg-slate-900">Size: Smallest First</option>
                  <option value="name-asc" className="bg-slate-900">Name: A &rarr; Z</option>
                  <option value="name-desc" className="bg-slate-900">Name: Z &rarr; A</option>
                </select>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Content Area based on viewMode */}
      {viewMode === 'albums' ? (
        /* Albums View */
        <AlbumsView
          allPhotos={images}
          onOpenLightbox={(albumPhotos, idx) => openLightboxWithImages(albumPhotos, idx)}
          onStartSlideshow={(albumPhotos) => startSlideshowWithList(albumPhotos)}
          onToggleFavorite={handleToggleFavorite}
        />
      ) : viewMode === 'timeline' ? (
        /* Timeline View */
        <GalleryTimelineView
          timelineGroups={timelineGroups}
          isLoading={isLoadingTimeline}
          selectedIds={selectedIds}
          isMultiSelectMode={isMultiSelectMode}
          onToggleSelect={handleToggleSelect}
          onSelectAllInGroup={handleSelectAllInTimelineMonth}
          onOpenLightbox={(photo) => {
            const allTimelinePhotos = timelineGroups.flatMap((g) => g.photos);
            const idx = allTimelinePhotos.findIndex((p) => p.id === photo.id);
            openLightboxWithImages(allTimelinePhotos, Math.max(0, idx));
          }}
          onToggleFavorite={handleToggleFavorite}
          onShare={(photo) => setShareTarget(photo)}
        />
      ) : (
        /* Grid & Favorites View */
        isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
              <div key={i} className="aspect-square bg-slate-900 border border-slate-800 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : images.length === 0 ? (
          <EmptyState
            icon={ImageIcon}
            title={viewMode === 'favorites' ? 'No favorite photos yet' : 'No images found'}
            description={
              viewMode === 'favorites'
                ? 'Click the heart icon on any photo to save it to your favorites.'
                : 'Upload photos, artwork, or screenshots to start building your gallery.'
            }
            actionLabel={viewMode === 'favorites' ? undefined : 'Upload Images'}
            onAction={viewMode === 'favorites' ? undefined : openUpload}
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {images.map((image, idx) => {
              const isSelected = selectedIds.has(image.id);

              return (
                <div
                  key={image.id}
                  onClick={() => {
                    if (isMultiSelectMode) {
                      handleToggleSelect(image.id);
                    } else {
                      openLightboxWithImages(images, idx);
                    }
                  }}
                  className={`group relative aspect-square bg-slate-900/80 rounded-2xl overflow-hidden cursor-pointer shadow-md transition-all duration-300 ${
                    isSelected
                      ? 'ring-2 ring-pink-500 scale-[0.98]'
                      : 'border border-white/[0.08] hover:border-pink-500/50 hover:shadow-2xl hover:-translate-y-1'
                  }`}
                >
                  <img
                    src={getMediaUrl(image.streamUrl)}
                    alt={image.originalName}
                    className="w-full h-full object-cover group-hover:scale-108 transition duration-500"
                    loading="lazy"
                  />

                  {/* Mobile Favorite Indicator */}
                  {image.isFavorite && (
                    <div className="absolute top-2.5 right-2.5 sm:hidden p-1.5 rounded-xl bg-rose-500/90 text-white shadow-md z-10">
                      <Heart className="w-3.5 h-3.5 fill-current" />
                    </div>
                  )}

                  {/* Multi-select checkbox */}
                  {isMultiSelectMode && (
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleSelect(image.id);
                      }}
                      className="absolute top-2.5 left-2.5 z-10"
                    >
                      {isSelected ? (
                        <div className="p-1 rounded-lg bg-pink-600 text-white shadow-lg">
                          <CheckCircle2 className="w-4 h-4 fill-current" />
                        </div>
                      ) : (
                        <div className="p-1 rounded-lg bg-black/60 text-white/70 hover:text-white border border-white/20 backdrop-blur-md">
                          <Circle className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  )}

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
                            setShareTarget(image);
                          }}
                          className="p-2 bg-black/50 hover:bg-brand-600 text-white/80 hover:text-white rounded-xl backdrop-blur-md transition shadow-md"
                          title="Share Image Link"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
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
              );
            })}
          </div>
        )
      )}

      {/* Floating Batch Actions Bar (when in multi-select mode) */}
      {isMultiSelectMode && selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 border border-pink-500/40 backdrop-blur-2xl rounded-2xl py-3 px-5 shadow-2xl flex items-center gap-4 text-xs animate-in slide-in-from-bottom-5">
          <div className="flex items-center gap-2 border-r border-white/10 pr-4">
            <div className="w-6 h-6 rounded-full bg-pink-600 text-white flex items-center justify-center font-bold text-xs">
              {selectedIds.size}
            </div>
            <span className="font-semibold text-white">selected</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Download ZIP */}
            <button
              disabled={isDownloadingZip}
              onClick={handleBatchDownloadZip}
              className="flex items-center gap-1.5 px-3 py-2 bg-pink-600 hover:bg-pink-500 text-white rounded-xl font-bold transition shadow-md shadow-pink-600/25 disabled:opacity-50 cursor-pointer"
            >
              {isDownloadingZip ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>{isDownloadingZip ? 'Zipping...' : 'Download ZIP'}</span>
            </button>

            {/* Add to Album */}
            <button
              onClick={openAddToAlbumModal}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl font-bold transition border border-white/10 cursor-pointer"
            >
              <FolderPlus className="w-3.5 h-3.5 text-pink-400" />
              <span>Add to Album</span>
            </button>

            {/* Delete Selected */}
            <button
              onClick={() => setIsBulkDeleteModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-rose-600 text-slate-200 hover:text-white rounded-xl font-bold transition border border-white/10 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Trash</span>
            </button>

            {/* Select/Deselect All */}
            <button
              onClick={handleSelectAllCurrent}
              className="px-2.5 py-2 text-slate-400 hover:text-white transition"
            >
              {selectedIds.size === activePhotosList.length ? 'Deselect All' : 'Select All'}
            </button>

            {/* Close Select Mode */}
            <button
              onClick={() => {
                setIsMultiSelectMode(false);
                setSelectedIds(new Set());
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Lightbox Viewer */}
      {lightboxIndex >= 0 && (
        <ImageLightbox
          images={lightboxImages}
          currentIndex={lightboxIndex}
          isOpen={lightboxIndex >= 0}
          onClose={() => setLightboxIndex(-1)}
          onNavigate={(newIdx: number) => setLightboxIndex(newIdx)}
          onToggleFavorite={handleToggleFavorite}
          onStartSlideshow={() => {
            setLightboxIndex(-1);
            startSlideshowWithList(lightboxImages, lightboxIndex);
          }}
          onDelete={(id: string) => {
            const target = lightboxImages.find((img) => img.id === id);
            if (target) setDeleteTarget(target);
          }}
        />
      )}

      {/* Fullscreen Slideshow */}
      <SlideshowModal
        images={slideshowImages}
        isOpen={isSlideshowOpen}
        onClose={() => setIsSlideshowOpen(false)}
      />

      {/* Duplicate Photos Scanner Modal */}
      <DuplicatePhotosModal
        isOpen={isDuplicatesModalOpen}
        onClose={() => setIsDuplicatesModalOpen(false)}
        onPhotosCleaned={() => {
          fetchImages();
          fetchTimeline();
        }}
        onViewPhoto={(photo) => {
          openLightboxWithImages([photo], 0);
        }}
      />

      {/* Add to Album Modal (from multi-select) */}
      <Modal
        isOpen={isAddToAlbumModalOpen}
        onClose={() => setIsAddToAlbumModalOpen(false)}
        title="Add Selected Photos to Album"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-300">
            Adding <strong>{selectedIds.size}</strong> photos to collection:
          </p>

          {availableAlbums.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-xs">
              <p>No albums created yet.</p>
              <p className="mt-1">Go to the <strong>Albums</strong> tab to create your first album.</p>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">Select Target Album</label>
              <select
                value={targetAlbumId}
                onChange={(e) => setTargetAlbumId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-pink-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
              >
                {availableAlbums.map((a) => (
                  <option key={a.id} value={a.id}>
                    📁 {a.name} ({a.photoCount} photos)
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
            <button
              onClick={() => setIsAddToAlbumModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              disabled={availableAlbums.length === 0}
              onClick={handleConfirmAddToAlbum}
              className="px-5 py-2 text-xs font-bold text-white bg-pink-600 hover:bg-pink-500 rounded-xl transition shadow-lg shadow-pink-600/25 disabled:opacity-50"
            >
              Add Photos
            </button>
          </div>
        </div>
      </Modal>

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

      {/* Single Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Move Image to Trash"
        message={`Are you sure you want to move "${deleteTarget?.originalName}" to trash? You can restore it anytime from Trash.`}
        confirmText="Move to Trash"
        isDangerous
      />

      {/* Bulk Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isBulkDeleteModalOpen}
        onClose={() => setIsBulkDeleteModalOpen(false)}
        onConfirm={handleBulkDeleteConfirm}
        title="Move Selected Photos to Trash"
        message={`Are you sure you want to move ${selectedIds.size} selected photos to trash? You can restore them anytime within 30 days.`}
        confirmText={`Trash (${selectedIds.size})`}
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
