import React, { useState, useEffect, useMemo } from 'react';
import {
  Trash2,
  RotateCcw,
  AlertTriangle,
  FileText,
  Image as ImageIcon,
  Film,
  Music as MusicIcon,
  FileSpreadsheet,
  Archive,
  File as FileIcon,
  Clock,
  Calendar,
  LayoutGrid,
  List as ListIcon,
  Search,
  Filter,
  ShieldAlert,
  Info,
  HardDrive,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import { trashApi } from '../services/trashApi';
import { filesApi } from '../services/filesApi';
import { getMediaUrl } from '../services/api';
import { FileItem, FileType } from '../types';
import { formatBytes, getTrashRetentionInfo, TrashRetentionInfo } from '../utils/formatters';
import { FileTypeBadge } from '../components/common/Badge';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { EmptyState } from '../components/common/EmptyState';
import { FilePreviewModal } from '../components/files/FilePreviewModal';
import { useToast } from '../contexts/ToastContext';

export const Trash: React.FC = () => {
  const { success, error } = useToast();
  const [trashFiles, setTrashFiles] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter, Sort, Layout states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'daysAsc' | 'daysDesc' | 'deletedDesc' | 'deletedAsc' | 'name' | 'size'>('daysAsc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Dialogs & Previews
  const [isEmptyOpen, setIsEmptyOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<FileItem | null>(null);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);

  const fetchTrash = async () => {
    setIsLoading(true);
    try {
      const data = await trashApi.getTrash();
      setTrashFiles(data);
    } catch (err) {
      console.error('Failed to load trash:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrash();
  }, []);

  const handleRestore = async (fileId: string) => {
    try {
      await filesApi.restoreFromTrash(fileId);
      setTrashFiles((prev) => prev.filter((f) => f.id !== fileId));
      success('File restored to library.');
    } catch (err: any) {
      error(err.message || 'Failed to restore file.');
    }
  };

  const handleRestoreAll = async () => {
    try {
      const res = await trashApi.restoreAll();
      setTrashFiles([]);
      success(res.message);
    } catch (err: any) {
      error(err.message || 'Failed to restore files.');
    }
  };

  const handleEmptyTrash = async () => {
    try {
      const res = await trashApi.emptyTrash();
      setTrashFiles([]);
      success(res.message);
      setIsEmptyOpen(false);
    } catch (err: any) {
      error(err.message || 'Failed to empty trash.');
    }
  };

  const handlePermanentDelete = async () => {
    if (!deleteTarget) return;
    try {
      await filesApi.permanentDelete(deleteTarget.id);
      setTrashFiles((prev) => prev.filter((f) => f.id !== deleteTarget.id));
      success('File permanently deleted.');
      setDeleteTarget(null);
    } catch (err: any) {
      error(err.message || 'Failed to delete file.');
    }
  };

  // Filter and sort files
  const filteredAndSortedFiles = useMemo(() => {
    return trashFiles
      .filter((file) => {
        // Search filter
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          const matchesName = file.originalName.toLowerCase().includes(query);
          const matchesType = file.fileType.toLowerCase().includes(query);
          if (!matchesName && !matchesType) return false;
        }

        // Type filter
        if (selectedType !== 'ALL' && file.fileType !== selectedType) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        const retA = getTrashRetentionInfo(a.deletedAt);
        const retB = getTrashRetentionInfo(b.deletedAt);
        const dateA = a.deletedAt ? new Date(a.deletedAt).getTime() : 0;
        const dateB = b.deletedAt ? new Date(b.deletedAt).getTime() : 0;

        switch (sortBy) {
          case 'daysAsc':
            return retA.daysRemaining - retB.daysRemaining; // Soonest to expire first
          case 'daysDesc':
            return retB.daysRemaining - retA.daysRemaining;
          case 'deletedDesc':
            return dateB - dateA; // Most recently deleted first
          case 'deletedAsc':
            return dateA - dateB; // Oldest deleted first
          case 'name':
            return a.originalName.localeCompare(b.originalName);
          case 'size':
            return Number(b.size) - Number(a.size);
          default:
            return 0;
        }
      });
  }, [trashFiles, searchQuery, selectedType, sortBy]);

  // Overall Trash Statistics
  const totalTrashSize = useMemo(() => {
    return trashFiles.reduce((acc, f) => acc + Number(f.size || 0), 0);
  }, [trashFiles]);

  const urgentCount = useMemo(() => {
    return trashFiles.filter((f) => {
      const ret = getTrashRetentionInfo(f.deletedAt);
      return ret.isUrgent;
    }).length;
  }, [trashFiles]);

  const renderFileIcon = (file: FileItem) => {
    switch (file.fileType) {
      case 'IMAGE':
        return <ImageIcon className="w-6 h-6 text-brand-400" />;
      case 'VIDEO':
        return <Film className="w-6 h-6 text-rose-400" />;
      case 'AUDIO':
        return <MusicIcon className="w-6 h-6 text-amber-400" />;
      case 'PDF':
      case 'DOCUMENT':
        return <FileText className="w-6 h-6 text-blue-400" />;
      case 'SPREADSHEET':
        return <FileSpreadsheet className="w-6 h-6 text-emerald-400" />;
      case 'ARCHIVE':
        return <Archive className="w-6 h-6 text-orange-400" />;
      default:
        return <FileIcon className="w-6 h-6 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-rose-500/20 to-red-500/10 border border-rose-500/30 text-rose-400 shadow-lg shadow-rose-500/10">
              <Trash2 className="w-6 h-6 sm:w-7 h-7" />
            </div>
            <span>Trash</span>
            {trashFiles.length > 0 && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 font-bold border border-slate-700">
                {trashFiles.length} {trashFiles.length === 1 ? 'item' : 'items'}
              </span>
            )}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Items in trash are automatically purged after 30 days. Restore them anytime before expiration.
          </p>
        </div>

        {trashFiles.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 shrink-0 self-start sm:self-center">
            <button
              onClick={handleRestoreAll}
              className="group flex items-center gap-2.5 px-4 sm:px-5 py-2.5 bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white text-xs sm:text-sm font-bold rounded-2xl transition-all duration-200 border border-white/10 hover:border-emerald-500/40 shadow-lg backdrop-blur-md active:scale-95 whitespace-nowrap cursor-pointer"
            >
              <div className="p-1 rounded-lg bg-emerald-500/15 group-hover:scale-110 transition-transform duration-300">
                <RotateCcw className="w-4 h-4 text-emerald-400" />
              </div>
              <span>Restore All</span>
            </button>
            <button
              onClick={() => setIsEmptyOpen(true)}
              className="group relative overflow-hidden flex items-center gap-2.5 px-4 sm:px-5 py-2.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs sm:text-sm font-black rounded-2xl transition-all duration-200 shadow-xl shadow-rose-600/25 hover:shadow-rose-600/40 border border-white/20 active:scale-95 whitespace-nowrap cursor-pointer"
            >
              <div className="p-1 rounded-lg bg-white/20 group-hover:rotate-12 transition-transform duration-300">
                <Trash2 className="w-4 h-4 text-white" />
              </div>
              <span>Empty Trash</span>
            </button>
          </div>
        )}
      </div>

      {/* 30-Day Auto-Deletion Info Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900/95 via-slate-900/90 to-rose-950/30 border border-rose-500/20 p-4 sm:p-5 shadow-xl backdrop-blur-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30 shrink-0 mt-0.5">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white tracking-wide">
                  30-Day Auto-Deletion Policy Active
                </h2>
                <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Auto-Purge
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                When a file is sent to trash, it is held for <strong className="text-rose-400 font-semibold">30 days</strong>. 
                Each card displays the exact deleted date, time, and remaining countdown days. After 30 days, files are permanently deleted.
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          {trashFiles.length > 0 && (
            <div className="flex items-center gap-3 shrink-0 self-start md:self-center bg-slate-950/60 p-2.5 rounded-xl border border-white/5 text-xs">
              <div className="px-2 py-1 text-center">
                <div className="text-slate-400 text-[11px] font-medium">Total Items</div>
                <div className="text-white font-bold text-sm">{trashFiles.length}</div>
              </div>
              <div className="h-6 w-px bg-white/10" />
              <div className="px-2 py-1 text-center">
                <div className="text-slate-400 text-[11px] font-medium">Total Size</div>
                <div className="text-cyan-400 font-mono font-bold text-sm">{formatBytes(totalTrashSize)}</div>
              </div>
              {urgentCount > 0 && (
                <>
                  <div className="h-6 w-px bg-white/10" />
                  <div className="px-2 py-1 text-center">
                    <div className="text-rose-400 text-[11px] font-medium">Expiring Soon</div>
                    <div className="text-rose-400 font-black text-sm animate-pulse">{urgentCount}</div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Control Bar (Search, Filters, Sort, View Toggle) */}
      {trashFiles.length > 0 && (
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800 backdrop-blur-md">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search deleted files by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* File Type Filter */}
            <div className="flex items-center gap-1.5 bg-slate-950/70 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="bg-transparent text-slate-200 text-xs font-semibold focus:outline-none cursor-pointer pr-2"
              >
                <option value="ALL" className="bg-slate-900 text-white">All Types</option>
                <option value="IMAGE" className="bg-slate-900 text-white">Images</option>
                <option value="VIDEO" className="bg-slate-900 text-white">Videos</option>
                <option value="AUDIO" className="bg-slate-900 text-white">Audio / Music</option>
                <option value="PDF" className="bg-slate-900 text-white">PDFs</option>
                <option value="DOCUMENT" className="bg-slate-900 text-white">Documents</option>
                <option value="SPREADSHEET" className="bg-slate-900 text-white">Spreadsheets</option>
                <option value="ARCHIVE" className="bg-slate-900 text-white">Archives</option>
                <option value="OTHER" className="bg-slate-900 text-white">Other</option>
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-950/70 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs">
              <span className="text-slate-400 font-medium">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-slate-200 text-xs font-semibold focus:outline-none cursor-pointer pr-2"
              >
                <option value="daysAsc" className="bg-slate-900 text-white">Expiring Soonest (Days Left)</option>
                <option value="daysDesc" className="bg-slate-900 text-white">Most Days Remaining</option>
                <option value="deletedDesc" className="bg-slate-900 text-white">Deleted: Newest First</option>
                <option value="deletedAsc" className="bg-slate-900 text-white">Deleted: Oldest First</option>
                <option value="name" className="bg-slate-900 text-white">File Name (A-Z)</option>
                <option value="size" className="bg-slate-900 text-white">File Size (Largest)</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'grid'
                    ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Grid Cards View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'list'
                    ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Table List View"
              >
                <ListIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="h-72 bg-slate-900/60 border border-slate-800/80 rounded-2xl animate-pulse p-4 space-y-3"
            >
              <div className="h-32 bg-slate-800/60 rounded-xl" />
              <div className="h-4 bg-slate-800/80 rounded w-3/4" />
              <div className="h-3 bg-slate-800/50 rounded w-1/2" />
              <div className="h-8 bg-slate-800/40 rounded-xl mt-4" />
            </div>
          ))}
        </div>
      ) : trashFiles.length === 0 ? (
        <EmptyState
          icon={Trash2}
          title="Trash is empty"
          description="Deleted files will appear here before being permanently removed after 30 days."
        />
      ) : filteredAndSortedFiles.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800">
          <Search className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">No matching trash files found</h3>
          <p className="text-xs text-slate-400 mt-1">Try changing your search query or file type filter.</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedType('ALL');
            }}
            className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl transition"
          >
            Clear Filters
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* ================= CARD GRID VIEW ================= */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {filteredAndSortedFiles.map((file) => {
            const retention: TrashRetentionInfo = getTrashRetentionInfo(file.deletedAt);

            return (
              <div
                key={file.id}
                className="group relative flex flex-col justify-between bg-slate-900/80 hover:bg-slate-900 border border-slate-800/90 hover:border-slate-700/80 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-0.5"
              >
                {/* Top Card Header: Type Badge & Days Left Chip */}
                <div className="p-3.5 pb-2 flex items-center justify-between gap-2 border-b border-white/5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <FileTypeBadge type={file.fileType} />
                    <span className="text-[11px] font-mono text-slate-400 uppercase">
                      {file.extension || ''}
                    </span>
                  </div>

                  {/* Days Left Chip */}
                  <div
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black border ${retention.badgeColor.chip} shrink-0`}
                    title={`Deleted on ${retention.deletedFull} - Will auto-delete in ${retention.daysRemaining} days`}
                  >
                    <span className={`w-2 h-2 rounded-full ${retention.badgeColor.dot}`} />
                    <span>{retention.statusText}</span>
                  </div>
                </div>

                {/* Preview / Thumbnail Area */}
                <div
                  onClick={() => setPreviewFile(file)}
                  className="relative h-36 bg-slate-950/60 flex items-center justify-center overflow-hidden cursor-pointer group/preview"
                >
                  {file.fileType === 'IMAGE' ? (
                    <img
                      src={getMediaUrl(file.streamUrl)}
                      alt={file.originalName}
                      className="w-full h-full object-cover group-hover/preview:scale-105 transition-transform duration-500 opacity-80 group-hover/preview:opacity-100"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : file.fileType === 'AUDIO' ? (
                    <div className="flex flex-col items-center justify-center p-4 text-center">
                      <div className="p-3 rounded-full bg-amber-500/10 text-amber-400 mb-1 group-hover/preview:scale-110 transition-transform">
                        <MusicIcon className="w-8 h-8" />
                      </div>
                      <span className="text-xs text-slate-400 truncate max-w-[180px]">
                        {file.music?.artist || 'Audio Track'}
                      </span>
                    </div>
                  ) : file.fileType === 'VIDEO' ? (
                    <div className="flex flex-col items-center justify-center p-4">
                      <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-400 mb-1 group-hover/preview:scale-110 transition-transform">
                        <Film className="w-8 h-8" />
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-4">
                      <div className="p-3 rounded-2xl bg-slate-800/80 text-slate-300 mb-1 group-hover/preview:scale-110 transition-transform">
                        {renderFileIcon(file)}
                      </div>
                    </div>
                  )}

                  {/* Overlay Quick View Button */}
                  <div className="absolute inset-0 bg-slate-950/50 opacity-0 group-hover/preview:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 text-white text-xs font-semibold border border-white/20 shadow-lg">
                      <Eye className="w-3.5 h-3.5 text-brand-400" />
                      Preview
                    </span>
                  </div>
                </div>

                {/* Card Body: Filename, Size, Deleted Date & Retention Progress */}
                <div className="p-3.5 space-y-3">
                  <div>
                    <h3
                      className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-brand-300 transition-colors"
                      title={file.originalName}
                    >
                      {file.originalName}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400 font-mono">
                      <span>{formatBytes(file.size)}</span>
                      {file.folder && (
                        <>
                          <span>•</span>
                          <span className="truncate max-w-[120px] text-slate-500">📁 {file.folder.name}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Deleted Date and Time Display */}
                  <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1.5">
                    <div className="flex items-center justify-between gap-1 text-[11px]">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Deleted Date:</span>
                      </div>
                      <span className="font-semibold text-slate-200 text-right truncate">
                        {retention.deletedFull}
                      </span>
                    </div>

                    {/* Retention Progress Bar */}
                    <div className="space-y-1 pt-0.5">
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span>Retention Policy</span>
                        <span className="font-mono font-bold text-slate-300">
                          {retention.daysRemaining} / 30 days left
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${retention.badgeColor.progress} transition-all duration-500`}
                          style={{ width: `${Math.max(5, retention.percentRemaining)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="p-3 pt-0 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleRestore(file.id)}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-300 border border-white/5 hover:border-emerald-500/30 text-xs font-bold transition-all duration-200 active:scale-95 cursor-pointer"
                    title="Restore file to library"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Restore</span>
                  </button>

                  <button
                    onClick={() => setDeleteTarget(file)}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border border-white/5 hover:border-rose-500/30 text-xs font-bold transition-all duration-200 active:scale-95 cursor-pointer"
                    title="Delete permanently now"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ================= TABLE LIST VIEW ================= */
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3.5">File Name</th>
                  <th className="px-4 py-3.5">Type</th>
                  <th className="px-4 py-3.5">Size</th>
                  <th className="px-4 py-3.5">Deleted Date & Time</th>
                  <th className="px-4 py-3.5">Days Left (Auto-Purge)</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {filteredAndSortedFiles.map((file) => {
                  const retention = getTrashRetentionInfo(file.deletedAt);

                  return (
                    <tr
                      key={file.id}
                      className="hover:bg-slate-800/50 transition duration-150 group"
                    >
                      {/* Name & Icon */}
                      <td className="px-4 py-3.5">
                        <div
                          onClick={() => setPreviewFile(file)}
                          className="flex items-center gap-3 cursor-pointer max-w-xs sm:max-w-md"
                        >
                          <div className="p-2 rounded-lg bg-slate-800 group-hover:bg-slate-700 transition shrink-0">
                            {renderFileIcon(file)}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-white truncate group-hover:text-brand-300 transition-colors">
                              {file.originalName}
                            </div>
                            {file.folder && (
                              <div className="text-[11px] text-slate-500 truncate">
                                📁 {file.folder.name}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Type Badge */}
                      <td className="px-4 py-3.5">
                        <FileTypeBadge type={file.fileType} />
                      </td>

                      {/* Size */}
                      <td className="px-4 py-3.5 font-mono text-slate-400">
                        {formatBytes(file.size)}
                      </td>

                      {/* Deleted Date & Time */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{retention.deletedFull}</span>
                        </div>
                      </td>

                      {/* Days Left & Progress Bar */}
                      <td className="px-4 py-3.5 min-w-[160px]">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-black border ${retention.badgeColor.chip}`}>
                              {retention.statusText}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              ({retention.daysRemaining}/30d)
                            </span>
                          </div>
                          <div className="w-32 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${retention.badgeColor.progress}`}
                              style={{ width: `${Math.max(5, retention.percentRemaining)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleRestore(file.id)}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-300 hover:text-emerald-300 bg-slate-800/80 hover:bg-emerald-500/20 border border-white/5 hover:border-emerald-500/30 rounded-xl transition font-bold"
                            title="Restore"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="hidden sm:inline">Restore</span>
                          </button>
                          <button
                            onClick={() => setDeleteTarget(file)}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-300 hover:text-rose-300 bg-slate-800/80 hover:bg-rose-500/20 border border-white/5 hover:border-rose-500/30 rounded-xl transition font-bold"
                            title="Delete Permanently"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                            <span className="hidden sm:inline">Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty Trash Confirm Dialog */}
      <ConfirmDialog
        isOpen={isEmptyOpen}
        onClose={() => setIsEmptyOpen(false)}
        onConfirm={handleEmptyTrash}
        title="Empty Trash"
        message="Are you sure you want to permanently delete all files currently in the trash? This action cannot be undone and files cannot be recovered."
        confirmText="Empty Trash Now"
        isDangerous
      />

      {/* Permanent Delete Single Item Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handlePermanentDelete}
        title="Permanently Delete File"
        message={`Permanently delete "${deleteTarget?.originalName}"? The storage file will be deleted immediately and cannot be recovered.`}
        confirmText="Delete Forever"
        isDangerous
      />

      {/* File Preview Modal */}
      {previewFile && (
        <FilePreviewModal
          file={previewFile}
          isOpen={!!previewFile}
          onClose={() => setPreviewFile(null)}
        />
      )}
    </div>
  );
};

