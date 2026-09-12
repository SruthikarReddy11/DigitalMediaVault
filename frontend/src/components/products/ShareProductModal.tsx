import React, { useState, useEffect } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  QrCode,
  Download,
  ExternalLink,
  MessageCircle,
  Send,
  Mail,
  ShoppingBag,
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
import { SavedProduct } from '../../types/product';
import { ShareLinkItem } from '../../types';
import { shareApi } from '../../services/shareApi';
import { productsApi } from '../../services/productsApi';
import { useToast } from '../../contexts/ToastContext';
import { QRCodeDisplayModal } from '../share/QRCodeDisplay';
import { ShareAccessLogsModal } from '../share/ShareAccessLogsModal';
import { formatDateTime } from '../../utils/formatters';

interface ShareProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: SavedProduct | null;
}

export const ShareProductModal: React.FC<ShareProductModalProps> = ({
  isOpen,
  onClose,
  product,
}) => {
  const { success, error } = useToast();

  const [activeTab, setActiveTab] = useState<'vault' | 'active_links' | 'store'>('vault');

  // Vault Share Link Form states
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

  // Active existing links for this product
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

  // Store Direct QR
  const [storeQrCodeUrl, setStoreQrCodeUrl] = useState('');

  // Load existing links for this product
  const loadExistingLinks = async () => {
    if (!product) return;
    try {
      setLoadingExisting(true);
      const links = await shareApi.getMyShares({ productId: product.id });
      setExistingLinks(links);
    } catch {
      // ignore
    } finally {
      setLoadingExisting(false);
    }
  };

  useEffect(() => {
    if (!isOpen || !product) return;

    setTitle(product.title);
    setHasPassword(false);
    setPassword('');
    setShowPassword(false);
    setExpiresOption('7d');
    setCreatedLink(null);
    setCopiedLink(false);
    setCopiedText(false);
    setActiveTab('vault');

    loadExistingLinks();

    // Fallback store QR
    setStoreQrCodeUrl(
      `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
        product.url
      )}`
    );
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  // Handle creating a new Vault Share Link
  const handleCreateShareLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (hasPassword && !password.trim()) {
      error('Please enter a password or disable password protection.');
      return;
    }

    try {
      setIsSubmitting(true);
      const newShare = await shareApi.createShare({
        productId: product.id,
        title: title.trim() || product.title,
        password: hasPassword ? password.trim() : undefined,
        expiresAtOption: expiresOption,
        allowDownload: true,
      });

      setCreatedLink(newShare);
      success('Vault share link created successfully!');
      loadExistingLinks();
    } catch (err: any) {
      error(err.message || 'Failed to generate share link');
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

  const activeShareLink = createdLink || (existingLinks.length > 0 ? existingLinks[0] : null);

  const formattedShareMessage = `🛍️ Check out this deal: *${product.title}*\n` +
    `🏪 Store: ${product.store}\n` +
    `💰 Price: ${product.currencySymbol || '₹'}${product.price?.toLocaleString('en-IN') || 'N/A'}` +
    (product.discountPercent ? ` (${product.discountPercent}% OFF)` : '') +
    (currentVaultUrl ? `\n🔗 View Showcase: ${currentVaultUrl}` : `\n🔗 Buy Link: ${product.url}`);

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
      error('Failed to copy to clipboard.');
    }
  };

  const openQrModal = (link: ShareLinkItem) => {
    const url = getVaultShareUrl(link.token);
    setQrModalData({
      isOpen: true,
      title: link.title || product.title,
      shareUrl: url,
      qrDataUrl: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
        url
      )}`,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-500/20 text-brand-400 border border-brand-500/30">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Share Product Showcase</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-brand-600 to-indigo-600 text-white">
                  VAULT LINK
                </span>
              </h2>
              <p className="text-xs text-slate-400 truncate max-w-xs sm:max-w-md">
                {product.title}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Product Quick Hero Bar */}
        <div className="px-6 py-3 bg-slate-950/60 border-b border-slate-800/80 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 p-1 flex items-center justify-center shrink-0 overflow-hidden">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.title}
                className="w-full h-full object-contain"
              />
            ) : (
              <ShoppingBag className="w-5 h-5 text-slate-600" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white truncate">{product.title}</span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-brand-500/20 text-brand-300 border border-brand-500/30 shrink-0">
                {product.store}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-xs">
              <span className="font-bold text-emerald-400 font-mono">
                {product.currencySymbol || '₹'}
                {product.price?.toLocaleString('en-IN') || '0'}
              </span>
              {product.originalPrice && product.originalPrice > (product.price || 0) && (
                <span className="text-slate-500 line-through text-[11px] font-mono">
                  {product.currencySymbol || '₹'}
                  {product.originalPrice.toLocaleString('en-IN')}
                </span>
              )}
              {product.discountPercent && product.discountPercent > 0 && (
                <span className="text-emerald-400 text-[10px] font-extrabold">
                  ({product.discountPercent}% OFF)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6">
          <button
            type="button"
            onClick={() => setActiveTab('vault')}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-bold border-b-2 transition ${
              activeTab === 'vault'
                ? 'border-brand-500 text-brand-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Link2 className="w-3.5 h-3.5" />
            <span>Generate Vault Link</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('active_links')}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-bold border-b-2 transition ${
              activeTab === 'active_links'
                ? 'border-brand-500 text-brand-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Active Links ({existingLinks.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('store')}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-bold border-b-2 transition ${
              activeTab === 'store'
                ? 'border-brand-500 text-brand-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Direct Store & QR</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[65vh]">
          {/* TAB 1: VAULT SHARE LINK CREATION & RESULT */}
          {activeTab === 'vault' && (
            <div className="space-y-6">
              {/* If a link is created or already exists, display the interactive URL card */}
              {activeShareLink ? (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-brand-950/40 via-slate-900 to-indigo-950/40 border border-brand-500/30 shadow-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-brand-300">
                      <Sparkles className="w-4 h-4 text-brand-400" />
                      <span>Your Vault Showcase Link is Ready!</span>
                    </div>
                    {activeShareLink.hasPassword && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" />
                        <span>Protected</span>
                      </span>
                    )}
                  </div>

                  {/* URL Display with Copy Button */}
                  <div className="flex items-center gap-2 p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                    <input
                      type="text"
                      readOnly
                      value={getVaultShareUrl(activeShareLink.token)}
                      className="bg-transparent text-xs text-brand-300 font-mono flex-1 outline-none truncate select-all"
                    />
                    <button
                      type="button"
                      onClick={() => handleCopy(getVaultShareUrl(activeShareLink.token))}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition shrink-0 active:scale-95"
                    >
                      {copiedLink ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-300" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Actions Row: Open Preview, QR Code, Logs */}
                  <div className="flex items-center gap-2 pt-1 flex-wrap">
                    <a
                      href={getVaultShareUrl(activeShareLink.token)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition border border-slate-700 active:scale-95"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-brand-400" />
                      <span>Preview Page</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => openQrModal(activeShareLink)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition border border-slate-700 active:scale-95"
                    >
                      <QrCode className="w-3.5 h-3.5 text-purple-400" />
                      <span>QR Code</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setLogsModalData({
                          isOpen: true,
                          shareLinkId: activeShareLink.id,
                          title: activeShareLink.title || product.title,
                          token: activeShareLink.token,
                        })
                      }
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition border border-slate-700 active:scale-95"
                    >
                      <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Access Logs</span>
                    </button>
                  </div>
                </div>
              ) : null}

              {/* Form to Create New Share Link */}
              <form onSubmit={handleCreateShareLink} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Share Link Title / Memo
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter a title for this share link..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition"
                  />
                </div>

                {/* Expiration dropdown */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Link Expiration</span>
                  </label>
                  <div className="grid grid-cols-5 gap-2">
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
                        className={`py-2 px-2 rounded-xl text-xs font-bold border transition text-center ${
                          expiresOption === opt.id
                            ? 'bg-brand-500/20 border-brand-500/50 text-brand-300 shadow-sm'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Password Protection Toggle */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-amber-400" />
                      <div>
                        <div className="text-xs font-bold text-white">Password Protection</div>
                        <div className="text-[11px] text-slate-500">
                          Require a password before guests can view this deal
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
                      <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-600"></div>
                    </label>
                  </div>

                  {hasPassword && (
                    <div className="relative pt-1 animate-in fade-in">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter secure password..."
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-200"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-brand-600 via-indigo-600 to-teal-500 hover:from-brand-500 hover:to-teal-400 text-white font-bold text-xs shadow-lg shadow-brand-500/20 active:scale-95 transition disabled:opacity-50 cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                  <span>{isSubmitting ? 'Generating Link...' : 'Create New Vault Share Link'}</span>
                </button>
              </form>

              {/* Social Channels Quick Share */}
              {activeShareLink && (
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="text-xs font-semibold text-slate-400">
                    Send Link Via Apps & Social:
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {/* WhatsApp */}
                    <a
                      href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                        formattedShareMessage
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 transition"
                    >
                      <MessageCircle className="w-5 h-5" />
                      <span className="text-[10px] font-bold">WhatsApp</span>
                    </a>

                    {/* Telegram */}
                    <a
                      href={`https://t.me/share/url?url=${encodeURIComponent(
                        getVaultShareUrl(activeShareLink.token)
                      )}&text=${encodeURIComponent(formattedShareMessage)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-400 transition"
                    >
                      <Send className="w-5 h-5" />
                      <span className="text-[10px] font-bold">Telegram</span>
                    </a>

                    {/* Email */}
                    <a
                      href={`mailto:?subject=${encodeURIComponent(
                        `Product Showcase: ${product.title}`
                      )}&body=${encodeURIComponent(formattedShareMessage)}`}
                      className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition"
                    >
                      <Mail className="w-5 h-5" />
                      <span className="text-[10px] font-bold">Email</span>
                    </a>

                    {/* Copy Deal Card */}
                    <button
                      type="button"
                      onClick={() => handleCopy(formattedShareMessage, true)}
                      className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition"
                    >
                      {copiedText ? (
                        <Check className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <Copy className="w-5 h-5" />
                      )}
                      <span className="text-[10px] font-bold">
                        {copiedText ? 'Copied' : 'Deal Card'}
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ACTIVE LINKS FOR THIS PRODUCT */}
          {activeTab === 'active_links' && (
            <div className="space-y-3">
              {loadingExisting ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Loading active share links...
                </div>
              ) : existingLinks.length === 0 ? (
                <div className="py-12 text-center rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <Share2 className="w-8 h-8 text-slate-600 mx-auto" />
                  <div className="text-xs font-bold text-white">No active links for this product</div>
                  <p className="text-[11px] text-slate-500">
                    Use the "Generate Vault Link" tab to create one.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {existingLinks.map((link) => {
                    const shareUrl = getVaultShareUrl(link.token);
                    return (
                      <div
                        key={link.id}
                        className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 font-mono text-xs text-brand-400 font-bold truncate">
                            <span>/share/{link.token}</span>
                            {link.hasPassword && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                🔒 Password
                              </span>
                            )}
                            {link.isRevoked ? (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                Revoked
                              </span>
                            ) : link.isExpired ? (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                Expired
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                Active
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleCopy(shareUrl)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                              title="Copy URL"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => openQrModal(link)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-300 transition"
                              title="QR Code"
                            >
                              <QrCode className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                setLogsModalData({
                                  isOpen: true,
                                  shareLinkId: link.id,
                                  title: link.title || product.title,
                                  token: link.token,
                                })
                              }
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 transition"
                              title="Access Logs"
                            >
                              <BarChart3 className="w-3.5 h-3.5" />
                            </button>

                            {!link.isRevoked && (
                              <button
                                type="button"
                                onClick={() => handleRevoke(link.id)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition"
                                title="Revoke Link"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleDelete(link.id)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition"
                              title="Delete Link"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                          <span>Views: {link.viewCount}</span>
                          <span>Created {formatDateTime(link.createdAt)}</span>
                          {link.expiresAt && <span>Expires {formatDateTime(link.expiresAt)}</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: DIRECT STORE LINK & QR */}
          {activeTab === 'store' && (
            <div className="space-y-5">
              {/* Direct Store URL */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">
                  Direct Store URL ({product.store})
                </label>
                <div className="flex items-center gap-2 p-2 bg-slate-950 rounded-xl border border-slate-800">
                  <input
                    type="text"
                    readOnly
                    value={product.url}
                    className="bg-transparent text-xs text-slate-300 font-mono flex-1 outline-none truncate select-all"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopy(product.url)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition shrink-0"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </button>
                  <a
                    href={product.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-brand-400 transition"
                    title="Open Store Page"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* Direct Store QR Code */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center text-center space-y-3">
                <div className="p-3 bg-white rounded-xl shadow-md">
                  <img
                    src={storeQrCodeUrl}
                    alt="Store QR Code"
                    className="w-40 h-40 object-contain"
                  />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Scan with Camera to Buy</div>
                  <p className="text-[11px] text-slate-400">
                    Points directly to {product.store} checkout/product page
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Submodal: QR Code Display */}
      {qrModalData.isOpen && (
        <QRCodeDisplayModal
          isOpen={qrModalData.isOpen}
          onClose={() => setQrModalData((prev) => ({ ...prev, isOpen: false }))}
          title={qrModalData.title}
          shareUrl={qrModalData.shareUrl}
          qrDataUrl={qrModalData.qrDataUrl}
        />
      )}

      {/* Submodal: Access Audit Logs */}
      {logsModalData.isOpen && (
        <ShareAccessLogsModal
          isOpen={logsModalData.isOpen}
          onClose={() => setLogsModalData((prev) => ({ ...prev, isOpen: false }))}
          shareLinkId={logsModalData.shareLinkId}
          shareTitle={logsModalData.title}
          shareToken={logsModalData.token}
        />
      )}
    </div>
  );
};
