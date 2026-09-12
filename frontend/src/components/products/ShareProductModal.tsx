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
  Smartphone,
  CheckCircle2,
} from 'lucide-react';
import { SavedProduct } from '../../types/product';
import { productsApi } from '../../services/productsApi';

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
  const [activeTab, setActiveTab] = useState<'social' | 'qr' | 'text'>('social');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [serverFormattedText, setServerFormattedText] = useState('');
  const [loadingQr, setLoadingQr] = useState(false);

  useEffect(() => {
    if (!isOpen || !product) return;

    setCopiedLink(false);
    setCopiedText(false);
    setActiveTab('social');

    // Fetch QR code & formatted share text from backend
    const loadShareData = async () => {
      try {
        setLoadingQr(true);
        const data = await productsApi.getShareData(product.id);
        if (data.qrDataUrl) {
          setQrCodeUrl(data.qrDataUrl);
        } else {
          setQrCodeUrl(
            `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
              product.url
            )}`
          );
        }
        if (data.formattedText) {
          setServerFormattedText(data.formattedText);
        }
      } catch {
        // Fallback QR code
        setQrCodeUrl(
          `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
            product.url
          )}`
        );
      } finally {
        setLoadingQr(false);
      }
    };

    loadShareData();
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  const priceFormatted =
    product.price !== null && product.price !== undefined
      ? `${product.currencySymbol || '₹'}${product.price.toLocaleString('en-IN')}`
      : 'Check Store';

  const discountFormatted =
    product.discountPercent && product.discountPercent > 0
      ? `(${product.discountPercent}% OFF)`
      : '';

  const defaultShareText =
    serverFormattedText ||
    `🛍️ Check out this product on ${product.store}!\n\n*${product.title}*\n💰 Price: ${priceFormatted} ${discountFormatted}\n🔗 Link: ${product.url}`;

  // Copy Link
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(product.url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2200);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  // Copy Formatted Summary
  const handleCopyFormattedText = async () => {
    try {
      await navigator.clipboard.writeText(defaultShareText);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2200);
    } catch (err) {
      console.error('Failed to copy formatted text:', err);
    }
  };

  // Native Web Share API
  const canNativeShare = typeof navigator !== 'undefined' && !!navigator.share;
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.title,
          text: `Check out this product on ${product.store}: ${product.title} at ${priceFormatted} ${discountFormatted}`,
          url: product.url,
        });
      } catch {
        // User cancelled or share failed
      }
    }
  };

  // Social Links
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
    defaultShareText
  )}`;
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(
    product.url
  )}&text=${encodeURIComponent(
    `🛍️ ${product.title} - ${priceFormatted} on ${product.store}`
  )}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    `Check out ${product.title} on ${product.store} for ${priceFormatted}! ${discountFormatted}`
  )}&url=${encodeURIComponent(product.url)}`;
  const emailUrl = `mailto:?subject=${encodeURIComponent(
    `Recommended Product: ${product.title} on ${product.store}`
  )}&body=${encodeURIComponent(defaultShareText)}`;

  const handleDownloadQr = () => {
    if (!qrCodeUrl) return;
    const a = document.createElement('a');
    a.href = qrCodeUrl;
    a.download = `product-qr-${product.title.slice(0, 20).replace(/\s+/g, '_')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-6">
        {/* Top Accent Gradient Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-brand-500 to-indigo-500" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-brand-500/20 text-brand-400 border border-brand-500/30">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Share Product</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Share this item via apps, social media, message or QR code
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Mini Product Preview Card */}
          <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-2xl flex items-center gap-3.5">
            <div className="w-16 h-16 rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center p-1">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.title}
                  className="w-full h-full object-contain"
                />
              ) : (
                <ShoppingBag className="w-6 h-6 text-slate-600" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-500/20 text-brand-300 border border-brand-500/30">
                  {product.store}
                </span>
                {product.discountPercent && product.discountPercent > 0 ? (
                  <span className="text-[10px] font-bold text-emerald-400">
                    -{product.discountPercent}% OFF
                  </span>
                ) : null}
              </div>
              <h4 className="text-xs font-bold text-white truncate" title={product.title}>
                {product.title}
              </h4>
              <p className="text-xs font-extrabold text-emerald-400 mt-0.5">
                {priceFormatted}
              </p>
            </div>
          </div>

          {/* Segmented Navigation Tabs */}
          <div className="flex items-center p-1 bg-slate-950/80 border border-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('social')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition ${
                activeTab === 'social'
                  ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Social & Apps</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('qr')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition ${
                activeTab === 'qr'
                  ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Scan QR Code</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('text')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition ${
                activeTab === 'text'
                  ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Card</span>
            </button>
          </div>

          {/* Tab 1: Social & Apps Share */}
          {activeTab === 'social' && (
            <div className="space-y-4 animate-fade-in">
              {/* Native Mobile Share Sheet Button */}
              {canNativeShare && (
                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-gradient-to-r from-brand-600 via-indigo-600 to-brand-500 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-brand-500/20 active:scale-98 transition"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Share via Device Sheet (WhatsApp, Instagram, AirDrop...)</span>
                </button>
              )}

              {/* Instant Social Channels Grid */}
              <div className="grid grid-cols-2 gap-2.5">
                {/* WhatsApp */}
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-bold transition group"
                >
                  <div className="p-2 rounded-lg bg-emerald-500 text-slate-950 shrink-0">
                    <MessageCircle className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-white font-bold group-hover:text-emerald-300">
                      WhatsApp
                    </span>
                    <span className="text-[10px] text-emerald-400/80">Send to chat</span>
                  </div>
                </a>

                {/* Telegram */}
                <a
                  href={telegramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-300 text-xs font-bold transition group"
                >
                  <div className="p-2 rounded-lg bg-sky-500 text-white shrink-0">
                    <Send className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-white font-bold group-hover:text-sky-300">
                      Telegram
                    </span>
                    <span className="text-[10px] text-sky-400/80">Share channel/chat</span>
                  </div>
                </a>

                {/* Twitter / X */}
                <a
                  href={twitterUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold transition group"
                >
                  <div className="p-2 rounded-lg bg-slate-950 text-white border border-slate-700 shrink-0">
                    <span className="font-bold text-xs">𝕏</span>
                  </div>
                  <div className="min-w-0">
                    <span className="block text-white font-bold group-hover:text-brand-300">
                      X (Twitter)
                    </span>
                    <span className="text-[10px] text-slate-400">Post product</span>
                  </div>
                </a>

                {/* Email */}
                <a
                  href={emailUrl}
                  className="flex items-center gap-3 p-3 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 text-xs font-bold transition group"
                >
                  <div className="p-2 rounded-lg bg-indigo-600 text-white shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-white font-bold group-hover:text-indigo-300">
                      Email
                    </span>
                    <span className="text-[10px] text-indigo-400/80">Send via Mail</span>
                  </div>
                </a>
              </div>

              {/* Direct Link Quick Copy */}
              <div className="pt-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Direct Store Link
                </label>
                <div className="flex items-center gap-2 p-1.5 bg-slate-950/70 border border-slate-800 rounded-xl">
                  <input
                    type="text"
                    readOnly
                    value={product.url}
                    className="flex-1 px-2.5 bg-transparent text-xs text-slate-300 truncate focus:outline-none select-all"
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      copiedLink
                        ? 'bg-emerald-500 text-slate-950 shadow-md'
                        : 'bg-slate-800 hover:bg-slate-700 text-white'
                    }`}
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: QR Code */}
          {activeTab === 'qr' && (
            <div className="flex flex-col items-center text-center space-y-4 py-2 animate-fade-in">
              <p className="text-xs text-slate-400">
                Scan this QR code with any smartphone camera to immediately open the product page
              </p>

              {/* QR Canvas Frame */}
              <div className="p-4 bg-white rounded-2xl shadow-2xl border-4 border-brand-500/30">
                {qrCodeUrl ? (
                  <img
                    src={qrCodeUrl}
                    alt="Product QR Code"
                    className="w-52 h-52 object-contain"
                  />
                ) : (
                  <div className="w-52 h-52 flex items-center justify-center">
                    <QrCode className="w-16 h-16 text-slate-400 animate-pulse" />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleDownloadQr}
                  className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download QR Image</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy URL</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Tab 3: Copy Formatted Card / Text */}
          {activeTab === 'text' && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Formatted Product Message
                  </label>
                  <button
                    type="button"
                    onClick={handleCopyFormattedText}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                      copiedText
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-brand-600 hover:bg-brand-500 text-white'
                    }`}
                  >
                    {copiedText ? (
                      <>
                        <Check className="w-3 h-3" />
                        <span>Copied to Clipboard!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Summary</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-300 font-mono whitespace-pre-line leading-relaxed select-all">
                  {defaultShareText}
                </div>
              </div>

              <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-xl text-xs text-slate-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Ready to paste into WhatsApp, Slack, Discord, Messages, or email!
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between text-xs text-slate-500">
          <span>{product.store} Product Link</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
