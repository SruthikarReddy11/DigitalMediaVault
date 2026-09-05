import React, { useState } from 'react';
import { Globe, Copy, Check, ExternalLink, Edit2, Trash2, X, Link2, FileText } from 'lucide-react';
import { VaultCell } from '../../types';
import { useToast } from '../../contexts/ToastContext';

interface ViewCellModalProps {
  cell: VaultCell | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (cell: VaultCell) => void;
  onDelete: (cell: VaultCell) => void;
}

export const ViewCellModal: React.FC<ViewCellModalProps> = ({
  cell,
  isOpen,
  onClose,
  onEdit,
  onDelete,
}) => {
  const { success } = useToast();
  const [copied, setCopied] = useState(false);

  if (!isOpen || !cell) return null;

  const getDomain = (url: string) => {
    try {
      const parsed = new URL(url);
      return parsed.hostname.replace(/^www\./i, '');
    } catch {
      return url;
    }
  };

  const domain = getDomain(cell.url);

  const handleCopy = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    navigator.clipboard.writeText(cell.url);
    setCopied(true);
    success('Link copied to clipboard in one click!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpen = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    window.open(cell.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6 relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-brand-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Cell Header */}
        <div className="flex items-start gap-3.5 pr-8">
          <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0 overflow-hidden shadow-inner p-2">
            <img
              src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`}
              alt=""
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
              className="w-full h-full object-contain"
            />
            <Globe className="w-6 h-6 text-brand-400 hidden" />
          </div>

          <div className="min-w-0">
            <h3 className="text-xl font-bold text-white tracking-tight leading-snug truncate">
              {cell.title}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 font-mono truncate">
              {domain}
            </p>
          </div>
        </div>

        {/* Saved Link Section */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Link2 className="w-3.5 h-3.5 text-brand-400" />
            <span>Saved Website URL</span>
          </label>
          <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-mono text-brand-300 break-all select-all shadow-inner leading-relaxed">
            {cell.url}
          </div>
        </div>

        {/* One-Click Copy & Open Actions */}
        <div className="grid grid-cols-2 gap-3">
          {/* ONE-CLICK COPY BUTTON */}
          <button
            onClick={handleCopy}
            className={`py-3.5 px-4 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg active:scale-95 ${
              copied
                ? 'bg-emerald-600 text-white ring-2 ring-emerald-400'
                : 'bg-brand-600 hover:bg-brand-500 text-white shadow-brand-600/30'
            }`}
            title="Copy link to clipboard in one click"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-white" />
                <span>Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Link</span>
              </>
            )}
          </button>

          {/* OPEN WEBSITE IN NEW TAB */}
          <button
            onClick={handleOpen}
            className="py-3.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700/60 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 active:scale-95 shadow"
            title="Open link in new browser tab"
          >
            <ExternalLink className="w-4 h-4 text-brand-400" />
            <span>Open Website</span>
          </button>
        </div>

        {/* Optional Notes */}
        {cell.notes && (
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>Notes</span>
            </label>
            <p className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-2xl border border-slate-800 leading-relaxed whitespace-pre-wrap">
              {cell.notes}
            </p>
          </div>
        )}

        {/* Footer Actions: Edit & Delete */}
        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onEdit(cell);
              }}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1.5 font-medium"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Link</span>
            </button>
            <button
              onClick={() => {
                onClose();
                onDelete(cell);
              }}
              className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition flex items-center gap-1.5 font-medium border border-rose-500/20"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
