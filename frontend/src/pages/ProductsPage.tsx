import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProductsHeader } from '../components/products/ProductsHeader';
import { ProductCard } from '../components/products/ProductCard';
import { SaveProductModal } from '../components/products/SaveProductModal';
import { ShareProductModal } from '../components/products/ShareProductModal';
import { ProductSectionsBar } from '../components/products/ProductSectionsBar';
import { CreateSectionModal } from '../components/products/CreateSectionModal';
import { UnlockSectionModal } from '../components/products/UnlockSectionModal';
import { AddProductsToSectionModal } from '../components/products/AddProductsToSectionModal';
import { AddToSectionDialog } from '../components/products/AddToSectionDialog';
import { SavedProduct, ProductFilterOptions, ProductSection } from '../types/product';
import { productsApi } from '../services/productsApi';
import { useToast } from '../contexts/ToastContext';
import {
  ShoppingBag,
  Plus,
  Loader2,
  Sparkles,
  Search,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';

export const ProductsPage: React.FC = () => {
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [products, setProducts] = useState<SavedProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [purchasedCount, setPurchasedCount] = useState(0);
  const [totalValue, setTotalValue] = useState(0);
  const [totalDiscountedCount, setTotalDiscountedCount] = useState(0);
  const [storeCounts, setStoreCounts] = useState<{ store: string; count: number }[]>([]);

  // View Mode: 'wishlist' (default, unpurchased items) | 'purchased' (bought items vault) | 'all'
  const [viewMode, setViewMode] = useState<'wishlist' | 'purchased' | 'all'>('wishlist');

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStore, setSelectedStore] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [sortBy, setSortBy] = useState('createdAt');
  const [favoriteOnly, setFavoriteOnly] = useState(false);

  // Custom Product Sections state
  const [sections, setSections] = useState<ProductSection[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [unsectionedCount, setUnsectionedCount] = useState<number>(0);
  const [unlockedSectionIds, setUnlockedSectionIds] = useState<string[]>([]);
  const [isCreateSectionOpen, setIsCreateSectionOpen] = useState(false);
  const [sectionToEdit, setSectionToEdit] = useState<ProductSection | null>(null);
  const [sectionToUnlock, setSectionToUnlock] = useState<ProductSection | null>(null);
  const [sectionToAddProducts, setSectionToAddProducts] = useState<ProductSection | null>(null);
  const [productToAddToSection, setProductToAddToSection] = useState<SavedProduct | null>(null);

  // Modals
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveModalInitialSectionId, setSaveModalInitialSectionId] = useState<string | null>(null);
  const [productToShare, setProductToShare] = useState<SavedProduct | null>(null);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);

  const handleOpenSaveModal = (sectionId?: string | null) => {
    setSaveModalInitialSectionId(sectionId !== undefined ? sectionId : selectedSectionId);
    setIsSaveModalOpen(true);
  };

  const fetchSections = useCallback(async () => {
    try {
      const data = await productsApi.getSections();
      setSections(data);
    } catch (err: any) {
      console.error('Failed to load sections:', err);
    }
  }, []);

  useEffect(() => {
    fetchSections();
  }, [fetchSections]);

  const fetchProducts = useCallback(async () => {
    try {
      setIsLoading(true);

      const filters: ProductFilterOptions = {
        search: searchTerm.trim() || undefined,
        store: selectedStore !== 'ALL' ? selectedStore : undefined,
        category: selectedCategory !== 'ALL' ? selectedCategory : undefined,
        sectionId: selectedSectionId || undefined,
        unsectionedOnly: selectedSectionId ? undefined : true,
        favoriteOnly: favoriteOnly || undefined,
        isPurchased:
          viewMode === 'wishlist' ? false : viewMode === 'purchased' ? true : undefined,
      };

      if (sortBy === 'price_asc') {
        filters.sortBy = 'price';
        filters.sortOrder = 'asc';
      } else if (sortBy === 'price_desc') {
        filters.sortBy = 'price';
        filters.sortOrder = 'desc';
      } else if (sortBy === 'discount') {
        filters.sortBy = 'discountPercent';
        filters.sortOrder = 'desc';
      } else {
        filters.sortBy = 'createdAt';
        filters.sortOrder = 'desc';
      }

      const res = await productsApi.getProducts(filters);
      setProducts(res.products);
      setTotalCount(res.totalCount);
      if (res.unsectionedCount !== undefined) setUnsectionedCount(res.unsectionedCount);
      if (res.wishlistCount !== undefined) setWishlistCount(res.wishlistCount);
      if (res.purchasedCount !== undefined) setPurchasedCount(res.purchasedCount);
      setTotalValue(res.totalValue);
      setTotalDiscountedCount(res.totalDiscountedCount);
      setStoreCounts(res.storeCounts);
    } catch (err: any) {
      console.error('Failed to load products:', err);
      error(err.message || 'Failed to load products');
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, selectedStore, selectedCategory, selectedSectionId, sortBy, favoriteOnly, viewMode, error]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleToggleFavorite = async (id: string) => {
    try {
      const updated = await productsApi.toggleFavorite(id);
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, isFavorite: updated.isFavorite } : p))
      );
      success(updated.isFavorite ? 'Added to favorites' : 'Removed from favorites');
    } catch (err: any) {
      error(err.message || 'Failed to update favorite');
    }
  };

  const handleTogglePurchased = async (id: string) => {
    try {
      const updated = await productsApi.togglePurchased(id);

      // Dynamically update counter states
      if (updated.isPurchased) {
        setWishlistCount((prev) => Math.max(0, prev - 1));
        setPurchasedCount((prev) => prev + 1);
      } else {
        setPurchasedCount((prev) => Math.max(0, prev - 1));
        setWishlistCount((prev) => prev + 1);
      }

      // If viewing wishlist and item is now purchased -> remove from wishlist view!
      if (viewMode === 'wishlist' && updated.isPurchased) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
        success('Moved to Purchased section!');
      } else if (viewMode === 'purchased' && !updated.isPurchased) {
        // If viewing purchased and item is marked unpurchased -> remove from purchased view!
        setProducts((prev) => prev.filter((p) => p.id !== id));
        success('Moved back to Wishlist!');
      } else {
        setProducts((prev) =>
          prev.map((p) => (p.id === id ? { ...p, isPurchased: updated.isPurchased } : p))
        );
        success(updated.isPurchased ? 'Moved to Purchased section!' : 'Moved back to Wishlist!');
      }
    } catch (err: any) {
      error(err.message || 'Failed to update purchased status');
    }
  };

  const handleRefreshPrice = async (id: string) => {
    try {
      setRefreshingId(id);
      const fresh = await productsApi.refreshPrice(id);
      setProducts((prev) => prev.map((p) => (p.id === id ? fresh : p)));
      success('Price & details refreshed from store');
    } catch (err: any) {
      error(err.message || 'Failed to refresh product price');
    } finally {
      setRefreshingId(null);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this product from your vault?')) return;
    try {
      await productsApi.deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      success('Product removed from vault');
      fetchProducts();
      fetchSections();
    } catch (err: any) {
      error(err.message || 'Failed to delete product');
    }
  };

  const handleSelectSection = (sectionId: string | null) => {
    if (sectionId === null) {
      setSelectedSectionId(null);
      return;
    }

    const section = sections.find((s) => s.id === sectionId);
    if (!section) return;

    if (section.isLocked && !unlockedSectionIds.includes(section.id)) {
      setSectionToUnlock(section);
    } else {
      setSelectedSectionId(section.id);
    }
  };

  const handleSectionUnlocked = (sectionId: string) => {
    if (!unlockedSectionIds.includes(sectionId)) {
      setUnlockedSectionIds((prev) => [...prev, sectionId]);
    }
    setSelectedSectionId(sectionId);
  };

  const handleRelockSection = (sectionId: string) => {
    setUnlockedSectionIds((prev) => prev.filter((id) => id !== sectionId));
    if (selectedSectionId === sectionId) {
      setSelectedSectionId(null);
    }
    success('Section relocked');
  };

  const handleDeleteSection = async (sectionId: string) => {
    if (
      !window.confirm(
        'Delete this section? Products in this section will NOT be deleted from your vault.'
      )
    ) {
      return;
    }

    try {
      await productsApi.deleteSection(sectionId);
      if (selectedSectionId === sectionId) {
        setSelectedSectionId(null);
      }
      fetchSections();
      fetchProducts();
      success('Section deleted');
    } catch (err: any) {
      error(err.message || 'Failed to delete section');
    }
  };

  const handleRemoveFromSection = async (productId: string) => {
    if (!selectedSectionId) return;
    try {
      await productsApi.removeProductFromSection(selectedSectionId, productId);
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      fetchSections();
      success('Product removed from section');
    } catch (err: any) {
      error(err.message || 'Failed to remove product from section');
    }
  };

  return (
    <div className="space-y-6 pb-16 animate-fade-in">
      {/* Header with Search, Filter Pills & Summary Metrics */}
      <ProductsHeader
        onNewProduct={() => handleOpenSaveModal(selectedSectionId)}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedStore={selectedStore}
        onStoreChange={setSelectedStore}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        sortBy={sortBy}
        onSortChange={setSortBy}
        favoriteOnly={favoriteOnly}
        onToggleFavoriteOnly={() => setFavoriteOnly(!favoriteOnly)}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        wishlistCount={wishlistCount}
        purchasedCount={purchasedCount}
        storeCounts={storeCounts}
        totalCount={totalCount}
        totalValue={totalValue}
        totalDiscountedCount={totalDiscountedCount}
      />

      {/* Custom Product Sections Bar */}
      <ProductSectionsBar
        sections={sections}
        selectedSectionId={selectedSectionId}
        onSelectSection={handleSelectSection}
        onNewSection={() => {
          setSectionToEdit(null);
          setIsCreateSectionOpen(true);
        }}
        onEditSection={(section) => {
          setSectionToEdit(section);
          setIsCreateSectionOpen(true);
        }}
        onDeleteSection={handleDeleteSection}
        onAddProductLink={(section) => handleOpenSaveModal(section.id)}
        unlockedSectionIds={unlockedSectionIds}
        onRelockSection={handleRelockSection}
        totalProductsCount={totalCount}
        unsectionedCount={unsectionedCount}
      />

      {/* Grid Canvas */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-80 bg-slate-900/40 border border-slate-800 rounded-2xl">
          <Loader2 className="w-8 h-8 text-brand-500 animate-spin mb-2" />
          <p className="text-xs text-slate-400">
            {viewMode === 'purchased'
              ? 'Loading your purchased products...'
              : 'Loading your product wishlist...'}
          </p>
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 bg-slate-900/50 border border-slate-800 rounded-2xl text-center space-y-4">
          <div
            className={`p-4 rounded-2xl border shadow-inner ${
              viewMode === 'purchased'
                ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400'
                : 'bg-slate-950/80 border-slate-800 text-brand-400'
            }`}
          >
            {viewMode === 'purchased' ? (
              <CheckCircle2 className="w-10 h-10" />
            ) : (
              <ShoppingBag className="w-10 h-10" />
            )}
          </div>
          <div className="max-w-md space-y-1">
            <h3 className="text-base font-bold text-white">
              {selectedSectionId
                ? 'No products in this section'
                : !selectedSectionId && unsectionedCount === 0 && sections.length > 0 && !searchTerm && selectedStore === 'ALL' && selectedCategory === 'ALL'
                ? 'All products organized into sections!'
                : viewMode === 'purchased'
                ? 'No purchased products yet'
                : 'No products in wishlist'}
            </h3>
            <p className="text-xs text-slate-400">
              {selectedSectionId
                ? 'This section is currently empty. Click "Add Products" above to populate it with items from your vault!'
                : !selectedSectionId && unsectionedCount === 0 && sections.length > 0 && !searchTerm && selectedStore === 'ALL' && selectedCategory === 'ALL'
                ? 'All your saved items have been placed into custom sections. Select a section above to view its products, or save a new product to your vault.'
                : searchTerm || selectedStore !== 'ALL' || selectedCategory !== 'ALL' || favoriteOnly
                ? 'No products match your current filters. Try resetting the search or filters.'
                : viewMode === 'purchased'
                ? 'Items you mark as bought in your wishlist will be moved and saved here in your Purchased vault.'
                : 'Your wishlist is empty! Save links from Flipkart, Amazon, Myntra, Ajio, or any store and automatically extract photos, prices, and discounts.'}
            </p>
          </div>

          {selectedSectionId ? (
            <button
              type="button"
              onClick={() => handleOpenSaveModal(selectedSectionId)}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-brand-600 via-indigo-600 to-brand-500 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-brand-500/20 active:scale-95 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Product Link to this Section</span>
            </button>
          ) : viewMode === 'purchased' ? (
            <button
              type="button"
              onClick={() => setViewMode('wishlist')}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-brand-600 via-indigo-600 to-brand-500 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-brand-500/20 active:scale-95 transition cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>View Your Wishlist ({wishlistCount})</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleOpenSaveModal(null)}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-brand-600 via-indigo-600 to-brand-500 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-brand-500/20 active:scale-95 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Save Your First Product Link</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onSelect={(p) => navigate(`/products/${p.id}`, { state: { product: p } })}
              onToggleFavorite={handleToggleFavorite}
              onTogglePurchased={handleTogglePurchased}
              onRefreshPrice={handleRefreshPrice}
              onDelete={handleDeleteProduct}
              onShare={setProductToShare}
              onAddToSection={setProductToAddToSection}
              onRemoveFromSection={selectedSectionId ? handleRemoveFromSection : undefined}
              currentSectionId={selectedSectionId}
              isRefreshing={refreshingId === product.id}
            />
          ))}
        </div>
      )}

      {/* Save Product Modal */}
      {isSaveModalOpen && (
        <SaveProductModal
          isOpen={isSaveModalOpen}
          onClose={() => {
            setIsSaveModalOpen(false);
            setSaveModalInitialSectionId(null);
          }}
          onSaved={() => {
            fetchProducts();
            fetchSections();
            success('Product link saved successfully!');
          }}
          sections={sections}
          initialSectionId={saveModalInitialSectionId}
        />
      )}

      {/* Share Product Modal */}
      {productToShare && (
        <ShareProductModal
          isOpen={!!productToShare}
          onClose={() => setProductToShare(null)}
          product={productToShare}
        />
      )}

      {/* Create / Edit Section Modal */}
      {isCreateSectionOpen && (
        <CreateSectionModal
          isOpen={isCreateSectionOpen}
          onClose={() => {
            setIsCreateSectionOpen(false);
            setSectionToEdit(null);
          }}
          sectionToEdit={sectionToEdit}
          onSaved={(saved) => {
            fetchSections();
            fetchProducts();
            setSelectedSectionId(saved.id);
          }}
        />
      )}

      {/* Unlock Section Modal */}
      {sectionToUnlock && (
        <UnlockSectionModal
          isOpen={!!sectionToUnlock}
          onClose={() => setSectionToUnlock(null)}
          section={sectionToUnlock}
          onUnlocked={handleSectionUnlocked}
        />
      )}

      {/* Add Products To Section Modal */}
      {sectionToAddProducts && (
        <AddProductsToSectionModal
          isOpen={!!sectionToAddProducts}
          onClose={() => setSectionToAddProducts(null)}
          section={sectionToAddProducts}
          onProductsAdded={() => {
            fetchSections();
            fetchProducts();
          }}
        />
      )}

      {/* Add Single Product to Section Dialog */}
      {productToAddToSection && (
        <AddToSectionDialog
          isOpen={!!productToAddToSection}
          onClose={() => {
            setProductToAddToSection(null);
            fetchSections();
            fetchProducts();
          }}
          product={productToAddToSection}
          onOpenCreateSection={() => {
            setSectionToEdit(null);
            setIsCreateSectionOpen(true);
          }}
        />
      )}
    </div>
  );
};
