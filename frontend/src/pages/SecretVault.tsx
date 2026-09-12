import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  KeyRound,
  Lock,
  Unlock,
  Plus,
  Search,
  FolderClosed,
  FolderOpen,
  Globe,
  ExternalLink,
  Copy,
  Check,
  Trash2,
  Edit2,
  ChevronLeft,
  ShieldCheck,
  Bookmark,
  RefreshCw,
  Image as ImageIcon,
  Video as VideoIcon,
  Music as MusicIcon,
  FileText,
  Download,
  Eye,
  Play,
  Sparkles,
  HardDrive,
  File as FileIcon,
  UploadCloud,
  FileSpreadsheet,
  Archive,
  Film,
  ZoomIn,
  CheckCircle2,
} from 'lucide-react';
import { VaultFolder, VaultCell, FileItem } from '../types';
import { vaultApi } from '../services/vaultApi';
import { useToast } from '../contexts/ToastContext';
import { useAudioPlayer } from '../contexts/AudioPlayerContext';
import { VaultGateModal } from '../components/vault/VaultGateModal';
import { FolderPasswordModal } from '../components/vault/FolderPasswordModal';
import { CreateFolderModal } from '../components/vault/CreateFolderModal';
import { CellModal } from '../components/vault/CellModal';
import { ViewCellModal } from '../components/vault/ViewCellModal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { ImageLightbox } from '../components/gallery/ImageLightbox';
import { VideoPlayerModal } from '../components/video/VideoPlayerModal';
import { formatBytes, formatDate } from '../utils/formatters';
import { useNavigate } from 'react-router-dom';

export const SecretVault: React.FC = () => {
  const navigate = useNavigate();
  const { success, error } = useToast();
  const { playSongNow } = useAudioPlayer();

  // 1. Vault Authentication Gate (Google Authenticator)
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isGateOpen, setIsGateOpen] = useState(true);

  // 2. Folders & Cells State
  const [folders, setFolders] = useState<VaultFolder[]>([]);
  const [isLoadingFolders, setIsLoadingFolders] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // 3. Active Folder View State
  const [activeFolder, setActiveFolder] = useState<VaultFolder | null>(null);
  const [activeCells, setActiveCells] = useState<VaultCell[]>([]);
  const [activeFiles, setActiveFiles] = useState<FileItem[]>([]);
  const [isFolderLocked, setIsFolderLocked] = useState(true);

  // 4. Folder Tabs & Filter State
  const [activeTab, setActiveTab] = useState<'files' | 'links'>('files');
  const [fileTypeFilter, setFileTypeFilter] = useState<'ALL' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOC'>('ALL');
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 5. Modals State
  const [passwordTargetFolder, setPasswordTargetFolder] = useState<VaultFolder | null>(null);
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [cellModalTarget, setCellModalTarget] = useState<{ isOpen: boolean; cell?: VaultCell | null }>({
    isOpen: false,
    cell: null,
  });
  const [deleteFolderTarget, setDeleteFolderTarget] = useState<VaultFolder | null>(null);
  const [deleteCellTarget, setDeleteCellTarget] = useState<VaultCell | null>(null);
  const [deleteFileTarget, setDeleteFileTarget] = useState<FileItem | null>(null);

  // 6. Media Preview State (Lightbox, Video Player, Cell Detail)
  const [viewingCell, setViewingCell] = useState<VaultCell | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [activeVideo, setActiveVideo] = useState<FileItem | null>(null);

  const activeFolderRef = useRef(activeFolder);
  useEffect(() => {
    activeFolderRef.current = activeFolder;
  }, [activeFolder]);

  const isUnlockedRef = useRef(isUnlocked);
  useEffect(() => {
    isUnlockedRef.current = isUnlocked;
  }, [isUnlocked]);

  // Lock Entire Vault Space (Google Authenticator Gate) - called on manual Lock Space or Route Exit
  const handleLockVault = useCallback(() => {
    vaultApi.lockVault().catch(() => {});
    setIsUnlocked(false);
    setIsGateOpen(true);
    setActiveFolder(null);
    setActiveCells([]);
    setActiveFiles([]);
    setIsFolderLocked(true);
    setPasswordTargetFolder(null);
    setViewingCell(null);
    setLightboxIndex(null);
    setActiveVideo(null);
  }, []);

  // When unmounting or navigating away from SecretVault page, lock the vault session
  useEffect(() => {
    return () => {
      if (isUnlockedRef.current) {
        vaultApi.lockVault().catch(() => {});
      }
    };
  }, []);

  // Lock Active Folder only - called on tab change so that returning asks for that folder's password, not the space authenticator code
  const handleLockActiveFolder = useCallback(() => {
    if (activeFolderRef.current) {
      setActiveFolder(null);
      setActiveCells([]);
      setActiveFiles([]);
      setIsFolderLocked(true);
      setPasswordTargetFolder(null);
      setViewingCell(null);
      setLightboxIndex(null);
      setActiveVideo(null);
    }
  }, []);

  useEffect(() => {
    // When changing browser tabs or minimizing window:
    // Lock active folder so returning asks for that folder's password (not space authenticator)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleLockActiveFolder();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [handleLockActiveFolder]);

  // Load Folders once Vault is unlocked
  const loadFolders = async () => {
    setIsLoadingFolders(true);
    try {
      const data = await vaultApi.getFolders();
      setFolders(data);
    } catch (err: any) {
      error(err.response?.data?.error?.message || 'Failed to load folders.');
    } finally {
      setIsLoadingFolders(false);
    }
  };

  useEffect(() => {
    if (isUnlocked) {
      loadFolders();
    }
  }, [isUnlocked]);

  // Handle Gate Unlock Success
  const handleGateUnlock = () => {
    setIsUnlocked(true);
    setIsGateOpen(false);
  };

  // Handle Opening a Folder (Prompts password)
  const handleFolderClick = (folder: VaultFolder) => {
    setPasswordTargetFolder(folder);
  };

  // Handle Folder Password Success
  const handleFolderUnlocked = (data: { folder: VaultFolder; cells: VaultCell[]; files?: FileItem[] }) => {
    setPasswordTargetFolder(null);
    setActiveFolder(data.folder);
    setActiveCells(data.cells || []);
    setActiveFiles(data.files || []);
    setIsFolderLocked(false);
    if ((data.files?.length || 0) > 0 || (data.cells?.length || 0) === 0) {
      setActiveTab('files');
    } else {
      setActiveTab('links');
    }
  };

  // Handle Close Folder (Back to folders list)
  const handleBackToFolders = () => {
    setActiveFolder(null);
    setActiveCells([]);
    setActiveFiles([]);
    setIsFolderLocked(true);
    setViewingCell(null);
    setLightboxIndex(null);
    setActiveVideo(null);
    loadFolders(); // Refresh file & cell counts
  };

  // Cell Saved Callback
  const handleCellSaved = (savedCell: VaultCell) => {
    setActiveCells((prev) => {
      const idx = prev.findIndex((c) => c.id === savedCell.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = savedCell;
        return updated;
      }
      return [savedCell, ...prev];
    });
    setViewingCell((prev) => (prev?.id === savedCell.id ? savedCell : prev));
  };

  // Delete Cell Handler
  const handleDeleteCellConfirm = async () => {
    if (!deleteCellTarget) return;
    try {
      await vaultApi.deleteCell(deleteCellTarget.id);
      setActiveCells((prev) => prev.filter((c) => c.id !== deleteCellTarget.id));
      success('Link deleted successfully.');
      setDeleteCellTarget(null);
      loadFolders();
    } catch (err: any) {
      error(err.message || 'Failed to delete link.');
    }
  };

  // Delete Folder Handler
  const handleDeleteFolderConfirm = async () => {
    if (!deleteFolderTarget) return;
    try {
      await vaultApi.deleteFolder(deleteFolderTarget.id);
      setFolders((prev) => prev.filter((f) => f.id !== deleteFolderTarget.id));
      success(`Folder "${deleteFolderTarget.name}" deleted.`);
      setDeleteFolderTarget(null);
      if (activeFolder?.id === deleteFolderTarget.id) {
        handleBackToFolders();
      }
    } catch (err: any) {
      error(err.message || 'Failed to delete folder.');
    }
  };

  // Delete Secret File Handler
  const handleDeleteFileConfirm = async () => {
    if (!deleteFileTarget) return;
    try {
      await vaultApi.deleteFile(deleteFileTarget.id);
      setActiveFiles((prev) => prev.filter((f) => f.id !== deleteFileTarget.id));
      success(`Private file "${deleteFileTarget.originalName}" permanently deleted.`);
      setDeleteFileTarget(null);
      loadFolders();
    } catch (err: any) {
      error(err.response?.data?.error?.message || err.message || 'Failed to delete private file.');
    }
  };

  // File Upload Handler (via input)
  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !activeFolder) return;
    uploadSelectedFiles(Array.from(files));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Common Upload Routine
  const uploadSelectedFiles = async (fileList: File[]) => {
    if (!activeFolder || fileList.length === 0) return;
    setIsUploadingFiles(true);
    try {
      const uploaded = await vaultApi.uploadFiles(activeFolder.id, fileList);
      setActiveFiles((prev) => [...uploaded, ...prev]);
      success(`${uploaded.length} private ${uploaded.length === 1 ? 'file' : 'files'} saved securely in Secret Vault.`);
      loadFolders();
    } catch (err: any) {
      error(err.response?.data?.error?.message || err.message || 'Failed to upload private files.');
    } finally {
      setIsUploadingFiles(false);
    }
  };

  // Drag & Drop Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      uploadSelectedFiles(Array.from(e.dataTransfer.files));
    }
  };

  const filteredFolders = useMemo(() => {
    if (!searchTerm) return folders;
    const term = searchTerm.toLowerCase();
    return folders.filter(
      (f) =>
        f.name.toLowerCase().includes(term) ||
        (f.description && f.description.toLowerCase().includes(term))
    );
  }, [folders, searchTerm]);

  const imageFiles = useMemo(() => {
    return activeFiles.filter((f) => f.fileType === 'IMAGE');
  }, [activeFiles]);

  const openLightboxForFile = (file: FileItem) => {
    const idx = imageFiles.findIndex((f) => f.id === file.id);
    setLightboxIndex(idx >= 0 ? idx : 0);
  };

  const counts = useMemo(() => {
    return {
      all: activeFiles.length,
      images: activeFiles.filter((f) => f.fileType === 'IMAGE').length,
      videos: activeFiles.filter((f) => f.fileType === 'VIDEO').length,
      audio: activeFiles.filter((f) => f.fileType === 'AUDIO').length,
      docs: activeFiles.filter((f) => f.fileType !== 'IMAGE' && f.fileType !== 'VIDEO' && f.fileType !== 'AUDIO').length,
    };
  }, [activeFiles]);

  const filteredFiles = useMemo(() => {
    return activeFiles.filter((file) => {
      if (fileTypeFilter === 'IMAGE' && file.fileType !== 'IMAGE') return false;
      if (fileTypeFilter === 'VIDEO' && file.fileType !== 'VIDEO') return false;
      if (fileTypeFilter === 'AUDIO' && file.fileType !== 'AUDIO') return false;
      if (fileTypeFilter === 'DOC' && (file.fileType === 'IMAGE' || file.fileType === 'VIDEO' || file.fileType === 'AUDIO')) return false;

      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return file.originalName.toLowerCase().includes(term);
      }
      return true;
    });
  }, [activeFiles, fileTypeFilter, searchTerm]);

  const filteredCells = useMemo(() => {
    if (!searchTerm) return activeCells;
    const term = searchTerm.toLowerCase();
    return activeCells.filter(
      (cell) =>
        cell.title.toLowerCase().includes(term) ||
        cell.url.toLowerCase().includes(term) ||
        (cell.notes && cell.notes.toLowerCase().includes(term))
    );
  }, [activeCells, searchTerm]);

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'IMAGE':
        return <ImageIcon className="w-5 h-5 text-emerald-400" />;
      case 'VIDEO':
        return <Film className="w-5 h-5 text-purple-400" />;
      case 'AUDIO':
        return <MusicIcon className="w-5 h-5 text-amber-400" />;
      default:
        return <FileText className="w-5 h-5 text-blue-400" />;
    }
  };

  const getDomain = (url: string) => {
    try {
      const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
      return parsed.hostname.replace(/^www\./, '');
    } catch {
      return url;
    }
  };

  return (
    <div className="space-y-6">
      {/* Hidden File Input for uploading */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFilesSelected}
        multiple
        className="hidden"
      />

      {/* 1. Google Authenticator Gate Modal */}
      {!isUnlocked && (
        <VaultGateModal
          isOpen={isGateOpen}
          onUnlock={handleGateUnlock}
          onClose={() => {
            if (window.history.length > 1) {
              navigate(-1);
            } else {
              navigate('/files');
            }
          }}
        />
      )}

      {/* 2. Folder Password Modal */}
      {passwordTargetFolder && (
        <FolderPasswordModal
          folder={passwordTargetFolder}
          isOpen={!!passwordTargetFolder}
          onClose={() => setPasswordTargetFolder(null)}
          onUnlocked={handleFolderUnlocked}
        />
      )}

      {/* 3. Create Folder Modal */}
      <CreateFolderModal
        isOpen={isCreateFolderOpen}
        onClose={() => setIsCreateFolderOpen(false)}
        onCreated={(newFolder) => setFolders((prev) => [newFolder, ...prev])}
      />

      {/* 4. Add / Edit Cell Modal */}
      {activeFolder && cellModalTarget.isOpen && (
        <CellModal
          folderId={activeFolder.id}
          cell={cellModalTarget.cell}
          isOpen={cellModalTarget.isOpen}
          onClose={() => setCellModalTarget({ isOpen: false, cell: null })}
          onSaved={handleCellSaved}
        />
      )}

      {/* 5. View Cell Modal (Opens when user clicks on a cell to view link) */}
      {viewingCell && (
        <ViewCellModal
          cell={viewingCell}
          isOpen={!!viewingCell}
          onClose={() => setViewingCell(null)}
          onEdit={(cell) => setCellModalTarget({ isOpen: true, cell })}
          onDelete={(cell) => setDeleteCellTarget(cell)}
        />
      )}

      {/* 6. Image Lightbox for Private Photos */}
      {lightboxIndex !== null && imageFiles.length > 0 && (
        <ImageLightbox
          images={imageFiles}
          currentIndex={lightboxIndex}
          isOpen={lightboxIndex !== null}
          onClose={() => setLightboxIndex(null)}
          onNavigate={(idx) => setLightboxIndex(idx)}
          onDelete={(fileId) => {
            const f = activeFiles.find((x) => x.id === fileId);
            if (f) {
              setDeleteFileTarget(f);
              setLightboxIndex(null);
            }
          }}
        />
      )}

      {/* 7. Video Player Modal for Private Videos */}
      {activeVideo && (
        <VideoPlayerModal
          video={activeVideo}
          isOpen={!!activeVideo}
          onClose={() => setActiveVideo(null)}
        />
      )}

      {/* 8. Delete Confirmations */}
      <ConfirmDialog
        isOpen={!!deleteFolderTarget}
        onClose={() => setDeleteFolderTarget(null)}
        onConfirm={handleDeleteFolderConfirm}
        title="Delete Protected Folder"
        message={`Are you sure you want to delete "${deleteFolderTarget?.name}"? All saved private files, media, and links inside will be permanently erased.`}
        confirmText="Delete Folder"
        isDangerous
      />

      <ConfirmDialog
        isOpen={!!deleteCellTarget}
        onClose={() => setDeleteCellTarget(null)}
        onConfirm={handleDeleteCellConfirm}
        title="Delete Saved Link"
        message={`Delete link "${deleteCellTarget?.title}"? This cannot be undone.`}
        confirmText="Delete Link"
        isDangerous
      />

      <ConfirmDialog
        isOpen={!!deleteFileTarget}
        onClose={() => setDeleteFileTarget(null)}
        onConfirm={handleDeleteFileConfirm}
        title="Permanently Delete Private File"
        message={`Are you sure you want to permanently delete "${deleteFileTarget?.originalName}"? This private file will be completely erased from disk and database.`}
        confirmText="Permanently Delete"
        isDangerous
      />

      {/* Main Vault Content */}
      {isUnlocked && (
        <div className="space-y-6">
          {/* Top Vault Navigation Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-5 bg-slate-900/90 border border-slate-800 backdrop-blur-xl rounded-3xl shadow-xl">
            <div className="flex items-center gap-3">
              {activeFolder ? (
                <button
                  onClick={handleBackToFolders}
                  className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1.5 text-xs font-semibold"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>All Folders</span>
                </button>
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shadow-lg shadow-amber-500/10">
                  <KeyRound className="w-6 h-6" />
                </div>
              )}

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                    {activeFolder ? activeFolder.name : 'Secret Vault Space'}
                  </h1>
                  <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-semibold text-emerald-400">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    2FA Authenticated
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {activeFolder
                    ? `${activeFiles.length} private ${activeFiles.length === 1 ? 'file' : 'files'} • ${activeCells.length} ${activeCells.length === 1 ? 'link' : 'links'} inside password-protected folder`
                    : 'End-to-end encrypted private vault for secret photos, videos, files, and bookmarks'}
                </p>
              </div>
            </div>

            {/* Actions: Add Files / Add Link & Lock Vault */}
            <div className="flex flex-wrap items-center gap-3 shrink-0 self-start sm:self-center">
              {activeFolder ? (
                <>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingFiles}
                    className="group relative overflow-hidden flex items-center gap-2 px-4 sm:px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs sm:text-sm font-black rounded-2xl transition-all duration-200 shadow-xl shadow-emerald-600/25 hover:shadow-emerald-600/40 border border-white/20 active:scale-95 whitespace-nowrap cursor-pointer disabled:opacity-50"
                  >
                    <div className="p-1 rounded-lg bg-white/20 group-hover:scale-110 transition-transform duration-300">
                      <UploadCloud className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span>{isUploadingFiles ? 'Uploading...' : 'Save Private Files'}</span>
                  </button>

                  <button
                    onClick={() => setCellModalTarget({ isOpen: true, cell: null })}
                    className="group relative overflow-hidden flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-bold rounded-2xl transition-all duration-200 border border-slate-700 active:scale-95 whitespace-nowrap cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-slate-300" />
                    <span>Add Link Cell</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsCreateFolderOpen(true)}
                  className="group relative overflow-hidden flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-black rounded-2xl transition-all duration-200 shadow-xl shadow-brand-600/25 hover:shadow-brand-600/40 border border-white/20 active:scale-95 whitespace-nowrap cursor-pointer"
                >
                  <div className="p-1 rounded-lg bg-white/20 group-hover:rotate-90 transition-transform duration-300">
                    <Plus className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span>New Protected Folder</span>
                </button>
              )}

              <button
                onClick={handleLockVault}
                className="group flex items-center gap-2 px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 border border-rose-500/30 text-xs sm:text-sm font-bold rounded-2xl transition-all duration-200 backdrop-blur-md active:scale-95 whitespace-nowrap cursor-pointer"
                title="Exit and Lock Vault Space (requires Google Authenticator to re-open)"
              >
                <div className="p-1 rounded-lg bg-rose-500/20 group-hover:scale-110 transition-transform duration-300">
                  <Lock className="w-3.5 h-3.5 text-rose-300" />
                </div>
                <span>Exit Space</span>
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={activeFolder ? 'Search links in this folder...' : 'Search protected folders...'}
              className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl pl-11 pr-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-brand-500 transition shadow-inner"
            />
          </div>

          {/* VIEW A: Folders Grid (When no folder is selected) */}
          {!activeFolder && (
            <div>
              {isLoadingFolders ? (
                <div className="py-20 flex flex-col items-center justify-center gap-3">
                  <RefreshCw className="w-8 h-8 text-brand-400 animate-spin" />
                  <p className="text-sm text-slate-400">Loading protected folders...</p>
                </div>
              ) : filteredFolders.length === 0 ? (
                <div className="py-16 text-center space-y-4 bg-slate-900/40 border border-slate-800/80 rounded-3xl p-8">
                  <div className="w-16 h-16 rounded-3xl bg-slate-800 flex items-center justify-center text-slate-400 mx-auto">
                    <FolderClosed className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-white">
                      {searchTerm ? 'No matching folders found' : 'No protected folders yet'}
                    </h3>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      Create your first password-protected folder to start organizing and storing website links.
                    </p>
                  </div>
                  {!searchTerm && (
                    <button
                      onClick={() => setIsCreateFolderOpen(true)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs rounded-xl transition shadow-lg shadow-brand-600/25"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Create First Folder</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredFolders.map((folder) => (
                    <div
                      key={folder.id}
                      onClick={() => handleFolderClick(folder)}
                      className="group relative bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-3xl p-5 cursor-pointer transition-all duration-200 hover:-translate-y-1 shadow-lg space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <div
                          className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md transition-transform group-hover:scale-105"
                          style={{ backgroundColor: folder.color || '#3b82f6' }}
                        >
                          <FolderClosed className="w-6 h-6" />
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-950/80 border border-slate-800 text-[10px] font-semibold text-amber-400">
                            <Lock className="w-3 h-3" />
                            <span>Protected</span>
                          </span>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteFolderTarget(folder);
                            }}
                            className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
                            title="Delete folder"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <h3 className="font-bold text-white text-base group-hover:text-brand-300 transition truncate">
                          {folder.name}
                        </h3>
                        <p className="text-xs text-slate-400 line-clamp-1">
                          {folder.description || 'Encrypted private vault folder'}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1 font-medium text-emerald-400">
                            <HardDrive className="w-3.5 h-3.5" />
                            {folder.fileCount || 0} {(folder.fileCount || 0) === 1 ? 'file' : 'files'}
                          </span>
                          <span className="flex items-center gap-1 font-medium text-slate-400">
                            <Bookmark className="w-3.5 h-3.5 text-brand-400" />
                            {folder.cellCount} {folder.cellCount === 1 ? 'link' : 'links'}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 group-hover:text-slate-400 transition">
                          Enter password →
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* VIEW B: Active Unlocked Folder Content */}
          {activeFolder && (
            <div className="space-y-6">
              {/* Privacy Isolation Alert Banner */}
              <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3 text-slate-200">
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-white flex items-center gap-2">
                      <span>Strict Privacy Isolation Active</span>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px]">Encrypted</span>
                    </div>
                    <p className="text-slate-300 mt-0.5 text-[11px] sm:text-xs">
                      All media and files saved in this folder are completely private. They will <strong>NEVER</strong> appear in the public Gallery, Cinema, Hi-Fi Music, Files Drive, Global Search, or Dashboard.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-400 text-[11px] font-mono border border-emerald-500/20 shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Hidden from public vaults</span>
                </div>
              </div>

              {/* Main Tabs: Private Files & Media VS Secret Links */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800">
                  <button
                    onClick={() => setActiveTab('files')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                      activeTab === 'files'
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/20'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <HardDrive className="w-4 h-4" />
                    <span>Private Media & Files</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-black/30 text-emerald-200">
                      {activeFiles.length}
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveTab('links')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                      activeTab === 'links'
                        ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-lg shadow-brand-600/20'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Bookmark className="w-4 h-4" />
                    <span>Encrypted Links & Portals</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-black/30 text-indigo-200">
                      {activeCells.length}
                    </span>
                  </button>
                </div>

                {/* File Sub-Filters (When Files tab is active) */}
                {activeTab === 'files' && (
                  <div className="flex items-center gap-1.5 overflow-x-auto py-1 text-xs">
                    <button
                      onClick={() => setFileTypeFilter('ALL')}
                      className={`px-3 py-1.5 rounded-xl font-semibold transition cursor-pointer ${
                        fileTypeFilter === 'ALL'
                          ? 'bg-slate-800 text-white border border-slate-700'
                          : 'text-slate-400 hover:text-white hover:bg-slate-900'
                      }`}
                    >
                      All ({activeFiles.length})
                    </button>
                    <button
                      onClick={() => setFileTypeFilter('IMAGE')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition cursor-pointer ${
                        fileTypeFilter === 'IMAGE'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'text-slate-400 hover:text-white hover:bg-slate-900'
                      }`}
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>Photos ({counts.images})</span>
                    </button>
                    <button
                      onClick={() => setFileTypeFilter('VIDEO')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition cursor-pointer ${
                        fileTypeFilter === 'VIDEO'
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          : 'text-slate-400 hover:text-white hover:bg-slate-900'
                      }`}
                    >
                      <Film className="w-3.5 h-3.5" />
                      <span>Cinema ({counts.videos})</span>
                    </button>
                    <button
                      onClick={() => setFileTypeFilter('AUDIO')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition cursor-pointer ${
                        fileTypeFilter === 'AUDIO'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'text-slate-400 hover:text-white hover:bg-slate-900'
                      }`}
                    >
                      <MusicIcon className="w-3.5 h-3.5" />
                      <span>Audio ({counts.audio})</span>
                    </button>
                    <button
                      onClick={() => setFileTypeFilter('DOC')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition cursor-pointer ${
                        fileTypeFilter === 'DOC'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : 'text-slate-400 hover:text-white hover:bg-slate-900'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Docs ({counts.docs})</span>
                    </button>
                  </div>
                )}
              </div>

              {/* TAB CONTENT 1: PRIVATE MEDIA & FILES */}
              {activeTab === 'files' && (
                <div className="space-y-6">
                  {/* Drag & Drop Upload Zone */}
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative border-2 border-dashed rounded-3xl p-6 sm:p-8 text-center transition-all duration-200 cursor-pointer ${
                      isDragging
                        ? 'border-emerald-500 bg-emerald-500/10 scale-[1.01]'
                        : 'border-slate-800 hover:border-emerald-500/50 bg-slate-900/40 hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="flex flex-col items-center justify-center gap-2 max-w-md mx-auto pointer-events-none">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/10 mb-1">
                        <UploadCloud className="w-6 h-6" />
                      </div>
                      <h4 className="font-bold text-white text-sm sm:text-base">
                        {isUploadingFiles
                          ? 'Saving private files into Secret Vault...'
                          : 'Click or Drag & Drop to save private files here'}
                      </h4>
                      <p className="text-xs text-slate-400">
                        Supports Photos, 4K Cinema Videos, Hi-Fi Audio tracks, PDFs, Documents, and Archives. Data is isolated with zero leakage.
                      </p>
                    </div>
                  </div>

                  {/* Files Grid View */}
                  {filteredFiles.length === 0 ? (
                    <div className="py-16 text-center space-y-4 bg-slate-900/30 border border-slate-800/80 rounded-3xl p-8">
                      <div className="w-16 h-16 rounded-3xl bg-slate-800 flex items-center justify-center text-slate-400 mx-auto">
                        <HardDrive className="w-8 h-8 text-emerald-400" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-lg font-bold text-white">
                          {searchTerm ? 'No matching private files' : 'No private files in this folder yet'}
                        </h3>
                        <p className="text-xs text-slate-400 max-w-sm mx-auto">
                          Upload images, videos, audio, or sensitive documents to keep them hidden from the actual vaults.
                        </p>
                      </div>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-emerald-600/25 cursor-pointer"
                      >
                        <UploadCloud className="w-4 h-4" />
                        <span>Upload First Private File</span>
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                      {filteredFiles.map((file) => {
                        const isImage = file.fileType === 'IMAGE';
                        const isVideo = file.fileType === 'VIDEO';
                        const isAudio = file.fileType === 'AUDIO';

                        return (
                          <div
                            key={file.id}
                            className="group relative bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-3xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5 shadow-lg flex flex-col justify-between"
                          >
                            {/* Media Preview Box */}
                            <div className="relative aspect-video w-full bg-slate-950 flex items-center justify-center overflow-hidden">
                              {isImage ? (
                                <img
                                  src={`/api/files/${file.id}/stream`}
                                  alt={file.originalName}
                                  loading="lazy"
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              ) : isVideo ? (
                                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 group-hover:bg-purple-950/20 transition">
                                  <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center shadow-lg group-hover:scale-110 transition">
                                    <Play className="w-5 h-5 ml-0.5" />
                                  </div>
                                  <span className="text-[11px] text-purple-300 mt-2 font-semibold">Private Cinema</span>
                                </div>
                              ) : isAudio ? (
                                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 group-hover:bg-amber-950/20 transition">
                                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shadow-lg group-hover:scale-110 transition">
                                    <MusicIcon className="w-5 h-5" />
                                  </div>
                                  <span className="text-[11px] text-amber-300 mt-2 font-semibold">Lossless Audio</span>
                                </div>
                              ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 group-hover:bg-blue-950/20 transition">
                                  <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shadow-lg">
                                    {getFileIcon(file.fileType)}
                                  </div>
                                  <span className="text-[11px] text-blue-300 mt-2 font-semibold uppercase font-mono">
                                    {file.extension.replace('.', '') || file.fileType}
                                  </span>
                                </div>
                              )}

                              {/* Hover Quick Action Buttons */}
                              <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-3">
                                {isImage && (
                                  <button
                                    onClick={() => openLightboxForFile(file)}
                                    className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition cursor-pointer"
                                    title="View Fullscreen"
                                  >
                                    <ZoomIn className="w-4 h-4" />
                                  </button>
                                )}

                                {isVideo && (
                                  <button
                                    onClick={() => setActiveVideo(file)}
                                    className="p-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white shadow-lg transition cursor-pointer"
                                    title="Play Cinema Video"
                                  >
                                    <Play className="w-4 h-4 ml-0.5" />
                                  </button>
                                )}

                                {isAudio && (
                                  <button
                                    onClick={() => {
                                      if (file.music) {
                                        playSongNow(file.music);
                                        success(`Playing "${file.originalName}"`);
                                      }
                                    }}
                                    className="p-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white shadow-lg transition cursor-pointer"
                                    title="Play Audio"
                                  >
                                    <Play className="w-4 h-4 ml-0.5" />
                                  </button>
                                )}

                                {!isImage && !isVideo && (
                                  <a
                                    href={`/api/files/${file.id}/stream`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition cursor-pointer"
                                    title="Open / Preview in New Tab"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </a>
                                )}

                                <a
                                  href={`/api/files/${file.id}/download`}
                                  download
                                  className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition cursor-pointer"
                                  title="Download"
                                >
                                  <Download className="w-4 h-4" />
                                </a>

                                <button
                                  onClick={() => setDeleteFileTarget(file)}
                                  className="p-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/30 transition cursor-pointer"
                                  title="Delete Private File"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>

                              {/* Badge for File Type */}
                              <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-md border border-slate-800 text-[10px] font-mono font-bold text-slate-300">
                                {file.extension ? file.extension.toUpperCase() : file.fileType}
                              </div>
                            </div>

                            {/* File Info Footer */}
                            <div className="p-3.5 space-y-1.5">
                              <div className="flex items-start justify-between gap-2">
                                <h4
                                  className="font-bold text-xs text-white truncate group-hover:text-emerald-300 transition"
                                  title={file.originalName}
                                >
                                  {file.originalName}
                                </h4>
                              </div>

                              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                                <span>{formatBytes(file.size)}</span>
                                <span className="font-mono text-[10px] text-slate-500">
                                  {formatDate(file.createdAt)}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB CONTENT 2: ENCRYPTED LINKS & BOOKMARKS */}
              {activeTab === 'links' && (
                <div className="space-y-4">
                  {filteredCells.length === 0 ? (
                    <div className="py-16 text-center space-y-4 bg-slate-900/40 border border-slate-800/80 rounded-3xl p-8">
                      <div className="w-16 h-16 rounded-3xl bg-slate-800 flex items-center justify-center text-slate-400 mx-auto">
                        <Globe className="w-8 h-8 text-brand-400" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-lg font-bold text-white">
                          {searchTerm ? 'No matching links' : 'No links saved in this folder'}
                        </h3>
                        <p className="text-xs text-slate-400 max-w-sm mx-auto">
                          Save your website links, bookmark URLs, or private portals in this password-protected cell space.
                        </p>
                      </div>
                      <button
                        onClick={() => setCellModalTarget({ isOpen: true, cell: null })}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs rounded-xl transition shadow-lg shadow-brand-600/25 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add First Link Cell</span>
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {filteredCells.map((cell) => {
                        const domain = getDomain(cell.url);

                        return (
                          <div
                            key={cell.id}
                            onClick={() => setViewingCell(cell)}
                            className="group bg-slate-900/80 hover:bg-slate-900/95 border border-slate-800 hover:border-brand-500/50 rounded-3xl p-5 transition-all duration-200 hover:-translate-y-0.5 shadow-lg flex flex-col justify-between space-y-4 relative overflow-hidden cursor-pointer hover:shadow-brand-500/10"
                          >
                            <div className="space-y-3">
                              {/* Cell Header: Favicon + Title + Actions */}
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0 overflow-hidden shadow-inner p-1.5 group-hover:border-brand-500/30 transition">
                                    <img
                                      src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`}
                                      alt=""
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                      }}
                                      className="w-full h-full object-contain"
                                    />
                                    <Globe className="w-5 h-5 text-brand-400 hidden" />
                                  </div>

                                  <div className="min-w-0">
                                    <h4 className="font-bold text-sm text-white truncate leading-tight group-hover:text-brand-300 transition">
                                      {cell.title}
                                    </h4>
                                    <p className="text-[11px] text-slate-400 truncate mt-0.5 font-mono">
                                      {domain}
                                    </p>
                                  </div>
                                </div>

                                {/* Edit / Delete Cell */}
                                <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setCellModalTarget({ isOpen: true, cell });
                                    }}
                                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
                                    title="Edit Link"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDeleteCellTarget(cell);
                                    }}
                                    className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition cursor-pointer"
                                    title="Delete Link"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              {/* Optional Notes */}
                              {cell.notes && (
                                <p className="text-xs text-slate-400/90 line-clamp-2 italic bg-slate-950/40 p-2.5 rounded-xl border border-slate-900">
                                  "{cell.notes}"
                                </p>
                              )}
                            </div>

                            {/* Bottom Action: Click to open cell & view link */}
                            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 group-hover:text-brand-300 transition">
                              <span className="flex items-center gap-1.5 font-semibold">
                                <ExternalLink className="w-3.5 h-3.5 text-brand-400" />
                                <span>Click to open link</span>
                              </span>
                              <span className="px-2 py-0.5 rounded-lg bg-slate-950 border border-slate-800 text-[10px] text-slate-400 font-mono">
                                Protected Cell
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
