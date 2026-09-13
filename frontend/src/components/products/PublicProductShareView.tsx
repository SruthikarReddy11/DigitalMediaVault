import React, { useState } from 'react';
import {
  ExternalLink,
  ShoppingBag,
  Star,
  Tag,
  Shield,
  Check,
  Copy,
  QrCode,
  Share2,
  Sparkles,
  Eye,
  Clock,
  Heart,
  MessageCircle,
  Send,
  Mail,
  Maximize2,
  X,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  Info,
} from 'lucide-react';
import { PublicShareData, PublicShareProduct } from '../../types';
import { QRCodeDisplayModal } from '../share/QRCodeDisplay';
import { formatDateTime } from '../../utils/formatters';

interface PublicProductShareViewProps {
  product: PublicShareProduct;
  shareData: PublicShareData;
}

export const PublicProductShareView: React.FC<PublicProductShareViewProps> = ({
  product,
  shareData,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  const images = [
    product.imageUrl,
    ...(product.additionalImages || []),
  ].filter(Boolean) as string[];

  const activeImage = selectedImage || images[0] || '';
  const activeImageIndex = images.indexOf(activeImage);

  // Store Brand Styling
  const getStoreBadge = (storeName: string) => {
    const s = (storeName || '').toLowerCase();
    if (s.includes('amazon')) {
      return {
        name: 'Amazon',
        bg: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
        glow: 'from-amber-500/20 to-orange-500/10',
        accentText: 'text-amber-400',
      };
    }
    if (s.includes('flipkart')) {
      return {
        name: 'Flipkart',
        bg: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
        glow: 'from-blue-500/20 to-cyan-500/10',
        accentText: 'text-blue-400',
      };
    }
    if (s.includes('myntra')) {
      return {
        name: 'Myntra',
        bg: 'bg-pink-500/15 text-pink-300 border-pink-500/30',
        glow: 'from-pink-500/20 to-rose-500/10',
        accentText: 'text-pink-400',
      };
    }
    if (s.includes('ajio')) {
      return {
        name: 'Ajio',
        bg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
        glow: 'from-emerald-500/20 to-teal-500/10',
        accentText: 'text-emerald-400',
      };
    }
    return {
      name: storeName || 'Store',
      bg: 'bg-brand-500/15 text-brand-300 border-brand-500/30',
      glow: 'from-brand-500/20 to-indigo-500/10',
      accentText: 'text-brand-400',
    };
  };

  const storeBadge = getStoreBadge(product.store);

  // Savings calculation
  const savings =
    product.originalPrice && product.price && product.originalPrice > product.price
      ? product.originalPrice - product.price
      : null;

  const currentShareUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentShareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // fallback
    }
  };

  const formattedShareMessage = `🛍️ Check out this deal: *${product.title}*\n` +
    `🏪 Store: ${product.store}\n` +
    `💰 Price: ${product.currencySymbol || '₹'}${product.price?.toLocaleString('en-IN') || 'N/A'}` +
    (product.discountPercent ? ` (${product.discountPercent}% OFF)` : '') +
    `\n🔗 View Deal: ${currentShareUrl}`;

  const handleCopySummary = async () => {
    try {
      await navigator.clipboard.writeText(formattedShareMessage);
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.title,
          text: `Check out ${product.title} on ${product.store}!`,
          url: currentShareUrl,
        });
      } catch {
        // user canceled
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="relative animate-in fade-in zoom-in-95 duration-500 max-w-6xl mx-auto space-y-6">
      {/* Background Ambient Glow */}
      <div
        className={`absolute -inset-4 bg-gradient-to-r ${storeBadge.glow} rounded-3xl blur-3xl opacity-40 -z-10 pointer-events-none transition-all duration-700`}
      />

      {/* Main Glassmorphic Showcase Card */}
      <div className="relative rounded-3xl bg-slate-900/80 backdrop-blur-2xl border border-slate-800/80 shadow-2xl shadow-black/60 overflow-hidden">
        {/* Top Accent Strip */}
        <div className="h-1.5 w-full bg-gradient-to-r from-brand-500 via-indigo-500 to-teal-400" />

        <div className="p-5 sm:p-8 lg:p-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* LEFT: Multi-Angle Interactive Image Gallery (5 Cols on LG) */}
            <div className="lg:col-span-5 space-y-4">
              {/* Primary Showcase Image */}
              <div className="relative group w-full aspect-square bg-slate-950/80 rounded-2xl border border-slate-800/80 overflow-hidden flex items-center justify-center p-4 shadow-inner">
                {activeImage ? (
                  <img
                    src={activeImage}
                    alt={product.title}
                    onClick={() => setIsLightboxOpen(true)}
                    className="max-h-full max-w-full object-contain transition-transform duration-500 group-hover:scale-105 cursor-zoom-in"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-600 gap-2">
                    <ShoppingBag className="w-16 h-16 stroke-1" />
                    <span className="text-xs">No image available</span>
                  </div>
                )}

                {/* Discount Floating Pill */}
                {product.discountPercent && product.discountPercent > 0 ? (
                  <div className="absolute top-3 left-3 px-3 py-1 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-lg shadow-emerald-500/20 flex items-center gap-1 animate-pulse">
                    <TrendingDown className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>{product.discountPercent}% OFF</span>
                  </div>
                ) : null}

                {/* Stock Badge */}
                <div className="absolute top-3 right-3">
                  {product.inStock ? (
                    <span className="px-3 py-1 rounded-xl text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 backdrop-blur-md flex items-center gap-1.5 shadow-sm">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      <span>In Stock</span>
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-xl text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 backdrop-blur-md shadow-sm">
                      Out of Stock
                    </span>
                  )}
                </div>

                {/* Zoom Lightbox Trigger Button */}
                {activeImage && (
                  <button
                    type="button"
                    onClick={() => setIsLightboxOpen(true)}
                    className="absolute bottom-3 right-3 p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-900 text-slate-300 hover:text-white border border-slate-700/60 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg cursor-pointer"
                    title="View Fullscreen"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                )}

                {/* Multi-image photo counter */}
                {images.length > 1 && (
                  <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-slate-950/70 text-slate-300 text-[11px] font-mono border border-slate-800 backdrop-blur-md">
                    {activeImageIndex + 1} / {images.length} Photos
                  </div>
                )}
              </div>

              {/* Thumbnails Carousel Row */}
              {images.length > 1 && (
                <div className="flex items-center gap-2.5 overflow-x-auto pb-1.5 pt-0.5 scrollbar-thin">
                  {images.map((img, idx) => {
                    const isSelected = img === activeImage;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedImage(img)}
                        className={`relative shrink-0 w-16 h-16 rounded-xl border p-1.5 bg-slate-950 transition-all duration-200 cursor-pointer overflow-hidden ${
                          isSelected
                            ? 'border-brand-500 ring-2 ring-brand-500/40 scale-105 shadow-md shadow-brand-500/20'
                            : 'border-slate-800 hover:border-slate-700 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={img}
                          alt={`Thumbnail ${idx + 1}`}
                          className="w-full h-full object-contain"
                        />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* RIGHT: Product Intelligence & Buying Actions (7 Cols on LG) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Top Row: Store Badge + Brand + Rating */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span
                    className={`px-3 py-1 rounded-xl text-xs font-extrabold border shadow-sm ${storeBadge.bg}`}
                  >
                    {storeBadge.name}
                  </span>

                  {product.brand && (
                    <span className="text-xs font-bold text-slate-300 px-2.5 py-1 rounded-xl bg-slate-800/80 border border-slate-700/60">
                      Brand: {product.brand}
                    </span>
                  )}

                  {product.category && (
                    <span className="text-xs text-slate-400 font-medium px-2 py-0.5">
                      • {product.category}
                    </span>
                  )}
                </div>

                {/* Rating Badge */}
                {product.rating ? (
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{product.rating.toFixed(1)}</span>
                    {product.reviewCount ? (
                      <span className="text-slate-400 font-normal text-[11px]">
                        ({product.reviewCount.toLocaleString('en-IN')} reviews)
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </div>

              {/* Product Title */}
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight leading-snug">
                  {product.title}
                </h1>
                {product.description && (
                  <p className="text-xs sm:text-sm text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                    {product.description}
                  </p>
                )}
              </div>

              {/* Pricing Showcase Block */}
              <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-slate-950/90 via-slate-900/90 to-slate-950/90 border border-slate-800 shadow-xl space-y-3">
                <div className="flex items-baseline gap-3 flex-wrap">
                  {product.price !== undefined && product.price !== null ? (
                    <span className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white font-mono">
                      {product.currencySymbol || '₹'}
                      {product.price.toLocaleString('en-IN')}
                    </span>
                  ) : (
                    <span className="text-2xl font-bold text-slate-400">Price not available</span>
                  )}

                  {product.originalPrice && product.originalPrice > (product.price || 0) && (
                    <span className="text-base sm:text-lg text-slate-500 line-through font-mono font-medium">
                      {product.currencySymbol || '₹'}
                      {product.originalPrice.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>

                {/* Savings Pill */}
                {savings && savings > 0 && (
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm font-bold animate-in fade-in">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span>
                      You Save {product.currencySymbol || '₹'}
                      {savings.toLocaleString('en-IN')}
                      {product.discountPercent ? ` (${product.discountPercent}% OFF)` : ''}
                    </span>
                  </div>
                )}
              </div>

              {/* Curator Notes (if any) */}
              {product.notes && (
                <div className="p-4 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-xs sm:text-sm text-brand-200/90 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-brand-300 text-xs uppercase tracking-wider">
                    <Info className="w-3.5 h-3.5" />
                    <span>Curator Note</span>
                  </div>
                  <p className="italic leading-relaxed">"{product.notes}"</p>
                </div>
              )}

              {/* Tags */}
              {product.tags && product.tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  {product.tags.map((t, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-800/80 text-slate-300 border border-slate-700/60 flex items-center gap-1"
                    >
                      <Tag className="w-3 h-3 text-brand-400" />
                      <span>{t}</span>
                    </span>
                  ))}
                </div>
              )}

              {/* Primary Call To Actions */}
              <div className="space-y-3 pt-2">
                {/* Hero External Store Button */}
                <a
                  href={product.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative group w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-gradient-to-r from-brand-600 via-indigo-600 to-teal-500 hover:from-brand-500 hover:via-indigo-500 hover:to-teal-400 text-white font-black text-sm sm:text-base shadow-xl shadow-brand-500/25 active:scale-[0.98] transition-all duration-200 cursor-pointer overflow-hidden"
                >
                  {/* Subtle shine animation effect */}
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

                  <ShoppingBag className="w-5 h-5 text-white" />
                  <span>Visit {storeBadge.name} & Buy Now</span>
                  <ExternalLink className="w-4 h-4 text-white/80 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </a>

                {/* Secondary Actions Row: Share Deal, QR Code, Copy Link */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={handleNativeShare}
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 hover:text-white text-xs font-bold transition shadow-sm cursor-pointer active:scale-95"
                  >
                    <Share2 className="w-4 h-4 text-brand-400" />
                    <span>Share Deal</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsQrModalOpen(true)}
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 hover:text-white text-xs font-bold transition shadow-sm cursor-pointer active:scale-95"
                  >
                    <QrCode className="w-4 h-4 text-purple-400" />
                    <span>Scan QR Code</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 hover:text-white text-xs font-bold transition shadow-sm cursor-pointer active:scale-95"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-300">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-slate-400" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Social Channels Quick-Share Strip */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-3 flex-wrap text-xs text-slate-400">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Direct Share:
                </span>
                <div className="flex items-center gap-2">
                  {/* WhatsApp */}
                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                      formattedShareMessage
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition shadow-sm"
                    title="Share on WhatsApp"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </a>

                  {/* Telegram */}
                  <a
                    href={`https://t.me/share/url?url=${encodeURIComponent(
                      currentShareUrl
                    )}&text=${encodeURIComponent(formattedShareMessage)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 transition shadow-sm"
                    title="Share on Telegram"
                  >
                    <Send className="w-4 h-4" />
                  </a>

                  {/* Email */}
                  <a
                    href={`mailto:?subject=${encodeURIComponent(
                      `Deal: ${product.title}`
                    )}&body=${encodeURIComponent(formattedShareMessage)}`}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition shadow-sm"
                    title="Share via Email"
                  >
                    <Mail className="w-4 h-4" />
                  </a>

                  {/* Copy Formatted Text Card */}
                  <button
                    type="button"
                    onClick={handleCopySummary}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] font-medium transition flex items-center gap-1.5"
                    title="Copy formatted deal text"
                  >
                    {copiedSummary ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                    )}
                    <span>{copiedSummary ? 'Copied Card' : 'Copy Card'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Meta Strip */}
        <div className="px-6 py-4 bg-slate-950/80 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-md">
              {shareData.owner.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <span className="text-white font-semibold">{shareData.owner.name}</span>
              <span className="text-slate-500 ml-1.5">• Digital Media Vault Shared Item</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-500 font-mono">
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5 text-slate-400" />
              <span>{shareData.viewCount.toLocaleString()} views</span>
            </span>

            {shareData.expiresAt && (
              <span className="flex items-center gap-1 text-amber-400/80">
                <Clock className="w-3.5 h-3.5" />
                <span>Expires {formatDateTime(shareData.expiresAt)}</span>
              </span>
            )}

            <span className="flex items-center gap-1 text-emerald-400/80">
              <Shield className="w-3.5 h-3.5" />
              <span>Verified Link</span>
            </span>
          </div>
        </div>
      </div>

      {/* Lightbox Fullscreen Modal */}
      {isLightboxOpen && activeImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-fade-in">
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              className="absolute -top-12 right-0 p-2.5 rounded-full bg-slate-800/90 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={activeImage}
              alt={product.title}
              className="max-h-[80vh] max-w-full object-contain rounded-2xl shadow-2xl border border-slate-800"
            />
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {isQrModalOpen && (
        <QRCodeDisplayModal
          isOpen={isQrModalOpen}
          onClose={() => setIsQrModalOpen(false)}
          title={product.title}
          shareUrl={currentShareUrl}
          qrDataUrl={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
            currentShareUrl
          )}`}
        />
      )}
    </div>
  );
};
