import React, { useState, useEffect } from 'react';
import { Globe, Copy, Check, ExternalLink, Edit2, Trash2, X, Link2, FileText, Video, Image as ImageIcon } from 'lucide-react';
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
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [cell?.url, isOpen]);

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

  // 1. Detect YouTube link
  const getYouTubeId = (rawUrl: string): string | null => {
    try {
      const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=|shorts\/)|youtu\.be\/)([^"&?\/\s]{11})/i;
      const match = rawUrl.match(regExp);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  };

  // 2. Detect Vimeo link
  const getVimeoId = (rawUrl: string): string | null => {
    try {
      const regExp = /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)(?:$|\/|\?)/i;
      const match = rawUrl.match(regExp);
      return match ? match[3] : null;
    } catch {
      return null;
    }
  };

  // 3. Detect Direct Video File
  const isDirectVideo = (rawUrl: string): boolean => {
    try {
      const pathname = new URL(rawUrl).pathname.toLowerCase();
      return /\.(mp4|webm|ogg|mov|m4v|mkv)$/i.test(pathname);
    } catch {
      return /\.(mp4|webm|ogg|mov|m4v|mkv)(\?.*)?$/i.test(rawUrl);
    }
  };

  // 4. Detect Direct Image File
  const isDirectImage = (rawUrl: string): boolean => {
    if (/^data:image\//i.test(rawUrl)) return true;
    try {
      const pathname = new URL(rawUrl).pathname.toLowerCase();
      return /\.(jpg|jpeg|png|gif|webp|svg|bmp|avif|ico)$/i.test(pathname);
    } catch {
      return /\.(jpg|jpeg|png|gif|webp|svg|bmp|avif|ico)(\?.*)?$/i.test(rawUrl);
    }
  };

  const youtubeId = getYouTubeId(cell.url);
  const vimeoId = getVimeoId(cell.url);
  const directVideo = isDirectVideo(cell.url);
  const directImage = isDirectImage(cell.url);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 relative overflow-hidden my-auto max-h-[90vh] flex flex-col">
        {/* Glow accent */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-brand-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition z-10"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Cell Header */}
        <div className="flex items-start gap-3.5 pr-8 shrink-0">
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

        {/* Modal Scrollable Body */}
        <div className="space-y-4 overflow-y-auto pr-1 flex-1">
          {/* Media Preview Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                {youtubeId || vimeoId || directVideo ? (
                  <>
                    <Video className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Video Preview</span>
                  </>
                ) : directImage && !imageFailed ? (
                  <>
                    <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Image Preview</span>
                  </>
                ) : (
                  <>
                    <Globe className="w-3.5 h-3.5 text-slate-400" />
                    <span>Link Type</span>
                  </>
                )}
              </label>
              <span className="text-[10px] text-slate-500 font-mono">
                {youtubeId || vimeoId || directVideo
                  ? 'Embedded Video'
                  : directImage && !imageFailed
                  ? 'Image Media'
                  : 'Web Address'}
              </span>
            </div>

            {/* Case A: YouTube Video */}
            {youtubeId ? (
              <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black border border-slate-800 shadow-xl">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0`}
                  title={cell.title || 'YouTube video preview'}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            ) : vimeoId ? (
              /* Case B: Vimeo Video */
              <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black border border-slate-800 shadow-xl">
                <iframe
                  src={`https://player.vimeo.com/video/${vimeoId}?dnt=1`}
                  title={cell.title || 'Vimeo video preview'}
                  className="w-full h-full border-0"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : directVideo ? (
              /* Case C: Direct HTML5 Video File */
              <div className="relative w-full rounded-2xl overflow-hidden bg-black border border-slate-800 shadow-xl">
                <video
                  src={cell.url}
                  controls
                  playsInline
                  preload="metadata"
                  className="w-full max-h-60 object-contain mx-auto bg-black rounded-2xl"
                >
                  Your browser does not support HTML5 video streaming.
                </video>
              </div>
            ) : directImage && !imageFailed ? (
              /* Case D: Image Thumbnail / Preview */
              <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 p-2 shadow-inner flex items-center justify-center max-h-64">
                <img
                  src={cell.url}
                  alt={cell.title}
                  onError={() => setImageFailed(true)}
                  className="max-h-60 max-w-full rounded-xl object-contain shadow"
                />
              </div>
            ) : (
              /* Case E: Website or Other Link (No Preview Available) */
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/90 flex items-center gap-3.5 shadow-inner">
                <div className="w-11 h-11 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                  <Globe className="w-6 h-6 text-brand-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-white">Website Link</p>
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] text-slate-400 font-mono">
                      Web Page
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                    This is a website link. No preview is available.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Saved Link Section */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5 text-brand-400" />
              <span>Saved Website URL</span>
            </label>
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-mono text-brand-300 break-all select-all shadow-inner leading-relaxed">
              {cell.url}
            </div>
          </div>

          {/* One-Click Copy & Open Actions */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            {/* ONE-CLICK COPY BUTTON */}
            <button
              onClick={handleCopy}
              className={`py-3 px-4 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg active:scale-95 ${
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
              className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700/60 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 active:scale-95 shadow"
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
        </div>

        {/* Footer Actions: Edit & Delete */}
        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs shrink-0">
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
