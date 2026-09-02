import React, { useState, useEffect } from 'react';
import { useSearchParams, useOutletContext } from 'react-router-dom';
import {
  FolderClosed,
  FolderPlus,
  FileText,
  Image,
  Video,
  Music,
  FileCode,
  FileSpreadsheet,
  FileArchive,
  Search,
  UploadCloud,
  Grid,
  List,
  ChevronRight,
  MoreVertical,
  Download,
  Edit2,
  FolderInput,
  Heart,
  Trash2,
  Eye,
  File,
  Sparkles,
} from 'lucide-react';
import { filesApi } from '../services/filesApi';
import { foldersApi } from '../services/foldersApi';
import { favoritesApi } from '../services/favoritesApi';
import { FileItem, FolderItem, FileType } from '../types';
import { formatBytes, formatDate } from '../utils/formatters';
import { getMediaUrl } from '../services/api';
import { FileTypeBadge } from '../components/common/Badge';
import { FilePreviewModal } from '../components/files/FilePreviewModal';
import { MoveFileModal } from '../components/files/MoveFileModal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { Modal } from '../components/common/Modal';
import { EmptyState } from '../components/common/EmptyState';
import { useToast } from '../contexts/ToastContext';
import { useAudioPlayer } from '../contexts/AudioPlayerContext';

export const Files: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { success, error } = useToast();
  const { playSongNow } = useAudioPlayer();
  const { openUpload } = useOutletContext<{ openUpload: () => void }>() || { openUpload: () => {} };

  // Active folder ID from URL param or state
  const currentFolderId = searchParams.get('folderId') || null;
  const initialTypeFilter = (searchParams.get('type') as FileType) || undefined;
  const initialSearch = searchParams.get('search') || '';

  const [files, setFiles] = useState<FileItem[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [breadcrumbs, setBreadcrumbs] = useState<Array<{ id: string | null; name: string }>>([
    { id: null, name: 'My Files' },
  ]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearchTerm] = useState(initialSearch);
  const [fileTypeFilter, setFileTypeFilter] = useState<FileType | undefined>(initialTypeFilter);
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  // Modals
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [moveTarget, setMoveTarget] = useState<FileItem | null>(null);
  const [renameTarget, setRenameTarget] = useState<FileItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FileItem | null>(null);
  const [newName, setNewName] = useState('');

  // Folder creation / rename / delete modals
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [renameFolderTarget, setRenameFolderTarget] = useState<FolderItem | null>(null);
  const [newFolderRename, setNewFolderRename] = useState('');
  const [deleteFolderTarget, setDeleteFolderTarget] = useState<FolderItem | null>(null);

  const fetchFilesAndFolders = async () => {
    setIsLoading(true);
    try {
      const [filesRes, foldersRes] = await Promise.all([
        filesApi.listFiles({
          folderId: currentFolderId,
          fileType: fileTypeFilter,
          search: search || undefined,
          favoriteOnly: onlyFavorites,
          limit: 100,
        }),
        foldersApi.getFolders(currentFolderId),
      ]);

      setFiles(filesRes.data);
      setFolders(foldersRes);
    } catch (err) {
      console.error('Failed to load files/folders:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFilesAndFolders();

    const handleUpdate = () => fetchFilesAndFolders();
    window.addEventListener('pdl_files_updated', handleUpdate);
    return () => window.removeEventListener('pdl_files_updated', handleUpdate);
  }, [currentFolderId, fileTypeFilter, search, onlyFavorites]);

  const handleNavigateFolder = (folder: FolderItem | null) => {
    if (!folder) {
      searchParams.delete('folderId');
      setSearchParams(searchParams);
      setBreadcrumbs([{ id: null, name: 'My Files' }]);
    } else {
      searchParams.set('folderId', folder.id);
      setSearchParams(searchParams);
      setBreadcrumbs((prev) => {
        const existingIdx = prev.findIndex((b) => b.id === folder.id);
        if (existingIdx >= 0) return prev.slice(0, existingIdx + 1);
        return [...prev, { id: folder.id, name: folder.name }];
      });
    }
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    try {
      const created = await foldersApi.createFolder(newFolderName.trim(), currentFolderId);
      setFolders((prev) => [...prev, created]);
      success(`Folder "${created.name}" created!`);
      setIsCreateFolderOpen(false);
      setNewFolderName('');
    } catch (err: any) {
      error(err.message || 'Failed to create folder.');
    }
  };

  const handleRenameFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameFolderTarget || !newFolderRename.trim()) return;

    try {
      const updated = await foldersApi.renameFolder(renameFolderTarget.id, newFolderRename.trim());
      setFolders((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
      success('Folder renamed successfully!');
      setRenameFolderTarget(null);
    } catch (err: any) {
      error(err.message || 'Failed to rename folder.');
    }
  };

  const handleDeleteFolderConfirm = async () => {
    if (!deleteFolderTarget) return;

    try {
      await foldersApi.deleteFolder(deleteFolderTarget.id);
      setFolders((prev) => prev.filter((f) => f.id !== deleteFolderTarget.id));
      success('Folder deleted.');
      setDeleteFolderTarget(null);
    } catch (err: any) {
      error(err.message || 'Failed to delete folder.');
    }
  };

  const handleToggleFavorite = async (fileId: string) => {
    try {
      const res = await favoritesApi.toggle(fileId);
      setFiles((prev) =>
        prev.map((f) => (f.id === fileId ? { ...f, isFavorite: res.isFavorite } : f))
      );
      success(res.message);
    } catch (err: any) {
      error(err.message || 'Failed to update favorite.');
    }
  };

  const handleRenameFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameTarget || !newName.trim()) return;

    try {
      const updated = await filesApi.renameFile(renameTarget.id, newName.trim());
      setFiles((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
      success('File renamed!');
      setRenameTarget(null);
    } catch (err: any) {
      error(err.message || 'Failed to rename file.');
    }
  };

  const handleDeleteFileConfirm = async () => {
    if (!deleteTarget) return;

    try {
      await filesApi.moveToTrash(deleteTarget.id);
      setFiles((prev) => prev.filter((f) => f.id !== deleteTarget.id));
      success('File moved to trash.');
      setDeleteTarget(null);
    } catch (err: any) {
      error(err.message || 'Failed to delete file.');
    }
  };

  const handleFileClick = (file: FileItem) => {
    if (file.fileType === 'AUDIO' && file.music) {
      playSongNow(file.music);
    } else {
      setPreviewFile(file);
    }
  };

  const renderFileIcon = (file: FileItem) => {
    switch (file.fileType) {
      case 'IMAGE':
        return <Image className="w-5 h-5 text-pink-400" />;
      case 'VIDEO':
        return <Video className="w-5 h-5 text-purple-400" />;
      case 'AUDIO':
        return <Music className="w-5 h-5 text-amber-400" />;
      case 'PDF':
        return <FileText className="w-5 h-5 text-rose-400" />;
      case 'DOCUMENT':
        return <FileText className="w-5 h-5 text-blue-400" />;
      case 'SPREADSHEET':
        return <FileSpreadsheet className="w-5 h-5 text-emerald-400" />;
      case 'ARCHIVE':
        return <FileArchive className="w-5 h-5 text-yellow-400" />;
      default:
        return <File className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <FolderClosed className="w-7 h-7 text-brand-400" />
            Universal Files & Documents
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Store, preview, organize, and manage files in structured folders
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsCreateFolderOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-sm font-semibold rounded-xl transition"
          >
            <FolderPlus className="w-4 h-4 text-brand-400" />
            New Folder
          </button>
          <button
            onClick={openUpload}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold rounded-xl transition shadow-lg shadow-brand-600/25 active:scale-95"
          >
            <UploadCloud className="w-4 h-4" />
            Upload
          </button>
        </div>
      </div>

      {/* Interactive Breadcrumb Bar */}
      <div className="flex items-center gap-1.5 p-3 bg-slate-900/60 border border-slate-800 rounded-2xl text-xs font-semibold overflow-x-auto">
        {breadcrumbs.map((crumb, idx) => {
          const isLast = idx === breadcrumbs.length - 1;
          return (
            <React.Fragment key={`${crumb.id}-${idx}`}>
              <button
                onClick={() => {
                  if (crumb.id === null) handleNavigateFolder(null);
                  else handleNavigateFolder({ id: crumb.id, name: crumb.name } as FolderItem);
                }}
                className={`px-2.5 py-1 rounded-lg transition whitespace-nowrap ${
                  isLast
                    ? 'text-white bg-slate-800'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                {crumb.id === null ? '📁 Root Library' : `📁 ${crumb.name}`}
              </button>
              {!isLast && <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />}
            </React.Fragment>
          );
        })}
      </div>

      {/* Control / Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-900/80 border border-slate-800 rounded-2xl">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search in this library..."
            className="w-full bg-slate-950 border border-slate-800 focus:border-brand-500 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 focus:outline-none"
          />
        </div>

        {/* Filter Type Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {/* File Type filter */}
          <select
            value={fileTypeFilter || ''}
            onChange={(e) => setFileTypeFilter((e.target.value as FileType) || undefined)}
            className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-xl px-3 py-2 focus:outline-none"
          >
            <option value="">All File Types</option>
            <option value="IMAGE">Images</option>
            <option value="VIDEO">Videos</option>
            <option value="AUDIO">Audio</option>
            <option value="PDF">PDFs</option>
            <option value="DOCUMENT">Documents</option>
            <option value="SPREADSHEET">Spreadsheets</option>
            <option value="ARCHIVE">Archives</option>
            <option value="OTHER">Other</option>
          </select>

          {/* Favorites */}
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

          {/* Grid / List View Toggle */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'grid' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'list' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Subfolders Grid */}
      {folders.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Folders</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {folders.map((f) => (
              <div
                key={f.id}
                onClick={() => handleNavigateFolder(f)}
                className="group relative p-3 bg-slate-900 border border-slate-800 hover:border-brand-500/50 rounded-2xl cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400 shrink-0">
                    <FolderClosed className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-semibold text-white group-hover:text-brand-300 transition truncate">
                      {f.name}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {f._count?.files ?? 0} files
                    </p>
                  </div>
                </div>

                {/* Folder options */}
                <div
                  className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => {
                      setRenameFolderTarget(f);
                      setNewFolderRename(f.name);
                    }}
                    className="p-1 text-slate-400 hover:text-white transition"
                    title="Rename Folder"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteFolderTarget(f)}
                    className="p-1 text-slate-400 hover:text-rose-400 transition"
                    title="Delete Folder"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Files Section */}
      <div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
          Files ({files.length})
        </h3>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="h-36 bg-slate-900 border border-slate-800 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : files.length === 0 && folders.length === 0 ? (
          <EmptyState
            icon={FolderClosed}
            title="Folder is empty"
            description="Upload files or create subfolders to keep your library organized."
            actionLabel="Upload Files"
            onAction={openUpload}
          />
        ) : viewMode === 'grid' ? (
          /* GRID VIEW */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {files.map((file) => (
              <div
                key={file.id}
                onClick={() => handleFileClick(file)}
                className="group relative bg-slate-900 border border-slate-800 hover:border-brand-500/50 rounded-2xl p-3.5 cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-xl flex flex-col justify-between"
              >
                {/* Thumbnail / Icon area */}
                <div className="aspect-video w-full rounded-xl bg-slate-950 flex items-center justify-center overflow-hidden mb-3 border border-slate-800 relative">
                  {file.fileType === 'IMAGE' ? (
                    <img
                      src={getMediaUrl(file.streamUrl)}
                      alt={file.originalName}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  ) : file.fileType === 'AUDIO' && file.music?.coverUrl ? (
                    <img src={file.music.coverUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    renderFileIcon(file)
                  )}

                  {/* Favorite indicator badge */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleFavorite(file.id);
                    }}
                    className={`absolute top-2 right-2 p-1.5 rounded-lg backdrop-blur-md transition ${
                      file.isFavorite
                        ? 'bg-rose-500/80 text-white'
                        : 'opacity-0 group-hover:opacity-100 bg-black/40 text-slate-300 hover:text-white'
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${file.isFavorite ? 'fill-current' : ''}`} />
                  </button>
                </div>

                {/* File details */}
                <div>
                  <p className="text-xs font-semibold text-white group-hover:text-brand-300 transition truncate leading-snug">
                    {file.originalName}
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1.5">
                    <span>{formatBytes(file.size)}</span>
                    <FileTypeBadge type={file.fileType} />
                  </div>
                </div>

                {/* Hover Action Strip */}
                <div
                  className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between opacity-0 group-hover:opacity-100 transition"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setMoveTarget(file)}
                      className="p-1 text-slate-400 hover:text-white rounded transition"
                      title="Move to Folder"
                    >
                      <FolderInput className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setRenameTarget(file);
                        setNewName(file.originalName);
                      }}
                      className="p-1 text-slate-400 hover:text-white rounded transition"
                      title="Rename"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <a
                      href={file.downloadUrl}
                      download={file.originalName}
                      className="p-1 text-slate-400 hover:text-white rounded transition"
                      title="Download"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                    <button
                      onClick={() => setDeleteTarget(file)}
                      className="p-1 text-slate-400 hover:text-rose-400 rounded transition"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* LIST VIEW */
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <div className="col-span-6 sm:col-span-5">Name</div>
              <div className="hidden sm:block sm:col-span-2">Type</div>
              <div className="col-span-3 sm:col-span-2">Size</div>
              <div className="hidden md:block md:col-span-2">Date Added</div>
              <div className="col-span-3 sm:col-span-1 text-right">Actions</div>
            </div>

            <div className="divide-y divide-slate-800/60">
              {files.map((file) => (
                <div
                  key={file.id}
                  onClick={() => handleFileClick(file)}
                  className="grid grid-cols-12 gap-4 px-4 py-3 items-center text-xs text-slate-300 hover:bg-slate-800/50 cursor-pointer transition"
                >
                  <div className="col-span-6 sm:col-span-5 flex items-center gap-3 min-w-0">
                    <div className="shrink-0">{renderFileIcon(file)}</div>
                    <span className="font-semibold text-white truncate">{file.originalName}</span>
                  </div>

                  <div className="hidden sm:block sm:col-span-2">
                    <FileTypeBadge type={file.fileType} />
                  </div>

                  <div className="col-span-3 sm:col-span-2 font-mono text-slate-400">
                    {formatBytes(file.size)}
                  </div>

                  <div className="hidden md:block md:col-span-2 text-slate-400">
                    {formatDate(file.createdAt)}
                  </div>

                  <div
                    className="col-span-3 sm:col-span-1 flex items-center justify-end gap-1.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => handleToggleFavorite(file.id)}
                      className={`p-1 rounded transition ${
                        file.isFavorite ? 'text-rose-400' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${file.isFavorite ? 'fill-current' : ''}`} />
                    </button>
                    <button
                      onClick={() => setMoveTarget(file)}
                      className="p-1 text-slate-400 hover:text-white rounded transition"
                      title="Move"
                    >
                      <FolderInput className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setRenameTarget(file);
                        setNewName(file.originalName);
                      }}
                      className="p-1 text-slate-400 hover:text-white rounded transition"
                      title="Rename"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(file)}
                      className="p-1 text-slate-400 hover:text-rose-400 rounded transition"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* File Preview Modal */}
      {previewFile && (
        <FilePreviewModal
          file={previewFile}
          isOpen={!!previewFile}
          onClose={() => setPreviewFile(null)}
        />
      )}

      {/* Move File Modal */}
      {moveTarget && (
        <MoveFileModal
          file={moveTarget}
          isOpen={!!moveTarget}
          onClose={() => setMoveTarget(null)}
          onMoved={() => fetchFilesAndFolders()}
        />
      )}

      {/* Create Folder Modal */}
      <Modal
        isOpen={isCreateFolderOpen}
        onClose={() => setIsCreateFolderOpen(false)}
        title="Create New Folder"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreateFolder} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Folder Name</label>
            <input
              type="text"
              required
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="e.g. Work Documents"
              className="w-full bg-slate-950 border border-slate-800 focus:border-brand-500 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsCreateFolderOpen(false)}
              className="px-4 py-2 text-sm text-slate-300 hover:text-white bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-500 rounded-xl shadow-lg shadow-brand-600/20"
            >
              Create Folder
            </button>
          </div>
        </form>
      </Modal>

      {/* Rename Folder Modal */}
      <Modal
        isOpen={!!renameFolderTarget}
        onClose={() => setRenameFolderTarget(null)}
        title="Rename Folder"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleRenameFolder} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">New Folder Name</label>
            <input
              type="text"
              required
              value={newFolderRename}
              onChange={(e) => setNewFolderRename(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-brand-500 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setRenameFolderTarget(null)}
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

      {/* Delete Folder Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteFolderTarget}
        onClose={() => setDeleteFolderTarget(null)}
        onConfirm={handleDeleteFolderConfirm}
        title="Delete Folder"
        message={`Delete "${deleteFolderTarget?.name}"? The files inside will be unassigned to the root library.`}
        confirmText="Delete Folder"
        isDangerous
      />

      {/* Rename File Modal */}
      <Modal
        isOpen={!!renameTarget}
        onClose={() => setRenameTarget(null)}
        title="Rename File"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleRenameFile} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">New File Name</label>
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

      {/* Delete File Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteFileConfirm}
        title="Move File to Trash"
        message={`Move "${deleteTarget?.originalName}" to trash?`}
        confirmText="Move to Trash"
        isDangerous
      />
    </div>
  );
};
