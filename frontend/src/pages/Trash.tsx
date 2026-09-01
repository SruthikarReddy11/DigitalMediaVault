import React, { useState, useEffect } from 'react';
import {
  Trash2,
  RotateCcw,
  AlertTriangle,
  FileText,
  Image,
  Video,
  Music,
  File,
} from 'lucide-react';
import { trashApi } from '../services/trashApi';
import { filesApi } from '../services/filesApi';
import { FileItem } from '../types';
import { formatBytes, formatDate } from '../utils/formatters';
import { FileTypeBadge } from '../components/common/Badge';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { EmptyState } from '../components/common/EmptyState';
import { useToast } from '../contexts/ToastContext';

export const Trash: React.FC = () => {
  const { success, error } = useToast();
  const [trashFiles, setTrashFiles] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Dialogs
  const [isEmptyOpen, setIsEmptyOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<FileItem | null>(null);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Trash2 className="w-7 h-7 text-rose-500" />
            Trash
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Deleted items can be restored or permanently removed
          </p>
        </div>

        {trashFiles.length > 0 && (
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleRestoreAll}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-sm font-semibold rounded-xl transition"
            >
              <RotateCcw className="w-4 h-4 text-emerald-400" />
              Restore All
            </button>
            <button
              onClick={() => setIsEmptyOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold rounded-xl transition shadow-lg shadow-rose-600/20"
            >
              <Trash2 className="w-4 h-4" />
              Empty Trash
            </button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-14 bg-slate-900 border border-slate-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : trashFiles.length === 0 ? (
        <EmptyState
          icon={Trash2}
          title="Trash is empty"
          description="Deleted files will appear here before being permanently removed."
        />
      ) : (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <div className="col-span-6 sm:col-span-5">Name</div>
            <div className="hidden sm:block sm:col-span-2">Type</div>
            <div className="col-span-3 sm:col-span-2">Size</div>
            <div className="hidden md:block md:col-span-2">Deleted Date</div>
            <div className="col-span-3 sm:col-span-1 text-right">Actions</div>
          </div>

          <div className="divide-y divide-slate-800/60">
            {trashFiles.map((file) => (
              <div
                key={file.id}
                className="grid grid-cols-12 gap-4 px-4 py-3 items-center text-xs text-slate-300 hover:bg-slate-800/50 transition"
              >
                <div className="col-span-6 sm:col-span-5 flex items-center gap-3 min-w-0">
                  <File className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="font-semibold text-white truncate">{file.originalName}</span>
                </div>

                <div className="hidden sm:block sm:col-span-2">
                  <FileTypeBadge type={file.fileType} />
                </div>

                <div className="col-span-3 sm:col-span-2 font-mono text-slate-400">
                  {formatBytes(file.size)}
                </div>

                <div className="hidden md:block md:col-span-2 text-slate-400">
                  {formatDate(file.deletedAt)}
                </div>

                <div className="col-span-3 sm:col-span-1 flex items-center justify-end gap-1.5">
                  <button
                    onClick={() => handleRestore(file.id)}
                    className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition"
                    title="Restore"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(file)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                    title="Permanently Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty Trash Confirm Dialog */}
      <ConfirmDialog
        isOpen={isEmptyOpen}
        onClose={() => setIsEmptyOpen(false)}
        onConfirm={handleEmptyTrash}
        title="Empty Trash"
        message="Are you sure you want to permanently delete all files in the trash? This action cannot be undone."
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
    </div>
  );
};
