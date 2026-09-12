import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { ProductSectionService } from '../services/productSection.service';

export class ProductSectionController {
  public static async list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const sections = await ProductSectionService.listSections(userId);
      res.json({
        success: true,
        data: sections,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const section = await ProductSectionService.createSection(userId, req.body);
      res.status(201).json({
        success: true,
        data: section,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const sectionId = String(req.params.id);
      const password = req.query.password as string | undefined;

      const section = await ProductSectionService.getSectionById(userId, sectionId, password);
      if (!section) {
        return res.status(404).json({
          success: false,
          error: { message: 'Section not found' },
        });
      }

      res.json({
        success: true,
        data: section,
      });
    } catch (err: any) {
      if (err.message === 'Incorrect password for this section') {
        return res.status(401).json({
          success: false,
          error: { message: err.message },
        });
      }
      next(err);
    }
  }

  public static async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const sectionId = String(req.params.id);

      const updated = await ProductSectionService.updateSection(userId, sectionId, req.body);
      res.json({
        success: true,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const sectionId = String(req.params.id);

      await ProductSectionService.deleteSection(userId, sectionId);
      res.json({
        success: true,
        data: { message: 'Section deleted' },
      });
    } catch (err) {
      next(err);
    }
  }

  public static async verifyPassword(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const sectionId = String(req.params.id);
      const { password } = req.body;

      if (!password || typeof password !== 'string') {
        return res.status(400).json({
          success: false,
          error: { message: 'Password is required' },
        });
      }

      const isValid = await ProductSectionService.verifyPassword(userId, sectionId, password);
      if (!isValid) {
        return res.status(401).json({
          success: false,
          error: { message: 'Incorrect password' },
        });
      }

      res.json({
        success: true,
        data: { verified: true },
      });
    } catch (err) {
      next(err);
    }
  }

  public static async addProducts(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const sectionId = String(req.params.id);
      const { productIds, productId } = req.body;

      const idsToAdd = Array.isArray(productIds)
        ? productIds
        : productId
        ? [productId]
        : [];

      if (idsToAdd.length === 0) {
        return res.status(400).json({
          success: false,
          error: { message: 'Product ID(s) required' },
        });
      }

      const result = await ProductSectionService.addProductsToSection(userId, sectionId, idsToAdd);
      res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async removeProduct(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const sectionId = String(req.params.id);
      const productId = String(req.params.productId);

      const result = await ProductSectionService.removeProductFromSection(
        userId,
        sectionId,
        productId
      );
      res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getProductSections(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = req.user!.id;
      const productId = String(req.params.productId);

      const sections = await ProductSectionService.getProductSections(userId, productId);
      res.json({
        success: true,
        data: sections,
      });
    } catch (err) {
      next(err);
    }
  }
}
