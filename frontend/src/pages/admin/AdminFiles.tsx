import React, { useState, useEffect } from 'react';
import {
  Files as FilesIcon,
  Search,
  Download,
  Trash2,
  Eye,
  FileText,
  Image,
  Video,
  Music,
  File,
  User,
  ShieldAlert,
  Lock,
  KeyRound,
  X,
} from 'lucide-react';
import { adminApi } from '../../services/adminApi';
import { FileItem, AdminUser, FileType } from '../../types';
import { formatBytes, formatDate } from '../../utils/formatters';
import { FileTypeBadge } from '../../components/common/Badge';
import { FilePreviewModal } from '../../components/files/FilePreviewModal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { filesApi } from '../../services/filesApi';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { getMediaUrl } from '../../services/api';

export const AdminFiles: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { success, error } = useToast();

  const [files, setFiles] = useState<FileItem[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearchTerm] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');

  // Preview & Delete
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FileItem | null>(null);

  // 4-Digit Security PIN Protection for unauthorized data
  const [verifiedPins, setVerifiedPins] = useState<Record<string, string>>({});
  const [pinPromptFile, setPinPromptFile] = useState<FileItem | null>(null);
  const [pinActionType, setPinActionType] = useState<'preview' | 'download'>('preview');
  const [inputPin, setInputPin] = useState('');
  const [isVerifyingPin, setIsVerifyingPin] = useState(false);

  const fetchFiles = async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.getAllFiles({
        search: search || undefined,
        userId: selectedUserId || undefined,
        fileType: selectedType || undefined,
        limit: 100,
      });
      setFiles(res.data);
    } catch (err) {
      console.error('Failed to load admin files:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    adminApi.getUsers().then((res) => setUsers(res.data)).catch(console.error);
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [search, selectedUserId, selectedType]);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    try {
      await filesApi.permanentDelete(deleteTarget.id);
      setFiles((prev) => prev.filter((f) => f.id !== deleteTarget.id));
      success('File deleted by administrator.');
      setDeleteTarget(null);
    } catch (err: any) {
      error(err.message || 'Failed to delete file.');
    }
  };

  const handleRequestPreview = (file: FileItem) => {
    if (file.userId === currentUser?.id || verifiedPins[file.userId]) {
      setPreviewFile(file);
      return;
    }
    setPinPromptFile(file);
    setPinActionType('preview');
    setInputPin('');
  };

  const handleRequestDownload = (file: FileItem) => {
    if (file.userId === currentUser?.id || verifiedPins[file.userId]) {
      const pinParam = verifiedPins[file.userId] ? `&pin=${encodeURIComponent(verifiedPins[file.userId])}` : '';
      window.open(getMediaUrl(`${file.downloadUrl}${pinParam}`), '_blank');
      return;
    }
    setPinPromptFile(file);
    setPinActionType('download');
    setInputPin('');
  };

  const handleVerifyPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinPromptFile || !inputPin.trim()) return;

    setIsVerifyingPin(true);
    try {
      await adminApi.verifyUserPin(pinPromptFile.userId, inputPin.trim());
      setVerifiedPins((prev) => ({ ...prev, [pinPromptFile.userId]: inputPin.trim() }));
      success('Security code verified. Access granted.');

      const target = pinPromptFile;
      const verifiedCode = inputPin.trim();
      setPinPromptFile(null);

      if (pinActionType === 'preview') {
        setPreviewFile(target);
      } else {
        window.open(getMediaUrl(`${target.downloadUrl}&pin=${encodeURIComponent(verifiedCode)}`), '_blank');
      }
    } catch (err: any) {
      error(err.response?.data?.error?.message || err.message || 'Incorrect 4-digit security code. Access denied.');
    } finally {
      setIsVerifyingPin(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
          <FilesIcon className="w-7 h-7 text-brand-400" />
          Global Files Explorer
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Inspect, audit, download, and manage files across all registered users
        </p>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-900/80 border border-slate-800 rounded-2xl">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search all files by name..."
            className="w-full bg-slate-950 border border-slate-800 focus:border-brand-500 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2.5">
          {/* User selector */}
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-xl px-3 py-2 focus:outline-none"
          >
            <option value="">All User Accounts</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                👤 {u.name} (@{u.username})
              </option>
            ))}
          </select>

          {/* Type selector */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-xl px-3 py-2 focus:outline-none"
          >
            <option value="">All Types</option>
            <option value="IMAGE">Images</option>
            <option value="VIDEO">Videos</option>
            <option value="AUDIO">Audio</option>
            <option value="PDF">PDFs</option>
            <option value="DOCUMENT">Documents</option>
            <option value="SPREADSHEET">Spreadsheets</option>
            <option value="ARCHIVE">Archives</option>
          </select>
        </div>
      </div>

      {/* Files Table */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 bg-slate-900 border border-slate-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="grid grid-cols-12 gap-4 px-5 py-3.5 border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <div className="col-span-5 sm:col-span-4">File</div>
            <div className="col-span-3 sm:col-span-2">Owner</div>
            <div className="hidden sm:block sm:col-span-2">Type</div>
            <div className="col-span-2 sm:col-span-2">Size</div>
            <div className="hidden md:block md:col-span-1">Date</div>
            <div className="col-span-2 sm:col-span-1 text-right">Actions</div>
          </div>

          <div className="divide-y divide-slate-800/60">
            {files.map((file) => (
              <div
                key={file.id}
                onClick={() => handleRequestPreview(file)}
                className="grid grid-cols-12 gap-4 px-5 py-3.5 items-center text-xs text-slate-300 hover:bg-slate-800/40 cursor-pointer transition"
              >
                {/* File Name */}
                <div className="col-span-5 sm:col-span-4 flex items-center gap-2.5 min-w-0">
                  <File className="w-4 h-4 text-brand-400 shrink-0" />
                  <span className="font-semibold text-white truncate">{file.originalName}</span>
                </div>

                {/* Owner */}
                <div className="col-span-3 sm:col-span-2 flex items-center gap-1.5 truncate">
                  <User className="w-3 h-3 text-purple-400 shrink-0" />
                  <span className="text-slate-200 truncate">
                    {file.owner?.name || 'Unknown'}
                  </span>
                </div>

                {/* Type */}
                <div className="hidden sm:block sm:col-span-2">
                  <FileTypeBadge type={file.fileType} />
                </div>

                {/* Size */}
                <div className="col-span-2 sm:col-span-2 font-mono text-slate-400">
                  {formatBytes(file.size)}
                </div>

                {/* Date */}
                <div className="hidden md:block md:col-span-1 text-slate-400">
                  {formatDate(file.createdAt)}
                </div>

                {/* Actions */}
                <div
                  className="col-span-2 sm:col-span-1 flex items-center justify-end gap-1.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => handleRequestDownload(file)}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
                    title="Download"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(file)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg transition"
                    title="Delete permanently"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewFile && (
        <FilePreviewModal
          file={
            verifiedPins[previewFile.userId]
              ? {
                  ...previewFile,
                  streamUrl: `${previewFile.streamUrl}${previewFile.streamUrl.includes('?') ? '&' : '?'}pin=${encodeURIComponent(verifiedPins[previewFile.userId])}`,
                  downloadUrl: `${previewFile.downloadUrl}${previewFile.downloadUrl.includes('?') ? '&' : '?'}pin=${encodeURIComponent(verifiedPins[previewFile.userId])}`,
                }
              : previewFile
          }
          isOpen={!!previewFile}
          onClose={() => setPreviewFile(null)}
        />
      )}

      {/* 4-Digit PIN Authorization Modal */}
      {pinPromptFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 text-center relative">
            <button
              onClick={() => setPinPromptFile(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/30">
              <KeyRound className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-bold text-white">4-Digit Security PIN Required</h3>
              <p className="text-xs text-slate-400">
                This file belongs to <span className="text-amber-400 font-semibold">{pinPromptFile.owner?.name || 'a private user'}</span>. Enter their 4-digit code to authorize access.
              </p>
            </div>

            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl text-left text-xs text-slate-300 flex items-center gap-2.5">
              <File className="w-4 h-4 text-brand-400 shrink-0" />
              <span className="truncate font-medium">{pinPromptFile.originalName}</span>
            </div>

            <form onSubmit={handleVerifyPin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Enter User's 4-Digit Access Code
                </label>
                <input
                  type="password"
                  maxLength={4}
                  autoFocus
                  required
                  value={inputPin}
                  onChange={(e) => setInputPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="••••"
                  className="w-40 text-center tracking-[0.5em] font-mono text-2xl font-bold bg-slate-950 border-2 border-slate-700 focus:border-amber-400 text-amber-400 rounded-2xl py-2.5 mx-auto block focus:outline-none transition shadow-inner"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setPinPromptFile(null)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isVerifyingPin || inputPin.length !== 4}
                  className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-xl text-xs transition shadow-lg shadow-amber-600/20 disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {isVerifyingPin ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>Authorize Access</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Admin Delete File"
        message={`Permanently delete "${deleteTarget?.originalName}" owned by ${deleteTarget?.owner?.name}? This cannot be undone.`}
        confirmText="Permanently Delete"
        isDangerous
      />
    </div>
  );
};
