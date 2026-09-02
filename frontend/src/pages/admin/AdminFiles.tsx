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
} from 'lucide-react';
import { adminApi } from '../../services/adminApi';
import { FileItem, AdminUser, FileType } from '../../types';
import { formatBytes, formatDate } from '../../utils/formatters';
import { FileTypeBadge } from '../../components/common/Badge';
import { FilePreviewModal } from '../../components/files/FilePreviewModal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { filesApi } from '../../services/filesApi';
import { useToast } from '../../contexts/ToastContext';
import { getMediaUrl } from '../../services/api';

export const AdminFiles: React.FC = () => {
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
                onClick={() => setPreviewFile(file)}
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
                  <a
                    href={getMediaUrl(file.downloadUrl)}
                    download={file.originalName}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
                    title="Download"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
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
          file={previewFile}
          isOpen={!!previewFile}
          onClose={() => setPreviewFile(null)}
        />
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
