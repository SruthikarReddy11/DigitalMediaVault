import { Response, NextFunction } from 'express';
import fs from 'fs';
import { AuthenticatedRequest } from '../types';
import { VaultService } from '../services/vault.service';

export class VaultController {
  public static async get2FAStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const status = await VaultService.get2FAStatus(req.user!.id);
      res.json({ success: true, data: status });
    } catch (err) {
      next(err);
    }
  }

  public static async setup2FA(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await VaultService.setup2FA(req.user!.id, req.user!.email);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  public static async verify2FA(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { token } = req.body;
      if (!token) {
        return res.status(400).json({
          success: false,
          error: { message: '6-digit Authenticator code is required.' },
        });
      }
      const result = await VaultService.verify2FA(req.user!.id, String(token), {
        ip: req.ip,
        userAgent: req.get('user-agent'),
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  public static async lockVault(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await VaultService.lockVault(req.user!.id, {
        ip: req.ip,
        userAgent: req.get('user-agent'),
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  public static async disable2FA(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { token } = req.body;
      if (!token) {
        return res.status(400).json({
          success: false,
          error: { message: '6-digit Authenticator code is required to disable 2FA.' },
        });
      }
      const result = await VaultService.disable2FA(req.user!.id, String(token));
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  // Folder Endpoints
  public static async listFolders(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const folders = await VaultService.listFolders(req.user!.id);
      res.json({ success: true, data: folders });
    } catch (err) {
      next(err);
    }
  }

  public static async createFolder(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { name, password, description, color, icon } = req.body;
      const folder = await VaultService.createFolder(req.user!.id, {
        name,
        password,
        description,
        color,
        icon,
      });
      res.status(201).json({ success: true, data: folder });
    } catch (err) {
      next(err);
    }
  }

  public static async unlockFolder(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const { password } = req.body;
      if (!password) {
        return res.status(400).json({
          success: false,
          error: { message: 'Folder password is required.' },
        });
      }
      const result = await VaultService.unlockFolder(req.user!.id, id, password);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  public static async updateFolder(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const folder = await VaultService.updateFolder(req.user!.id, id, req.body);
      res.json({ success: true, data: folder });
    } catch (err) {
      next(err);
    }
  }

  public static async deleteFolder(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const result = await VaultService.deleteFolder(req.user!.id, id);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  // Cell Endpoints
  public static async createCell(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const folderId = String(req.params.folderId);
      const { url, title, notes } = req.body;
      const cell = await VaultService.createCell(req.user!.id, folderId, {
        url,
        title,
        notes,
      });
      res.status(201).json({ success: true, data: cell });
    } catch (err) {
      next(err);
    }
  }

  public static async updateCell(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const cell = await VaultService.updateCell(req.user!.id, id, req.body);
      res.json({ success: true, data: cell });
    } catch (err) {
      next(err);
    }
  }

  public static async deleteCell(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const result = await VaultService.deleteCell(req.user!.id, id);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  public static async detectVideo(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const url = String(req.query.url || '');
      if (!url) {
        return res.json({ success: true, data: { hasVideo: false } });
      }
      const data = await VaultService.detectVideo(url);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  // Private Files Endpoints in Vault
  public static async uploadFolderFiles(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const folderId = String(req.params.id);
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({
          success: false,
          error: { message: 'Please select one or more private files to save in Secret Vault.' },
        });
      }

      const items = files.map((file) => ({
        buffer: file.buffer,
        filePath: file.path,
        originalname: Buffer.from(file.originalname, 'latin1').toString('utf8'),
        mimetype: file.mimetype,
        size: file.size,
      }));

      const results = await VaultService.uploadFolderFiles(req.user!, folderId, items);

      // Clean up temporary multer files if any
      for (const file of files) {
        if (file.path && fs.existsSync(file.path)) {
          try {
            fs.unlinkSync(file.path);
          } catch {}
        }
      }

      res.status(201).json({
        success: true,
        data: {
          files: results,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getFolderFiles(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const folderId = String(req.params.id);
      const files = await VaultService.getFolderFiles(req.user!.id, folderId);
      res.json({ success: true, data: files });
    } catch (err) {
      next(err);
    }
  }

  public static async deleteFile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const fileId = String(req.params.fileId);
      const result = await VaultService.deleteSecretFile(req.user!, fileId);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}
