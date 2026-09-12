import { api } from './api';
import {
  SavedProduct,
  ProductExtractResult,
  SaveProductInput,
  UpdateProductInput,
  ProductFilterOptions,
  ProductListResponse,
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
    if (filters?.favoriteOnly) params.favoriteOnly = true;
    if (filters?.purchasedOnly) params.purchasedOnly = true;
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
};
