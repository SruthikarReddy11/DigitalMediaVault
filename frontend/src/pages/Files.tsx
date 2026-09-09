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
  Share2,
  Play,
} from 'lucide-react';
import { filesApi } from '../services/filesApi';
import { foldersApi } from '../services/foldersApi';
import { favoritesApi } from '../services/favoritesApi';
import { FileItem, FolderItem, FileType, MusicItem } from '../types';
import { formatBytes, formatDate, fileItemToMusicItem } from '../utils/formatters';
import { getMediaUrl } from '../services/api';
import { FileTypeBadge } from '../components/common/Badge';
import { FilePreviewModal } from '../components/files/FilePreviewModal';
import { MoveFileModal } from '../components/files/MoveFileModal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { Modal } from '../components/common/Modal';
import { EmptyState } from '../components/common/EmptyState';
import { ShareModal } from '../components/share/ShareModal';
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
  const [shareFileTarget, setShareFileTarget] = useState<FileItem | null>(null);
  const [shareFolderTarget, setShareFolderTarget] = useState<FolderItem | null>(null);
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
    if (file.fileType === 'AUDIO') {
      const musicItem = fileItemToMusicItem(file);
      const audioQueue: MusicItem[] = files
        .filter((f) => f.fileType === 'AUDIO')
        .map((f) => fileItemToMusicItem(f));

      playSongNow(musicItem, audioQueue.length > 0 ? audioQueue : undefined);
      success(`Playing "${musicItem.title}"`);
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
      {/* Top Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-cyan-950/30 border border-white/[0.08] p-6 sm:p-8 shadow-2xl">
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider">
              <Sparkles className="w-4 h-4 animate-pulse" />
              <span>Universal Cloud Drive</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight flex items-center gap-3">
              Files & Workspaces
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed font-medium">
              Store, preview, organize, and manage files in structured folders with multi-device synchronization.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0 self-start md:self-center">
            <button
              onClick={() => setIsCreateFolderOpen(true)}
              className="group flex items-center gap-2.5 px-5 py-2.5 bg-slate-900/80 hover:bg-slate-800 text-slate-200 hover:text-white text-xs sm:text-sm font-bold rounded-2xl transition-all duration-200 border border-white/10 hover:border-cyan-500/40 shadow-lg backdrop-blur-md active:scale-95 whitespace-nowrap cursor-pointer"
            >
              <div className="p-1 rounded-lg bg-cyan-500/15 group-hover:scale-110 transition-transform duration-300">
                <FolderPlus className="w-4 h-4 text-cyan-400" />
              </div>
              <span>New Folder</span>
            </button>
            <button
              onClick={openUpload}
              className="group relative overflow-hidden flex items-center gap-2.5 px-5 py-2.5 bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs sm:text-sm font-black rounded-2xl transition-all duration-200 shadow-xl shadow-cyan-600/25 hover:shadow-cyan-600/40 border border-white/20 active:scale-95 whitespace-nowrap cursor-pointer"
            >
              <div className="p-1 rounded-lg bg-white/20 group-hover:rotate-12 transition-transform duration-300">
                <UploadCloud className="w-4 h-4 text-white" />
              </div>
              <span>Upload Files</span>
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Breadcrumb Bar */}
      <div className="flex items-center gap-1.5 p-3 bg-slate-900/70 border border-white/[0.08] rounded-2xl text-xs font-semibold overflow-x-auto backdrop-blur-md">
        {breadcrumbs.map((crumb, idx) => {
          const isLast = idx === breadcrumbs.length - 1;
          return (
            <React.Fragment key={`${crumb.id}-${idx}`}>
              <button
                onClick={() => {
                  if (crumb.id === null) handleNavigateFolder(null);
                  else handleNavigateFolder({ id: crumb.id, name: crumb.name } as FolderItem);
                }}
                className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap ${
                  isLast
                    ? 'text-white bg-slate-800 border border-white/10 shadow-sm'
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
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 sm:p-4 bg-slate-900/70 border border-white/[0.08] rounded-2xl backdrop-blur-md">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search files by name or extension..."
            className="w-full bg-slate-950/80 border border-white/[0.08] focus:border-cyan-500 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 transition"
          />
        </div>

        {/* Filter Type Pills */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* File Type filter */}
          <select
            value={fileTypeFilter || ''}
            onChange={(e) => setFileTypeFilter((e.target.value as FileType) || undefined)}
            className="bg-slate-950/80 border border-white/[0.08] text-xs font-medium text-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-500 transition cursor-pointer"
          >
            <option value="">All File Types</option>
            <option value="IMAGE">Photos & Art</option>
            <option value="VIDEO">Videos & Cinema</option>
            <option value="AUDIO">Lossless Audio</option>
            <option value="PDF">PDF Documents</option>
            <option value="DOCUMENT">Text & Docs</option>
            <option value="SPREADSHEET">Spreadsheets</option>
            <option value="ARCHIVE">Zip Archives</option>
            <option value="OTHER">Other</option>
          </select>

          {/* Favorites */}
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

          {/* Grid / List View Toggle */}
          <div className="flex items-center bg-slate-950/80 border border-white/[0.08] rounded-xl p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'grid' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
              title="Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'list' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
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
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <FolderClosed className="w-3.5 h-3.5 text-cyan-400" />
            <span>Folders ({folders.length})</span>
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {folders.map((f) => (
              <div
                key={f.id}
                onClick={() => handleNavigateFolder(f)}
                className="group relative p-3.5 bg-slate-900/60 backdrop-blur-xl border border-white/[0.08] hover:border-cyan-500/50 hover:bg-slate-800/60 rounded-2xl cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_25px_rgba(6,182,212,0.12)] flex items-center justify-between"
              >
                <div className="flex items-center gap-3 truncate min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/10 border border-cyan-500/25 text-cyan-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <FolderClosed className="w-5 h-5" />
                  </div>
                  <div className="truncate min-w-0">
                    <p className="text-xs font-bold text-white group-hover:text-cyan-300 transition truncate">
                      {f.name}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium">
                      {f._count?.files ?? 0} files
                    </p>
                  </div>
                </div>

                {/* Folder options */}
                <div
                  className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition bg-slate-950/80 rounded-lg p-0.5 border border-white/[0.08]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => setShareFolderTarget(f)}
                    className="p-1 text-slate-400 hover:text-brand-400 transition rounded hover:bg-white/[0.08]"
                    title="Share Folder"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      setRenameFolderTarget(f);
                      setNewFolderRename(f.name);
                    }}
                    className="p-1 text-slate-400 hover:text-white transition rounded hover:bg-white/[0.08]"
                    title="Rename Folder"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteFolderTarget(f)}
                    className="p-1 text-slate-400 hover:text-rose-400 transition rounded hover:bg-white/[0.08]"
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
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <span>Files ({files.length})</span>
        </h3>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
              <div key={i} className="h-44 bg-slate-900/60 border border-white/[0.08] rounded-2xl animate-pulse" />
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
                className="group relative bg-slate-900/60 backdrop-blur-xl border border-white/[0.08] hover:border-cyan-500/50 hover:bg-slate-800/60 rounded-2xl p-3.5 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(6,182,212,0.12)] flex flex-col justify-between"
              >
                {/* Thumbnail / Icon area */}
                <div className="aspect-video w-full rounded-xl bg-slate-950/80 flex items-center justify-center overflow-hidden mb-3 border border-white/[0.06] relative group-hover:border-cyan-500/30 transition">
                  {file.fileType === 'IMAGE' ? (
                    <img
                      src={getMediaUrl(file.streamUrl)}
                      alt={file.originalName}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                  ) : file.fileType === 'AUDIO' && file.music?.coverUrl ? (
                    <img src={file.music.coverUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="p-3">
                      {renderFileIcon(file)}
                    </div>
                  )}

                  {/* Audio quick play overlay */}
                  {file.fileType === 'AUDIO' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-10 h-10 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/30 transition transform hover:scale-110">
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      </div>
                    </div>
                  )}

                  {/* Favorite indicator badge */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleFavorite(file.id);
                    }}
                    className={`absolute top-2 right-2 p-1.5 rounded-xl backdrop-blur-md transition shadow-md ${
                      file.isFavorite
                        ? 'bg-rose-500/90 text-white'
                        : 'opacity-0 group-hover:opacity-100 bg-slate-950/70 text-slate-300 hover:text-white border border-white/[0.1]'
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${file.isFavorite ? 'fill-current' : ''}`} />
                  </button>
                </div>

                {/* File details */}
                <div>
                  <p className="text-xs font-semibold text-white group-hover:text-cyan-300 transition truncate leading-snug">
                    {file.originalName}
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1.5">
                    <span className="font-mono text-[10px]">{formatBytes(file.size)}</span>
                    <FileTypeBadge type={file.fileType} />
                  </div>
                </div>

                {/* Hover Action Strip */}
                <div
                  className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between opacity-0 group-hover:opacity-100 transition"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-1">
                    {file.fileType === 'AUDIO' && (
                      <button
                        onClick={() => handleFileClick(file)}
                        className="p-1.5 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 rounded-lg transition"
                        title="Play in Music Player"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </button>
                    )}
                    <button
                      onClick={() => setShareFileTarget(file)}
                      className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition"
                      title="Share Link"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setMoveTarget(file)}
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-white/[0.08] rounded-lg transition"
                      title="Move to Folder"
                    >
                      <FolderInput className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setRenameTarget(file);
                        setNewName(file.originalName);
                      }}
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-white/[0.08] rounded-lg transition"
                      title="Rename"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <a
                      href={getMediaUrl(file.downloadUrl)}
                      download={file.originalName}
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-white/[0.08] rounded-lg transition"
                      title="Download"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                    <button
                      onClick={() => setDeleteTarget(file)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
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
          <div className="bg-slate-900/60 backdrop-blur-xl border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl">
            <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-white/[0.08] bg-slate-950/40 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <div className="col-span-6 sm:col-span-5">Name</div>
              <div className="hidden sm:block sm:col-span-2">Type</div>
              <div className="col-span-3 sm:col-span-2">Size</div>
              <div className="hidden md:block md:col-span-2">Date Added</div>
              <div className="col-span-3 sm:col-span-1 text-right">Actions</div>
            </div>

            <div className="divide-y divide-white/[0.04]">
              {files.map((file) => (
                <div
                  key={file.id}
                  onClick={() => handleFileClick(file)}
                  className="grid grid-cols-12 gap-4 px-4 py-3.5 items-center text-xs text-slate-300 hover:bg-white/[0.03] cursor-pointer transition-colors duration-150"
                >
                  <div className="col-span-6 sm:col-span-5 flex items-center gap-3 min-w-0">
                    <div className="shrink-0">{renderFileIcon(file)}</div>
                    <span className="font-semibold text-white truncate group-hover:text-cyan-300">{file.originalName}</span>
                  </div>

                  <div className="hidden sm:block sm:col-span-2">
                    <FileTypeBadge type={file.fileType} />
                  </div>

                  <div className="col-span-3 sm:col-span-2 font-mono text-[11px] text-slate-400">
                    {formatBytes(file.size)}
                  </div>

                  <div className="hidden md:block md:col-span-2 text-slate-400 text-[11px]">
                    {formatDate(file.createdAt)}
                  </div>

                  <div
                    className="col-span-3 sm:col-span-1 flex items-center justify-end gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {file.fileType === 'AUDIO' && (
                      <button
                        onClick={() => handleFileClick(file)}
                        className="p-1.5 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 rounded-lg transition"
                        title="Play Audio"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </button>
                    )}
                    <button
                      onClick={() => setShareFileTarget(file)}
                      className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition"
                      title="Share Link"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleToggleFavorite(file.id)}
                      className={`p-1.5 rounded-lg transition ${
                        file.isFavorite ? 'text-rose-400 bg-rose-500/10' : 'text-slate-400 hover:text-white hover:bg-white/[0.08]'
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${file.isFavorite ? 'fill-current' : ''}`} />
                    </button>
                    <button
                      onClick={() => setMoveTarget(file)}
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-white/[0.08] rounded-lg transition"
                      title="Move"
                    >
                      <FolderInput className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setRenameTarget(file);
                        setNewName(file.originalName);
                      }}
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-white/[0.08] rounded-lg transition"
                      title="Rename"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(file)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
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
              className="w-full bg-slate-950/80 border border-white/[0.1] focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 transition"
            />
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={() => setIsCreateFolderOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-xl border border-white/[0.08] transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-xl shadow-lg shadow-cyan-600/25 border border-cyan-400/30 transition active:scale-95"
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
              className="w-full bg-slate-950/80 border border-white/[0.1] focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 transition"
            />
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={() => setRenameFolderTarget(null)}
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-xl border border-white/[0.08] transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-xl shadow-lg shadow-cyan-600/25 border border-cyan-400/30 transition active:scale-95"
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
              className="w-full bg-slate-950/80 border border-white/[0.1] focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 transition"
            />
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={() => setRenameTarget(null)}
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-xl border border-white/[0.08] transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-xl shadow-lg shadow-cyan-600/25 border border-cyan-400/30 transition active:scale-95"
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

      {/* Share File / Folder Modal */}
      <ShareModal
        isOpen={!!shareFileTarget || !!shareFolderTarget}
        onClose={() => {
          setShareFileTarget(null);
          setShareFolderTarget(null);
        }}
        file={shareFileTarget}
        folder={shareFolderTarget}
      />
    </div>
  );
};
