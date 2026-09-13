import React, { useState, useEffect } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  QrCode,
  ExternalLink,
  MessageCircle,
  Send,
  Mail,
  Layers,
  Sparkles,
  Lock,
  Clock,
  Shield,
  Eye,
  EyeOff,
  RotateCcw,
  BarChart3,
  Trash2,
  AlertCircle,
  Link2,
} from 'lucide-react';
import { ProductSection } from '../../types/product';
import { ShareLinkItem } from '../../types';
import { shareApi } from '../../services/shareApi';
import { useToast } from '../../contexts/ToastContext';
import { QRCodeDisplayModal } from '../share/QRCodeDisplay';
import { ShareAccessLogsModal } from '../share/ShareAccessLogsModal';
import { formatDateTime } from '../../utils/formatters';

interface ShareSectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  section: ProductSection | null;
}

export const ShareSectionModal: React.FC<ShareSectionModalProps> = ({
  isOpen,
  onClose,
  section,
}) => {
  const { success, error } = useToast();

  const [activeTab, setActiveTab] = useState<'create' | 'active_links'>('create');

  // Form states
  const [title, setTitle] = useState('');
  const [hasPassword, setHasPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [expiresOption, setExpiresOption] = useState<'1h' | '1d' | '7d' | '30d' | 'never'>('7d');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Created Link result state
  const [createdLink, setCreatedLink] = useState<ShareLinkItem | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  // Active existing links for this section
  const [existingLinks, setExistingLinks] = useState<ShareLinkItem[]>([]);
  const [loadingExisting, setLoadingExisting] = useState(false);

  // Sub-Modals
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

  // Load existing links for this section
  const loadExistingLinks = async () => {
    if (!section) return;
    try {
      setLoadingExisting(true);
      const links = await shareApi.getMyShares({ productSectionId: section.id });
      setExistingLinks(links);
    } catch {
      // ignore
    } finally {
      setLoadingExisting(false);
    }
  };

  useEffect(() => {
    if (!isOpen || !section) return;

    setTitle(section.name);
    setHasPassword(false);
    setPassword('');
    setShowPassword(false);
    setExpiresOption('7d');
    setCreatedLink(null);
    setCopiedLink(false);
    setCopiedText(false);
    setActiveTab('create');

    loadExistingLinks();
  }, [isOpen, section]);

  if (!isOpen || !section) return null;

  // Handle creating a new Section Share Link
  const handleCreateShareLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (hasPassword && !password.trim()) {
      error('Please enter a password or disable password protection.');
      return;
    }

    try {
      setIsSubmitting(true);
      const payloadTitle = (title.trim() || section.name).slice(0, 300);
      const newShare = await shareApi.createShare({
        productSectionId: section.id,
        title: payloadTitle,
        password: hasPassword && password.trim() ? password.trim() : undefined,
        expiresAtOption: expiresOption,
        allowDownload: true,
      });

      setCreatedLink(newShare);
      success(`Share link created for "${section.name}"!`);
      loadExistingLinks();
    } catch (err: any) {
      const msg =
        err.response?.data?.error?.details?.[0]?.message ||
        err.response?.data?.error?.message ||
        err.message ||
        'Failed to generate section share link';
      error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Revoke a link
  const handleRevoke = async (linkId: string) => {
    try {
      await shareApi.revokeShare(linkId);
      success('Share link revoked.');
      loadExistingLinks();
      if (createdLink?.id === linkId) {
        setCreatedLink((prev) => (prev ? { ...prev, isRevoked: true, status: 'revoked' } : null));
      }
    } catch (err: any) {
      error(err.message || 'Failed to revoke share link');
    }
  };

  // Restore a revoked link
  const handleRestore = async (linkId: string) => {
    try {
      await shareApi.restoreShare(linkId);
      success('Share link restored.');
      loadExistingLinks();
      if (createdLink?.id === linkId) {
        setCreatedLink((prev) => (prev ? { ...prev, isRevoked: false, status: 'active' } : null));
      }
    } catch (err: any) {
      error(err.message || 'Failed to restore share link');
    }
  };

  // Delete a link
  const handleDelete = async (linkId: string) => {
    if (!window.confirm('Delete this share link permanently? Anyone with this URL will lose access.')) {
      return;
    }
    try {
      await shareApi.deleteShare(linkId);
      success('Share link deleted.');
      loadExistingLinks();
      if (createdLink?.id === linkId) {
        setCreatedLink(null);
      }
    } catch (err: any) {
      error(err.message || 'Failed to delete share link');
    }
  };

  const getVaultShareUrl = (token: string) => `${window.location.origin}/share/${token}`;

  const currentVaultUrl = createdLink
    ? getVaultShareUrl(createdLink.token)
    : existingLinks[0]
    ? getVaultShareUrl(existingLinks[0].token)
    : '';

  const formattedShareMessage = `📦 Check out the *"${section.name}"* product section on VaultMedia!\n` +
    `🛍️ Items: ${section.totalItems} product${section.totalItems !== 1 ? 's' : ''}` +
    (section.totalValue && section.totalValue > 0 ? ` (Total: ₹${section.totalValue.toLocaleString('en-IN')})` : '') +
    (section.description ? `\n📝 ${section.description}` : '') +
    (currentVaultUrl ? `\n🔗 View Section & Products: ${currentVaultUrl}` : '');

  const handleCopy = async (text: string, isSummary = false) => {
    try {
      await navigator.clipboard.writeText(text);
      if (isSummary) {
        setCopiedText(true);
        setTimeout(() => setCopiedText(false), 2000);
      } else {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      }
      success('Copied to clipboard!');
    } catch {
      error('Failed to copy');
    }
  };

  const handleOpenQr = async (link: ShareLinkItem) => {
    try {
      const res = await shareApi.getQrCode(link.token);
      setQrModalData({
        isOpen: true,
        title: link.title || section.name,
        shareUrl: res.shareUrl,
        qrDataUrl: res.qrDataUrl,
      });
    } catch (err: any) {
      error('Failed to generate QR code');
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in overflow-y-auto">
        <div className="relative w-full max-w-2xl my-auto rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl shadow-brand-500/10 overflow-hidden flex flex-col max-h-[92vh]">
          {/* Section Banner Header */}
          <div
            className="p-5 sm:p-6 border-b flex items-start justify-between gap-4 relative overflow-hidden"
            style={{
              backgroundColor: `${section.color || '#6366f1'}15`,
              borderColor: `${section.color || '#6366f1'}35`,
            }}
          >
            <div className="flex items-center gap-4 min-w-0">
              <div
                className="w-13 h-13 rounded-2xl flex items-center justify-center text-white shadow-xl shrink-0"
                style={{ backgroundColor: section.color || '#6366f1' }}
              >
                <Layers className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider bg-slate-900/80 text-white border border-slate-700">
                    Product Section
                  </span>
                  {section.isLocked && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      <Lock className="w-3 h-3" />
                      <span>Vault Protected</span>
                    </span>
                  )}
                </div>
                <h2 className="text-lg sm:text-xl font-black text-white truncate tracking-tight mt-1">
                  {section.name}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {section.totalItems} product{section.totalItems !== 1 ? 's' : ''} in section
                  {section.totalValue && section.totalValue > 0 ? ` • ₹${section.totalValue.toLocaleString('en-IN')} value` : ''}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center px-6 pt-3 border-b border-slate-800 bg-slate-900/50 gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('create')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition cursor-pointer ${
                activeTab === 'create'
                  ? 'border-brand-500 text-brand-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Share2 className="w-4 h-4" />
              <span>Share Section</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('active_links')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition cursor-pointer ${
                activeTab === 'active_links'
                  ? 'border-brand-500 text-brand-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Link2 className="w-4 h-4" />
              <span>Active Links</span>
              {existingLinks.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300 font-mono">
                  {existingLinks.length}
                </span>
              )}
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            {activeTab === 'create' && (
              <div className="space-y-6">
                {/* Result Card if Link was just created */}
                {createdLink && (
                  <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-brand-500/10 to-indigo-500/10 border border-emerald-500/30 space-y-3.5 animate-in fade-in zoom-in-95">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs sm:text-sm">
                        <Sparkles className="w-4 h-4" />
                        <span>Share Link Ready! Anyone with this link can view this section and all its products</span>
                      </div>
                      <span className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-mono">
                        Active
                      </span>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800">
                      <input
                        type="text"
                        readOnly
                        value={getVaultShareUrl(createdLink.token)}
                        className="bg-transparent text-xs text-slate-200 w-full px-2 font-mono outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleCopy(getVaultShareUrl(createdLink.token))}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition shrink-0 cursor-pointer active:scale-95"
                      >
                        {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenQr(createdLink)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                        title="Show QR Code"
                      >
                        <QrCode className="w-4 h-4" />
                      </button>
                      <a
                        href={getVaultShareUrl(createdLink.token)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                        title="Open Shared Section in New Tab"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                )}

                {/* Section Preview Card */}
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0"
                      style={{ backgroundColor: section.color || '#6366f1' }}
                    >
                      <Layers className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white leading-tight">{section.name}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {section.totalItems} product{section.totalItems !== 1 ? 's' : ''} organized in this section
                      </p>
                    </div>
                  </div>

                  {section.previewImages && section.previewImages.length > 0 && (
                    <div className="flex items-center -space-x-2 shrink-0">
                      {section.previewImages.slice(0, 3).map((img, idx) => (
                        <img
                          key={idx}
                          src={img}
                          alt=""
                          className="w-8 h-8 rounded-lg object-cover border-2 border-slate-900 bg-slate-800"
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Create Form */}
                <form onSubmit={handleCreateShareLink} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Share Link Title
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. My Favorite Gadgets Collection"
                      maxLength={300}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition"
                    />
                  </div>

                  {/* Password Protection Toggle */}
                  <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                          <Shield className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm font-bold text-white">
                            Password Protection
                          </p>
                          <p className="text-[11px] text-slate-400">
                            Require visitors to enter a password to view this section
                          </p>
                        </div>
                      </div>

                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={hasPassword}
                          onChange={(e) => setHasPassword(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-600" />
                      </label>
                    </div>

                    {hasPassword && (
                      <div className="pt-2">
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Set a password for this link..."
                            className="w-full pl-3.5 pr-10 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Expiration Options */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Link Expiration</span>
                    </label>
                    <div className="grid grid-cols-5 gap-2">
                      {[
                        { label: '1 Hour', value: '1h' },
                        { label: '1 Day', value: '1d' },
                        { label: '7 Days', value: '7d' },
                        { label: '30 Days', value: '30d' },
                        { label: 'Never', value: 'never' },
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setExpiresOption(opt.value as any)}
                          className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition cursor-pointer border ${
                            expiresOption === opt.value
                              ? 'bg-brand-600/20 border-brand-500 text-brand-300'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-brand-600 via-indigo-600 to-teal-500 hover:from-brand-500 hover:via-indigo-500 hover:to-teal-400 text-white font-black text-xs sm:text-sm shadow-xl shadow-brand-500/20 active:scale-[0.99] transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>{isSubmitting ? 'Generating Secure Link...' : 'Generate Section Share Link'}</span>
                  </button>
                </form>

                {/* Direct Social / Messenger Sharing */}
                {currentVaultUrl && (
                  <div className="pt-4 border-t border-slate-800 space-y-3">
                    <p className="text-xs font-bold text-slate-300">Quick Share to Apps</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <a
                        href={`https://api.whatsapp.com/send?text=${encodeURIComponent(formattedShareMessage)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/30 text-emerald-400 text-xs font-bold transition"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>WhatsApp</span>
                      </a>
                      <a
                        href={`https://t.me/share/url?url=${encodeURIComponent(currentVaultUrl)}&text=${encodeURIComponent(`Check out the ${section.name} section!`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-sky-600/15 hover:bg-sky-600/25 border border-sky-500/30 text-sky-400 text-xs font-bold transition"
                      >
                        <Send className="w-4 h-4" />
                        <span>Telegram</span>
                      </a>
                      <a
                        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out the ${section.name} collection on VaultMedia:`)}&url=${encodeURIComponent(currentVaultUrl)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold transition"
                      >
                        <Share2 className="w-4 h-4" />
                        <span>Twitter/X</span>
                      </a>
                      <a
                        href={`mailto:?subject=${encodeURIComponent(`Shared Section: ${section.name}`)}&body=${encodeURIComponent(formattedShareMessage)}`}
                        className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-brand-600/15 hover:bg-brand-600/25 border border-brand-500/30 text-brand-400 text-xs font-bold transition"
                      >
                        <Mail className="w-4 h-4" />
                        <span>Email</span>
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Existing Share Links */}
            {activeTab === 'active_links' && (
              <div className="space-y-4">
                {loadingExisting ? (
                  <div className="py-12 text-center text-xs text-slate-400">Loading links...</div>
                ) : existingLinks.length === 0 ? (
                  <div className="py-12 text-center space-y-3 bg-slate-950/40 rounded-2xl border border-slate-800/80 p-6">
                    <Link2 className="w-8 h-8 text-slate-500 mx-auto" />
                    <p className="text-xs text-slate-400">
                      No active share links for this section yet. Create one from the "Share Section" tab!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {existingLinks.map((link) => (
                      <div
                        key={link.id}
                        className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white truncate">
                              {link.title || section.name}
                            </span>
                            {link.hasPassword && (
                              <span className="p-0.5 rounded bg-amber-500/20 text-amber-400" title="Password Protected">
                                <Lock className="w-3 h-3" />
                              </span>
                            )}
                            <span
                              className={`text-[10px] font-mono px-2 py-0.2 rounded-full border ${
                                link.isRevoked
                                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                                  : link.isExpired
                                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              }`}
                            >
                              {link.status.toUpperCase()}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-[11px] text-slate-400">
                            <span className="font-mono text-brand-400">/share/{link.token}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              <span>{link.viewCount} views</span>
                            </span>
                            <span>•</span>
                            <span>Created {formatDateTime(link.createdAt)}</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                          <button
                            type="button"
                            onClick={() => handleCopy(getVaultShareUrl(link.token))}
                            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
                            title="Copy link"
                          >
                            <Copy className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenQr(link)}
                            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
                            title="QR Code"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setLogsModalData({
                                isOpen: true,
                                shareLinkId: link.id,
                                title: link.title || section.name,
                                token: link.token,
                              })
                            }
                            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
                            title="Access Logs"
                          >
                            <BarChart3 className="w-4 h-4" />
                          </button>

                          {link.isRevoked ? (
                            <button
                              type="button"
                              onClick={() => handleRestore(link.id)}
                              className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition cursor-pointer"
                              title="Restore Link"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleRevoke(link.id)}
                              className="p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 transition cursor-pointer"
                              title="Revoke Link"
                            >
                              <Lock className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleDelete(link.id)}
                            className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition cursor-pointer"
                            title="Delete Permanently"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* QR Code Sub-Modal */}
      {qrModalData.isOpen && (
        <QRCodeDisplayModal
          isOpen={qrModalData.isOpen}
          onClose={() => setQrModalData((prev) => ({ ...prev, isOpen: false }))}
          title={qrModalData.title}
          shareUrl={qrModalData.shareUrl}
          qrDataUrl={qrModalData.qrDataUrl}
        />
      )}

      {/* Access Logs Sub-Modal */}
      {logsModalData.isOpen && (
        <ShareAccessLogsModal
          isOpen={logsModalData.isOpen}
          onClose={() => setLogsModalData((prev) => ({ ...prev, isOpen: false }))}
          shareLinkId={logsModalData.shareLinkId}
          shareTitle={logsModalData.title}
          shareToken={logsModalData.token}
        />
      )}
    </>
  );
};
