import React, { useState } from 'react';
import {
  ExternalLink,
  Heart,
  Star,
  RefreshCw,
  Trash2,
  Check,
  Eye,
  ShoppingBag,
  MoreVertical,
  Tag,
  AlertCircle,
  Clock,
  Share2,
  Sparkles,
  TrendingDown,
  Layers,
  FolderPlus,
  X,
} from 'lucide-react';
import { SavedProduct } from '../../types/product';
import { formatDate } from '../../utils/formatters';

interface ProductCardProps {
  product: SavedProduct;
  onSelect: (product: SavedProduct) => void;
  onToggleFavorite: (id: string) => void;
  onTogglePurchased: (id: string) => void;
  onRefreshPrice: (id: string) => void;
  onDelete: (id: string) => void;
  onShare?: (product: SavedProduct) => void;
  onAddToSection?: (product: SavedProduct) => void;
  onRemoveFromSection?: (productId: string) => void;
  currentSectionId?: string | null;
  isRefreshing?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onSelect,
  onToggleFavorite,
  onTogglePurchased,
  onRefreshPrice,
  onDelete,
  onShare,
  onAddToSection,
  onRemoveFromSection,
  currentSectionId,
  isRefreshing = false,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Store brand stylings
  const getStoreBadge = (store: string) => {
    const s = (store || '').toLowerCase();
    if (s.includes('amazon')) {
      return {
        name: 'Amazon',
        bg: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
        dot: 'bg-amber-400',
        barGradient: 'from-amber-500 via-orange-500 to-amber-600',
      };
    }
    if (s.includes('flipkart')) {
      return {
        name: 'Flipkart',
        bg: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
        dot: 'bg-blue-400',
        barGradient: 'from-blue-500 via-indigo-500 to-blue-600',
      };
    }
    if (s.includes('myntra')) {
      return {
        name: 'Myntra',
        bg: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
        dot: 'bg-rose-400',
        barGradient: 'from-rose-500 via-pink-500 to-rose-600',
      };
    }
    if (s.includes('ajio')) {
      return {
        name: 'Ajio',
        bg: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
        dot: 'bg-teal-400',
        barGradient: 'from-teal-500 via-cyan-500 to-teal-600',
      };
    }
    if (s.includes('meesho')) {
      return {
        name: 'Meesho',
        bg: 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30',
        dot: 'bg-fuchsia-400',
        barGradient: 'from-fuchsia-500 via-purple-500 to-pink-500',
      };
    }
    if (s.includes('nykaa')) {
      return {
        name: 'Nykaa',
        bg: 'bg-pink-500/15 text-pink-300 border-pink-500/30',
        dot: 'bg-pink-400',
        barGradient: 'from-pink-500 via-rose-500 to-red-500',
      };
    }
    return {
      name: product.store || 'Store',
      bg: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
      dot: 'bg-slate-400',
      barGradient: 'from-brand-500 via-indigo-500 to-purple-500',
    };
  };

  const storeBadge = getStoreBadge(product.store);

  const formatCurrency = (amount?: number | null) => {
    if (amount === undefined || amount === null) return null;
    return `${product.currencySymbol || '₹'}${amount.toLocaleString('en-IN')}`;
  };

  const savings =
    product.originalPrice && product.price && product.originalPrice > product.price
      ? product.originalPrice - product.price
      : 0;

  return (
    <div
      onClick={() => onSelect(product)}
      className="group relative flex flex-col bg-slate-900/85 hover:bg-slate-900 border border-slate-800/80 hover:border-brand-500/40 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-brand-500/10 transition-all duration-300 transform-gpu hover:-translate-y-1 cursor-pointer"
    >
      {/* Top Store Micro-Accent Bar */}
      <div className={`h-1 w-full bg-gradient-to-r ${storeBadge.barGradient}`} />

      {/* Top Image Canvas */}
      <div className="relative w-full h-52 bg-slate-950/70 overflow-hidden flex items-center justify-center p-3 border-b border-slate-800/50">
        {product.imageUrl && !imgError ? (
          <img
            src={product.imageUrl}
            alt={product.title}
            onError={() => setImgError(true)}
            className="w-full h-full object-contain object-center group-hover:scale-108 transition-transform duration-500 ease-out"
            loading="lazy"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-600 gap-2">
            <ShoppingBag className="w-12 h-12 stroke-[1.5]" />
            <span className="text-[11px] font-medium text-slate-500">No preview image</span>
          </div>
        )}

        {/* Badges Stack (Top-Left) */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
          {/* Discount Pill */}
          {product.discountPercent && product.discountPercent > 0 ? (
            <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" />
              <span>-{product.discountPercent}% OFF</span>
            </span>
          ) : null}

          {/* Savings Badge */}
          {savings > 0 && !product.discountPercent ? (
            <span className="px-2 py-0.5 rounded-lg text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 backdrop-blur-md">
              Save {formatCurrency(savings)}
            </span>
          ) : null}

          {/* Purchased Status */}
          {product.isPurchased && (
            <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 backdrop-blur-md shadow-md shadow-emerald-500/10">
              <Check className="w-3 h-3 text-emerald-400" />
              <span>Purchased</span>
            </span>
          )}

          {/* Stock Beacon */}
          {product.inStock ? (
            <span className="px-2 py-0.5 rounded-lg text-[9px] font-bold bg-slate-900/80 border border-slate-700/60 text-emerald-300 backdrop-blur-md flex items-center gap-1.5 shadow-sm">
              <span className="flex h-1.5 w-1.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              <span>In Stock</span>
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 backdrop-blur-md">
              Out of Stock
            </span>
          )}
        </div>

        {/* Top-Right Action Controls (Purchased, Favorite, Share & Menu) */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-10">
          {/* Quick Purchased Toggle */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onTogglePurchased(product.id);
            }}
            className={`p-2 rounded-xl backdrop-blur-md border transition-all cursor-pointer ${
              product.isPurchased
                ? 'bg-emerald-500/30 border-emerald-500/60 text-emerald-300 shadow-md shadow-emerald-500/20'
                : 'bg-slate-900/70 border-slate-700/60 text-slate-400 hover:text-emerald-400 hover:bg-slate-800'
            }`}
            title={product.isPurchased ? 'Move back to Wishlist' : 'Mark as Purchased'}
          >
            <Check className="w-3.5 h-3.5" />
          </button>

          {/* Favorite toggle */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(product.id);
            }}
            className={`p-2 rounded-xl backdrop-blur-md border transition-all cursor-pointer ${
              product.isFavorite
                ? 'bg-rose-500/20 border-rose-500/50 text-rose-400 shadow-md shadow-rose-500/20'
                : 'bg-slate-900/70 border-slate-700/60 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title={product.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart
              className={`w-3.5 h-3.5 ${product.isFavorite ? 'fill-rose-400' : ''}`}
            />
          </button>

          {/* Share button */}
          {onShare && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onShare(product);
              }}
              className="p-2 rounded-xl backdrop-blur-md border bg-slate-900/70 border-slate-700/60 text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Share product"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
          )}

          {/* More options dropdown menu */}
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(!menuOpen);
              }}
              className="p-2 rounded-xl bg-slate-900/70 backdrop-blur-md border border-slate-700/60 text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="More options"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>

            {menuOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-10 w-44 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-1.5 z-30 text-xs animate-fade-in"
              >
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onSelect(product);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800 transition text-left cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-blue-400" />
                  <span>View Details</span>
                </button>

                {onShare && (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onShare(product);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800 transition text-left cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Share Product</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onRefreshPrice(product.id);
                  }}
                  disabled={isRefreshing}
                  className="w-full flex items-center gap-2 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800 transition text-left cursor-pointer"
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
                  onClick={() => {
                    setMenuOpen(false);
                    onTogglePurchased(product.id);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800 transition text-left cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{product.isPurchased ? 'Move to Wishlist' : 'Mark as Purchased'}</span>
                </button>

                {onAddToSection && (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onAddToSection(product);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800 transition text-left cursor-pointer"
                  >
                    <Layers className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Organize Sections</span>
                  </button>
                )}

                {currentSectionId && onRemoveFromSection && (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onRemoveFromSection(product.id);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 transition text-left cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Remove from Section</span>
                  </button>
                )}

                <div className="h-px bg-slate-800 my-1" />

                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete(product.id);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition text-left cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove Product</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        {/* Store, Category & Timestamp */}
        <div className="flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 truncate">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${storeBadge.bg}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${storeBadge.dot}`} />
              <span>{storeBadge.name}</span>
            </span>

            {product.category && (
              <span className="text-[11px] text-slate-400 truncate max-w-[100px]">
                • {product.category}
              </span>
            )}
          </div>

          <span className="text-[10px] text-slate-500 shrink-0">
            {formatDate(product.createdAt)}
          </span>
        </div>

        {/* Brand & Product Title */}
        <div>
          {product.brand && (
            <p className="text-[10px] font-bold tracking-wider text-brand-400 uppercase truncate mb-0.5">
              {product.brand}
            </p>
          )}
          <h3
            className="text-sm font-semibold text-white line-clamp-2 leading-snug group-hover:text-brand-300 transition-colors"
            title={product.title}
          >
            {product.title}
          </h3>
        </div>

        {/* Ratings & Reviews */}
        {product.rating ? (
          <div className="flex items-center gap-1.5 text-xs">
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold text-[10px]">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span>{product.rating}</span>
            </div>
            {product.reviewCount ? (
              <span className="text-[11px] text-slate-500">
                ({product.reviewCount.toLocaleString()} reviews)
              </span>
            ) : null}
          </div>
        ) : null}

        {/* Tags preview (first 2 tags) */}
        {product.tags && product.tags.length > 0 && (
          <div className="flex items-center gap-1 overflow-hidden">
            {product.tags.slice(0, 2).map((t) => (
              <span
                key={t}
                className="px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-400 text-[10px] font-medium truncate max-w-[100px]"
              >
                #{t}
              </span>
            ))}
            {product.tags.length > 2 && (
              <span className="text-[10px] text-slate-500">+{product.tags.length - 2}</span>
            )}
          </div>
        )}

        {/* Pricing & Dual CTAs Area */}
        <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-black text-white tracking-tight font-mono">
                {product.price !== null && product.price !== undefined
                  ? formatCurrency(product.price)
                  : 'Check Store'}
              </span>

              {product.originalPrice &&
                product.price &&
                product.originalPrice > product.price && (
                  <span className="text-xs text-slate-500 line-through font-medium">
                    {formatCurrency(product.originalPrice)}
                  </span>
                )}
            </div>

            {product.targetPrice && (
              <p className="text-[10px] text-amber-400 flex items-center gap-1 mt-0.5 font-medium">
                <AlertCircle className="w-3 h-3" />
                <span>Target: {formatCurrency(product.targetPrice)}</span>
              </p>
            )}
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* View Details CTA */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(product);
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white text-xs font-semibold rounded-xl border border-slate-700/80 transition cursor-pointer"
              title="Open full product page"
            >
              <span>Details</span>
              <Eye className="w-3 h-3 text-brand-400" />
            </button>

            {/* External Store Link Button */}
            <a
              href={product.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-md shadow-brand-500/20 active:scale-95 transition-all"
              title={`Open product on ${product.store}`}
            >
              <span>Buy</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
