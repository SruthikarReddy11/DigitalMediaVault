import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { ContactService } from '../services/contact.service';

export class ContactController {
  /**
   * Helper to verify contacts unlock token from headers
   */
  private static requireUnlock(req: AuthenticatedRequest, res: Response): boolean {
    const token = (req.headers['x-contacts-token'] as string) || (req.query.unlockToken as string);
    if (!token || !ContactService.verifyUnlock(req.user!.id, token)) {
      res.status(401).json({
        success: false,
        error: {
          code: 'CONTACTS_LOCKED',
          message: 'Secure contacts vault is locked. Please unlock with your password.',
        },
      });
      return false;
    }
    return true;
  }

  /**
   * Unlock contacts vault with password
   */
  public static async unlock(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { password } = req.body;
      if (!password) {
        return res.status(400).json({
          success: false,
          error: { message: 'Password is required to unlock contacts.' },
        });
      }

      const result = await ContactService.unlockVault(req.user!.id, password, {
        ip: req.ip,
        userAgent: req.headers['user-agent'] as string,
      });

      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * List all contacts
   */
  public static async list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!ContactController.requireUnlock(req, res)) return;

      const { search, type, favoriteOnly } = req.query;
      const contacts = await ContactService.listContacts(req.user!.id, {
        search: search ? String(search) : undefined,
        type: type ? String(type) : undefined,
        favoriteOnly: favoriteOnly === 'true',
      });

      res.json({ success: true, data: contacts });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Create a new contact
   */
  public static async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!ContactController.requireUnlock(req, res)) return;

      const contact = await ContactService.createContact(req.user!.id, req.body, {
        ip: req.ip,
        userAgent: req.headers['user-agent'] as string,
      });

      res.status(201).json({ success: true, data: contact });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Update an existing contact
   */
  public static async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!ContactController.requireUnlock(req, res)) return;

      const id = String(req.params.id);
      const contact = await ContactService.updateContact(req.user!.id, id, req.body, {
        ip: req.ip,
        userAgent: req.headers['user-agent'] as string,
      });

      res.json({ success: true, data: contact });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Delete a contact
   */
  public static async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!ContactController.requireUnlock(req, res)) return;

      const id = String(req.params.id);
      const result = await ContactService.deleteContact(req.user!.id, id, {
        ip: req.ip,
        userAgent: req.headers['user-agent'] as string,
      });

      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Toggle favorite
   */
  public static async toggleFavorite(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!ContactController.requireUnlock(req, res)) return;

      const id = String(req.params.id);
      const contact = await ContactService.toggleFavorite(req.user!.id, id);

      res.json({ success: true, data: contact });
    } catch (err) {
      next(err);
    }
  }
}
