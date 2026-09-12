import { api } from './api';
import {
  SavedProduct,
  ProductExtractResult,
  SaveProductInput,
  UpdateProductInput,
  ProductFilterOptions,
  ProductListResponse,
  ProductSection,
  CreateSectionInput,
  UpdateSectionInput,
} from '../types/product';

export const productsApi = {
  /**
   * Extract product metadata from any e-commerce URL
   */
  async extractProduct(url: string): Promise<ProductExtractResult> {
    const res = await api.post<{ success: boolean; data: ProductExtractResult }>(
      '/products/extract',
      { url }
    );
    return res.data.data;
  },

  /**
   * List saved products with optional filters
   */
  async getProducts(filters?: ProductFilterOptions): Promise<ProductListResponse> {
    const params: any = {};
    if (filters?.search) params.search = filters.search;
    if (filters?.store && filters.store !== 'ALL') params.store = filters.store;
    if (filters?.category && filters.category !== 'ALL') params.category = filters.category;
    if (filters?.sectionId) params.sectionId = filters.sectionId;
    if (filters?.unsectionedOnly !== undefined) params.unsectionedOnly = filters.unsectionedOnly;
    if (filters?.favoriteOnly) params.favoriteOnly = true;
    if (filters?.isPurchased !== undefined) params.isPurchased = filters.isPurchased;
    else if (filters?.purchasedOnly !== undefined) params.isPurchased = filters.purchasedOnly;
    if (filters?.sortBy) params.sortBy = filters.sortBy;
    if (filters?.sortOrder) params.sortOrder = filters.sortOrder;

    const res = await api.get<{ success: boolean; data: ProductListResponse }>(
      '/products',
      { params }
    );
    return res.data.data;
  },

  /**
   * Get single product by ID
   */
  async getProductById(id: string): Promise<SavedProduct> {
    const res = await api.get<{ success: boolean; data: SavedProduct }>(`/products/${id}`);
    return res.data.data;
  },

  /**
   * Save a product to vault
   */
  async saveProduct(data: SaveProductInput): Promise<SavedProduct> {
    const res = await api.post<{ success: boolean; data: SavedProduct }>('/products', data);
    return res.data.data;
  },

  /**
   * Update saved product details
   */
  async updateProduct(id: string, data: UpdateProductInput): Promise<SavedProduct> {
    const res = await api.put<{ success: boolean; data: SavedProduct }>(`/products/${id}`, data);
    return res.data.data;
  },

  /**
   * Delete product
   */
  async deleteProduct(id: string): Promise<void> {
    await api.delete(`/products/${id}`);
  },

  /**
   * Toggle favorite
   */
  async toggleFavorite(id: string): Promise<SavedProduct> {
    const res = await api.post<{ success: boolean; data: SavedProduct }>(
      `/products/${id}/favorite`
    );
    return res.data.data;
  },

  /**
   * Toggle purchased
   */
  async togglePurchased(id: string): Promise<SavedProduct> {
    const res = await api.post<{ success: boolean; data: SavedProduct }>(
      `/products/${id}/purchased`
    );
    return res.data.data;
  },

  /**
   * Re-extract fresh price from live store
   */
  async refreshPrice(id: string): Promise<SavedProduct> {
    const res = await api.post<{ success: boolean; data: SavedProduct }>(
      `/products/${id}/refresh`
    );
    return res.data.data;
  },

  /**
   * Get share payload with QR code and formatted share text
   */
  async getShareData(id: string): Promise<{
    product: SavedProduct;
    shareUrl: string;
    qrDataUrl: string;
    formattedText: string;
  }> {
    const res = await api.get<{
      success: boolean;
      data: {
        product: SavedProduct;
        shareUrl: string;
        qrDataUrl: string;
        formattedText: string;
      };
    }>(`/products/${id}/share`);
    return res.data.data;
  },

  /**
   * List all user product sections
   */
  async getSections(): Promise<ProductSection[]> {
    const res = await api.get<{ success: boolean; data: ProductSection[] }>('/products/sections');
    return res.data.data;
  },

  /**
   * Get section details with products (password optional for locked sections)
   */
  async getSectionById(id: string, password?: string): Promise<ProductSection & { products: SavedProduct[]; isAccessGranted: boolean }> {
    const res = await api.get<{
      success: boolean;
      data: ProductSection & { products: SavedProduct[]; isAccessGranted: boolean };
    }>(`/products/sections/${id}`, {
      params: password ? { password } : undefined,
    });
    return res.data.data;
  },

  /**
   * Create a new product section
   */
  async createSection(data: CreateSectionInput): Promise<ProductSection> {
    const res = await api.post<{ success: boolean; data: ProductSection }>(
      '/products/sections',
      data
    );
    return res.data.data;
  },

  /**
   * Update an existing section (name, color, password)
   */
  async updateSection(id: string, data: UpdateSectionInput): Promise<ProductSection> {
    const res = await api.put<{ success: boolean; data: ProductSection }>(
      `/products/sections/${id}`,
      data
    );
    return res.data.data;
  },

  /**
   * Delete a section
   */
  async deleteSection(id: string): Promise<void> {
    await api.delete(`/products/sections/${id}`);
  },

  /**
   * Verify password to unlock a locked section
   */
  async verifySectionPassword(id: string, password: string): Promise<boolean> {
    const res = await api.post<{ success: boolean; data: { verified: boolean } }>(
      `/products/sections/${id}/unlock`,
      { password }
    );
    return res.data.data.verified;
  },

  /**
   * Add products to a section
   */
  async addProductsToSection(sectionId: string, productIds: string[]): Promise<{ addedCount: number; sectionId: string }> {
    const res = await api.post<{
      success: boolean;
      data: { addedCount: number; sectionId: string };
    }>(`/products/sections/${sectionId}/products`, { productIds });
    return res.data.data;
  },

  /**
   * Remove a product from a section
   */
  async removeProductFromSection(sectionId: string, productId: string): Promise<void> {
    await api.delete(`/products/sections/${sectionId}/products/${productId}`);
  },

  /**
   * Get all sections that a specific product belongs to
   */
  async getProductSections(productId: string): Promise<ProductSection[]> {
    const res = await api.get<{ success: boolean; data: ProductSection[] }>(
      `/products/product-sections/${productId}`
    );
    return res.data.data;
  },
};
