import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { NoteService } from '../services/note.service';

export class NoteController {
  /**
   * Unlock Hidden Notes section using user password
   */
  public static async unlockHidden(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { password } = req.body;
      if (!password) {
        return res.status(400).json({
          success: false,
          error: { message: 'Account password is required to unlock hidden notes.' },
        });
      }

      const result = await NoteService.unlockHiddenNotes(req.user!.id, password, {
        ip: req.ip,
        userAgent: req.headers['user-agent'] as string,
      });

      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * List non-hidden notes
   */
  public static async list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { search, tag, isPinned, isArchived, color } = req.query;

      const notes = await NoteService.listNotes(req.user!.id, {
        search: search ? String(search) : undefined,
        tag: tag ? String(tag) : undefined,
        isPinned: isPinned !== undefined ? isPinned === 'true' : undefined,
        isArchived: isArchived !== undefined ? isArchived === 'true' : undefined,
        color: color ? String(color) : undefined,
      });

      res.json({ success: true, data: notes });
    } catch (err) {
      next(err);
    }
  }

  /**
   * List hidden notes (requires signed token)
   */
  public static async listHidden(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const token =
        (req.headers['x-notes-hidden-token'] as string) ||
        (req.headers['X-Notes-Hidden-Token'] as string) ||
        (req.query.hiddenToken as string);

      if (!token || !NoteService.verifyHiddenNotesToken(req.user!.id, token)) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'HIDDEN_NOTES_LOCKED',
            message: 'Hidden notes vault is locked. Please unlock with your account password.',
          },
        });
      }

      const { search, tag } = req.query;
      const notes = await NoteService.listHiddenNotes(req.user!.id, {
        search: search ? String(search) : undefined,
        tag: tag ? String(tag) : undefined,
      });

      res.json({ success: true, data: notes });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get single note by ID
   */
  public static async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const token =
        (req.headers['x-notes-hidden-token'] as string) ||
        (req.headers['X-Notes-Hidden-Token'] as string);
      const isHiddenUnlocked = NoteService.verifyHiddenNotesToken(req.user!.id, token);

      const note = await NoteService.getNoteById(req.user!.id, id, isHiddenUnlocked);
      res.json({ success: true, data: note });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Create a new note
   */
  public static async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const note = await NoteService.createNote(req.user!.id, req.body, {
        ip: req.ip,
        userAgent: req.headers['user-agent'] as string,
      });
      res.status(201).json({ success: true, data: note });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Unlock an individual password-protected note
   */
  public static async unlockNote(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const { password } = req.body;

      if (!password) {
        return res.status(400).json({
          success: false,
          error: { message: 'Note password is required.' },
        });
      }

      const note = await NoteService.unlockNote(req.user!.id, id, password, {
        ip: req.ip,
        userAgent: req.headers['user-agent'] as string,
      });

      res.json({ success: true, data: note });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Update an existing note
   */
  public static async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const note = await NoteService.updateNote(req.user!.id, id, req.body, {
        ip: req.ip,
        userAgent: req.headers['user-agent'] as string,
      });
      res.json({ success: true, data: note });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Delete a note
   */
  public static async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const result = await NoteService.deleteNote(req.user!.id, id, {
        ip: req.ip,
        userAgent: req.headers['user-agent'] as string,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Toggle pin
   */
  public static async togglePin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const note = await NoteService.togglePin(req.user!.id, id);
      res.json({ success: true, data: note });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Toggle archive
   */
  public static async toggleArchive(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const note = await NoteService.toggleArchive(req.user!.id, id);
      res.json({ success: true, data: note });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Toggle hide
   */
  public static async toggleHide(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const note = await NoteService.toggleHide(req.user!.id, id);
      res.json({ success: true, data: note });
    } catch (err) {
      next(err);
    }
  }
}
