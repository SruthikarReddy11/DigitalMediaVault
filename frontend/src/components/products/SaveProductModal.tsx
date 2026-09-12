import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Link as LinkIcon,
  ShoppingBag,
  ExternalLink,
  Check,
  AlertCircle,
  Loader2,
  Tag,
  DollarSign,
  Image as ImageIcon,
  Edit2,
  CheckCircle2,
} from 'lucide-react';
import { productsApi } from '../../services/productsApi';
import { SaveProductInput, ProductExtractResult } from '../../types/product';

interface SaveProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const CATEGORIES = [
  'General',
  'Electronics',
  'Fashion',
  'Beauty & Personal Care',
  'Home & Kitchen',
  'Books',
  'Sports & Fitness',
  'Toys & Baby',
  'Automotive',
  'Other',
];

const STORES = ['Amazon', 'Flipkart', 'Myntra', 'Ajio', 'Meesho', 'Nykaa', 'Tata CLiQ', 'Croma', 'Other'];

export const SaveProductModal: React.FC<SaveProductModalProps> = ({
  isOpen,
  onClose,
  onSaved,
}) => {
  const [url, setUrl] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [extractedPreview, setExtractedPreview] = useState<ProductExtractResult | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [brand, setBrand] = useState('');
  const [store, setStore] = useState('Amazon');
  const [category, setCategory] = useState('General');
  const [price, setPrice] = useState<string>('');
  const [originalPrice, setOriginalPrice] = useState<string>('');
  const [currency, setCurrency] = useState('INR');
  const [currencySymbol, setCurrencySymbol] = useState('₹');
  const [imageUrl, setImageUrl] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  if (!isOpen) return null;

  const handleExtract = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!url.trim()) {
      setErrorMsg('Please paste a product URL first.');
      return;
    }

    try {
      setExtracting(true);
      setErrorMsg('');

      const data = await productsApi.extractProduct(url.trim());
      setExtractedPreview(data);

      // Populate form
      setTitle(data.title || '');
      setDescription(data.description || '');
      setBrand(data.brand || '');
      setStore(data.store || 'Other');
      setCategory(data.category || 'General');
      setPrice(data.price !== undefined && data.price !== null ? String(data.price) : '');
      setOriginalPrice(
        data.originalPrice !== undefined && data.originalPrice !== null
          ? String(data.originalPrice)
          : ''
      );
      setCurrency(data.currency || 'INR');
      setCurrencySymbol(data.currencySymbol || '₹');
      setImageUrl(data.imageUrl || '');
    } catch (err: any) {
      console.error('Extraction error:', err);
      setErrorMsg(
        err.message ||
          'Could not automatically scrape full details. You can enter or edit the details manually below.'
      );
    } finally {
      setExtracting(false);
    }
  };

  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    const clean = tagInput.trim().replace(/^#/, '');
    if (!tags.includes(clean)) {
      setTags([...tags, clean]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      setErrorMsg('Product URL is required.');
      return;
    }
    if (!title.trim()) {
      setErrorMsg('Product title is required.');
      return;
    }

    try {
      setSaving(true);
      setErrorMsg('');

      const numPrice = price.trim() ? parseFloat(price) : undefined;
      const numMrp = originalPrice.trim() ? parseFloat(originalPrice) : undefined;
      const numTarget = targetPrice.trim() ? parseFloat(targetPrice) : undefined;

      let discountPercent: number | undefined = undefined;
      if (numPrice && numMrp && numMrp > numPrice) {
        discountPercent = Math.round(((numMrp - numPrice) / numMrp) * 100);
      }

      const payload: SaveProductInput = {
        url: url.trim(),
        title: title.trim(),
        description: description.trim() || undefined,
        brand: brand.trim() || undefined,
        store: store || 'Other',
        category: category || 'General',
        price: numPrice,
        originalPrice: numMrp,
        currency,
        currencySymbol,
        discountPercent,
        targetPrice: numTarget,
        imageUrl: imageUrl.trim() || undefined,
        additionalImages: extractedPreview?.additionalImages || [],
        rating: extractedPreview?.rating,
        reviewCount: extractedPreview?.reviewCount,
        inStock: extractedPreview?.inStock !== undefined ? extractedPreview.inStock : true,
        notes: notes.trim() || undefined,
        tags,
      };

      await productsApi.saveProduct(payload);
      onSaved();
      onClose();
    } catch (err: any) {
      console.error('Save product error:', err);
      setErrorMsg(err.message || 'Failed to save product to vault.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-6">
        {/* Accent Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-brand-500 via-indigo-500 to-rose-500" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-brand-500/20 to-indigo-500/20 border border-brand-500/30 text-brand-400 shadow-lg shadow-brand-500/10">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <span>Save Product to Wishlist</span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30">
                  Auto-Extract
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Paste any link from Flipkart, Amazon, Myntra, Ajio, Meesho & more
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[78vh]">
          {errorMsg && (
            <div className="p-3 bg-red-500/15 border border-red-500/30 rounded-xl text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* URL Input & Extract Action */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300">
              Product Link / URL <span className="text-red-400">*</span>
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  required
                  placeholder="https://www.flipkart.com/... or https://www.amazon.in/dp/..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleExtract();
                    }
                  }}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition"
                />
              </div>

              <button
                type="button"
                onClick={() => handleExtract()}
                disabled={extracting || !url.trim()}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md transition active:scale-95 shrink-0"
              >
                {extracting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Extracting...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Auto-Extract</span>
                  </>
                )}
              </button>
            </div>

            {/* Store tags hints */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px] text-slate-400">
              <span className="font-semibold text-slate-500">Supports:</span>
              {['Amazon', 'Flipkart', 'Myntra', 'Ajio', 'Meesho', 'Nykaa', 'Tata CLiQ', 'Croma'].map(
                (s) => (
                  <span
                    key={s}
                    className="px-2 py-0.5 bg-slate-950/50 border border-slate-800 rounded-md font-mono"
                  >
                    {s}
                  </span>
                )
              )}
            </div>
          </div>

          {/* Live Extracted Preview Card (if extracted) */}
          {extractedPreview && (
            <div className="p-3.5 bg-slate-950/80 border border-brand-500/30 rounded-2xl flex items-center gap-4 animate-fade-in">
              <div className="w-16 h-16 rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center p-1">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={title}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <ImageIcon className="w-6 h-6 text-slate-600" />
                )}
              </div>

              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-500/20 text-brand-300 border border-brand-500/30">
                    {store}
                  </span>
                  <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Details Extracted
                  </span>
                </div>
                <p className="text-xs font-bold text-white truncate">{title}</p>
                <div className="flex items-baseline gap-2 text-xs">
                  <span className="font-extrabold text-white">
                    {price ? `${currencySymbol}${price}` : 'Price not detected'}
                  </span>
                  {originalPrice && parseFloat(originalPrice) > (parseFloat(price) || 0) && (
                    <span className="text-[10px] text-slate-500 line-through">
                      {currencySymbol}
                      {originalPrice}
                    </span>
                  )}
                  {extractedPreview.discountPercent && (
                    <span className="text-[10px] font-extrabold text-emerald-400">
                      -{extractedPreview.discountPercent}% OFF
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Form Fields for Customization */}
          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Product Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Product name / item description..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition"
              />
            </div>

            {/* Store and Category */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Store / Platform</label>
                <select
                  value={store}
                  onChange={(e) => setStore(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500 transition"
                >
                  {STORES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500 transition"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Brand (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Apple, Nike..."
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition"
                />
              </div>
            </div>

            {/* Pricing Details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Current Price ({currencySymbol})
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. 1499"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Original MRP ({currencySymbol})
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. 2999"
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Target Price Alert ({currencySymbol})
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. 999"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition"
                />
              </div>
            </div>

            {/* Image URL */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Product Image URL
              </label>
              <input
                type="url"
                placeholder="https://..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition"
              />
            </div>

            {/* Notes & Tags */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Private Notes (Size, Color, Variant)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Size UK 9, Black color, buy during Big Billion Days..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tags (e.g. Wishlist, Gift, Deal)
                </label>
                <div className="flex gap-1.5 mb-1.5">
                  <input
                    type="text"
                    placeholder="Add tag..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    className="flex-1 px-3 py-1.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition"
                  >
                    Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-1">
                  {tags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 text-[11px] text-slate-300 font-medium"
                    >
                      <span>#{t}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(t)}
                        className="text-slate-400 hover:text-white"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !url.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-brand-600 via-indigo-600 to-brand-500 hover:from-brand-500 hover:to-indigo-500 shadow-lg shadow-brand-500/25 active:scale-95 transition disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving Product...</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" />
                    <span>Save to Product Vault</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
