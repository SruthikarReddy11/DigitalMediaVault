import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  Plus,
  Check,
  ShoppingBag,
  Store,
  Layers,
  Sparkles,
} from 'lucide-react';
import { ProductSection, SavedProduct } from '../../types/product';
import { productsApi } from '../../services/productsApi';
import { useToast } from '../../contexts/ToastContext';

interface AddProductsToSectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  section: ProductSection | null;
  allProducts: SavedProduct[];
  currentSectionProductIds: string[];
  onProductsAdded: () => void;
}

export const AddProductsToSectionModal: React.FC<AddProductsToSectionModalProps> = ({
  isOpen,
  onClose,
  section,
  allProducts,
  currentSectionProductIds,
  onProductsAdded,
}) => {
  const { success, error } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter available products
  const filteredProducts = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return allProducts.filter((p) => {
      if (term) {
        const matches =
          p.title.toLowerCase().includes(term) ||
          (p.brand && p.brand.toLowerCase().includes(term)) ||
          p.store.toLowerCase().includes(term) ||
          (p.category && p.category.toLowerCase().includes(term));
        if (!matches) return false;
      }
      return true;
    });
  }, [allProducts, searchTerm]);

  if (!isOpen || !section) return null;

  const toggleSelect = (id: string) => {
    if (currentSectionProductIds.includes(id)) return; // already in section
    if (selectedProductIds.includes(id)) {
      setSelectedProductIds(selectedProductIds.filter((pId) => pId !== id));
    } else {
      setSelectedProductIds([...selectedProductIds, id]);
    }
  };

  const handleAdd = async () => {
    if (selectedProductIds.length === 0) return;
    setIsSubmitting(true);
    try {
      await productsApi.addProductsToSection(section.id, selectedProductIds);
      success(`Added ${selectedProductIds.length} product(s) to "${section.name}"!`);
      setSelectedProductIds([]);
      onProductsAdded();
      onClose();
    } catch (err: any) {
      error(err.message || 'Failed to add products to section');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-6 max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-md"
              style={{ backgroundColor: section.color }}
            >
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Add Products to &quot;{section.name}&quot;
              </h3>
              <p className="text-[11px] text-slate-400">
                Select items from your vault to organize into this section
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

        {/* Search Bar */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-950/40">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search products by title, store, or brand..."
              className="w-full bg-slate-900 border border-slate-700/80 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition"
            />
          </div>
        </div>

        {/* Product List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 min-h-[250px] max-h-[50vh]">
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500 space-y-2">
              <ShoppingBag className="w-10 h-10 stroke-[1.5]" />
              <p className="text-xs">No products found</p>
            </div>
          ) : (
            filteredProducts.map((product) => {
              const isAlreadyIn = currentSectionProductIds.includes(product.id);
              const isSelected = selectedProductIds.includes(product.id);

              return (
                <div
                  key={product.id}
                  onClick={() => toggleSelect(product.id)}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition cursor-pointer ${
                    isAlreadyIn
                      ? 'bg-slate-950/30 border-slate-800/50 opacity-60 cursor-not-allowed'
                      : isSelected
                      ? 'bg-brand-600/15 border-brand-500/60 shadow-md shadow-brand-500/10'
                      : 'bg-slate-950/60 hover:bg-slate-800/60 border-slate-800/70'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 pr-3">
                    {/* Thumbnail */}
                    <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0 p-1">
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

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {product.store}
                        </span>
                        {product.brand && (
                          <span className="text-[10px] font-bold text-brand-400 uppercase truncate">
                            {product.brand}
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-semibold text-white truncate max-w-sm sm:max-w-md mt-0.5">
                        {product.title}
                      </h4>
                      <p className="text-xs font-bold text-white font-mono mt-0.5">
                        {product.price !== null && product.price !== undefined
                          ? `${product.currencySymbol || '₹'}${product.price.toLocaleString('en-IN')}`
                          : 'Check Store'}
                      </p>
                    </div>
                  </div>

                  {/* Selection Indicator */}
                  <div className="shrink-0 pl-2">
                    {isAlreadyIn ? (
                      <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-slate-800 text-slate-400 border border-slate-700">
                        In Section
                      </span>
                    ) : (
                      <div
                        className={`w-6 h-6 rounded-xl border flex items-center justify-center transition ${
                          isSelected
                            ? 'bg-brand-600 border-brand-500 text-white'
                            : 'border-slate-700 hover:border-slate-500'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer with Add Button */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/90">
          <span className="text-xs text-slate-400 font-medium">
            {selectedProductIds.length} item(s) selected
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleAdd}
              disabled={isSubmitting || selectedProductIds.length === 0}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-brand-500/20 active:scale-95 transition disabled:opacity-50 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add to Section</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
