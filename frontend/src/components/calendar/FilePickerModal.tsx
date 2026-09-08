import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  Check,
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  HardDrive,
  Loader2,
} from 'lucide-react';
import { filesApi } from '../../services/filesApi';
import { FileItem, FileType } from '../../types';
import { formatBytes } from '../../utils/formatters';
import { getMediaUrl } from '../../services/api';

interface FilePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  alreadySelectedIds: string[];
  onSelectFiles: (selectedFiles: FileItem[]) => void;
}

export const FilePickerModal: React.FC<FilePickerModalProps> = ({
  isOpen,
  onClose,
  alreadySelectedIds,
  onSelectFiles,
}) => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<FileType | 'ALL'>('ALL');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(alreadySelectedIds));

  useEffect(() => {
    if (isOpen) {
      setSelectedIds(new Set(alreadySelectedIds));
      loadFiles();
    }
  }, [isOpen, alreadySelectedIds]);

  const loadFiles = async (query = '', type: FileType | 'ALL' = selectedType) => {
    setLoading(true);
    try {
      const params: any = { limit: 100 };
      if (query.trim()) params.search = query.trim();
      if (type !== 'ALL') params.fileType = type;
      const res = await filesApi.listFiles(params);
      setFiles(res.data || []);
    } catch (err) {
      console.error('Failed to load files:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearch(val);
    loadFiles(val, selectedType);
  };

  const handleTypeChange = (type: FileType | 'ALL') => {
    setSelectedType(type);
    loadFiles(search, type);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleConfirm = () => {
    const selectedFileList = files.filter((f) => selectedIds.has(f.id));
    onSelectFiles(selectedFileList);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/60">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-brand-400" />
              Attach Files from Drive
            </h3>
            <p className="text-xs text-slate-400">
              Select existing media and documents to attach to this event
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter bar */}
        <div className="p-4 border-b border-slate-800 space-y-3 bg-slate-950/40">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search files by name..."
              value={search}
              onChange={handleSearchChange}
              className="w-full pl-9 pr-4 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {(['ALL', 'IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT', 'PDF'] as const).map((t) => (
              <button
                key={t}
                onClick={() => handleTypeChange(t)}
                className={`px-3 py-1 rounded-lg font-medium transition whitespace-nowrap ${
                  selectedType === t
                    ? 'bg-brand-600 text-white shadow-md'
                    : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {t === 'ALL' ? 'All Files' : t}
              </button>
            ))}
          </div>
        </div>

        {/* Files Grid/List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-brand-500 mb-2" />
              <p className="text-xs">Loading files from your library...</p>
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <p className="text-sm">No files found matching your search.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {files.map((file) => {
                const isSelected = selectedIds.has(file.id);
                return (
                  <div
                    key={file.id}
                    onClick={() => toggleSelect(file.id)}
                    className={`flex items-center gap-3 p-2.5 rounded-xl border transition cursor-pointer select-none ${
                      isSelected
                        ? 'bg-brand-500/15 border-brand-500 text-white'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition ${
                        isSelected
                          ? 'bg-brand-600 border-brand-500 text-white'
                          : 'border-slate-700 bg-slate-950'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>

                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center shrink-0 overflow-hidden">
                      {file.fileType === 'IMAGE' ? (
                        <img
                          src={getMediaUrl(file.streamUrl)}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : file.fileType === 'VIDEO' ? (
                        <Video className="w-4 h-4 text-purple-400" />
                      ) : file.fileType === 'AUDIO' ? (
                        <Music className="w-4 h-4 text-amber-400" />
                      ) : (
                        <FileText className="w-4 h-4 text-blue-400" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium truncate">{file.originalName}</p>
                      <p className="text-[10px] text-slate-400">{formatBytes(file.size)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/80">
          <span className="text-xs text-slate-400">
            {selectedIds.size} file{selectedIds.size === 1 ? '' : 's'} selected
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-500/20 transition active:scale-95"
            >
              Attach Selected
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
