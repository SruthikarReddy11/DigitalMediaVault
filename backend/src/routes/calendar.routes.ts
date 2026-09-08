import { Router } from 'express';
import { CalendarController } from '../controllers/calendar.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

// Events CRUD & list
router.get('/events', CalendarController.getEvents);
router.post('/events', CalendarController.createEvent);
router.get('/events/:id', CalendarController.getEventById);
router.put('/events/:id', CalendarController.updateEvent);
router.delete('/events/:id', CalendarController.deleteEvent);
router.patch('/events/:id/complete', CalendarController.toggleComplete);

// Checklist items
router.post('/events/:id/checklist', CalendarController.addChecklistItem);
router.patch('/events/:id/checklist/:itemId', CalendarController.toggleChecklistItem);
router.delete('/events/:id/checklist/:itemId', CalendarController.deleteChecklistItem);

// File attachments
router.post('/events/:id/attachments', CalendarController.attachFile);
router.delete('/events/:id/attachments/:fileId', CalendarController.detachFile);

// Dashboard & Reminders
router.get('/upcoming', CalendarController.getUpcoming);
router.get('/reminders/active', CalendarController.getActiveReminders);
router.post('/reminders/:id/dismiss', CalendarController.dismissReminder);
router.post('/reminders/:id/snooze', CalendarController.snoozeReminder);

export default router;
