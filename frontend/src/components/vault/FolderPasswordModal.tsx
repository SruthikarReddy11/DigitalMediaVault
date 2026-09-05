import React, { useState } from 'react';
import { Lock, Eye, EyeOff, X, ArrowRight, FolderClosed } from 'lucide-react';
import { VaultFolder, VaultCell } from '../../types';
import { vaultApi } from '../../services/vaultApi';
import { useToast } from '../../contexts/ToastContext';

interface FolderPasswordModalProps {
  folder: VaultFolder | null;
  isOpen: boolean;
  onClose: () => void;
  onUnlocked: (data: { folder: VaultFolder; cells: VaultCell[] }) => void;
}

export const FolderPasswordModal: React.FC<FolderPasswordModalProps> = ({
  folder,
  isOpen,
  onClose,
  onUnlocked,
}) => {
  const { error, success } = useToast();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen || !folder) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      error('Please enter the folder password.');
      return;
    }

    setIsLoading(true);
    try {
      const data = await vaultApi.unlockFolder(folder.id, password);
      success(`Unlocked "${folder.name}"`);
      setPassword('');
      onUnlocked(data);
    } catch (err: any) {
      error(err.response?.data?.error?.message || 'Incorrect folder password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0"
            style={{ backgroundColor: folder.color || '#3b82f6' }}
          >
            <FolderClosed className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-white truncate">{folder.name}</h3>
            <p className="text-xs text-slate-400">Password-protected folder</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Enter Folder Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Folder password..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-brand-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none pr-10 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !password}
              className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl text-xs transition shadow-lg shadow-brand-600/25 disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {isLoading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Open Folder</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
