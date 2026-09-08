import { Request, Response } from 'express';
import { CalendarService } from '../services/calendar.service';

export class CalendarController {
  private static getUserAgent(req: Request): string | undefined {
    const ua = req.headers['user-agent'];
    return Array.isArray(ua) ? ua[0] : ua;
  }

  public static async getEvents(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { startDate, endDate, type, priority, isCompleted, search } = req.query;

      const filters: any = {};
      if (startDate) filters.startDate = String(startDate);
      if (endDate) filters.endDate = String(endDate);
      if (type) filters.type = String(type);
      if (priority) filters.priority = String(priority);
      if (isCompleted !== undefined) filters.isCompleted = isCompleted === 'true';
      if (search) filters.search = String(search);

      const events = await CalendarService.getEvents(userId, filters);
      res.json({ events });
    } catch (err: any) {
      console.error('getEvents error:', err);
      res.status(500).json({ error: err.message || 'Failed to fetch calendar events' });
    }
  }

  public static async getEventById(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const eventId = String(req.params.id);
      const event = await CalendarService.getEventById(userId, eventId);

      if (!event) {
        res.status(404).json({ error: 'Event not found' });
        return;
      }

      res.json({ event });
    } catch (err: any) {
      console.error('getEventById error:', err);
      res.status(500).json({ error: err.message || 'Failed to fetch event' });
    }
  }

  public static async createEvent(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const {
        title,
        description,
        type,
        priority,
        startTime,
        endTime,
        allDay,
        timezone,
        location,
        color,
        isImportant,
        recurrenceRule,
        recurrenceEnd,
        recurrenceCount,
        checklist,
        attachmentFileIds,
        reminderOffsets,
      } = req.body;

      if (!title || !title.trim()) {
        res.status(400).json({ error: 'Title is required' });
        return;
      }
      if (!startTime) {
        res.status(400).json({ error: 'Start time is required' });
        return;
      }

      const clientMeta = {
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: CalendarController.getUserAgent(req),
      };

      const event = await CalendarService.createEvent(
        userId,
        {
          title,
          description,
          type,
          priority,
          startTime,
          endTime,
          allDay,
          timezone,
          location,
          color,
          isImportant,
          recurrenceRule,
          recurrenceEnd,
          recurrenceCount,
          checklist,
          attachmentFileIds,
          reminderOffsets,
        },
        clientMeta
      );

      res.status(201).json({ event });
    } catch (err: any) {
      console.error('createEvent error:', err);
      res.status(500).json({ error: err.message || 'Failed to create event' });
    }
  }

  public static async updateEvent(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const eventId = String(req.params.id);
      const clientMeta = {
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: CalendarController.getUserAgent(req),
      };

      const updated = await CalendarService.updateEvent(
        userId,
        eventId,
        req.body,
        clientMeta
      );

      res.json({ event: updated });
    } catch (err: any) {
      console.error('updateEvent error:', err);
      res.status(err.message?.includes('not found') ? 404 : 500).json({
        error: err.message || 'Failed to update event',
      });
    }
  }

  public static async deleteEvent(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const eventId = String(req.params.id);
      const clientMeta = {
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: CalendarController.getUserAgent(req),
      };

      await CalendarService.deleteEvent(userId, eventId, clientMeta);
      res.json({ success: true });
    } catch (err: any) {
      console.error('deleteEvent error:', err);
      res.status(err.message?.includes('not found') ? 404 : 500).json({
        error: err.message || 'Failed to delete event',
      });
    }
  }

  public static async toggleComplete(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const eventId = String(req.params.id);
      const { isCompleted } = req.body;

      const updated = await CalendarService.toggleEventCompletion(
        userId,
        eventId,
        !!isCompleted
      );

      res.json({ event: updated });
    } catch (err: any) {
      console.error('toggleComplete error:', err);
      res.status(500).json({ error: err.message || 'Failed to toggle event completion' });
    }
  }

  public static async addChecklistItem(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const eventId = String(req.params.id);
      const { title } = req.body;
      if (!title || !title.trim()) {
        res.status(400).json({ error: 'Checklist item title is required' });
        return;
      }

      const item = await CalendarService.addChecklistItem(userId, eventId, title);
      res.status(201).json({ item });
    } catch (err: any) {
      console.error('addChecklistItem error:', err);
      res.status(500).json({ error: err.message || 'Failed to add checklist item' });
    }
  }

  public static async toggleChecklistItem(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const eventId = String(req.params.id);
      const itemId = String(req.params.itemId);
      const { isCompleted } = req.body;

      const item = await CalendarService.toggleChecklistItem(
        userId,
        eventId,
        itemId,
        !!isCompleted
      );

      res.json({ item });
    } catch (err: any) {
      console.error('toggleChecklistItem error:', err);
      res.status(500).json({ error: err.message || 'Failed to update checklist item' });
    }
  }

  public static async deleteChecklistItem(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const eventId = String(req.params.id);
      const itemId = String(req.params.itemId);
      await CalendarService.deleteChecklistItem(userId, eventId, itemId);
      res.json({ success: true });
    } catch (err: any) {
      console.error('deleteChecklistItem error:', err);
      res.status(500).json({ error: err.message || 'Failed to delete checklist item' });
    }
  }

  public static async attachFile(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const eventId = String(req.params.id);
      const { fileId } = req.body;
      if (!fileId) {
        res.status(400).json({ error: 'File ID is required' });
        return;
      }

      const attachment = await CalendarService.attachFile(userId, eventId, String(fileId));
      res.status(201).json({ attachment });
    } catch (err: any) {
      console.error('attachFile error:', err);
      res.status(500).json({ error: err.message || 'Failed to attach file' });
    }
  }

  public static async detachFile(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const eventId = String(req.params.id);
      const fileId = String(req.params.fileId);
      await CalendarService.detachFile(userId, eventId, fileId);
      res.json({ success: true });
    } catch (err: any) {
      console.error('detachFile error:', err);
      res.status(500).json({ error: err.message || 'Failed to detach file' });
    }
  }

  public static async getUpcoming(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 5;
      const events = await CalendarService.getUpcomingEvents(userId, limit);
      res.json({ events });
    } catch (err: any) {
      console.error('getUpcoming error:', err);
      res.status(500).json({ error: err.message || 'Failed to fetch upcoming events' });
    }
  }

  public static async getActiveReminders(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const reminders = await CalendarService.getActiveReminders(userId);
      res.json({ reminders });
    } catch (err: any) {
      console.error('getActiveReminders error:', err);
      res.status(500).json({ error: err.message || 'Failed to fetch active reminders' });
    }
  }

  public static async dismissReminder(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const reminderId = String(req.params.id);
      const reminder = await CalendarService.dismissReminder(userId, reminderId);
      res.json({ reminder });
    } catch (err: any) {
      console.error('dismissReminder error:', err);
      res.status(500).json({ error: err.message || 'Failed to dismiss reminder' });
    }
  }

  public static async snoozeReminder(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const reminderId = String(req.params.id);
      const minutes = req.body.minutes ? parseInt(String(req.body.minutes), 10) : 15;
      const reminder = await CalendarService.snoozeReminder(userId, reminderId, minutes);
      res.json({ reminder });
    } catch (err: any) {
      console.error('snoozeReminder error:', err);
      res.status(500).json({ error: err.message || 'Failed to snooze reminder' });
    }
  }
}
