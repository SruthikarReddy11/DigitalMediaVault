import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { AdminService } from '../services/admin.service';
import { prisma } from '../database/prisma';

export class AdminController {
  public static async getStats(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const stats = await AdminService.getSystemStats();
      res.json({
        success: true,
        data: stats,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getUsers(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { search, role, status, page, limit } = req.query as any;
      const result = await AdminService.getUsers({
        search,
        role,
        status,
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 20,
      });

      res.json({
        success: true,
        data: result.users,
        pagination: result.pagination,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async updateUserStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const updated = await AdminService.updateUserStatus(
        String(req.params.id),
        req.body,
        req.user!.id
      );
      res.json({
        success: true,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async deleteUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await AdminService.deleteUser(String(req.params.id), req.user!.id);
      res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getAllFiles(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { userId, fileType, search, page, limit, sortBy, sortOrder } = req.query as any;
      const result = await AdminService.getAllFiles({
        userId,
        fileType,
        search,
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 50,
        sortBy,
        sortOrder,
      });

      res.json({
        success: true,
        data: result.files,
        pagination: result.pagination,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getLogs(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { userId, action, page, limit } = req.query as any;
      const result = await AdminService.getAuditLogs({
        userId,
        action,
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 50,
      });

      res.json({
        success: true,
        data: result.logs,
        pagination: result.pagination,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async verifyUserPin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { userId, pin } = req.body;
      if (!userId || !pin) {
        res.status(400).json({
          success: false,
          error: { code: 'BAD_REQUEST', message: 'User ID and 4-digit PIN are required.' },
        });
        return;
      }

      const targetUser = await prisma.user.findUnique({
        where: { id: String(userId) },
        select: { id: true, name: true, securityPin: true },
      });

      if (!targetUser) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'User not found.' },
        });
        return;
      }

      if (String(targetUser.securityPin) !== String(pin).trim()) {
        res.status(403).json({
          success: false,
          error: { code: 'INVALID_PIN', message: 'Incorrect 4-digit security code. Access to private data denied.' },
        });
        return;
      }

      res.json({
        success: true,
        data: {
          verified: true,
          message: 'Security PIN verified successfully.',
        },
      });
    } catch (err) {
      next(err);
    }
  }
}
