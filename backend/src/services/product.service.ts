import { prisma } from '../database/prisma';
import { ProductExtractorService, ProductExtractedData } from './productExtractor.service';

export interface SaveProductInput {
  url: string;
  title?: string;
  description?: string;
  brand?: string;
  store?: string;
  category?: string;
  price?: number;
  originalPrice?: number;
  currency?: string;
  currencySymbol?: string;
  discountPercent?: number;
  targetPrice?: number;
  imageUrl?: string;
  additionalImages?: string[];
  rating?: number;
  reviewCount?: number;
  inStock?: boolean;
  notes?: string;
  tags?: string[];
  isFavorite?: boolean;
}

export interface UpdateProductInput {
  title?: string;
  description?: string;
  brand?: string;
  store?: string;
  category?: string;
  price?: number;
  originalPrice?: number;
  currency?: string;
  currencySymbol?: string;
  discountPercent?: number;
  targetPrice?: number;
  imageUrl?: string;
  additionalImages?: string[];
  rating?: number;
  reviewCount?: number;
  inStock?: boolean;
  notes?: string;
  tags?: string[];
  isFavorite?: boolean;
  isPurchased?: boolean;
}

export interface ProductListFilters {
  search?: string;
  store?: string;
  category?: string;
  isFavorite?: boolean;
  isPurchased?: boolean;
  sortBy?: 'createdAt' | 'price' | 'discountPercent' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export class ProductService {
  /**
   * Extract product details from URL without saving
   */
  public static async extractFromUrl(url: string): Promise<ProductExtractedData> {
    return await ProductExtractorService.extract(url);
  }

  /**
   * Save a product to the user's vault
   */
  public static async saveProduct(userId: string, input: SaveProductInput) {
    let finalData = { ...input };

    // If title or price or image is missing, attempt auto-extraction
    if (!finalData.title || finalData.price === undefined || !finalData.imageUrl) {
      try {
        const extracted = await ProductExtractorService.extract(input.url);
        finalData = {
          ...extracted,
          ...input,
          title: input.title || extracted.title,
          price: input.price !== undefined ? input.price : extracted.price,
          originalPrice: input.originalPrice !== undefined ? input.originalPrice : extracted.originalPrice,
          imageUrl: input.imageUrl || extracted.imageUrl,
          store: input.store || extracted.store,
          category: input.category || extracted.category,
          brand: input.brand || extracted.brand,
          discountPercent:
            input.discountPercent !== undefined ? input.discountPercent : extracted.discountPercent,
          inStock: input.inStock !== undefined ? input.inStock : extracted.inStock,
        };
      } catch (err) {
        console.warn('[ProductService] Extraction on save notice:', err);
      }
    }

    const { store, currency, currencySymbol } = ProductExtractorService.detectStore(input.url);

    return await prisma.savedProduct.create({
      data: {
        userId,
        url: finalData.url,
        title: finalData.title || `Product from ${store}`,
        description: finalData.description,
        brand: finalData.brand,
        store: finalData.store || store,
        category: finalData.category || 'General',
        price: finalData.price,
        originalPrice: finalData.originalPrice,
        currency: finalData.currency || currency,
        currencySymbol: finalData.currencySymbol || currencySymbol,
        discountPercent: finalData.discountPercent,
        targetPrice: finalData.targetPrice,
        imageUrl: finalData.imageUrl,
        additionalImages: finalData.additionalImages || [],
        rating: finalData.rating,
        reviewCount: finalData.reviewCount,
        inStock: finalData.inStock !== undefined ? finalData.inStock : true,
        isFavorite: finalData.isFavorite || false,
        notes: finalData.notes,
        tags: finalData.tags || [],
      },
    });
  }

  /**
   * List saved products with filtering and sorting
   */
  public static async listProducts(userId: string, filters: ProductListFilters = {}) {
    const where: any = { userId };

    if (filters.store && filters.store !== 'ALL') {
      where.store = { equals: filters.store, mode: 'insensitive' };
    }

    if (filters.category && filters.category !== 'ALL') {
      where.category = { equals: filters.category, mode: 'insensitive' };
    }

    if (filters.isFavorite !== undefined) {
      where.isFavorite = filters.isFavorite;
    }

    if (filters.isPurchased !== undefined) {
      where.isPurchased = filters.isPurchased;
    }

    if (filters.search && filters.search.trim()) {
      const q = filters.search.trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { brand: { contains: q, mode: 'insensitive' } },
        { store: { contains: q, mode: 'insensitive' } },
        { category: { contains: q, mode: 'insensitive' } },
        { notes: { contains: q, mode: 'insensitive' } },
      ];
    }

    const sortField = filters.sortBy || 'createdAt';
    const sortOrder = filters.sortOrder || 'desc';

    const orderBy: any = {};
    orderBy[sortField] = sortOrder;

    const [products, totalCount, storeGroups] = await Promise.all([
      prisma.savedProduct.findMany({
        where,
        orderBy,
      }),
      prisma.savedProduct.count({ where }),
      prisma.savedProduct.groupBy({
        by: ['store'],
        where: { userId },
        _count: { id: true },
      }),
    ]);

    // Calculate metrics
    const totalValue = products.reduce((sum, p) => sum + (p.price || 0), 0);
    const totalDiscountedCount = products.filter((p) => p.discountPercent && p.discountPercent > 0).length;

    return {
      products,
      totalCount,
      totalValue,
      totalDiscountedCount,
      storeCounts: storeGroups.map((g) => ({ store: g.store, count: g._count.id })),
    };
  }

  /**
   * Get single product by ID
   */
  public static async getProductById(userId: string, productId: string) {
    return await prisma.savedProduct.findFirst({
      where: { id: productId, userId },
    });
  }

  /**
   * Update saved product details
   */
  public static async updateProduct(userId: string, productId: string, data: UpdateProductInput) {
    const existing = await prisma.savedProduct.findFirst({
      where: { id: productId, userId },
    });

    if (!existing) {
      throw new Error('Product not found or unauthorized');
    }

    // Recalculate discount if prices are updated
    let discountPercent = data.discountPercent;
    const effPrice = data.price !== undefined ? data.price : existing.price;
    const effMrp = data.originalPrice !== undefined ? data.originalPrice : existing.originalPrice;
    if (effPrice && effMrp && effMrp > effPrice) {
      discountPercent = Math.round(((effMrp - effPrice) / effMrp) * 100);
    }

    return await prisma.savedProduct.update({
      where: { id: productId },
      data: {
        ...data,
        discountPercent,
      },
    });
  }

  /**
   * Delete product from vault
   */
  public static async deleteProduct(userId: string, productId: string) {
    const existing = await prisma.savedProduct.findFirst({
      where: { id: productId, userId },
    });

    if (!existing) {
      throw new Error('Product not found or unauthorized');
    }

    return await prisma.savedProduct.delete({
      where: { id: productId },
    });
  }

  /**
   * Toggle favorite status
   */
  public static async toggleFavorite(userId: string, productId: string) {
    const existing = await prisma.savedProduct.findFirst({
      where: { id: productId, userId },
    });

    if (!existing) {
      throw new Error('Product not found or unauthorized');
    }

    return await prisma.savedProduct.update({
      where: { id: productId },
      data: { isFavorite: !existing.isFavorite },
    });
  }

  /**
   * Toggle purchased status
   */
  public static async togglePurchased(userId: string, productId: string) {
    const existing = await prisma.savedProduct.findFirst({
      where: { id: productId, userId },
    });

    if (!existing) {
      throw new Error('Product not found or unauthorized');
    }

    return await prisma.savedProduct.update({
      where: { id: productId },
      data: { isPurchased: !existing.isPurchased },
    });
  }

  /**
   * Re-extract fresh price and status from the live e-commerce store
   */
  public static async refreshProductPrice(userId: string, productId: string) {
    const existing = await prisma.savedProduct.findFirst({
      where: { id: productId, userId },
    });

    if (!existing) {
      throw new Error('Product not found or unauthorized');
    }

    const fresh = await ProductExtractorService.extract(existing.url);

    let discountPercent = existing.discountPercent;
    if (fresh.price && fresh.originalPrice && fresh.originalPrice > fresh.price) {
      discountPercent = Math.round(((fresh.originalPrice - fresh.price) / fresh.originalPrice) * 100);
    }

    return await prisma.savedProduct.update({
      where: { id: productId },
      data: {
        price: fresh.price !== undefined ? fresh.price : existing.price,
        originalPrice: fresh.originalPrice !== undefined ? fresh.originalPrice : existing.originalPrice,
        discountPercent,
        inStock: fresh.inStock,
        rating: fresh.rating !== undefined ? fresh.rating : existing.rating,
        reviewCount: fresh.reviewCount !== undefined ? fresh.reviewCount : existing.reviewCount,
        imageUrl: fresh.imageUrl || existing.imageUrl,
      },
    });
  }
}
