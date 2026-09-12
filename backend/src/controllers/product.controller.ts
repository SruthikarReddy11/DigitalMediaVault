import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { ProductService } from '../services/product.service';

export class ProductController {
  /**
   * Extract product details from URL
   */
  public static async extract(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { url } = req.body;
      if (!url || typeof url !== 'string' || !url.trim()) {
        return res.status(400).json({
          success: false,
          error: { message: 'A valid product link/URL is required' },
        });
      }

      const extracted = await ProductService.extractFromUrl(url.trim());
      res.json({
        success: true,
        data: extracted,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * List saved products with search and filtering
   */
  public static async list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const {
        search,
        store,
        category,
        favoriteOnly,
        purchasedOnly,
        sortBy,
        sortOrder,
      } = req.query;

      const filters: any = {};
      if (search) filters.search = String(search);
      if (store) filters.store = String(store);
      if (category) filters.category = String(category);
      if (favoriteOnly !== undefined) filters.isFavorite = favoriteOnly === 'true';
      if (purchasedOnly !== undefined) filters.isPurchased = purchasedOnly === 'true';
      if (sortBy) filters.sortBy = String(sortBy);
      if (sortOrder) filters.sortOrder = String(sortOrder);

      const result = await ProductService.listProducts(userId, filters);
      res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Save a new product
   */
  public static async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { url } = req.body;

      if (!url || typeof url !== 'string' || !url.trim()) {
        return res.status(400).json({
          success: false,
          error: { message: 'Product URL is required' },
        });
      }

      const product = await ProductService.saveProduct(userId, req.body);
      res.status(201).json({
        success: true,
        data: product,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get single product by ID
   */
  public static async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const productId = String(req.params.id);

      const product = await ProductService.getProductById(userId, productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          error: { message: 'Product not found' },
        });
      }

      res.json({
        success: true,
        data: product,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Update product
   */
  public static async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const productId = String(req.params.id);

      const updated = await ProductService.updateProduct(userId, productId, req.body);
      res.json({
        success: true,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Delete product
   */
  public static async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const productId = String(req.params.id);

      await ProductService.deleteProduct(userId, productId);
      res.json({
        success: true,
        message: 'Product deleted successfully',
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Toggle favorite
   */
  public static async toggleFavorite(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const productId = String(req.params.id);

      const product = await ProductService.toggleFavorite(userId, productId);
      res.json({
        success: true,
        data: product,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Toggle purchased status
   */
  public static async togglePurchased(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const productId = String(req.params.id);

      const product = await ProductService.togglePurchased(userId, productId);
      res.json({
        success: true,
        data: product,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Re-extract fresh price from live store
   */
  public static async refreshPrice(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const productId = String(req.params.id);

      const product = await ProductService.refreshProductPrice(userId, productId);
      res.json({
        success: true,
        data: product,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get share data with QR code and formatted share text
   */
  public static async getShareData(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const productId = String(req.params.id);

      const shareData = await ProductService.getProductShareData(userId, productId);
      res.json({
        success: true,
        data: shareData,
      });
    } catch (err) {
      next(err);
    }
  }
}
