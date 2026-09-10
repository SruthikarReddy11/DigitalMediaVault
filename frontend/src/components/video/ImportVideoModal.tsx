import React, { useState, useMemo } from 'react';
import {
  Link2,
  Youtube,
  Film,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Tv,
  Globe,
  Loader2,
  Zap,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { filesApi } from '../../services/filesApi';
import { useToast } from '../../contexts/ToastContext';
import { formatDuration } from '../../utils/formatters';

interface ImportVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  folderId?: string | null;
  onSuccess?: () => void;
}

export const ImportVideoModal: React.FC<ImportVideoModalProps> = ({
  isOpen,
  onClose,
  folderId,
  onSuccess,
}) => {
  const { success, error } = useToast();
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [quality, setQuality] = useState('1080p Full HD');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedMeta, setExtractedMeta] = useState<{
    streamUrl: string;
    title: string;
    duration?: number;
    thumbnail?: string;
    quality: string;
    extractor?: string;
    webpageUrl: string;
    formatNote?: string;
  } | null>(null);

  // Helper to extract true destination link if wrapped in redirect query params (e.g. ?url=...)
  const cleanAndResolveUrl = (raw: string) => {
    let candidate = raw.trim();
    if (!candidate) return '';
    try {
      const parsed = new URL(candidate);
      const inner =
        parsed.searchParams.get('url') ||
        parsed.searchParams.get('redirect') ||
        parsed.searchParams.get('target') ||
        parsed.searchParams.get('dest') ||
        parsed.searchParams.get('link');

      if (inner) {
        const decoded = decodeURIComponent(inner);
        if (decoded.startsWith('http://') || decoded.startsWith('https://')) {
          candidate = decoded;
        } else if (decoded.startsWith('/')) {
          candidate = `${parsed.origin}${decoded}`;
        }
      }

      // Clean tracking UTM and affiliate query params
      const finalParsed = new URL(candidate);
      const trackingParams = [
        'utm_source',
        'utm_medium',
        'utm_campaign',
        'utm_term',
        'utm_content',
        'statsUID',
        'wtp',
        'referringDomain',
      ];
      trackingParams.forEach((p) => finalParsed.searchParams.delete(p));
      return finalParsed.toString();
    } catch {
      return candidate;
    }
  };

  const resolvedUrl = useMemo(() => cleanAndResolveUrl(url), [url]);

  // Extract YouTube ID if valid
  const youtubeInfo = useMemo(() => {
    if (!resolvedUrl) return null;
    const match = resolvedUrl.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i);
    if (match && match[1]) {
      return {
        id: match[1],
        thumbnailUrl: `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`,
      };
    }
    return null;
  }, [resolvedUrl]);

  // Detect direct stream or provider format
  const streamFormat = useMemo(() => {
    if (!resolvedUrl) return null;
    if (youtubeInfo) return 'YouTube';
    if (/vimeo\.com/i.test(resolvedUrl)) return 'Vimeo';
    if (/dailymotion\.com/i.test(resolvedUrl)) return 'Dailymotion';
    const clean = resolvedUrl.split('?')[0].toLowerCase();
    if (clean.endsWith('.mp4')) return 'MP4 Video';
    if (clean.endsWith('.webm')) return 'WebM Video';
    if (clean.endsWith('.m3u8')) return 'HLS Live Stream';
    if (clean.endsWith('.mov')) return 'QuickTime Movie';
    if (clean.endsWith('.mkv')) return 'Matroska Video';
    return 'Online Web Video';
  }, [resolvedUrl, youtubeInfo]);

  // Auto-generate title from URL slug if empty
  const autoSuggestedTitle = useMemo(() => {
    if (!resolvedUrl || youtubeInfo) return '';
    try {
      const parsed = new URL(resolvedUrl);
      const segments = parsed.pathname.split('/').filter(Boolean);
      const last = segments[segments.length - 1] || '';
      if (last && !last.endsWith('.mp4') && !last.endsWith('.webm') && !last.endsWith('.m3u8')) {
        return decodeURIComponent(last)
          .replace(/[_-]+/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase())
          .trim();
      }
    } catch {}
    return '';
  }, [resolvedUrl, youtubeInfo]);

  const handleExtractStream = async () => {
    const input = resolvedUrl || url.trim();
    if (!input) {
      error('Please enter a video or web link to extract.');
      return;
    }
    setIsExtracting(true);
    try {
      const data = await filesApi.extractStream(input);
      setExtractedMeta(data);
      setUrl(data.streamUrl);
      if (data.title && !title) setTitle(data.title);
      if (data.quality) setQuality(data.quality);
      success(`Resolved direct stream via yt-dlp (${data.extractor || 'Web Video'})!`);
    } catch (err: any) {
      console.error('Extract failed:', err);
      error(err.response?.data?.message || err.message || 'yt-dlp could not extract a direct stream for this link.');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalUrl = resolvedUrl || url.trim();
    if (!finalUrl) {
      error('Please enter a valid video stream or web link.');
      return;
    }

    try {
      new URL(finalUrl);
    } catch {
      error('Invalid URL format. Please enter a valid http:// or https:// link.');
      return;
    }

    setIsSubmitting(true);
    try {
      const finalTitle = title.trim() || autoSuggestedTitle || undefined;
      await filesApi.importVideoLink({
        url: finalUrl,
        title: finalTitle,
        quality,
        folderId,
      });

      success('Video link successfully saved to your Vault Theater!');
      setUrl('');
      setTitle('');
      window.dispatchEvent(new CustomEvent('pdl_files_updated'));
      onSuccess?.();
      onClose();
    } catch (err: any) {
      console.error('Failed to import video link:', err);
      error(err.response?.data?.message || err.message || 'Failed to save video stream.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickFill = (exampleUrl: string, exampleTitle: string) => {
    setUrl(exampleUrl);
    setTitle(exampleTitle);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Import Video & YouTube Stream"
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Header Tagline */}
        <div className="flex items-center gap-3 p-3.5 bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-slate-900/50 border border-purple-500/20 rounded-2xl">
          <div className="p-2.5 bg-purple-600/20 text-purple-400 rounded-xl border border-purple-500/30 shrink-0">
            <Tv className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>Zero-Redirection In-App Cinema</span>
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            </h4>
            <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
              Import YouTube videos, HLS streams, or direct video links to watch inside this website with full theater controls.
            </p>
          </div>
        </div>

        {/* URL Input */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
            <span>Video Stream or Web Video Link</span>
            {streamFormat && (
              <span className="text-[10px] normal-case font-semibold px-2 py-0.5 rounded-md bg-purple-900/60 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                {youtubeInfo ? <Youtube className="w-3 h-3 text-red-500" /> : <Globe className="w-3 h-3 text-brand-400" />}
                {streamFormat} Detected
              </span>
            )}
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                <Link2 className="w-4 h-4" />
              </div>
              <input
                type="url"
                required
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  setExtractedMeta(null);
                }}
                placeholder="Paste YouTube, web video, or direct stream link..."
                className="w-full bg-slate-950/90 border border-white/[0.08] focus:border-purple-500 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500/30 transition shadow-inner font-mono"
              />
            </div>
            <button
              type="button"
              onClick={handleExtractStream}
              disabled={isExtracting || !url.trim()}
              className="px-3.5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-purple-600/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shrink-0 cursor-pointer"
              title="Auto-Extract Direct Stream (Mode A: Direct Stream via yt-dlp)"
            >
              {isExtracting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span className="hidden sm:inline">Extracting...</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5 text-amber-300" />
                  <span>Extract Stream</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Extracted Stream Preview Card (Mode A) */}
        {extractedMeta && (
          <div className="p-3.5 bg-gradient-to-r from-purple-950/50 via-slate-900/90 to-slate-950 border border-purple-500/40 rounded-2xl flex items-center gap-3.5 shadow-xl animate-in fade-in zoom-in-95">
            {extractedMeta.thumbnail ? (
              <img
                src={extractedMeta.thumbnail}
                alt={extractedMeta.title}
                className="w-24 h-16 object-cover rounded-xl shrink-0 border border-purple-500/20 shadow-md"
              />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center shrink-0">
                <Tv className="w-6 h-6" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 text-[10px] font-mono font-bold border border-purple-500/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-purple-400" />
                  yt-dlp Resolved ({extractedMeta.extractor})
                </span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 text-[10px] font-bold border border-emerald-500/25 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  Mode A: Direct Stream
                </span>
              </div>
              <h5 className="text-xs font-bold text-white truncate mt-1">
                {extractedMeta.title}
              </h5>
              <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400 font-mono">
                <span>{extractedMeta.quality}</span>
                {extractedMeta.duration ? (
                  <>
                    <span>•</span>
                    <span>{formatDuration(extractedMeta.duration)}</span>
                  </>
                ) : null}
                <span>•</span>
                <span className="text-purple-300">{extractedMeta.formatNote}</span>
              </div>
            </div>
          </div>
        )}

        {/* Live Preview If YouTube */}
        {youtubeInfo && (
          <div className="flex items-center gap-3 p-3 bg-slate-900/80 border border-red-500/20 rounded-2xl overflow-hidden backdrop-blur-sm">
            <img
              src={youtubeInfo.thumbnailUrl}
              alt="YouTube preview"
              className="w-24 h-14 object-cover rounded-lg shrink-0 border border-white/10 shadow"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-red-400">
                <Youtube className="w-3.5 h-3.5" />
                <span>YouTube High-Definition Stream</span>
              </div>
              <p className="text-xs text-white font-medium truncate mt-0.5">
                {title || `YouTube Video (${youtubeInfo.id})`}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Streams directly inside the player modal with zero redirection.
              </p>
            </div>
          </div>
        )}

        {/* Title Input */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
            Video Title <span className="text-slate-500 normal-case font-normal">(optional, will auto-generate if empty)</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Interstellar 4K HDR Teaser"
            className="w-full bg-slate-950/90 border border-white/[0.08] focus:border-purple-500 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500/30 transition"
          />
        </div>

        {/* Quality Selector */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
            Display Stream Quality
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: '4K Ultra HD', label: '4K Ultra HD', sub: '2160p HDR' },
              { id: '1080p Full HD', label: '1080p FHD', sub: 'Lossless 60fps' },
              { id: '720p HD', label: '720p HD', sub: 'Standard HD' },
              { id: 'Auto Stream', label: 'Auto Adaptive', sub: 'Dynamic Bitrate' },
            ].map((q) => (
              <button
                key={q.id}
                type="button"
                onClick={() => setQuality(q.id)}
                className={`p-2.5 rounded-xl border text-left transition duration-200 flex flex-col ${
                  quality === q.id
                    ? 'bg-purple-600/20 border-purple-500 text-white shadow-lg shadow-purple-600/20'
                    : 'bg-slate-950/60 border-white/[0.08] text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <span className="text-xs font-bold text-slate-100">{q.label}</span>
                <span className="text-[10px] text-purple-300/80 font-mono mt-0.5">{q.sub}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Example Templates */}
        <div className="pt-1">
          <p className="text-[11px] text-slate-400 font-semibold mb-2">Try sample streams:</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                handleQuickFill(
                  'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                  'Rick Astley - Never Gonna Give You Up (Official Music Video)'
                )
              }
              className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-900 border border-white/[0.08] text-slate-300 hover:text-white hover:border-red-500/40 transition flex items-center gap-1.5"
            >
              <Youtube className="w-3 h-3 text-red-500" />
              <span>Sample YouTube Stream</span>
            </button>
            <button
              type="button"
              onClick={() =>
                handleQuickFill(
                  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
                  'Big Buck Bunny (4K Ultra HD Open Film)'
                )
              }
              className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-900 border border-white/[0.08] text-slate-300 hover:text-white hover:border-purple-500/40 transition flex items-center gap-1.5"
            >
              <Film className="w-3 h-3 text-purple-400" />
              <span>Direct MP4 Stream</span>
            </button>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800/80">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-300 hover:text-white bg-slate-800/70 hover:bg-slate-800 rounded-xl transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !url.trim()}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-bold rounded-xl transition shadow-lg shadow-purple-600/30 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving to Vault...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Save & Stream Video</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
