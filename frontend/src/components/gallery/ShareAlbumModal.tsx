import React, { useState, useEffect } from 'react';
import {
  Share2,
  Lock,
  Clock,
  Download,
  Shield,
  Copy,
  Check,
  QrCode,
  Sparkles,
  ExternalLink,
  Images,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { PhotoAlbum } from '../../types';
import { galleryApi } from '../../services/galleryApi';
import { shareApi } from '../../services/shareApi';
import { useToast } from '../../contexts/ToastContext';
import { QRCodeDisplayModal } from '../share/QRCodeDisplay';

interface ShareAlbumModalProps {
  isOpen: boolean;
  onClose: () => void;
  album: PhotoAlbum | null;
}

export const ShareAlbumModal: React.FC<ShareAlbumModalProps> = ({
  isOpen,
  onClose,
  album,
}) => {
  const { success, error } = useToast();

  const [title, setTitle] = useState('');
  const [hasPassword, setHasPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [expiresOption, setExpiresOption] = useState<'1h' | '1d' | '7d' | '30d' | 'never'>('7d');
  const [allowDownload, setAllowDownload] = useState(true);
  const [hasMaxDownloads, setHasMaxDownloads] = useState(false);
  const [maxDownloads, setMaxDownloads] = useState<number>(10);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Result
  const [createdShareUrl, setCreatedShareUrl] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    if (isOpen && album) {
      setTitle(`Album: ${album.name}`);
      setHasPassword(false);
      setPassword('');
      setExpiresOption('7d');
      setAllowDownload(true);
      setHasMaxDownloads(false);
      setMaxDownloads(10);
      setCreatedShareUrl(null);
      setCopiedLink(false);
    }
  }, [isOpen, album]);

  const handleCreateShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!album) return;

    setIsSubmitting(true);
    try {
      const res = await galleryApi.shareAlbum(album.id, {
        title: title.trim() || `Album: ${album.name}`,
        password: hasPassword ? password.trim() : undefined,
        expiresAtOption: expiresOption,
        allowDownload,
        maxDownloads: hasMaxDownloads ? maxDownloads : null,
      });

      setCreatedShareUrl(res.shareUrl);
      success('Album share link generated successfully!');

      // Fetch QR code for link
      try {
        const qrRes = await shareApi.getQrCode(res.token);
        setQrDataUrl(qrRes.qrDataUrl);
      } catch (qrErr) {
        console.error('Failed to generate QR:', qrErr);
      }
    } catch (err: any) {
      error(err.message || 'Failed to generate album share link.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyLink = async () => {
    if (!createdShareUrl) return;
    try {
      await navigator.clipboard.writeText(createdShareUrl);
      setCopiedLink(true);
      success('Share link copied to clipboard!');
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      error('Failed to copy link.');
    }
  };

  if (!isOpen || !album) return null;

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Share Photo Album" maxWidth="max-w-lg">
        <div className="space-y-5">
          {/* Album Info Badge */}
          <div className="flex items-center gap-3 p-3 bg-slate-950/60 border border-white/[0.08] rounded-2xl">
            <div className="p-2.5 rounded-xl bg-pink-500/15 border border-pink-500/20 text-pink-400">
              <Images className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{album.name}</p>
              <p className="text-xs text-slate-400">
                {album.photoCount} {album.photoCount === 1 ? 'photo' : 'photos'} inside album
              </p>
            </div>
          </div>

          {createdShareUrl ? (
            /* Share Link Created Screen */
            <div className="space-y-4 animate-in fade-in zoom-in-95">
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl space-y-3 text-center">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Album Link Ready to Share!</h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Anyone with this link can view the photos in this album based on your permissions.
                  </p>
                </div>

                <div className="flex items-center gap-2 bg-slate-950/80 p-2 rounded-xl border border-white/10">
                  <input
                    type="text"
                    readOnly
                    value={createdShareUrl}
                    className="flex-1 bg-transparent text-xs text-slate-200 font-mono focus:outline-none px-2 select-all"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-3 py-1.5 bg-pink-600 hover:bg-pink-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {qrDataUrl && (
                  <button
                    onClick={() => setQrModalOpen(true)}
                    className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
                  >
                    <QrCode className="w-4 h-4 text-pink-400" />
                    <span>View QR Code</span>
                  </button>
                )}
                <a
                  href={createdShareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 text-center"
                >
                  <ExternalLink className="w-4 h-4 text-brand-400" />
                  <span>Open Link</span>
                </a>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={onClose}
                  className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            /* Creation Form */
            <form onSubmit={handleCreateShare} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Link Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={`Album: ${album.name}`}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-pink-500 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none"
                />
              </div>

              {/* Password Protection */}
              <div className="p-3 bg-slate-950/60 border border-white/[0.06] rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-white">
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Password Protection</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasPassword}
                      onChange={(e) => setHasPassword(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-pink-600"></div>
                  </label>
                </div>

                {hasPassword && (
                  <input
                    type="password"
                    required={hasPassword}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter link password..."
                    className="w-full bg-slate-900 border border-slate-700 focus:border-pink-500 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                  />
                )}
              </div>

              {/* Expiration Options */}
              <div className="p-3 bg-slate-950/60 border border-white/[0.06] rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-white">
                  <Clock className="w-3.5 h-3.5 text-blue-400" />
                  <span>Link Expiration</span>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {(['1h', '1d', '7d', '30d', 'never'] as const).map((opt) => (
                    <button
                      type="button"
                      key={opt}
                      onClick={() => setExpiresOption(opt)}
                      className={`py-1.5 text-xs rounded-lg font-medium transition ${
                        expiresOption === opt
                          ? 'bg-pink-600 text-white shadow-md'
                          : 'bg-slate-900 text-slate-400 hover:text-white border border-white/5'
                      }`}
                    >
                      {opt === 'never' ? 'Never' : opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Download Permissions */}
              <div className="p-3 bg-slate-950/60 border border-white/[0.06] rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-white">
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <div>
                    <p>Allow Photo Downloads</p>
                    <p className="text-[10px] text-slate-400 font-normal">
                      Recipients can download individual photos or the full album
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowDownload}
                    onChange={(e) => setAllowDownload(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-pink-600"></div>
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 rounded-xl shadow-lg shadow-pink-600/25 flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Generating...' : 'Create Album Link'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </Modal>

      {/* QR Code Modal */}
      {qrModalOpen && (
        <QRCodeDisplayModal
          isOpen={qrModalOpen}
          onClose={() => setQrModalOpen(false)}
          title={`Album: ${album.name}`}
          shareUrl={createdShareUrl || ''}
          qrDataUrl={qrDataUrl}
        />
      )}
    </>
  );
};
