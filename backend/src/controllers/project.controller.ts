import { Response, NextFunction } from 'express';
import fs from 'fs';
import { AuthenticatedRequest } from '../types';
import { ProjectService } from '../services/project.service';

export class ProjectController {
  /**
   * Auto extract website info & metadata from live URL
   */
  public static async extract(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { url } = req.body;
      if (!url || typeof url !== 'string' || !url.trim()) {
        return res.status(400).json({
          success: false,
          error: { message: 'A valid website or deployed frontend URL is required.' },
        });
      }

      const extracted = await ProjectService.extractFromUrl(url.trim());
      res.json({
        success: true,
        data: extracted,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Upload screenshot UI images to vault
   */
  public static async uploadImages(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({
          success: false,
          error: { message: 'Please select one or more image files to upload.' },
        });
      }

      const uploadItems = files.map((file) => ({
        buffer: file.buffer,
        filePath: file.path,
        originalname: Buffer.from(file.originalname, 'latin1').toString('utf8'),
        mimetype: file.mimetype,
        size: file.size,
      }));

      try {
        const uploaded = await ProjectService.uploadImages(req.user!, uploadItems);
        res.json({
          success: true,
          data: uploaded,
        });
      } finally {
        for (const file of files) {
          if (file.path && fs.existsSync(file.path)) {
            try {
              fs.unlinkSync(file.path);
            } catch {}
          }
        }
      }
    } catch (err) {
      next(err);
    }
  }

  /**
   * List projects with search, filter, and analytics stats
   */
  public static async list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { search, category, status, isFavorite, tech, sortBy, sortOrder } = req.query;

      const filters: any = {};
      if (search) filters.search = String(search);
      if (category) filters.category = String(category);
      if (status) filters.status = String(status);
      if (isFavorite !== undefined) filters.isFavorite = isFavorite === 'true';
      if (tech) filters.tech = String(tech);
      if (sortBy) filters.sortBy = String(sortBy);
      if (sortOrder) filters.sortOrder = String(sortOrder);

      const result = await ProjectService.listProjects(userId, filters);
      res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get single project by ID
   */
  public static async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const id = String(req.params.id);

      const project = await ProjectService.getProjectById(userId, id);
      if (!project) {
        return res.status(404).json({
          success: false,
          error: { message: 'Project not found.' },
        });
      }

      res.json({
        success: true,
        data: project,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Create a new project
   */
  public static async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { title, liveUrl } = req.body;

      if (!title || typeof title !== 'string' || !title.trim()) {
        return res.status(400).json({
          success: false,
          error: { message: 'Project title is required.' },
        });
      }

      if (!liveUrl || typeof liveUrl !== 'string' || !liveUrl.trim()) {
        return res.status(400).json({
          success: false,
          error: { message: 'Deployed frontend link is required.' },
        });
      }

      const project = await ProjectService.createProject(userId, req.body);
      res.status(201).json({
        success: true,
        message: 'Project added successfully!',
        data: project,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Update an existing project
   */
  public static async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const id = String(req.params.id);

      const updated = await ProjectService.updateProject(userId, id, req.body);
      if (!updated) {
        return res.status(404).json({
          success: false,
          error: { message: 'Project not found.' },
        });
      }

      res.json({
        success: true,
        message: 'Project updated successfully!',
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Delete a project
   */
  public static async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const id = String(req.params.id);

      const success = await ProjectService.deleteProject(userId, id);
      if (!success) {
        return res.status(404).json({
          success: false,
          error: { message: 'Project not found.' },
        });
      }

      res.json({
        success: true,
        message: 'Project removed from showcase.',
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Toggle project favorite
   */
  public static async toggleFavorite(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const id = String(req.params.id);

      const updated = await ProjectService.toggleFavorite(userId, id);
      if (!updated) {
        return res.status(404).json({
          success: false,
          error: { message: 'Project not found.' },
        });
      }

      res.json({
        success: true,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }
}
