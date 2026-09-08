import React, { useState, useEffect } from 'react';
import {
  Share2,
  Lock,
  Clock,
  Download,
  Eye,
  Shield,
  Copy,
  Check,
  QrCode,
  AlertCircle,
  FileText,
  Folder as FolderIcon,
  Trash2,
  RotateCcw,
  List,
  Sparkles,
  ExternalLink,
  ChevronRight,
  BarChart3,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { shareApi } from '../../services/shareApi';
import { FileItem, FolderItem, ShareLinkItem } from '../../types';
import { useToast } from '../../contexts/ToastContext';
import { QRCodeDisplayModal } from './QRCodeDisplay';
import { ShareAccessLogsModal } from './ShareAccessLogsModal';
import { formatDateTime } from '../../utils/formatters';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  file?: FileItem | null;
  folder?: FolderItem | null;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  file,
  folder,
}) => {
  const { success, error } = useToast();

  // Active tab: 'create' | 'existing'
  const [activeTab, setActiveTab] = useState<'create' | 'existing'>('create');

  // Form states
  const [title, setTitle] = useState('');
  const [hasPassword, setHasPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [expiresOption, setExpiresOption] = useState<'1h' | '1d' | '7d' | '30d' | 'never'>('7d');
  const [allowDownload, setAllowDownload] = useState(true);
  const [hasMaxDownloads, setHasMaxDownloads] = useState(false);
  const [maxDownloads, setMaxDownloads] = useState<number>(5);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Existing links
  const [existingLinks, setExistingLinks] = useState<ShareLinkItem[]>([]);
  const [loadingLinks, setLoadingLinks] = useState(false);

  // Newly created link result
  const [createdLink, setCreatedLink] = useState<ShareLinkItem | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // QR Code & Logs modal state
  const [qrModalData, setQrModalData] = useState<{
    isOpen: boolean;
    title: string;
    shareUrl: string;
    qrDataUrl: string;
  }>({
    isOpen: false,
    title: '',
    shareUrl: '',
    qrDataUrl: '',
  });

  const [logsModalData, setLogsModalData] = useState<{
    isOpen: boolean;
    shareLinkId: string;
    title: string;
    token: string;
  }>({
    isOpen: false,
    shareLinkId: '',
    title: '',
    token: '',
  });

  const itemName = file?.originalName || folder?.name || 'Item';
  const itemType = file ? 'File' : 'Folder';

  // Load existing links for this item
  const loadExistingLinks = async () => {
    if (!isOpen || (!file && !folder)) return;
    setLoadingLinks(true);
    try {
      const data = await shareApi.getMyShares({
        fileId: file?.id,
        folderId: folder?.id,
      });
      setExistingLinks(data);
    } catch (err) {
      console.error('Failed to load existing shares:', err);
    } finally {
      setLoadingLinks(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setTitle(itemName);
      setHasPassword(false);
      setPassword('');
      setExpiresOption('7d');
      setAllowDownload(true);
      setHasMaxDownloads(false);
      setMaxDownloads(5);
      setCreatedLink(null);
      setCopiedLink(false);
      loadExistingLinks();
    }
  }, [isOpen, file?.id, folder?.id]);

  const handleCreateShare = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const newShare = await shareApi.createShare({
        fileId: file?.id,
        folderId: folder?.id,
        title: title.trim() || itemName,
        password: hasPassword ? password.trim() : undefined,
        expiresAtOption: expiresOption,
        allowDownload,
        maxDownloads: hasMaxDownloads ? maxDownloads : null,
      });

      setCreatedLink(newShare);
      success('Shareable link generated successfully!');
      loadExistingLinks();
    } catch (err: any) {
      error(err.message || 'Failed to create share link.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getShareUrl = (token: string) => {
    return `${window.location.origin}/share/${token}`;
  };

  const handleCopy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
      success('Share link copied to clipboard!');
    } catch (err) {
      error('Failed to copy link.');
    }
  };

  const handleShowQR = async (token: string, linkTitle?: string) => {
    try {
      const qrRes = await shareApi.getQrCode(token);
      setQrModalData({
        isOpen: true,
        title: linkTitle || itemName,
        shareUrl: qrRes.shareUrl || getShareUrl(token),
        qrDataUrl: qrRes.qrDataUrl,
      });
    } catch (err) {
      error('Failed to generate QR code.');
    }
  };

  const handleRevoke = async (shareId: string) => {
    try {
      await shareApi.revokeShare(shareId);
      success('Share link revoked.');
      loadExistingLinks();
    } catch (err: any) {
      error(err.message || 'Failed to revoke link.');
    }
  };

  const handleRestore = async (shareId: string) => {
    try {
      await shareApi.restoreShare(shareId);
      success('Share link restored.');
      loadExistingLinks();
    } catch (err: any) {
      error(err.message || 'Failed to restore link.');
    }
  };

  const handleDelete = async (shareId: string) => {
    try {
      await shareApi.deleteShare(shareId);
      success('Share link deleted permanently.');
      loadExistingLinks();
    } catch (err: any) {
      error(err.message || 'Failed to delete link.');
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`Share ${itemType}: ${itemName}`}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-5">
          {/* Header Tabs */}
          <div className="flex items-center gap-2 p-1 bg-slate-950/80 rounded-xl border border-slate-800">
            <button
              onClick={() => {
                setActiveTab('create');
                setCreatedLink(null);
              }}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'create'
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Create New Link</span>
            </button>

            <button
              onClick={() => setActiveTab('existing')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'existing'
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Active Links ({existingLinks.length})</span>
            </button>
          </div>

          {/* TAB 1: CREATE SHARE LINK */}
          {activeTab === 'create' && (
            <div>
              {createdLink ? (
                /* Success Generated Screen */
                <div className="space-y-4 p-5 rounded-2xl bg-gradient-to-b from-brand-950/40 via-slate-900/60 to-slate-950/80 border border-brand-500/30 text-center animate-in fade-in zoom-in-95 duration-200">
                  <div className="w-12 h-12 rounded-2xl bg-brand-500/20 border border-brand-500/40 text-brand-400 flex items-center justify-center mx-auto shadow-lg shadow-brand-500/20">
                    <Check className="w-6 h-6 text-brand-300" />
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white">Share Link Generated!</h3>
                    <p className="text-xs text-slate-300 mt-1">
                      Anyone with this link can {createdLink.allowDownload ? 'view and download' : 'view and stream'} this {itemType.toLowerCase()}.
                    </p>
                  </div>

                  {/* URL Display */}
                  <div className="flex items-center gap-2 p-2 bg-slate-950/90 rounded-xl border border-brand-500/30 text-xs text-left">
                    <input
                      type="text"
                      readOnly
                      value={getShareUrl(createdLink.token)}
                      className="flex-1 bg-transparent text-brand-300 font-mono text-xs px-2 py-1 outline-none truncate"
                    />
                    <button
                      onClick={() => handleCopy(getShareUrl(createdLink.token))}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-bold transition text-xs shrink-0 active:scale-95"
                    >
                      {copiedLink ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-300" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Link</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Badges Info */}
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-[11px]">
                    <span className="px-2.5 py-1 rounded-full bg-slate-900 text-slate-300 border border-slate-800 flex items-center gap-1 font-semibold">
                      <Clock className="w-3 h-3 text-cyan-400" />
                      <span>{createdLink.expiresAt ? `Expires: ${formatDateTime(createdLink.expiresAt)}` : 'Never Expires'}</span>
                    </span>

                    {createdLink.hasPassword && (
                      <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-1 font-semibold">
                        <Lock className="w-3 h-3 text-amber-400" />
                        <span>Password Protected</span>
                      </span>
                    )}

                    <span className="px-2.5 py-1 rounded-full bg-slate-900 text-slate-300 border border-slate-800 flex items-center gap-1 font-semibold">
                      <Download className="w-3 h-3 text-emerald-400" />
                      <span>{createdLink.allowDownload ? 'Download Allowed' : 'View Only'}</span>
                    </span>

                    {createdLink.maxDownloads && (
                      <span className="px-2.5 py-1 rounded-full bg-slate-900 text-slate-300 border border-slate-800 flex items-center gap-1 font-semibold">
                        <Shield className="w-3 h-3 text-rose-400" />
                        <span>Max {createdLink.maxDownloads} downloads</span>
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-2.5 pt-2">
                    <button
                      onClick={() => handleShowQR(createdLink.token, createdLink.title || itemName)}
                      className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold transition active:scale-95 border border-white/5"
                    >
                      <QrCode className="w-4 h-4 text-brand-400" />
                      <span>Show QR Code</span>
                    </button>

                    <a
                      href={getShareUrl(createdLink.token)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold transition active:scale-95 border border-white/5"
                    >
                      <ExternalLink className="w-4 h-4 text-emerald-400" />
                      <span>Open Link</span>
                    </a>
                  </div>

                  <button
                    onClick={() => setCreatedLink(null)}
                    className="text-xs text-slate-400 hover:text-slate-200 underline pt-1 cursor-pointer"
                  >
                    Create another link
                  </button>
                </div>
              ) : (
                /* Create Form */
                <form onSubmit={handleCreateShare} className="space-y-4">
                  {/* Link Title */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Share Title
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Title seen by visitors..."
                      className="w-full px-3.5 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition"
                    />
                  </div>

                  {/* Expiration Options */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Link Expiration</span>
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                      {[
                        { id: '1h', label: '1 Hour' },
                        { id: '1d', label: '1 Day' },
                        { id: '7d', label: '7 Days' },
                        { id: '30d', label: '30 Days' },
                        { id: 'never', label: 'Never' },
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setExpiresOption(opt.id as any)}
                          className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition text-center cursor-pointer ${
                            expiresOption === opt.id
                              ? 'bg-brand-500/20 text-brand-300 border-brand-500/50 shadow-sm'
                              : 'bg-slate-950/50 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Password Protection */}
                  <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-amber-400" />
                        <div>
                          <div className="text-xs font-bold text-white">Password Protection</div>
                          <div className="text-[11px] text-slate-400">
                            Require visitors to enter a password to unlock
                          </div>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={hasPassword}
                          onChange={(e) => setHasPassword(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500" />
                      </label>
                    </div>

                    {hasPassword && (
                      <div className="pt-2 animate-in fade-in duration-200">
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter secure share password..."
                            required={hasPassword}
                            className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                          >
                            {showPassword ? 'Hide' : 'Show'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Permission Controls: Allow Download & Max Downloads */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Allow Download */}
                    <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Download className="w-4 h-4 text-emerald-400" />
                        <div>
                          <div className="text-xs font-bold text-white">Allow Download</div>
                          <div className="text-[11px] text-slate-400">
                            {allowDownload ? 'Visitors can download' : 'View-only / stream'}
                          </div>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={allowDownload}
                          onChange={(e) => setAllowDownload(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500" />
                      </label>
                    </div>

                    {/* Max Downloads Limit */}
                    <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-rose-400" />
                          <div>
                            <div className="text-xs font-bold text-white">Download Limit</div>
                            <div className="text-[11px] text-slate-400">Cap max downloads</div>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={hasMaxDownloads}
                            onChange={(e) => setHasMaxDownloads(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-500" />
                        </label>
                      </div>

                      {hasMaxDownloads && (
                        <div className="pt-1 flex items-center gap-2 animate-in fade-in duration-200">
                          <input
                            type="number"
                            min="1"
                            max="1000"
                            value={maxDownloads}
                            onChange={(e) => setMaxDownloads(parseInt(e.target.value) || 1)}
                            className="w-20 px-2 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white text-center font-mono"
                          />
                          <span className="text-[11px] text-slate-400">downloads total</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-brand-600/25 transition active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>{isSubmitting ? 'Generating Link...' : 'Create Secure Share Link'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* TAB 2: ACTIVE / EXISTING LINKS */}
          {activeTab === 'existing' && (
            <div className="space-y-3">
              {loadingLinks ? (
                <div className="space-y-2 py-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-16 bg-slate-900/60 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : existingLinks.length === 0 ? (
                <div className="text-center py-10 bg-slate-950/40 rounded-2xl border border-slate-800">
                  <Share2 className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                  <h4 className="text-sm font-bold text-slate-300">No share links yet</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Generate your first secure link using the Create tab above.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                  {existingLinks.map((link) => (
                    <div
                      key={link.id}
                      className={`p-3.5 rounded-xl border transition ${
                        link.isRevoked
                          ? 'bg-slate-950/40 border-rose-950/60 opacity-70'
                          : link.isExpired
                          ? 'bg-slate-950/40 border-amber-950/60 opacity-80'
                          : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-brand-400">
                              /share/{link.token}
                            </span>
                            {/* Status Badge */}
                            {link.isRevoked ? (
                              <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                                Revoked
                              </span>
                            ) : link.isExpired ? (
                              <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                Expired
                              </span>
                            ) : (
                              <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                Active
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px] text-slate-400">
                            <span className="flex items-center gap-1">
                              <Eye className="w-3 h-3 text-blue-400" />
                              <span>{link.viewCount} views</span>
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Download className="w-3 h-3 text-emerald-400" />
                              <span>
                                {link.downloadCount}
                                {link.maxDownloads ? `/${link.maxDownloads}` : ''} downloads
                              </span>
                            </span>
                            <span>•</span>
                            <span>
                              {link.expiresAt
                                ? `Expires ${formatDateTime(link.expiresAt)}`
                                : 'Never expires'}
                            </span>
                          </div>
                        </div>

                        {/* Quick Action Icons */}
                        <div className="flex items-center gap-1 shrink-0">
                          {/* Copy Link */}
                          <button
                            onClick={() => handleCopy(getShareUrl(link.token))}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                            title="Copy link"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          {/* QR Code */}
                          <button
                            onClick={() => handleShowQR(link.token, link.title || itemName)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-brand-300 hover:text-brand-200 transition cursor-pointer"
                            title="Show QR Code"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                          </button>

                          {/* Visitor Logs */}
                          <button
                            onClick={() =>
                              setLogsModalData({
                                isOpen: true,
                                shareLinkId: link.id,
                                title: link.title || itemName,
                                token: link.token,
                              })
                            }
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-cyan-200 transition cursor-pointer"
                            title="Visitor Audit Logs"
                          >
                            <BarChart3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Revoke / Restore */}
                          {link.isRevoked ? (
                            <button
                              onClick={() => handleRestore(link.id)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-emerald-500/20 text-emerald-400 transition cursor-pointer"
                              title="Restore Link"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleRevoke(link.id)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-rose-400 transition cursor-pointer"
                              title="Revoke Link"
                            >
                              <Shield className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Delete */}
                          <button
                            onClick={() => handleDelete(link.id)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-500 hover:text-rose-400 transition cursor-pointer"
                            title="Delete Permanently"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>

      {/* QR Code Modal */}
      <QRCodeDisplayModal
        isOpen={qrModalData.isOpen}
        onClose={() => setQrModalData((prev) => ({ ...prev, isOpen: false }))}
        title={qrModalData.title}
        shareUrl={qrModalData.shareUrl}
        qrDataUrl={qrModalData.qrDataUrl}
      />

      {/* Visitor Access Logs Modal */}
      <ShareAccessLogsModal
        isOpen={logsModalData.isOpen}
        onClose={() => setLogsModalData((prev) => ({ ...prev, isOpen: false }))}
        shareLinkId={logsModalData.shareLinkId}
        shareTitle={logsModalData.title}
        shareToken={logsModalData.token}
      />
    </>
  );
};
