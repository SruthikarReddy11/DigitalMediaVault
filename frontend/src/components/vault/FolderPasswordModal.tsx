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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in perspective-1000">
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-700/60 w-full max-w-md rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6 relative preserve-3d animate-in zoom-in-95 duration-200 overflow-hidden">
        {/* Ambient 3D Glow */}
        <div
          className="absolute -top-20 -right-20 w-44 h-44 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ backgroundColor: folder.color || '#3b82f6' }}
        />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition active:scale-95"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 3D Floating Folder Header */}
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-xl shrink-0 animate-float-3d relative preserve-3d"
            style={{ backgroundColor: folder.color || '#3b82f6' }}
          >
            <div
              className="absolute -inset-1 rounded-2xl blur opacity-40 -z-10"
              style={{ backgroundColor: folder.color || '#3b82f6' }}
            />
            <FolderClosed className="w-7 h-7 drop-shadow-md" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
              Vault Folder Lock
            </span>
            <h3 className="text-xl font-black text-white truncate">{folder.name}</h3>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
              <Lock className="w-3 h-3 text-amber-400" />
              <span>Password-Protected Access</span>
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Enter Folder Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Type folder password..."
                className="w-full bg-slate-950 border-2 border-slate-800 focus:border-brand-500 rounded-2xl px-4 py-3 text-sm text-slate-200 focus:outline-none pr-11 transition shadow-inner font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white transition"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold rounded-2xl text-xs transition border border-slate-700/60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !password}
              className="flex-1 py-3 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold rounded-2xl text-xs transition btn-3d disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Unlock Folder</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
