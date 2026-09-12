import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ExternalLink,
  Heart,
  Check,
  CheckCircle2,
  Share2,
  RefreshCw,
  Trash2,
  Star,
  Tag,
  AlertCircle,
  TrendingDown,
  ShieldCheck,
  Calendar,
  DollarSign,
  ShoppingBag,
  Eye,
  Edit3,
  Save,
  X,
  Copy,
  Sparkles,
  Layers,
  Info,
  Clock,
} from 'lucide-react';
import { productsApi } from '../services/productsApi';
import { SavedProduct } from '../types/product';
import { useToast } from '../contexts/ToastContext';
import { formatDate } from '../utils/formatters';
import { ShareProductModal } from '../components/products/ShareProductModal';

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { success, error, info } = useToast();

  // Initialize with location state if available for instant render
  const initialProduct = (location.state as { product?: SavedProduct })?.product || null;
  const [product, setProduct] = useState<SavedProduct | null>(initialProduct);
  const [isLoading, setIsLoading] = useState(!initialProduct);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Notes & Target Price editing state
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesInput, setNotesInput] = useState('');
  const [isEditingTargetPrice, setIsEditingTargetPrice] = useState(false);
  const [targetPriceInput, setTargetPriceInput] = useState('');
  const [isEditingTags, setIsEditingTags] = useState(false);
  const [tagsList, setTagsList] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [isSavingEdits, setIsSavingEdits] = useState(false);

  // Delete confirmation
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const fetchProduct = useCallback(async () => {
    if (!id) return;
    try {
      if (!product) setIsLoading(true);
      const data = await productsApi.getProductById(id);
      setProduct(data);
      setNotesInput(data.notes || '');
      setTargetPriceInput(data.targetPrice ? String(data.targetPrice) : '');
      setTagsList(data.tags || []);
    } catch (err: any) {
      console.error('Failed to load product:', err);
      error(err.message || 'Product not found or failed to load');
    } finally {
      setIsLoading(false);
    }
  }, [id, error]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  useEffect(() => {
    if (product) {
      setNotesInput(product.notes || '');
      setTargetPriceInput(product.targetPrice ? String(product.targetPrice) : '');
      setTagsList(product.tags || []);
    }
  }, [product]);

  // Store Brand Theme
  const getStoreTheme = (storeName?: string) => {
    const s = (storeName || '').toLowerCase();
    if (s.includes('amazon')) {
      return {
        name: 'Amazon',
        color: '#ff9900',
        badgeBg: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
        dotBg: 'bg-amber-400',
        glow: 'shadow-amber-500/10',
        heroGradient: 'from-amber-500/20 via-slate-900 to-slate-950',
      };
    }
    if (s.includes('flipkart')) {
      return {
        name: 'Flipkart',
        color: '#2874f0',
        badgeBg: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
        dotBg: 'bg-blue-400',
        glow: 'shadow-blue-500/10',
        heroGradient: 'from-blue-600/20 via-slate-900 to-slate-950',
      };
    }
    if (s.includes('myntra')) {
      return {
        name: 'Myntra',
        color: '#ff3f6c',
        badgeBg: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
        dotBg: 'bg-rose-400',
        glow: 'shadow-rose-500/10',
        heroGradient: 'from-rose-500/20 via-slate-900 to-slate-950',
      };
    }
    if (s.includes('ajio')) {
      return {
        name: 'Ajio',
        color: '#00ced1',
        badgeBg: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
        dotBg: 'bg-teal-400',
        glow: 'shadow-teal-500/10',
        heroGradient: 'from-teal-500/20 via-slate-900 to-slate-950',
      };
    }
    if (s.includes('meesho')) {
      return {
        name: 'Meesho',
        color: '#f43397',
        badgeBg: 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30',
        dotBg: 'bg-fuchsia-400',
        glow: 'shadow-fuchsia-500/10',
        heroGradient: 'from-fuchsia-500/20 via-slate-900 to-slate-950',
      };
    }
    if (s.includes('nykaa')) {
      return {
        name: 'Nykaa',
        color: '#fc2779',
        badgeBg: 'bg-pink-500/15 text-pink-300 border-pink-500/30',
        dotBg: 'bg-pink-400',
        glow: 'shadow-pink-500/10',
        heroGradient: 'from-pink-500/20 via-slate-900 to-slate-950',
      };
    }
    return {
      name: product?.store || 'Store',
      color: '#6366f1',
      badgeBg: 'bg-brand-500/15 text-brand-300 border-brand-500/30',
      dotBg: 'bg-brand-400',
      glow: 'shadow-brand-500/10',
      heroGradient: 'from-brand-600/20 via-slate-900 to-slate-950',
    };
  };

  const storeTheme = getStoreTheme(product?.store);

  const formatCurrency = (amount?: number | null) => {
    if (amount === undefined || amount === null) return null;
    return `${product?.currencySymbol || '₹'}${amount.toLocaleString('en-IN')}`;
  };

  // Actions
  const handleToggleFavorite = async () => {
    if (!product) return;
    try {
      const updated = await productsApi.toggleFavorite(product.id);
      setProduct((prev) => (prev ? { ...prev, isFavorite: updated.isFavorite } : null));
      success(updated.isFavorite ? 'Added to favorites' : 'Removed from favorites');
    } catch (err: any) {
      error(err.message || 'Failed to update favorite');
    }
  };

  const handleTogglePurchased = async () => {
    if (!product) return;
    try {
      const updated = await productsApi.togglePurchased(product.id);
      setProduct((prev) => (prev ? { ...prev, isPurchased: updated.isPurchased } : null));
      success(updated.isPurchased ? 'Moved to Purchased vault!' : 'Moved back to Wishlist!');
    } catch (err: any) {
      error(err.message || 'Failed to update purchase status');
    }
  };

  const handleRefreshPrice = async () => {
    if (!product) return;
    setIsRefreshing(true);
    try {
      const updated = await productsApi.refreshPrice(product.id);
      setProduct(updated);
      success('Price and inventory refreshed!');
    } catch (err: any) {
      error(err.message || 'Failed to refresh price from store');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDelete = async () => {
    if (!product) return;
    try {
      await productsApi.deleteProduct(product.id);
      success('Product removed from vault');
      navigate('/products');
    } catch (err: any) {
      error(err.message || 'Failed to delete product');
    }
  };

  const handleSaveEdits = async () => {
    if (!product) return;
    setIsSavingEdits(true);
    try {
      const targetPriceVal = targetPriceInput.trim() ? parseFloat(targetPriceInput) : null;
      const updated = await productsApi.updateProduct(product.id, {
        notes: notesInput.trim() || undefined,
        targetPrice: targetPriceVal !== null && !isNaN(targetPriceVal) ? targetPriceVal : undefined,
        tags: tagsList,
      });
      setProduct(updated);
      setIsEditingNotes(false);
      setIsEditingTargetPrice(false);
      setIsEditingTags(false);
      success('Product details saved!');
    } catch (err: any) {
      error(err.message || 'Failed to save edits');
    } finally {
      setIsSavingEdits(false);
    }
  };

  const handleAddTag = () => {
    const t = newTagInput.trim().replace(/^#/, '');
    if (t && !tagsList.includes(t)) {
      setTagsList([...tagsList, t]);
      setNewTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTagsList(tagsList.filter((t) => t !== tagToRemove));
  };

  const handleCopyLink = () => {
    if (!product?.url) return;
    navigator.clipboard.writeText(product.url);
    info('Product retailer link copied to clipboard!');
  };

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4 text-center px-4">
        <div className="relative">
          <div className="w-14 h-14 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center animate-pulse">
            <ShoppingBag className="w-7 h-7 text-brand-400" />
          </div>
          <div className="absolute -inset-1 bg-brand-500/20 rounded-2xl blur-md animate-pulse -z-10" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-white">Loading Product Intelligence...</h3>
          <p className="text-xs text-slate-400">Fetching pricing, imagery, and vault specifications</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4 text-center px-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div className="space-y-1 max-w-md">
          <h3 className="text-lg font-bold text-white">Product Not Found</h3>
          <p className="text-xs text-slate-400">
            This product may have been deleted or the link is invalid.
          </p>
        </div>
        <Link
          to="/products"
          className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl shadow-lg transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Product Vault</span>
        </Link>
      </div>
    );
  }

  const allImages = [product.imageUrl, ...(product.additionalImages || [])].filter(
    Boolean
  ) as string[];
  const currentImg = selectedImage || product.imageUrl;
  const savings =
    product.originalPrice && product.price && product.originalPrice > product.price
      ? product.originalPrice - product.price
      : 0;

  const isTargetPriceHit =
    product.targetPrice && product.price && product.price <= product.targetPrice;

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-16 max-w-7xl mx-auto">
      {/* Top Header & Breadcrumbs Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/products')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800/80 text-slate-300 hover:text-white text-xs font-semibold backdrop-blur-md shadow-md hover:shadow-brand-500/10 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-brand-400" />
            <span>Back to Vault</span>
          </button>

          {/* Breadcrumb path */}
          <div className="hidden md:flex items-center gap-2 text-xs text-slate-400">
            <span>/</span>
            <Link to="/products" className="hover:text-slate-200 transition">
              Products
            </Link>
            <span>/</span>
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md font-bold text-[10px] border ${storeTheme.badgeBg}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${storeTheme.dotBg}`} />
              {storeTheme.name}
            </span>
            <span>/</span>
            <span className="text-slate-300 font-medium truncate max-w-[200px]" title={product.title}>
              {product.title}
            </span>
          </div>
        </div>

        {/* Action Controls Toolbar */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Quick Favorite */}
          <button
            type="button"
            onClick={handleToggleFavorite}
            className={`p-2.5 rounded-xl border transition-all ${
              product.isFavorite
                ? 'bg-rose-500/20 border-rose-500/50 text-rose-400 shadow-md shadow-rose-500/20'
                : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title={product.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart className={`w-4 h-4 ${product.isFavorite ? 'fill-rose-400' : ''}`} />
          </button>

          {/* Share */}
          <button
            type="button"
            onClick={() => setIsShareModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold shadow-md transition"
            title="Create Vault Share Link"
          >
            <Share2 className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Share</span>
          </button>

          {/* Refresh Price */}
          <button
            type="button"
            onClick={handleRefreshPrice}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold shadow-md transition disabled:opacity-50"
            title="Fetch latest price & in-stock status"
          >
            <RefreshCw
              className={`w-4 h-4 text-brand-400 ${isRefreshing ? 'animate-spin' : ''}`}
            />
            <span className="hidden sm:inline">Refresh Price</span>
          </button>

          {/* Delete with Confirmation */}
          {isConfirmingDelete ? (
            <div className="flex items-center gap-1 bg-rose-950/40 border border-rose-500/50 rounded-xl p-1 animate-fade-in">
              <span className="text-[11px] text-rose-300 font-bold px-2">Delete product?</span>
              <button
                type="button"
                onClick={handleDelete}
                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold rounded-lg transition"
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsConfirmingDelete(true)}
              className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-rose-500/15 border border-slate-800 hover:border-rose-500/30 text-slate-400 hover:text-rose-400 transition"
              title="Remove from vault"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Showcase Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        {/* Left Column: Visual & Image Stage (5 cols on lg) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Main Visual Stage */}
          <div
            className={`relative w-full aspect-square bg-slate-950/80 border border-slate-800/80 rounded-3xl overflow-hidden flex items-center justify-center p-6 shadow-2xl ${storeTheme.glow} transition-all`}
          >
            {/* Ambient Store Glow */}
            <div
              className={`absolute inset-0 bg-gradient-to-b ${storeTheme.heroGradient} opacity-30 pointer-events-none`}
            />

            {/* Badges Overlay */}
            <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
              {/* Discount Badge */}
              {product.discountPercent && product.discountPercent > 0 ? (
                <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-lg flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>-{product.discountPercent}% OFF</span>
                </span>
              ) : null}

              {/* Stock status badge */}
              <span
                className={`px-2.5 py-1 rounded-xl text-xs font-bold backdrop-blur-md border flex items-center gap-1.5 shadow-md ${
                  product.inStock
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                }`}
              >
                {product.inStock ? (
                  <>
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span>In Stock</span>
                  </>
                ) : (
                  <span>Out of Stock</span>
                )}
              </span>

              {/* Purchased Badge */}
              {product.isPurchased && (
                <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 backdrop-blur-md shadow-lg shadow-emerald-500/20">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Purchased Item</span>
                </span>
              )}
            </div>

            {/* Main Product Image */}
            {currentImg && !imgError ? (
              <img
                src={currentImg}
                alt={product.title}
                onError={() => setImgError(true)}
                className="max-h-full max-w-full object-contain hover:scale-105 transition-transform duration-500 ease-out z-0"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-600 gap-3">
                <ShoppingBag className="w-16 h-16 stroke-[1.5]" />
                <span className="text-xs font-medium text-slate-500">No Image Available</span>
              </div>
            )}
          </div>

          {/* Multi-angle Thumbnail Gallery */}
          {allImages.length > 1 && (
            <div className="flex items-center gap-2.5 overflow-x-auto pb-2 pt-1 scrollbar-thin">
              {allImages.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedImage(img)}
                  className={`w-16 h-16 rounded-2xl bg-slate-950 border overflow-hidden p-1 shrink-0 transition-all cursor-pointer ${
                    currentImg === img
                      ? 'border-brand-500 ring-2 ring-brand-500/40 shadow-lg scale-105'
                      : 'border-slate-800 hover:border-slate-700 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={img}
                    alt={`Angle ${idx + 1}`}
                    className="w-full h-full object-contain"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Quick Copy Link & Store Meta */}
          <div className="flex items-center justify-between p-3.5 bg-slate-900/60 border border-slate-800/80 rounded-2xl text-xs text-slate-400">
            <div className="flex items-center gap-2 truncate">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="truncate">Official {storeTheme.name} Listing</span>
            </div>
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 text-brand-400 hover:text-brand-300 font-semibold shrink-0 cursor-pointer ml-2"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Link</span>
            </button>
          </div>
        </div>

        {/* Right Column: Command Center & Pricing (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Header Metadata */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border ${storeTheme.badgeBg}`}
              >
                <span className={`w-2 h-2 rounded-full ${storeTheme.dotBg}`} />
                <span>{storeTheme.name}</span>
              </span>

              {product.brand && (
                <span className="px-3 py-1 rounded-xl text-xs font-extrabold uppercase tracking-wider bg-brand-500/15 text-brand-300 border border-brand-500/30">
                  {product.brand}
                </span>
              )}

              {product.category && (
                <span className="px-3 py-1 rounded-xl text-xs font-medium bg-slate-800/80 text-slate-300 border border-slate-700/60">
                  {product.category}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug">
              {product.title}
            </h1>

            {/* Ratings & Reviews */}
            {product.rating ? (
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 font-black">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span>{product.rating}</span>
                </div>
                {product.reviewCount ? (
                  <span className="text-slate-400 font-medium">
                    Based on {product.reviewCount.toLocaleString()} customer reviews
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>

          {/* Pricing Intelligence Card */}
          <div className="p-6 bg-slate-900/90 border border-slate-800/90 rounded-3xl space-y-4 shadow-xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Current Selling Price
                </span>
                <div className="flex items-baseline gap-3 flex-wrap">
                  <span className="text-3xl sm:text-4xl font-black text-white tracking-tight font-mono">
                    {product.price !== null && product.price !== undefined
                      ? formatCurrency(product.price)
                      : 'Check Store'}
                  </span>

                  {product.originalPrice &&
                    product.price &&
                    product.originalPrice > product.price && (
                      <span className="text-sm sm:text-base text-slate-500 line-through font-medium">
                        {formatCurrency(product.originalPrice)}
                      </span>
                    )}
                </div>
              </div>

              {/* Total Savings Pill */}
              {savings > 0 ? (
                <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-xs shadow-lg shadow-emerald-500/10">
                  <TrendingDown className="w-4 h-4 text-emerald-400" />
                  <span>
                    You Save {formatCurrency(savings)}
                    {product.discountPercent ? ` (${product.discountPercent}% OFF)` : ''}
                  </span>
                </div>
              ) : null}
            </div>

            {/* Target Price Alert Box */}
            <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <AlertCircle
                  className={`w-4 h-4 ${
                    isTargetPriceHit ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                />
                <span className="text-slate-400 font-medium">Target Alert Price:</span>
                <span className="font-bold text-amber-300">
                  {product.targetPrice ? formatCurrency(product.targetPrice) : 'Not set'}
                </span>
              </div>

              {isTargetPriceHit && (
                <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-black bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 animate-pulse">
                  🔥 Target Reached!
                </span>
              )}
            </div>
          </div>

          {/* Primary Action Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Store Buy Button */}
            <a
              href={product.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2.5 px-6 py-4 bg-gradient-to-r from-brand-600 via-indigo-600 to-brand-500 hover:from-brand-500 hover:to-indigo-500 text-white text-sm font-bold rounded-2xl shadow-xl shadow-brand-500/25 active:scale-95 transition-all cursor-pointer"
            >
              <span>Visit & Buy on {storeTheme.name}</span>
              <ExternalLink className="w-4 h-4" />
            </a>

            {/* Purchased Vault Toggle Button */}
            <button
              type="button"
              onClick={handleTogglePurchased}
              className={`flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl text-sm font-bold border transition-all cursor-pointer active:scale-95 shadow-lg ${
                product.isPurchased
                  ? 'bg-emerald-500/25 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/35 shadow-emerald-500/20'
                  : 'bg-slate-900/90 hover:bg-slate-800 text-slate-200 border-slate-700/80 hover:text-white'
              }`}
            >
              <Check className="w-4 h-4 text-emerald-400" />
              <span>{product.isPurchased ? 'Purchased ✓ (Move to Wishlist)' : 'Mark as Purchased'}</span>
            </button>
          </div>

          {/* Quick Specifications / Highlights Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3.5 bg-slate-900/60 border border-slate-800/80 rounded-2xl space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Vault Status
              </span>
              <p className="text-xs font-bold text-slate-200">
                {product.isPurchased ? 'Purchased Archive' : 'Active Wishlist'}
              </p>
            </div>

            <div className="p-3.5 bg-slate-900/60 border border-slate-800/80 rounded-2xl space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Saved On
              </span>
              <p className="text-xs font-bold text-slate-200">{formatDate(product.createdAt)}</p>
            </div>

            <div className="p-3.5 bg-slate-900/60 border border-slate-800/80 rounded-2xl space-y-1 col-span-2 sm:col-span-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Currency & Region
              </span>
              <p className="text-xs font-bold text-slate-200">
                {product.currency} ({product.currencySymbol || '₹'})
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Detailed Sections Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 pt-4">
        {/* Description & Overview (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-6">
          {product.description && (
            <div className="p-6 bg-slate-900/80 border border-slate-800/80 rounded-3xl space-y-3">
              <div className="flex items-center gap-2 text-slate-300 font-bold text-sm">
                <Info className="w-4 h-4 text-brand-400" />
                <span>Description & Specifications</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed whitespace-pre-line max-h-80 overflow-y-auto pr-2 scrollbar-thin">
                {product.description}
              </p>
            </div>
          )}

          {/* Personal Notes Section (Editable) */}
          <div className="p-6 bg-slate-900/80 border border-slate-800/80 rounded-3xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-300 font-bold text-sm">
                <Edit3 className="w-4 h-4 text-brand-400" />
                <span>Your Vault Notes</span>
              </div>
              {!isEditingNotes ? (
                <button
                  type="button"
                  onClick={() => setIsEditingNotes(true)}
                  className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Notes</span>
                </button>
              ) : null}
            </div>

            {isEditingNotes ? (
              <div className="space-y-3 animate-fade-in">
                <textarea
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder="Add personal notes, sizing thoughts, reasons to buy, gift notes..."
                  rows={4}
                  className="w-full bg-slate-950/80 border border-slate-700/80 rounded-2xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 resize-none"
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setNotesInput(product.notes || '');
                      setIsEditingNotes(false);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEdits}
                    disabled={isSavingEdits}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-md disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Notes</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-950/40 border border-slate-800/60 rounded-2xl">
                {product.notes ? (
                  <p className="text-xs text-slate-300 whitespace-pre-line">{product.notes}</p>
                ) : (
                  <p className="text-xs text-slate-500 italic">
                    No notes added yet. Click &quot;Edit Notes&quot; to keep track of sizing, coupons, or reminders.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Tags & Price Tracking Settings (5 cols on lg) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Target Alert Price Setter */}
          <div className="p-6 bg-slate-900/80 border border-slate-800/80 rounded-3xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-300 font-bold text-sm">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                <span>Price Drop Alert</span>
              </div>
              {!isEditingTargetPrice && (
                <button
                  type="button"
                  onClick={() => setIsEditingTargetPrice(true)}
                  className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Set Alert</span>
                </button>
              )}
            </div>

            {isEditingTargetPrice ? (
              <div className="space-y-3 animate-fade-in">
                <p className="text-xs text-slate-400">
                  Enter the price threshold you are waiting for:
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-400">
                    {product.currencySymbol || '₹'}
                  </span>
                  <input
                    type="number"
                    value={targetPriceInput}
                    onChange={(e) => setTargetPriceInput(e.target.value)}
                    placeholder="e.g. 1999"
                    className="flex-1 bg-slate-950/80 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTargetPriceInput(product.targetPrice ? String(product.targetPrice) : '');
                      setIsEditingTargetPrice(false);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEdits}
                    disabled={isSavingEdits}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Alert</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-950/40 border border-slate-800/60 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-500 block">Target Threshold</span>
                  <span className="text-sm font-bold text-amber-300">
                    {product.targetPrice ? formatCurrency(product.targetPrice) : 'None set'}
                  </span>
                </div>
                {isTargetPriceHit && (
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    Triggered
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Tags Management */}
          <div className="p-6 bg-slate-900/80 border border-slate-800/80 rounded-3xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-300 font-bold text-sm">
                <Tag className="w-4 h-4 text-brand-400" />
                <span>Tags & Labels</span>
              </div>
              {!isEditingTags && (
                <button
                  type="button"
                  onClick={() => setIsEditingTags(true)}
                  className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Manage Tags</span>
                </button>
              )}
            </div>

            {isEditingTags ? (
              <div className="space-y-3 animate-fade-in">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    placeholder="Type tag and press enter..."
                    className="flex-1 bg-slate-950/80 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold"
                  >
                    Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 min-h-[32px]">
                  {tagsList.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-brand-500/20 text-brand-300 border border-brand-500/40 text-xs font-medium"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-rose-400"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setTagsList(product.tags || []);
                      setIsEditingTags(false);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEdits}
                    disabled={isSavingEdits}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-md disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Tags</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {product.tags && product.tags.length > 0 ? (
                  product.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 rounded-lg bg-slate-800/90 text-slate-300 text-xs font-medium"
                    >
                      #{tag}
                    </span>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 italic">No tags added.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Share Product Modal */}
      {isShareModalOpen && product && (
        <ShareProductModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          product={product}
        />
      )}
    </div>
  );
};

export default ProductDetailPage;
