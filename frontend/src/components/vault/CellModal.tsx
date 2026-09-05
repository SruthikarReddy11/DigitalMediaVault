import React, { useState, useEffect } from 'react';
import { Globe, Link2, X, Bookmark, FileText } from 'lucide-react';
import { VaultCell } from '../../types';
import { vaultApi } from '../../services/vaultApi';
import { useToast } from '../../contexts/ToastContext';

interface CellModalProps {
  folderId: string;
  cell?: VaultCell | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (cell: VaultCell) => void;
}

export const CellModal: React.FC<CellModalProps> = ({
  folderId,
  cell,
  isOpen,
  onClose,
  onSaved,
}) => {
  const { error, success } = useToast();
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (cell) {
      setUrl(cell.url);
      setTitle(cell.title);
      setNotes(cell.notes || '');
    } else {
      setUrl('');
      setTitle('');
      setNotes('');
    }
  }, [cell, isOpen]);

  if (!isOpen) return null;

  // Auto-fill title from URL if empty
  const handleUrlBlur = () => {
    if (!title && url.trim()) {
      try {
        let clean = url.trim();
        if (!/^https?:\/\//i.test(clean)) clean = `https://${clean}`;
        const parsed = new URL(clean);
        const host = parsed.hostname.replace(/^www\./i, '');
        setTitle(host.charAt(0).toUpperCase() + host.slice(1));
      } catch {}
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      error('Please enter a website URL.');
      return;
    }

    setIsLoading(true);
    try {
      if (cell) {
        const updated = await vaultApi.updateCell(cell.id, {
          url: url.trim(),
          title: title.trim() || undefined,
          notes: notes.trim() || undefined,
        });
        success('Link updated successfully!');
        onSaved(updated);
      } else {
        const created = await vaultApi.createCell(folderId, {
          url: url.trim(),
          title: title.trim() || undefined,
          notes: notes.trim() || undefined,
        });
        success('Link saved to cell successfully!');
        onSaved(created);
      }
      onClose();
    } catch (err: any) {
      error(err.response?.data?.error?.message || 'Failed to save link.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-brand-600/20 text-brand-400 border border-brand-500/30 flex items-center justify-center shrink-0">
            <Link2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              {cell ? 'Edit Link Cell' : 'Add Website Link (New Cell)'}
            </h3>
            <p className="text-xs text-slate-400">Save any website URL inside this protected folder</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* Website URL */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Website URL <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                required
                autoFocus
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onBlur={handleUrlBlur}
                placeholder="https://example.com"
                className="w-full bg-slate-950 border border-slate-800 focus:border-brand-500 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-200 focus:outline-none transition"
              />
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Link Title / Name <span className="text-slate-500 font-normal">(Optional)</span>
            </label>
            <div className="relative">
              <Bookmark className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. My Dashboard, Work Mail"
                className="w-full bg-slate-950 border border-slate-800 focus:border-brand-500 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-200 focus:outline-none transition"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Notes / Description <span className="text-slate-500 font-normal">(Optional)</span>
            </label>
            <div className="relative">
              <FileText className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Username, login reminder, or private notes..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-brand-500 rounded-xl pl-10 pr-3.5 py-2 text-sm text-slate-200 focus:outline-none transition resize-none"
              />
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
              disabled={isLoading || !url.trim()}
              className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl text-xs transition shadow-lg shadow-brand-600/25 disabled:opacity-50"
            >
              {isLoading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto block" />
              ) : (
                'Save Link'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
