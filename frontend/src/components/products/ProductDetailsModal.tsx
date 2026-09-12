import React, { useState } from 'react';
import {
  X,
  ExternalLink,
  Heart,
  Star,
  RefreshCw,
  Trash2,
  Check,
  Tag,
  AlertCircle,
  Calendar,
  DollarSign,
  ShoppingBag,
  Share2,
  Edit2,
  Sparkles,
} from 'lucide-react';
import { SavedProduct } from '../../types/product';
import { formatDate } from '../../utils/formatters';

interface ProductDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: SavedProduct | null;
  onToggleFavorite: (id: string) => void;
  onTogglePurchased: (id: string) => void;
  onRefreshPrice: (id: string) => void;
  onDelete: (id: string) => void;
  isRefreshing?: boolean;
}

export const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({
  isOpen,
  onClose,
  product,
  onToggleFavorite,
  onTogglePurchased,
  onRefreshPrice,
  onDelete,
  isRefreshing = false,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  if (!isOpen || !product) return null;

  const currentImg = selectedImage || product.imageUrl;
  const allImages = [
    product.imageUrl,
    ...(product.additionalImages || []),
  ].filter(Boolean) as string[];

  const formatCurrency = (amount?: number | null) => {
    if (amount === undefined || amount === null) return null;
    return `${product.currencySymbol || '₹'}${amount.toLocaleString('en-IN')}`;
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(product.url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-brand-500/20 text-brand-300 border border-brand-500/30">
              {product.store}
            </span>
            {product.category && (
              <span className="text-xs text-slate-400 font-medium">
                • {product.category}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onToggleFavorite(product.id)}
              className={`p-2 rounded-xl border transition ${
                product.isFavorite
                  ? 'bg-rose-500/20 border-rose-500/50 text-rose-400'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
              }`}
              title="Toggle Favorite"
            >
              <Heart className={`w-4 h-4 ${product.isFavorite ? 'fill-rose-400' : ''}`} />
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition"
              title="Copy Product Link"
            >
              <Share2 className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[75vh]">
          {/* Main Visual & Price Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Image Gallery */}
            <div className="space-y-3">
              <div className="w-full h-64 bg-slate-950/80 border border-slate-800 rounded-2xl flex items-center justify-center p-4 overflow-hidden">
                {currentImg ? (
                  <img
                    src={currentImg}
                    alt={product.title}
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <ShoppingBag className="w-12 h-12 text-slate-600" />
                )}
              </div>

              {allImages.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {allImages.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedImage(img)}
                      className={`w-12 h-12 rounded-lg bg-slate-950 border overflow-hidden p-0.5 shrink-0 transition ${
                        currentImg === img
                          ? 'border-brand-500 ring-2 ring-brand-500/30'
                          : 'border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <img
                        src={img}
                        alt="Thumbnail"
                        className="w-full h-full object-contain"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Meta & Pricing */}
            <div className="flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                {product.brand && (
                  <p className="text-xs font-bold text-brand-400 tracking-wider uppercase">
                    {product.brand}
                  </p>
                )}
                <h2 className="text-base font-bold text-white leading-snug">
                  {product.title}
                </h2>

                {/* Rating & Reviews */}
                {product.rating ? (
                  <div className="flex items-center gap-2 text-xs">
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{product.rating}</span>
                    </div>
                    {product.reviewCount ? (
                      <span className="text-slate-400 text-xs">
                        ({product.reviewCount.toLocaleString()} ratings & reviews)
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </div>

              {/* Price Details Card */}
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-slate-400 font-medium">Price</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-white">
                      {product.price !== null && product.price !== undefined
                        ? formatCurrency(product.price)
                        : 'Check Store'}
                    </span>
                    {product.originalPrice &&
                      product.price &&
                      product.originalPrice > product.price && (
                        <span className="text-xs text-slate-500 line-through">
                          {formatCurrency(product.originalPrice)}
                        </span>
                      )}
                  </div>
                </div>

                {product.discountPercent && product.discountPercent > 0 ? (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">Discount</span>
                    <span className="text-emerald-400 font-bold">
                      {product.discountPercent}% OFF
                    </span>
                  </div>
                ) : null}

                {product.targetPrice && (
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/80">
                    <span className="text-amber-400 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Target Alert Price
                    </span>
                    <span className="font-bold text-amber-300">
                      {formatCurrency(product.targetPrice)}
                    </span>
                  </div>
                )}
              </div>

              {/* Main Store CTA */}
              <a
                href={product.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-brand-600 via-indigo-600 to-brand-500 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-brand-500/25 active:scale-95 transition"
              >
                <span>View on {product.store}</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Description / Overview */}
          {product.description && (
            <div className="space-y-1.5 pt-2 border-t border-slate-800">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Description & Specifications
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed max-h-36 overflow-y-auto whitespace-pre-line">
                {product.description}
              </p>
            </div>
          )}

          {/* User Notes */}
          {product.notes && (
            <div className="p-3.5 bg-slate-950/40 border border-slate-800 rounded-xl space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Your Notes
              </span>
              <p className="text-xs text-slate-300">{product.notes}</p>
            </div>
          )}

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-800">
              <span className="text-xs text-slate-500 font-semibold mr-1">Tags:</span>
              {product.tags.map((t) => (
                <span
                  key={t}
                  className="px-2.5 py-0.5 rounded-lg bg-slate-800 text-[11px] text-slate-300 font-medium"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}

          {/* Footer Metadata & Action Buttons */}
          <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <span>Saved on {formatDate(product.createdAt)}</span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onRefreshPrice(product.id)}
                disabled={isRefreshing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 text-brand-400 ${
                    isRefreshing ? 'animate-spin' : ''
                  }`}
                />
                <span>Refresh Price</span>
              </button>

              <button
                type="button"
                onClick={() => onTogglePurchased(product.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold border transition ${
                  product.isPurchased
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                }`}
              >
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>{product.isPurchased ? 'Purchased' : 'Mark Bought'}</span>
              </button>

              <button
                type="button"
                onClick={() => onDelete(product.id)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                title="Delete Product"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
