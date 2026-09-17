import { prisma } from '../database/prisma';
import QRCode from 'qrcode';
import { ProductExtractorService, ProductExtractedData } from './productExtractor.service';
import { FileService } from './file.service';

export interface SaveProductInput {
  url: string;
  title?: string;
  description?: string;
  brand?: string;
  store?: string;
  category?: string;
  sectionId?: string;
  sectionIds?: string[];
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
  sectionId?: string;
  unsectionedOnly?: boolean;
  isFavorite?: boolean;
  isPurchased?: boolean;
  sortBy?: 'createdAt' | 'price' | 'discountPercent' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export class ProductService {
  /**
   * Helper to normalize e-commerce product URLs for deduplication
   */
  public static normalizeUrl(rawUrl: string): string {
    try {
      let clean = rawUrl.trim();
      if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
        clean = `https://${clean}`;
      }
      const parsed = new URL(clean);
      const host = parsed.hostname.toLowerCase().replace(/^www\./, '');

      // 1. Amazon: /dp/<ASIN> or /gp/product/<ASIN>
      if (host.includes('amazon.')) {
        const asinMatch = parsed.pathname.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})/i);
        if (asinMatch) {
          return `https://${host}/dp/${asinMatch[1].toUpperCase()}`;
        }
      }

      // 2. Flipkart: match /p/<id> or ?pid=<id>
      if (host.includes('flipkart.com')) {
        const pid = parsed.searchParams.get('pid');
        const pMatch = parsed.pathname.match(/\/p\/(itm[a-zA-Z0-9]+)/i);
        if (pid) {
          return `https://${host}${parsed.pathname}?pid=${pid}`;
        }
        if (pMatch) {
          return `https://${host}/p/${pMatch[1]}`;
        }
      }

      // 3. Myntra: product id
      if (host.includes('myntra.com')) {
        const idMatch =
          parsed.pathname.match(/\/(\d+)(?:\/buy|\/|$)/i) || parsed.pathname.match(/\/(\d+)/);
        if (idMatch) {
          return `https://${host}/${idMatch[1]}/buy`;
        }
      }

      // 4. Ajio: /p/<id>
      if (host.includes('ajio.com')) {
        const pMatch = parsed.pathname.match(/\/p\/([a-zA-Z0-9_]+)/i);
        if (pMatch) {
          return `https://${host}/p/${pMatch[1]}`;
        }
      }

      // 5. Meesho: /p/<id> or /s/p/<id>
      if (host.includes('meesho.com')) {
        const pMatch = parsed.pathname.match(/\/(?:s\/p|p)\/([a-zA-Z0-9]+)/i);
        if (pMatch) {
          return `https://${host}/s/p/${pMatch[1]}`;
        }
      }

      // Strip common query tracking parameters
      const trackingParams = [
        'ref',
        'ref_',
        'tag',
        'utm_source',
        'utm_medium',
        'utm_campaign',
        'utm_term',
        'utm_content',
        'qid',
        'sr',
        'sprefix',
        'keywords',
        'crid',
        'pd_rd_w',
        'pd_rd_wg',
        'pd_rd_r',
        'pf_rd_p',
        'pf_rd_r',
        'psc',
        'smid',
        'fbclid',
        'gclid',
        '_ga',
      ];
      for (const param of trackingParams) {
        parsed.searchParams.delete(param);
      }

      return parsed.toString().replace(/\/+$/, '');
    } catch {
      return rawUrl.trim().replace(/\/+$/, '');
    }
  }

  /**
   * Check if a product URL already exists in user's wishlist.
   * If any duplicates exist, automatically removes extras and keeps only one!
   */
  public static async checkProductExists(userId: string, targetUrl: string) {
    const rawUrl = targetUrl.trim();
    const normalized = ProductService.normalizeUrl(rawUrl);

    // Find matches by raw or normalized URL
    const existing = await prisma.savedProduct.findMany({
      where: {
        userId,
        OR: [
          { url: rawUrl },
          { url: normalized },
          ...(normalized !== rawUrl ? [{ url: { contains: normalized } }] : []),
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    if (existing.length > 0) {
      // If duplicates are found, remove extra copies
      if (existing.length > 1) {
        const duplicateIds = existing.slice(1).map((p) => p.id);
        await prisma.productSectionItem.deleteMany({
          where: { productId: { in: duplicateIds } },
        });
        await prisma.savedProduct.deleteMany({
          where: { id: { in: duplicateIds } },
        });
      }

      return {
        exists: true,
        product: existing[0],
      };
    }

    return {
      exists: false,
      product: null,
    };
  }

  /**
   * Deduplicate all products in user's wishlist: scans all products, removes any duplicates, and keeps one
   */
  public static async deduplicateWishlist(userId: string): Promise<number> {
    try {
      const allProducts = await prisma.savedProduct.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }, // latest first
      });

      const seenUrls = new Set<string>();
      const seenTitles = new Set<string>();
      const duplicateIds: string[] = [];

      for (const p of allProducts) {
        const normUrl = ProductService.normalizeUrl(p.url);
        const titleKey = `${(p.store || '').toLowerCase()}:::${p.title.trim().toLowerCase()}`;

        if (seenUrls.has(normUrl) || (p.title && seenTitles.has(titleKey))) {
          duplicateIds.push(p.id);
        } else {
          seenUrls.add(normUrl);
          if (p.title) seenTitles.add(titleKey);
        }
      }

      // Automatically purge and migrate any video links (YouTube/Vimeo) from saved products
      const videoProducts = await prisma.savedProduct.findMany({
        where: {
          userId,
          OR: [
            { url: { contains: 'youtube.com' } },
            { url: { contains: 'youtu.be' } },
            { url: { contains: 'vimeo.com' } },
          ],
        },
      });

      if (videoProducts.length > 0) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        for (const vp of videoProducts) {
          if (user) {
            try {
              await FileService.importLink(user as any, {
                url: vp.url,
                title: vp.title,
              });
            } catch {}
          }
        }
        const vpIds = videoProducts.map((p) => p.id);
        await prisma.productSectionItem.deleteMany({ where: { productId: { in: vpIds } } });
        await prisma.savedProduct.deleteMany({ where: { id: { in: vpIds } } });
      }

      if (duplicateIds.length > 0) {
        await prisma.productSectionItem.deleteMany({
          where: { productId: { in: duplicateIds } },
        });
        await prisma.savedProduct.deleteMany({
          where: { id: { in: duplicateIds } },
        });
        console.log(
          `[ProductService] Deduplicated ${duplicateIds.length} duplicate products for user ${userId}`
        );
      }

      return duplicateIds.length;
    } catch (err) {
      console.warn('[ProductService] Error in deduplicateWishlist:', err);
      return 0;
    }
  }

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
    const rawUrl = input.url.trim();

    // 0. Auto-redirect video links (YouTube, Vimeo, streams) directly to Videos section!
    const isVideoUrl =
      /(?:youtube\.com|youtu\.be|vimeo\.com|dailymotion\.com)/i.test(rawUrl) ||
      /\.(mp4|webm|m3u8|mov|mkv)(\?|$)/i.test(rawUrl);

    if (isVideoUrl) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user) {
        const video = await FileService.importLink(user as any, {
          url: rawUrl,
          title: input.title,
        });
        return {
          id: video.id,
          userId,
          url: rawUrl,
          title: video.originalName,
          store: 'YouTube',
          category: 'Video',
          price: null,
          currency: 'INR',
          currencySymbol: '₹',
          inStock: true,
          createdAt: new Date().toISOString(),
          isVideo: true,
          alreadyExists: false,
          message: 'Saved to Videos / Vault Theater',
        };
      }
    }

    const normalizedUrl = ProductService.normalizeUrl(rawUrl);

    // 1. Check if product already exists before extracting or creating
    const existingCheck = await ProductService.checkProductExists(userId, rawUrl);
    if (existingCheck.exists && existingCheck.product) {
      return {
        ...existingCheck.product,
        alreadyExists: true,
      };
    }

    let finalData = { ...input, url: normalizedUrl };

    // If title or price or image is missing, attempt auto-extraction
    if (!finalData.title || finalData.price === undefined || !finalData.imageUrl) {
      try {
        const extracted = await ProductExtractorService.extract(input.url);
        finalData = {
          ...extracted,
          ...input,
          url: normalizedUrl,
          title: input.title || extracted.title,
          price: input.price !== undefined ? input.price : extracted.price,
          originalPrice:
            input.originalPrice !== undefined ? input.originalPrice : extracted.originalPrice,
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

    // 2. Secondary check: after extraction, check if a product with the same store & title already exists
    if (finalData.title) {
      const matchByTitle = await prisma.savedProduct.findMany({
        where: {
          userId,
          store: finalData.store || store,
          title: finalData.title,
        },
        orderBy: { createdAt: 'desc' },
      });

      if (matchByTitle.length > 0) {
        if (matchByTitle.length > 1) {
          const duplicateIds = matchByTitle.slice(1).map((p) => p.id);
          await prisma.productSectionItem.deleteMany({
            where: { productId: { in: duplicateIds } },
          });
          await prisma.savedProduct.deleteMany({
            where: { id: { in: duplicateIds } },
          });
        }

        return {
          ...matchByTitle[0],
          alreadyExists: true,
        };
      }
    }

    // Collect target section IDs if provided
    const targetSectionIds: string[] = [];
    if (finalData.sectionId && typeof finalData.sectionId === 'string' && finalData.sectionId.trim()) {
      targetSectionIds.push(finalData.sectionId.trim());
    }
    if (finalData.sectionIds && Array.isArray(finalData.sectionIds)) {
      for (const sId of finalData.sectionIds) {
        if (typeof sId === 'string' && sId.trim() && !targetSectionIds.includes(sId.trim())) {
          targetSectionIds.push(sId.trim());
        }
      }
    }

    // Verify sections exist and belong to this user
    let validSectionIds: string[] = [];
    if (targetSectionIds.length > 0) {
      const ownedSections = await prisma.productSection.findMany({
        where: {
          id: { in: targetSectionIds },
          userId,
        },
        select: { id: true },
      });
      validSectionIds = ownedSections.map((s) => s.id);
    }

    const newProduct = await prisma.savedProduct.create({
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
        ...(validSectionIds.length > 0
          ? {
              sectionItems: {
                create: validSectionIds.map((secId, idx) => ({
                  sectionId: secId,
                  position: idx,
                })),
              },
            }
          : {}),
      },
    });

    return {
      ...newProduct,
      alreadyExists: false,
    };
  }

  /**
   * List saved products with filtering and sorting
   */
  public static async listProducts(userId: string, filters: ProductListFilters = {}) {
    // Automatically clean up any existing duplicates for this user
    await ProductService.deduplicateWishlist(userId).catch(() => 0);

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

    if (filters.sectionId) {
      where.sectionItems = {
        some: {
          sectionId: filters.sectionId,
        },
      };
    } else if (filters.unsectionedOnly) {
      where.sectionItems = {
        none: {},
      };
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

    const [products, totalCount, unsectionedCount, wishlistCount, purchasedCount, storeGroups] = await Promise.all([
      prisma.savedProduct.findMany({
        where,
        orderBy,
      }),
      prisma.savedProduct.count({ where }),
      prisma.savedProduct.count({
        where: {
          userId,
          sectionItems: { none: {} },
        },
      }),
      prisma.savedProduct.count({ where: { userId, isPurchased: false } }),
      prisma.savedProduct.count({ where: { userId, isPurchased: true } }),
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
      unsectionedCount,
      wishlistCount,
      purchasedCount,
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

  /**
   * Get share payload for a product with QR code data URL and formatted text
   */
  public static async getProductShareData(userId: string, productId: string) {
    const product = await prisma.savedProduct.findFirst({
      where: { id: productId, userId },
    });

    if (!product) {
      throw new Error('Product not found or unauthorized');
    }

    let qrDataUrl = '';
    try {
      qrDataUrl = await QRCode.toDataURL(product.url, {
        width: 300,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' },
      });
    } catch (err) {
      console.warn('[ProductService] QR Code generation notice:', err);
    }

    const priceText =
      product.price !== null && product.price !== undefined
        ? `${product.currencySymbol || '₹'}${product.price.toLocaleString('en-IN')}`
        : 'Check price on store';

    const discountText =
      product.discountPercent && product.discountPercent > 0
        ? ` (${product.discountPercent}% OFF)`
        : '';

    const formattedText = `🛍️ Check out this product on ${product.store}!\n\n*${product.title}*\n💰 Price: ${priceText}${discountText}\n🔗 Link: ${product.url}`;

    return {
      product,
      shareUrl: product.url,
      qrDataUrl,
      formattedText,
    };
  }
}

