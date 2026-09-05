import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Share2,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';
import { VaultFolder, VaultCell } from '../types';
import { vaultApi } from '../services/vaultApi';
import { useToast } from '../contexts/ToastContext';
import { VaultGateModal } from '../components/vault/VaultGateModal';
import { FolderPasswordModal } from '../components/vault/FolderPasswordModal';
import { CreateFolderModal } from '../components/vault/CreateFolderModal';
import { CellModal } from '../components/vault/CellModal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';

export const SecretVault: React.FC = () => {
  const { success, error } = useToast();

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
  const [isFolderLocked, setIsFolderLocked] = useState(true);

  // 4. Modals State
  const [passwordTargetFolder, setPasswordTargetFolder] = useState<VaultFolder | null>(null);
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [cellModalTarget, setCellModalTarget] = useState<{ isOpen: boolean; cell?: VaultCell | null }>({
    isOpen: false,
    cell: null,
  });
  const [deleteFolderTarget, setDeleteFolderTarget] = useState<VaultFolder | null>(null);
  const [deleteCellTarget, setDeleteCellTarget] = useState<VaultCell | null>(null);

  // 5. One-Click Copy Feedback Tracker: cellId -> boolean
  const [copiedCellId, setCopiedCellId] = useState<string | null>(null);

  const isUnlockedRef = useRef(isUnlocked);
  useEffect(() => {
    isUnlockedRef.current = isUnlocked;
  }, [isUnlocked]);

  // Immediate Auto-Lock on Unmount or Tab Switch (within 1 second)
  const handleLockVault = useCallback(() => {
    setIsUnlocked(false);
    setIsGateOpen(true);
    setActiveFolder(null);
    setActiveCells([]);
    setIsFolderLocked(true);
    setPasswordTargetFolder(null);
  }, []);

  useEffect(() => {
    // When the user switches away or closes tab/browser, lock immediately
    const handleVisibilityChange = () => {
      if (document.hidden && isUnlockedRef.current) {
        handleLockVault();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [handleLockVault]);

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
  const handleFolderUnlocked = (data: { folder: VaultFolder; cells: VaultCell[] }) => {
    setPasswordTargetFolder(null);
    setActiveFolder(data.folder);
    setActiveCells(data.cells);
    setIsFolderLocked(false);
  };

  // Handle Close Folder (Back to folders list)
  const handleBackToFolders = () => {
    setActiveFolder(null);
    setActiveCells([]);
    setIsFolderLocked(true);
    loadFolders(); // Refresh cell counts
  };

  // One-Click URL Copy Handler
  const handleCopyUrl = (cell: VaultCell, e?: React.MouseEvent) => {
    e?.stopPropagation();
    navigator.clipboard.writeText(cell.url);
    setCopiedCellId(cell.id);
    success(`Copied: ${cell.url}`);
    setTimeout(() => {
      setCopiedCellId((prev) => (prev === cell.id ? null : prev));
    }, 2000);
  };

  // Open Link in New Tab Handler
  const handleOpenLink = (url: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    window.open(url, '_blank', 'noopener,noreferrer');
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
  };

  // Delete Cell Handler
  const handleDeleteCellConfirm = async () => {
    if (!deleteCellTarget) return;
    try {
      await vaultApi.deleteCell(deleteCellTarget.id);
      setActiveCells((prev) => prev.filter((c) => c.id !== deleteCellTarget.id));
      success('Link deleted successfully.');
      setDeleteCellTarget(null);
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

  // Extract domain for Favicon & display
  const getDomain = (url: string) => {
    try {
      const parsed = new URL(url);
      return parsed.hostname.replace(/^www\./i, '');
    } catch {
      return url;
    }
  };

  const filteredFolders = folders.filter((f) =>
    f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (f.description && f.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredCells = activeCells.filter((c) =>
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.notes && c.notes.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* 1. Google Authenticator Gate Modal */}
      {!isUnlocked && (
        <VaultGateModal
          isOpen={isGateOpen}
          onUnlock={handleGateUnlock}
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

      {/* 5. Delete Confirmations */}
      <ConfirmDialog
        isOpen={!!deleteFolderTarget}
        onClose={() => setDeleteFolderTarget(null)}
        onConfirm={handleDeleteFolderConfirm}
        title="Delete Protected Folder"
        message={`Are you sure you want to delete "${deleteFolderTarget?.name}"? All saved links inside will be permanently erased.`}
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
                    ? `${activeCells.length} saved links inside this password-protected folder`
                    : 'Encrypted link vault protected by Google Authenticator'}
                </p>
              </div>
            </div>

            {/* Actions: Add Folder / Add Cell & Immediate Lock */}
            <div className="flex items-center gap-2.5">
              {activeFolder ? (
                <button
                  onClick={() => setCellModalTarget({ isOpen: true, cell: null })}
                  className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-2xl transition shadow-lg shadow-brand-600/25 active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Link Cell</span>
                </button>
              ) : (
                <button
                  onClick={() => setIsCreateFolderOpen(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-2xl transition shadow-lg shadow-brand-600/25 active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Protected Folder</span>
                </button>
              )}

              <button
                onClick={handleLockVault}
                className="flex items-center gap-1.5 px-3.5 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold rounded-2xl transition"
                title="Lock Vault Now (requires Google Authenticator to re-open)"
              >
                <Lock className="w-4 h-4" />
                <span className="hidden sm:inline">Lock Vault</span>
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
                          {folder.description || 'Password-protected link collection'}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                        <span className="flex items-center gap-1 font-medium">
                          <Bookmark className="w-3.5 h-3.5 text-brand-400" />
                          {folder.cellCount} {folder.cellCount === 1 ? 'link' : 'links'}
                        </span>
                        <span className="text-[11px] text-slate-500 group-hover:text-slate-400 transition">
                          Click to enter password →
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* VIEW B: Active Folder Cells / Links View */}
          {activeFolder && (
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
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs rounded-xl transition shadow-lg shadow-brand-600/25"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add First Link Cell</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredCells.map((cell) => {
                    const domain = getDomain(cell.url);
                    const isCopied = copiedCellId === cell.id;

                    return (
                      <div
                        key={cell.id}
                        className="group bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-3xl p-5 transition-all duration-200 hover:-translate-y-0.5 shadow-lg flex flex-col justify-between space-y-4 relative overflow-hidden"
                      >
                        <div className="space-y-3">
                          {/* Cell Header: Favicon + Title + Actions */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0 overflow-hidden shadow-inner p-1.5">
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
                                onClick={() => setCellModalTarget({ isOpen: true, cell })}
                                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                                title="Edit Link"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteCellTarget(cell)}
                                className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
                                title="Delete Link"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Raw URL Display */}
                          <div className="p-2.5 bg-slate-950/80 border border-slate-800/80 rounded-xl text-xs font-mono text-slate-300 truncate select-all">
                            {cell.url}
                          </div>

                          {/* Optional Notes */}
                          {cell.notes && (
                            <p className="text-xs text-slate-400/90 line-clamp-2 italic bg-slate-950/40 p-2 rounded-lg border border-slate-900">
                              "{cell.notes}"
                            </p>
                          )}
                        </div>

                        {/* Bottom Actions: One-Click Copy & Open Link */}
                        <div className="pt-3 border-t border-slate-800/80 flex items-center gap-2">
                          {/* ONE-CLICK COPY LINK BUTTON */}
                          <button
                            onClick={(e) => handleCopyUrl(cell, e)}
                            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow active:scale-95 ${
                              isCopied
                                ? 'bg-emerald-600 text-white ring-2 ring-emerald-400'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700/50'
                            }`}
                            title="Copy link to clipboard in one click"
                          >
                            {isCopied ? (
                              <>
                                <Check className="w-4 h-4 text-white" />
                                <span>Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy Link</span>
                              </>
                            )}
                          </button>

                          {/* OPEN LINK BUTTON */}
                          <button
                            onClick={(e) => handleOpenLink(cell.url, e)}
                            className="py-2 px-3 bg-brand-600/20 hover:bg-brand-600 text-brand-300 hover:text-white border border-brand-500/30 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 active:scale-95 shrink-0"
                            title="Open URL in new tab"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Open</span>
                          </button>
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
  );
};
