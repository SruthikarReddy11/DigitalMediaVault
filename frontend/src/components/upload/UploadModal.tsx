import React, { useState, useRef, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { UploadCloud, File, X, CheckCircle2, AlertCircle, FolderClosed } from 'lucide-react';
import { filesApi } from '../../services/filesApi';
import { foldersApi } from '../../services/foldersApi';
import { FolderItem } from '../../types';
import { formatBytes } from '../../utils/formatters';
import { useToast } from '../../contexts/ToastContext';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete?: () => void;
  initialFolderId?: string | null;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onUploadComplete,
  initialFolderId,
}) => {
  const { success, error } = useToast();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [targetFolderId, setTargetFolderId] = useState<string | null>(initialFolderId || null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      foldersApi.getFolders().then(setFolders).catch(console.error);
      setTargetFolderId(initialFolderId || null);
    } else {
      setSelectedFiles([]);
      setUploadProgress(0);
      setIsUploading(false);
    }
  }, [isOpen, initialFolderId]);

  const handleFilesAdded = (files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files);
    setSelectedFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFilesAdded(e.dataTransfer.files);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      await filesApi.uploadFiles(selectedFiles, targetFolderId, (percent) => {
        setUploadProgress(percent);
      });

      success(`Successfully uploaded ${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''}!`);
      if (onUploadComplete) onUploadComplete();
      onClose();
    } catch (err: any) {
      error(err.message || 'Failed to upload files.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={isUploading ? () => {} : onClose} title="Upload Files">
      <div className="space-y-4">
        {/* Destination Folder Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
            <FolderClosed className="w-3.5 h-3.5 text-brand-400" />
            Destination Folder
          </label>
          <select
            value={targetFolderId || ''}
            onChange={(e) => setTargetFolderId(e.target.value ? e.target.value : null)}
            disabled={isUploading}
            className="w-full bg-slate-950 border border-slate-800 focus:border-brand-500 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none transition"
          >
            <option value="">Root Library (No folder)</option>
            {folders.map((f) => (
              <option key={f.id} value={f.id}>
                📁 {f.name}
              </option>
            ))}
          </select>
        </div>

        {/* Drag & Drop Zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-brand-500 bg-brand-500/10'
              : 'border-slate-800 hover:border-slate-700 bg-slate-950/60'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={(e) => handleFilesAdded(e.target.files)}
            className="hidden"
          />
          <div className="w-12 h-12 rounded-2xl bg-brand-500/10 text-brand-400 flex items-center justify-center mx-auto mb-3">
            <UploadCloud className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-white">
            Click to upload <span className="font-normal text-slate-400">or drag and drop</span>
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Supports Images, Videos, Music, PDFs, Documents, Archives (up to 500 MB)
          </p>
        </div>

        {/* Selected Files List */}
        {selectedFiles.length > 0 && (
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-2">
              <span>Selected Files ({selectedFiles.length})</span>
              <span>
                Total: {formatBytes(selectedFiles.reduce((acc, f) => acc + f.size, 0))}
              </span>
            </div>
            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
              {selectedFiles.map((file, idx) => (
                <div
                  key={`${file.name}-${idx}`}
                  className="flex items-center justify-between p-2.5 bg-slate-950 border border-slate-800/80 rounded-xl text-xs"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <File className="w-4 h-4 text-brand-400 shrink-0" />
                    <span className="text-slate-200 font-medium truncate">{file.name}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-slate-400">{formatBytes(file.size)}</span>
                    {!isUploading && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(idx);
                        }}
                        className="text-slate-400 hover:text-rose-400 transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload Progress Bar */}
        {isUploading && (
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
            <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
              <span className="text-brand-400">Uploading media & extracting tags...</span>
              <span className="text-white">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-brand-500 to-indigo-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleUpload}
            disabled={selectedFiles.length === 0 || isUploading}
            className="px-5 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-500 rounded-xl transition shadow-lg shadow-brand-600/20 disabled:opacity-50 flex items-center gap-2"
          >
            {isUploading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Uploading...
              </>
            ) : (
              `Upload ${selectedFiles.length > 0 ? `(${selectedFiles.length})` : ''}`
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};
