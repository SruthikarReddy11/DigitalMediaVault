import React from 'react';
import {
  ShoppingBag,
  Plus,
  Search,
  X,
  Filter,
  ArrowUpDown,
  Heart,
  Tag,
  DollarSign,
  TrendingDown,
  CheckCircle2,
} from 'lucide-react';

interface ProductsHeaderProps {
  onNewProduct: () => void;
  searchTerm: string;
  onSearchChange: (val: string) => void;
  selectedStore: string;
  onStoreChange: (store: string) => void;
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  favoriteOnly: boolean;
  onToggleFavoriteOnly: () => void;
  viewMode: 'wishlist' | 'purchased' | 'all';
  onViewModeChange: (mode: 'wishlist' | 'purchased' | 'all') => void;
  wishlistCount: number;
  purchasedCount: number;
  storeCounts: { store: string; count: number }[];
  totalCount: number;
  totalValue: number;
  totalDiscountedCount: number;
}

const POPULAR_STORES = [
  { id: 'ALL', label: 'All Stores' },
  { id: 'Amazon', label: 'Amazon' },
  { id: 'Flipkart', label: 'Flipkart' },
  { id: 'Myntra', label: 'Myntra' },
  { id: 'Ajio', label: 'Ajio' },
  { id: 'Meesho', label: 'Meesho' },
  { id: 'Nykaa', label: 'Nykaa' },
  { id: 'Other', label: 'Other' },
];

const CATEGORIES = [
  'ALL',
  'Electronics',
  'Fashion',
  'Beauty & Personal Care',
  'Home & Kitchen',
  'Books',
  'Sports & Fitness',
  'Other',
];

export const ProductsHeader: React.FC<ProductsHeaderProps> = ({
  onNewProduct,
  searchTerm,
  onSearchChange,
  selectedStore,
  onStoreChange,
  selectedCategory,
  onCategoryChange,
  sortBy,
  onSortChange,
  favoriteOnly,
  onToggleFavoriteOnly,
  viewMode,
  onViewModeChange,
  wishlistCount,
  purchasedCount,
  storeCounts,
  totalCount,
  totalValue,
  totalDiscountedCount,
}) => {
  const getCountForStore = (storeId: string) => {
    if (storeId === 'ALL') return totalCount;
    const match = storeCounts.find(
      (s) => s.store.toLowerCase() === storeId.toLowerCase()
    );
    return match ? match.count : 0;
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-gradient-to-r from-slate-900 via-slate-900/90 to-indigo-950/40 border border-slate-800 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-brand-600 to-indigo-600 text-white shadow-lg shadow-brand-500/25 shrink-0">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <span>Product Vault & Wishlist</span>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30">
                Live Scraping
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Save links from Flipkart, Amazon, Myntra, Ajio & track prices, images and discounts
            </p>
          </div>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={onNewProduct}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-600 via-indigo-600 to-brand-500 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-brand-500/25 active:scale-95 transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Save Product Link</span>
        </button>
      </div>

      {/* View Mode Toggle: Wishlist vs Purchased vs All */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-2 bg-slate-900/60 border border-slate-800 rounded-2xl">
        <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 rounded-xl border border-slate-800/80">
          <button
            type="button"
            onClick={() => onViewModeChange('wishlist')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'wishlist'
                ? 'bg-gradient-to-r from-brand-600 via-indigo-600 to-brand-500 text-white shadow-lg shadow-brand-500/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Wishlist</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                viewMode === 'wishlist' ? 'bg-black/40 text-white' : 'bg-slate-800 text-slate-300'
              }`}
            >
              {wishlistCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onViewModeChange('purchased')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'purchased'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
            <span>Purchased Vault</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                viewMode === 'purchased' ? 'bg-black/40 text-white' : 'bg-slate-800 text-slate-300'
              }`}
            >
              {purchasedCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onViewModeChange('all')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'all'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <span>All</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                viewMode === 'all' ? 'bg-black/40 text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {totalCount}
            </span>
          </button>
        </div>

        {/* View Mode Description Cue */}
        <div className="text-[11px] text-slate-400 font-medium px-3 hidden sm:block">
          {viewMode === 'wishlist' && 'Showing active wishlist (unpurchased items).'}
          {viewMode === 'purchased' && 'Showing purchased items & order archive.'}
          {viewMode === 'all' && 'Showing all saved products.'}
        </div>
      </div>

      {/* Summary Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-slate-900/60 border border-slate-800/80 rounded-xl flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/15 text-blue-400 border border-blue-500/30">
            {viewMode === 'purchased' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <ShoppingBag className="w-4 h-4" />
            )}
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              {viewMode === 'purchased' ? 'Purchased Items' : viewMode === 'wishlist' ? 'Wishlist Items' : 'Total Items'}
            </span>
            <span className="text-base font-extrabold text-white">
              {viewMode === 'purchased' ? purchasedCount : viewMode === 'wishlist' ? wishlistCount : totalCount}
            </span>
          </div>
        </div>

        <div className="p-3.5 bg-slate-900/60 border border-slate-800/80 rounded-xl flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <DollarSign className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Value
            </span>
            <span className="text-base font-extrabold text-white">
              ₹{totalValue.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        <div className="p-3.5 bg-slate-900/60 border border-slate-800/80 rounded-xl flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <TrendingDown className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Discounted Items
            </span>
            <span className="text-base font-extrabold text-white">{totalDiscountedCount}</span>
          </div>
        </div>

        <div
          onClick={onToggleFavoriteOnly}
          className={`p-3.5 rounded-xl border transition cursor-pointer flex items-center gap-3 ${
            favoriteOnly
              ? 'bg-rose-500/15 border-rose-500/40 text-rose-300 ring-1 ring-rose-500/30'
              : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-900'
          }`}
        >
          <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30">
            <Heart className={`w-4 h-4 ${favoriteOnly ? 'fill-rose-400' : ''}`} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Favorites
            </span>
            <span className="text-xs font-bold text-slate-200">
              {favoriteOnly ? 'Filter Active' : 'Show Only Favorites'}
            </span>
          </div>
        </div>
      </div>

      {/* Search, Filters & Sorting Toolbar */}
      <div className="p-3.5 bg-slate-900/70 border border-slate-800 rounded-2xl flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search saved products, brands, or notes..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-8 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Controls: Category & Sort */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Category Dropdown */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs">
            <Tag className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="bg-transparent text-slate-300 focus:outline-none text-xs cursor-pointer"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c} className="bg-slate-900 text-white">
                  {c === 'ALL' ? 'All Categories' : c}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="bg-transparent text-slate-300 focus:outline-none text-xs cursor-pointer"
            >
              <option value="createdAt" className="bg-slate-900 text-white">
                Recently Added
              </option>
              <option value="price_asc" className="bg-slate-900 text-white">
                Price: Low to High
              </option>
              <option value="price_desc" className="bg-slate-900 text-white">
                Price: High to Low
              </option>
              <option value="discount" className="bg-slate-900 text-white">
                Highest Discount
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* Store Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {POPULAR_STORES.map((st) => {
          const count = getCountForStore(st.id);
          const isSelected = selectedStore === st.id;
          return (
            <button
              key={st.id}
              type="button"
              onClick={() => onStoreChange(st.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-semibold transition whitespace-nowrap border ${
                isSelected
                  ? 'bg-slate-200 text-slate-950 border-white shadow-md font-bold'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span>{st.label}</span>
              {count > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isSelected ? 'bg-slate-950 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
