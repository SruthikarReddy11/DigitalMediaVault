import React, { useState } from 'react';
import { FolderPlus, Lock, Eye, EyeOff, X } from 'lucide-react';
import { VaultFolder } from '../../types';
import { vaultApi } from '../../services/vaultApi';
import { useToast } from '../../contexts/ToastContext';

interface CreateFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (folder: VaultFolder) => void;
}

const COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#8b5cf6', // purple
  '#f59e0b', // amber
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f43f5e', // rose
];

export const CreateFolderModal: React.FC<CreateFolderModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const { error, success } = useToast();
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      error('Folder name is required.');
      return;
    }
    if (!password || password.length < 4) {
      error('Folder password must be at least 4 characters.');
      return;
    }

    setIsLoading(true);
    try {
      const created = await vaultApi.createFolder({
        name: name.trim(),
        password,
        description: description.trim() || undefined,
        color,
      });
      success(`Password-protected folder "${created.name}" created!`);
      setName('');
      setPassword('');
      setDescription('');
      onCreated(created);
      onClose();
    } catch (err: any) {
      error(err.response?.data?.error?.message || 'Failed to create folder.');
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
            style={{ backgroundColor: color }}
          >
            <FolderPlus className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Create Protected Folder</h3>
            <p className="text-xs text-slate-400">Set a custom password to protect this folder's links</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Folder Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Banking, Work Tools, Social Accounts"
              className="w-full bg-slate-950 border border-slate-800 focus:border-brand-500 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none transition"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              Folder Password <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 4 characters..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-brand-500 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none pr-10 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              This password will be required each time you open this folder.
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Description <span className="text-slate-500 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-brand-500 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none transition"
            />
          </div>

          {/* Color Accent */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Folder Accent Color
            </label>
            <div className="flex gap-2.5">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-transform ${
                    color === c ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
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
              disabled={isLoading || !name.trim() || password.length < 4}
              className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl text-xs transition shadow-lg shadow-brand-600/25 disabled:opacity-50"
            >
              {isLoading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto block" />
              ) : (
                'Create Folder'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
