import { prisma } from '../database/prisma';
import { ReminderStatus } from '@prisma/client';
import { ActivityService } from './activity.service';

export class ReminderWorker {
  private static timer: NodeJS.Timeout | null = null;
  private static isRunning = false;

  /**
   * Starts the background interval checking for due reminders every 30 seconds
   */
  public static start(intervalMs = 30 * 1000) {
    if (this.timer) return;

    console.log('[ReminderWorker] Starting background reminder engine (interval: 30s)...');

    // Run immediately on start
    this.processDueReminders().catch((err) => {
      console.error('[ReminderWorker] Initial check error:', err);
    });

    this.timer = setInterval(() => {
      this.processDueReminders().catch((err) => {
        console.error('[ReminderWorker] Interval check error:', err);
      });
    }, intervalMs);
  }

  public static stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      console.log('[ReminderWorker] Stopped background reminder engine.');
    }
  }

  /**
   * Check for pending reminders that have reached their trigger time
   */
  public static async processDueReminders() {
    if (this.isRunning) return;
    this.isRunning = true;

    try {
      const now = new Date();

      // Find due pending reminders where event is not completed
      const dueReminders = await prisma.calendarReminder.findMany({
        where: {
          status: ReminderStatus.PENDING,
          triggerTime: { lte: now },
          event: {
            isCompleted: false,
          },
        },
        include: {
          event: {
            select: {
              id: true,
              title: true,
              type: true,
              priority: true,
              startTime: true,
            },
          },
        },
        take: 100, // Batch limit
      });

      if (dueReminders.length === 0) {
        return;
      }

      console.log(`[ReminderWorker] Processing ${dueReminders.length} due reminder(s)...`);

      for (const reminder of dueReminders) {
        try {
          await prisma.calendarReminder.update({
            where: { id: reminder.id },
            data: {
              status: ReminderStatus.SENT,
              notifiedAt: now,
            },
          });

          await ActivityService.log({
            userId: reminder.userId,
            action: 'CALENDAR_REMINDER_TRIGGERED',
            resourceType: 'CALENDAR_REMINDER',
            resourceId: reminder.id,
            metadata: {
              eventId: reminder.eventId,
              eventTitle: reminder.event.title,
              timeOffsetMinutes: reminder.timeOffsetMinutes,
              triggerTime: reminder.triggerTime,
            },
          });
        } catch (itemErr) {
          console.error(`[ReminderWorker] Failed to process reminder ${reminder.id}:`, itemErr);
        }
      }
    } catch (err) {
      console.error('[ReminderWorker] Error scanning due reminders:', err);
    } finally {
      this.isRunning = false;
    }
  }
}
