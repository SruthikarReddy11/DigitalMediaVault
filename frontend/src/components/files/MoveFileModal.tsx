import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { FileItem, FolderItem } from '../../types';
import { FolderClosed, FolderPlus, Check } from 'lucide-react';
import { foldersApi } from '../../services/foldersApi';
import { filesApi } from '../../services/filesApi';
import { useToast } from '../../contexts/ToastContext';

interface MoveFileModalProps {
  file: FileItem | null;
  isOpen: boolean;
  onClose: () => void;
  onMoved?: (updated: FileItem) => void;
}

export const MoveFileModal: React.FC<MoveFileModalProps> = ({
  file,
  isOpen,
  onClose,
  onMoved,
}) => {
  const { success, error } = useToast();
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [isMoving, setIsMoving] = useState(false);

  useEffect(() => {
    if (isOpen && file) {
      foldersApi.getFolders().then(setFolders).catch(console.error);
      setSelectedFolderId(file.folderId || null);
    }
  }, [isOpen, file]);

  if (!file || !isOpen) return null;

  const handleMove = async () => {
    setIsMoving(true);
    try {
      const updated = await filesApi.moveFile(file.id, selectedFolderId);
      success('File moved successfully!');
      if (onMoved) onMoved(updated);
      onClose();
    } catch (err: any) {
      error(err.message || 'Failed to move file.');
    } finally {
      setIsMoving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Move File" maxWidth="max-w-md">
      <div className="space-y-4">
        <p className="text-xs text-slate-400">
          Select destination folder for <span className="text-white font-medium">"{file.originalName}"</span>:
        </p>

        <div className="max-h-60 overflow-y-auto space-y-1.5 border border-slate-800 rounded-xl p-2 bg-slate-950">
          {/* Root library option */}
          <button
            onClick={() => setSelectedFolderId(null)}
            className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-medium transition ${
              selectedFolderId === null
                ? 'bg-brand-600/20 text-brand-300 border border-brand-500/30'
                : 'hover:bg-slate-900 text-slate-300'
            }`}
          >
            <span className="flex items-center gap-2">
              <FolderClosed className="w-4 h-4 text-slate-400" />
              Root Library (No folder)
            </span>
            {selectedFolderId === null && <Check className="w-4 h-4 text-brand-400" />}
          </button>

          {/* User Folders */}
          {folders.map((f) => (
            <button
              key={f.id}
              onClick={() => setSelectedFolderId(f.id)}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-medium transition ${
                selectedFolderId === f.id
                  ? 'bg-brand-600/20 text-brand-300 border border-brand-500/30'
                  : 'hover:bg-slate-900 text-slate-300'
              }`}
            >
              <span className="flex items-center gap-2 truncate">
                <FolderClosed className="w-4 h-4 text-brand-400 shrink-0" />
                <span className="truncate">{f.name}</span>
              </span>
              {selectedFolderId === f.id && <Check className="w-4 h-4 text-brand-400" />}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isMoving}
            className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleMove}
            disabled={isMoving || selectedFolderId === (file.folderId || null)}
            className="px-5 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-500 rounded-xl transition shadow-lg shadow-brand-600/20 disabled:opacity-50"
          >
            {isMoving ? 'Moving...' : 'Move File'}
          </button>
        </div>
      </div>
    </Modal>
  );
};
