import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
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
  Layers,
  Search,
  Filter,
  TrendingDown,
  Maximize2,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
  Send,
  Mail,
  Info,
} from 'lucide-react';
import {
  PublicShareData,
  PublicShareProduct,
  PublicShareProductSection,
  FileItem,
} from '../../types';
import { QRCodeDisplayModal } from '../share/QRCodeDisplay';
import { ImageLightbox } from '../gallery/ImageLightbox';
import { formatDateTime } from '../../utils/formatters';

interface PublicProductSectionShareViewProps {
  section: PublicShareProductSection;
  shareData: PublicShareData;
}

export const PublicProductSectionShareView: React.FC<PublicProductSectionShareViewProps> = ({
  section,
  shareData,
}) => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Search & Filter within section
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStore, setSelectedStore] = useState('ALL');

  // Currently viewing single product details
  const productIdParam = searchParams.get('product');
  const [selectedProduct, setSelectedProduct] = useState<PublicShareProduct | null>(() => {
    if (productIdParam) {
      return section.products.find((p) => p.id === productIdParam) || null;
    }
    return null;
  });

  // Keep in sync if query param changes (e.g. back/forward button)
  useEffect(() => {
    if (productIdParam) {
      const found = section.products.find((p) => p.id === productIdParam);
      if (found) {
        setSelectedProduct(found);
      }
    } else {
      setSelectedProduct(null);
    }
  }, [productIdParam, section.products]);

  // Handle selecting a product to open details page
  const handleSelectProduct = (product: PublicShareProduct) => {
    setSelectedProduct(product);
    setSearchParams({ product: product.id });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle back to section products grid
  const handleBackToSection = () => {
    setSelectedProduct(null);
    setSearchParams({});
  };

  // Image Gallery state for Product Details
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Copy & Share states
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedTitle, setCopiedTitle] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    if (selectedProduct) {
      setActiveImage(selectedProduct.imageUrl || null);
    }
  }, [selectedProduct]);

  // Unique stores for filter chips
  const storeOptions = useMemo(() => {
    const stores = Array.from(new Set(section.products.map((p) => p.store).filter(Boolean)));
    return ['ALL', ...stores];
  }, [section.products]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return section.products.filter((product) => {
      if (selectedStore !== 'ALL' && product.store !== selectedStore) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          product.title.toLowerCase().includes(q) ||
          product.store.toLowerCase().includes(q) ||
          (product.brand && product.brand.toLowerCase().includes(q)) ||
          (product.category && product.category.toLowerCase().includes(q)) ||
          (product.tags && product.tags.some((t) => t.toLowerCase().includes(q)))
        );
      }
      return true;
    });
  }, [section.products, selectedStore, searchQuery]);

  // Total value calculation
  const totalValue = useMemo(() => {
    return section.products.reduce((acc, p) => acc + (p.price || 0), 0);
  }, [section.products]);

  // Store Brand Theme Helper
  const getStoreTheme = (storeName?: string) => {
    const s = (storeName || '').toLowerCase();
    if (s.includes('amazon')) {
      return {
        name: 'Amazon',
        bgGradient: 'from-amber-500/20 via-orange-500/10 to-transparent',
        borderColor: 'border-amber-500/30',
        textColor: 'text-amber-400',
        pillBg: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
        accentGlow: 'shadow-amber-500/10',
      };
    }
    if (s.includes('flipkart')) {
      return {
        name: 'Flipkart',
        bgGradient: 'from-blue-500/20 via-sky-500/10 to-transparent',
        borderColor: 'border-blue-500/30',
        textColor: 'text-blue-400',
        pillBg: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
        accentGlow: 'shadow-blue-500/10',
      };
    }
    if (s.includes('myntra')) {
      return {
        name: 'Myntra',
        bgGradient: 'from-pink-500/20 via-rose-500/10 to-transparent',
        borderColor: 'border-pink-500/30',
        textColor: 'text-pink-400',
        pillBg: 'bg-pink-500/15 text-pink-300 border-pink-500/30',
        accentGlow: 'shadow-pink-500/10',
      };
    }
    if (s.includes('ajio')) {
      return {
        name: 'Ajio',
        bgGradient: 'from-emerald-500/20 via-teal-500/10 to-transparent',
        borderColor: 'border-emerald-500/30',
        textColor: 'text-emerald-400',
        pillBg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
        accentGlow: 'shadow-emerald-500/10',
      };
    }
    return {
      name: storeName || 'Store',
      bgGradient: 'from-brand-500/20 via-indigo-500/10 to-transparent',
      borderColor: 'border-brand-500/30',
      textColor: 'text-brand-400',
      pillBg: 'bg-brand-500/15 text-brand-300 border-brand-500/30',
      accentGlow: 'shadow-brand-500/10',
    };
  };

  const handleCopyLink = async (url?: string) => {
    const targetUrl = url || window.location.href;
    try {
      await navigator.clipboard.writeText(targetUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleCopyTitle = async (title: string) => {
    try {
      await navigator.clipboard.writeText(title);
      setCopiedTitle(true);
      setTimeout(() => setCopiedTitle(false), 2000);
    } catch {
      // ignore
    }
  };

  // Convert product images to FileItem shape for Lightbox
  const productImagesForLightbox: FileItem[] = useMemo(() => {
    if (!selectedProduct) return [];
    const allImgs = [
      selectedProduct.imageUrl,
      ...(selectedProduct.additionalImages || []),
    ].filter(Boolean) as string[];

    return allImgs.map((img, idx) => ({
      id: `img-${idx}`,
      userId: '',
      originalName: `${selectedProduct.title} - Photo ${idx + 1}`,
      storageKey: img,
      mimeType: 'image/jpeg',
      fileType: 'IMAGE',
      extension: '.jpg',
      size: 0,
      createdAt: selectedProduct.createdAt,
      updatedAt: selectedProduct.createdAt,
      isFavorite: false,
      streamUrl: img,
      downloadUrl: img,
      isExternal: true,
      externalUrl: img,
    }));
  }, [selectedProduct]);

  // ==========================================
  // VIEW 1: PRODUCT DETAILS PAGE (Identical to Website's ProductDetailPage)
  // ==========================================
  if (selectedProduct) {
    const storeTheme = getStoreTheme(selectedProduct.store);
    const allImages = [
      selectedProduct.imageUrl,
      ...(selectedProduct.additionalImages || []),
    ].filter(Boolean) as string[];
    const displayImg = activeImage || allImages[0] || '';

    const savings =
      selectedProduct.originalPrice &&
      selectedProduct.price &&
      selectedProduct.originalPrice > selectedProduct.price
        ? selectedProduct.originalPrice - selectedProduct.price
        : null;

    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        {/* Top Navigation & Breadcrumbs Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-xl">
          <button
            type="button"
            onClick={handleBackToSection}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-white text-xs sm:text-sm font-bold transition cursor-pointer active:scale-95 group"
          >
            <ArrowLeft className="w-4 h-4 text-brand-400 group-hover:-translate-x-1 transition-transform" />
            <span>Back to {section.name} ({section.totalProducts})</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleCopyLink()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition cursor-pointer"
              title="Copy link to this product"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Link Copied' : 'Share Product'}</span>
            </button>

            <a
              href={selectedProduct.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-2 rounded-2xl bg-gradient-to-r from-brand-600 via-indigo-600 to-teal-500 hover:from-brand-500 hover:via-indigo-500 hover:to-teal-400 text-white text-xs sm:text-sm font-black shadow-lg shadow-brand-600/25 transition active:scale-95 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Buy on {selectedProduct.store}</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </a>
          </div>
        </div>

        {/* Store Brand Banner */}
        <div
          className={`p-4 sm:p-5 rounded-3xl bg-gradient-to-r ${storeTheme.bgGradient} border ${storeTheme.borderColor} backdrop-blur-xl flex items-center justify-between gap-4`}
        >
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider ${storeTheme.pillBg}`}>
              {selectedProduct.store}
            </span>
            <span className="text-xs text-slate-300 font-semibold hidden sm:inline">
              Verified Merchant Product
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: section.color || '#6366f1' }}
            />
            <span>Part of <strong className="text-white">{section.name}</strong></span>
          </div>
        </div>

        {/* Main Product Details Split View */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* LEFT: Hero Gallery */}
          <div className="lg:col-span-6 space-y-4">
            <div className="relative aspect-square w-full rounded-3xl bg-slate-950 border border-slate-800/80 overflow-hidden shadow-2xl flex items-center justify-center p-4 group">
              {displayImg ? (
                <img
                  src={displayImg}
                  alt={selectedProduct.title}
                  className="max-h-full max-w-full object-contain rounded-2xl transition-transform duration-300 group-hover:scale-105 cursor-zoom-in"
                  onClick={() => setIsLightboxOpen(true)}
                />
              ) : (
                <div className="text-center p-8 space-y-2">
                  <ShoppingBag className="w-16 h-16 text-slate-700 mx-auto" />
                  <p className="text-xs text-slate-500">No Image Available</p>
                </div>
              )}

              {/* Top Corner Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none">
                {selectedProduct.discountPercent && selectedProduct.discountPercent > 0 ? (
                  <span className="px-3 py-1 rounded-xl bg-rose-600/90 text-white font-black text-xs shadow-lg backdrop-blur-md">
                    {selectedProduct.discountPercent}% OFF
                  </span>
                ) : null}
              </div>

              {/* Zoom Action Button */}
              {displayImg && (
                <button
                  type="button"
                  onClick={() => setIsLightboxOpen(true)}
                  className="absolute bottom-4 right-4 p-2.5 rounded-2xl bg-black/60 hover:bg-black/80 text-white backdrop-blur-md border border-white/10 transition cursor-pointer shadow-xl opacity-0 group-hover:opacity-100"
                  title="View Fullscreen"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Thumbnail Carousel */}
            {allImages.length > 1 && (
              <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-thin">
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImage(img)}
                    className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl p-1 bg-slate-950 border-2 transition shrink-0 cursor-pointer overflow-hidden ${
                      activeImage === img
                        ? 'border-brand-500 shadow-lg shadow-brand-500/20'
                        : 'border-slate-800 hover:border-slate-700 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-contain rounded-xl" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: Product Information & Purchase CTAs */}
          <div className="lg:col-span-6 space-y-6">
            {/* Title & Brand */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                {selectedProduct.brand && (
                  <span className="text-xs font-bold text-brand-400 uppercase tracking-wider">
                    {selectedProduct.brand}
                  </span>
                )}
                {selectedProduct.category && (
                  <span className="px-2.5 py-0.5 rounded-lg bg-slate-800/80 text-slate-300 text-[11px] font-semibold border border-slate-700">
                    {selectedProduct.category}
                  </span>
                )}
              </div>

              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight leading-snug">
                {selectedProduct.title}
              </h1>

              <button
                type="button"
                onClick={() => handleCopyTitle(selectedProduct.title)}
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition cursor-pointer"
              >
                {copiedTitle ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedTitle ? 'Title Copied' : 'Copy Title'}</span>
              </button>
            </div>

            {/* Rating & Stock Status */}
            <div className="flex items-center gap-4 flex-wrap pb-4 border-b border-slate-800/80">
              {selectedProduct.rating ? (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span>{selectedProduct.rating.toFixed(1)} / 5</span>
                  {selectedProduct.reviewCount ? (
                    <span className="text-amber-400/80">({selectedProduct.reviewCount.toLocaleString()} reviews)</span>
                  ) : null}
                </div>
              ) : null}

              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{selectedProduct.inStock ? 'In Stock' : 'Check Store for Stock'}</span>
              </div>
            </div>

            {/* Pricing Card */}
            <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                  {selectedProduct.currencySymbol || '₹'}
                  {selectedProduct.price ? selectedProduct.price.toLocaleString('en-IN') : 'N/A'}
                </span>

                {selectedProduct.originalPrice && selectedProduct.originalPrice > (selectedProduct.price || 0) && (
                  <span className="text-base sm:text-lg text-slate-500 line-through font-semibold">
                    {selectedProduct.currencySymbol || '₹'}
                    {selectedProduct.originalPrice.toLocaleString('en-IN')}
                  </span>
                )}

                {selectedProduct.discountPercent && selectedProduct.discountPercent > 0 && (
                  <span className="px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 font-extrabold text-xs border border-emerald-500/30">
                    {selectedProduct.discountPercent}% OFF
                  </span>
                )}
              </div>

              {savings && (
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-xl">
                  <TrendingDown className="w-4 h-4" />
                  <span>You save {selectedProduct.currencySymbol || '₹'}{savings.toLocaleString('en-IN')} on this product!</span>
                </div>
              )}

              {/* Primary Buy CTA Button */}
              <a
                href={selectedProduct.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-brand-600 via-indigo-600 to-teal-500 hover:from-brand-500 hover:via-indigo-500 hover:to-teal-400 text-white font-black text-sm sm:text-base shadow-xl shadow-brand-500/25 active:scale-[0.99] transition cursor-pointer flex items-center justify-center gap-2.5 group"
              >
                <ShoppingBag className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span>Buy Now on {selectedProduct.store}</span>
                <ExternalLink className="w-4 h-4 opacity-80" />
              </a>
            </div>

            {/* Description & Specifications */}
            {selectedProduct.description && (
              <div className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-2.5">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Info className="w-4 h-4 text-brand-400" />
                  <span>Product Overview & Details</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                  {selectedProduct.description}
                </p>
              </div>
            )}

            {/* Tags */}
            {selectedProduct.tags && selectedProduct.tags.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" />
                  <span>Tags</span>
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedProduct.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 text-xs font-medium"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Fullscreen Lightbox */}
        {isLightboxOpen && productImagesForLightbox.length > 0 && (
          <ImageLightbox
            images={productImagesForLightbox}
            currentIndex={Math.max(
              0,
              allImages.indexOf(activeImage || allImages[0])
            )}
            isOpen={isLightboxOpen}
            onClose={() => setIsLightboxOpen(false)}
            onNavigate={(newIdx) => {
              if (allImages[newIdx]) {
                setActiveImage(allImages[newIdx]);
              }
            }}
          />
        )}
      </div>
    );
  }

  // ==========================================
  // VIEW 2: SECTION PRODUCTS GRID VIEW
  // ==========================================
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Section Hero Banner */}
      <div
        className="p-6 sm:p-8 rounded-3xl border shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6"
        style={{
          backgroundColor: `${section.color || '#6366f1'}12`,
          borderColor: `${section.color || '#6366f1'}35`,
        }}
      >
        <div className="flex items-start sm:items-center gap-4">
          <div
            className="w-16 h-16 rounded-3xl flex items-center justify-center text-white shadow-2xl shrink-0"
            style={{ backgroundColor: section.color || '#6366f1' }}
          >
            <Layers className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-900/90 text-white border border-slate-700">
                Shared Product Section
              </span>
              <span className="text-xs text-slate-400">
                Created by <strong className="text-slate-200">{shareData.owner.name}</strong>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {section.name}
            </h1>

            {section.description && (
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
                {section.description}
              </p>
            )}

            <div className="flex items-center gap-3 pt-1 text-xs text-slate-400 flex-wrap">
              <span className="font-bold text-white">
                🛍️ {section.totalProducts} product{section.totalProducts !== 1 ? 's' : ''}
              </span>
              {totalValue > 0 && (
                <>
                  <span>•</span>
                  <span className="font-bold text-emerald-400">
                    💰 ₹{totalValue.toLocaleString('en-IN')} total section value
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Share Actions */}
        <div className="flex items-center gap-2.5 shrink-0 self-start md:self-center">
          <button
            type="button"
            onClick={() => handleCopyLink()}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white text-xs sm:text-sm font-bold shadow-lg transition active:scale-95 cursor-pointer"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copiedLink ? 'Link Copied' : 'Copy Section Link'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setQrDataUrl(
                `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(
                  window.location.href
                )}`
              );
              setIsQrModalOpen(true);
            }}
            className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
            title="QR Code"
          >
            <QrCode className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-3xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${section.totalProducts} products in ${section.name}...`}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition"
          />
        </div>

        {/* Store Chips */}
        {storeOptions.length > 2 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-thin">
            {storeOptions.map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setSelectedStore(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                  selectedStore === st
                    ? 'bg-brand-600 text-white shadow-md'
                    : 'bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Section Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="py-16 text-center space-y-3 rounded-3xl bg-slate-900/40 border border-slate-800 p-8">
          <ShoppingBag className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No products found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchQuery
              ? `No products in this section match "${searchQuery}". Try a different search term.`
              : 'There are no products in this section.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {filteredProducts.map((product) => {
            const storeBadge = getStoreTheme(product.store);

            return (
              <div
                key={product.id}
                onClick={() => handleSelectProduct(product)}
                className="group relative bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-brand-500/60 rounded-3xl overflow-hidden shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-brand-500/10 cursor-pointer flex flex-col justify-between"
              >
                <div>
                  {/* Thumbnail Container */}
                  <div className="relative aspect-square w-full bg-slate-950 flex items-center justify-center p-3 overflow-hidden">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.title}
                        loading="lazy"
                        className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300 rounded-xl"
                      />
                    ) : (
                      <ShoppingBag className="w-12 h-12 text-slate-800" />
                    )}

                    {/* Store Pill */}
                    <div className="absolute top-3 left-3">
                      <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${storeBadge.pillBg} shadow-md`}>
                        {product.store}
                      </span>
                    </div>

                    {/* Discount Badge */}
                    {product.discountPercent && product.discountPercent > 0 ? (
                      <div className="absolute top-3 right-3">
                        <span className="px-2 py-0.5 rounded-lg bg-rose-600 text-white font-extrabold text-[10px] shadow-md">
                          {product.discountPercent}% OFF
                        </span>
                      </div>
                    ) : null}

                  </div>

                  {/* Card Content */}
                  <div className="p-4 space-y-2">
                    {/* Brand / Category */}
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="font-semibold truncate">{product.brand || product.category || product.store}</span>
                      {product.rating ? (
                        <span className="flex items-center gap-1 text-amber-400 font-bold">
                          <Star className="w-3 h-3 fill-current" />
                          <span>{product.rating.toFixed(1)}</span>
                        </span>
                      ) : null}
                    </div>

                    {/* Product Title */}
                    <h3
                      className="font-bold text-xs sm:text-sm text-white line-clamp-2 leading-snug group-hover:text-brand-300 transition"
                      title={product.title}
                    >
                      {product.title}
                    </h3>
                  </div>
                </div>

                {/* Price & Action Footer */}
                <div className="p-4 pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-2 relative z-10">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-1.5 flex-wrap">
                      <span className="text-base sm:text-lg font-black text-white font-mono">
                        {product.currencySymbol || '₹'}
                        {product.price ? product.price.toLocaleString('en-IN') : 'N/A'}
                      </span>
                      {product.originalPrice && product.originalPrice > (product.price || 0) && (
                        <span className="text-xs text-slate-500 line-through font-semibold">
                          {product.currencySymbol || '₹'}
                          {product.originalPrice.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Dual Action CTAs: Details + Direct Buy */}
                  <div className="flex items-center gap-1.5 shrink-0 relative z-20" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectProduct(product);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700/80 transition cursor-pointer"
                      title="View full details"
                    >
                      <Eye className="w-3.5 h-3.5 text-brand-400" />
                      <span className="text-[11px]">Details</span>
                    </button>

                    <a
                      href={product.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-brand-500/20 active:scale-95 transition-all cursor-pointer"
                      title={`Buy on ${product.store}`}
                    >
                      <span>Buy</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* QR Code Modal */}
      {isQrModalOpen && (
        <QRCodeDisplayModal
          isOpen={isQrModalOpen}
          onClose={() => setIsQrModalOpen(false)}
          title={section.name}
          shareUrl={window.location.href}
          qrDataUrl={qrDataUrl}
        />
      )}
    </div>
  );
};
