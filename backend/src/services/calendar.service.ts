import { prisma } from '../database/prisma';
import { ActivityService } from './activity.service';
import { CalendarEventType, CalendarEventPriority, ReminderStatus } from '@prisma/client';

export interface CreateEventInput {
  title: string;
  description?: string;
  type?: CalendarEventType;
  priority?: CalendarEventPriority;
  startTime: string | Date;
  endTime: string | Date;
  allDay?: boolean;
  timezone?: string;
  location?: string;
  color?: string;
  isImportant?: boolean;
  recurrenceRule?: string;
  recurrenceEnd?: string | Date;
  recurrenceCount?: number;
  checklist?: string[] | { title: string; isCompleted?: boolean }[];
  attachmentFileIds?: string[];
  reminderOffsets?: number[]; // Minutes before start, e.g. [0, 15, 60]
}

export interface UpdateEventInput {
  title?: string;
  description?: string;
  type?: CalendarEventType;
  priority?: CalendarEventPriority;
  startTime?: string | Date;
  endTime?: string | Date;
  allDay?: boolean;
  timezone?: string;
  location?: string;
  color?: string;
  isImportant?: boolean;
  isCompleted?: boolean;
  recurrenceRule?: string;
  recurrenceEnd?: string | Date;
  recurrenceCount?: number;
  checklist?: { id?: string; title: string; isCompleted?: boolean }[];
  attachmentFileIds?: string[];
  reminderOffsets?: number[];
}

export interface CalendarEventFilters {
  startDate?: string | Date;
  endDate?: string | Date;
  type?: CalendarEventType;
  priority?: CalendarEventPriority;
  isCompleted?: boolean;
  search?: string;
}

const FILE_SELECT = {
  id: true,
  originalName: true,
  fileType: true,
  mimeType: true,
  size: true,
  storageKey: true,
  extension: true,
};

export class CalendarService {
  private static serializeEvent(ev: any) {
    if (!ev) return ev;
    return {
      ...ev,
      attachments: ev.attachments
        ? ev.attachments.map((att: any) => ({
            ...att,
            file: att.file
              ? {
                  ...att.file,
                  size: Number(att.file.size),
                  streamUrl: `/api/files/${att.file.id}/stream`,
                  thumbnailUrl:
                    att.file.fileType === 'IMAGE'
                      ? `/api/files/${att.file.id}/thumbnail`
                      : undefined,
                }
              : null,
          }))
        : [],
    };
  }

  /**
   * Get events for a user with optional filtering and recurrence expansion.
   */
  public static async getEvents(userId: string, filters: CalendarEventFilters = {}) {
    const whereClause: any = { userId };

    if (filters.type) {
      whereClause.type = filters.type;
    }
    if (filters.priority) {
      whereClause.priority = filters.priority;
    }
    if (typeof filters.isCompleted === 'boolean') {
      whereClause.isCompleted = filters.isCompleted;
    }
    if (filters.search && filters.search.trim()) {
      const q = filters.search.trim();
      whereClause.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { location: { contains: q, mode: 'insensitive' } },
      ];
    }

    let rangeStart: Date | null = null;
    let rangeEnd: Date | null = null;
    if (filters.startDate) {
      rangeStart = new Date(filters.startDate);
    }
    if (filters.endDate) {
      rangeEnd = new Date(filters.endDate);
    }

    if (rangeStart && rangeEnd) {
      whereClause.OR = [
        ...(whereClause.OR || []),
        // Non-recurring events within range
        {
          recurrenceRule: null,
          startTime: { lte: rangeEnd },
          endTime: { gte: rangeStart },
        },
        // Recurring events that started before range end and not ended before range start
        {
          recurrenceRule: { not: null },
          startTime: { lte: rangeEnd },
          OR: [
            { recurrenceEnd: null },
            { recurrenceEnd: { gte: rangeStart } },
          ],
        },
      ];
    }

    const rawEvents = await prisma.calendarEvent.findMany({
      where: whereClause,
      include: {
        checklist: {
          orderBy: { position: 'asc' },
        },
        attachments: {
          include: {
            file: {
              select: FILE_SELECT,
            },
          },
        },
        reminders: {
          orderBy: { triggerTime: 'asc' },
        },
      },
      orderBy: { startTime: 'asc' },
    });

    const events = rawEvents.map(this.serializeEvent);

    if (!rangeStart || !rangeEnd) {
      return events;
    }

    // Expand recurrence for events within range
    const expandedList: any[] = [];

    for (const ev of events) {
      if (!ev.recurrenceRule || ev.recurrenceRule === 'NONE') {
        expandedList.push(ev);
        continue;
      }

      // Add the master event if its original time falls in range
      if (ev.startTime <= rangeEnd && ev.endTime >= rangeStart) {
        expandedList.push(ev);
      }

      // Expand recurrence instances
      const instances = this.generateRecurrenceInstances(ev, rangeStart, rangeEnd);
      expandedList.push(...instances);
    }

    // Sort by startTime
    return expandedList.sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
  }

  /**
   * Helper to generate recurrence instances for daily, weekly, monthly, yearly, weekdays
   */
  private static generateRecurrenceInstances(event: any, rangeStart: Date, rangeEnd: Date) {
    const instances: any[] = [];
    const rule = (event.recurrenceRule || '').toUpperCase();
    const durationMs = new Date(event.endTime).getTime() - new Date(event.startTime).getTime();
    const maxEnd = event.recurrenceEnd ? new Date(event.recurrenceEnd) : rangeEnd;
    const effectiveEnd = maxEnd < rangeEnd ? maxEnd : rangeEnd;

    let cursor = new Date(event.startTime);
    let count = 0;
    const maxIterations = 500; // safety ceiling

    const advanceCursor = (d: Date) => {
      const next = new Date(d);
      switch (rule) {
        case 'DAILY':
          next.setDate(next.getDate() + 1);
          break;
        case 'WEEKDAYS':
          do {
            next.setDate(next.getDate() + 1);
          } while (next.getDay() === 0 || next.getDay() === 6);
          break;
        case 'WEEKLY':
          next.setDate(next.getDate() + 7);
          break;
        case 'MONTHLY':
          next.setMonth(next.getMonth() + 1);
          break;
        case 'YEARLY':
          next.setFullYear(next.getFullYear() + 1);
          break;
        default:
          next.setDate(next.getDate() + 1);
          break;
      }
      return next;
    };

    while (cursor <= effectiveEnd && count < maxIterations) {
      cursor = advanceCursor(cursor);
      count++;

      if (event.recurrenceCount && count >= event.recurrenceCount) {
        break;
      }

      const instanceStart = new Date(cursor);
      const instanceEnd = new Date(instanceStart.getTime() + durationMs);

      if (
        instanceStart > new Date(event.startTime) &&
        instanceStart <= effectiveEnd &&
        instanceEnd >= rangeStart
      ) {
        instances.push({
          ...event,
          id: `${event.id}_inst_${instanceStart.toISOString().slice(0, 10)}`,
          masterEventId: event.id,
          startTime: instanceStart,
          endTime: instanceEnd,
          isRecurringInstance: true,
        });
      }
    }

    return instances;
  }

  /**
   * Get a single event by ID with all relations
   */
  public static async getEventById(userId: string, eventId: string) {
    const raw = await prisma.calendarEvent.findFirst({
      where: { id: eventId, userId },
      include: {
        checklist: {
          orderBy: { position: 'asc' },
        },
        attachments: {
          include: {
            file: {
              select: FILE_SELECT,
            },
          },
        },
        reminders: {
          orderBy: { triggerTime: 'asc' },
        },
      },
    });

    return this.serializeEvent(raw);
  }

  /**
   * Create a new event
   */
  public static async createEvent(
    userId: string,
    input: CreateEventInput,
    clientMeta?: { ipAddress?: string; userAgent?: string }
  ) {
    const startTime = new Date(input.startTime);
    const endTime = input.endTime
      ? new Date(input.endTime)
      : new Date(startTime.getTime() + 60 * 60 * 1000);

    let validFileIds: string[] = [];
    if (input.attachmentFileIds && input.attachmentFileIds.length > 0) {
      const userFiles = await prisma.file.findMany({
        where: {
          id: { in: input.attachmentFileIds },
          userId,
          deletedAt: null,
        },
        select: { id: true },
      });
      validFileIds = userFiles.map((f) => f.id);
    }

    const offsets = input.reminderOffsets !== undefined ? input.reminderOffsets : [15];

    const remindersData = offsets.map((offset) => ({
      userId,
      timeOffsetMinutes: offset,
      triggerTime: new Date(startTime.getTime() - offset * 60 * 1000),
      status: ReminderStatus.PENDING,
    }));

    let checklistData: { title: string; isCompleted: boolean; position: number }[] = [];
    if (input.checklist && input.checklist.length > 0) {
      checklistData = input.checklist
        .map((item, idx) => {
          if (typeof item === 'string') {
            return { title: item.trim(), isCompleted: false, position: idx };
          }
          return {
            title: (item.title || '').trim(),
            isCompleted: !!item.isCompleted,
            position: idx,
          };
        })
        .filter((item) => item.title.length > 0);
    }

    const event = await prisma.calendarEvent.create({
      data: {
        userId,
        title: input.title.trim(),
        description: input.description?.trim() || null,
        type: input.type || CalendarEventType.REMINDER,
        priority: input.priority || CalendarEventPriority.NORMAL,
        startTime,
        endTime,
        allDay: !!input.allDay,
        timezone: input.timezone || 'UTC',
        location: input.location?.trim() || null,
        color: input.color || null,
        isImportant: !!input.isImportant,
        recurrenceRule: input.recurrenceRule || null,
        recurrenceEnd: input.recurrenceEnd ? new Date(input.recurrenceEnd) : null,
        recurrenceCount: input.recurrenceCount || null,
        reminders: {
          create: remindersData,
        },
        checklist: {
          create: checklistData,
        },
        attachments: {
          create: validFileIds.map((fileId) => ({
            fileId,
          })),
        },
      },
      include: {
        checklist: { orderBy: { position: 'asc' } },
        attachments: {
          include: {
            file: {
              select: FILE_SELECT,
            },
          },
        },
        reminders: true,
      },
    });

    await ActivityService.log({
      userId,
      action: 'CALENDAR_EVENT_CREATED',
      resourceType: 'CALENDAR_EVENT',
      resourceId: event.id,
      metadata: {
        title: event.title,
        type: event.type,
        priority: event.priority,
        startTime: event.startTime,
      },
      ipAddress: clientMeta?.ipAddress,
      userAgent: clientMeta?.userAgent,
    });

    return this.serializeEvent(event);
  }

  /**
   * Update an existing event
   */
  public static async updateEvent(
    userId: string,
    eventId: string,
    input: UpdateEventInput,
    clientMeta?: { ipAddress?: string; userAgent?: string }
  ) {
    const existing = await prisma.calendarEvent.findFirst({
      where: { id: eventId, userId },
    });

    if (!existing) {
      throw new Error('Calendar event not found or access denied');
    }

    const startTime = input.startTime ? new Date(input.startTime) : existing.startTime;
    const endTime = input.endTime ? new Date(input.endTime) : existing.endTime;

    const updateData: any = {};
    if (input.title !== undefined) updateData.title = input.title.trim();
    if (input.description !== undefined) updateData.description = input.description?.trim() || null;
    if (input.type !== undefined) updateData.type = input.type;
    if (input.priority !== undefined) updateData.priority = input.priority;
    if (input.startTime !== undefined) updateData.startTime = startTime;
    if (input.endTime !== undefined) updateData.endTime = endTime;
    if (input.allDay !== undefined) updateData.allDay = input.allDay;
    if (input.timezone !== undefined) updateData.timezone = input.timezone;
    if (input.location !== undefined) updateData.location = input.location?.trim() || null;
    if (input.color !== undefined) updateData.color = input.color;
    if (input.isImportant !== undefined) updateData.isImportant = input.isImportant;
    if (input.isCompleted !== undefined) {
      updateData.isCompleted = input.isCompleted;
      updateData.completedAt = input.isCompleted ? new Date() : null;
    }
    if (input.recurrenceRule !== undefined) updateData.recurrenceRule = input.recurrenceRule;
    if (input.recurrenceEnd !== undefined)
      updateData.recurrenceEnd = input.recurrenceEnd ? new Date(input.recurrenceEnd) : null;
    if (input.recurrenceCount !== undefined) updateData.recurrenceCount = input.recurrenceCount;

    // Handle reminders synchronization
    if (input.reminderOffsets !== undefined) {
      await prisma.calendarReminder.deleteMany({
        where: { eventId },
      });

      const newReminders = input.reminderOffsets.map((offset) => ({
        eventId,
        userId,
        timeOffsetMinutes: offset,
        triggerTime: new Date(startTime.getTime() - offset * 60 * 1000),
        status: ReminderStatus.PENDING,
      }));

      if (newReminders.length > 0) {
        await prisma.calendarReminder.createMany({
          data: newReminders,
        });
      }
    } else if (input.startTime !== undefined) {
      const reminders = await prisma.calendarReminder.findMany({
        where: { eventId, status: ReminderStatus.PENDING },
      });
      for (const r of reminders) {
        await prisma.calendarReminder.update({
          where: { id: r.id },
          data: {
            triggerTime: new Date(startTime.getTime() - r.timeOffsetMinutes * 60 * 1000),
          },
        });
      }
    }

    // Handle attachments synchronization
    if (input.attachmentFileIds !== undefined) {
      const userFiles = await prisma.file.findMany({
        where: {
          id: { in: input.attachmentFileIds },
          userId,
          deletedAt: null,
        },
        select: { id: true },
      });
      const validFileIds = userFiles.map((f) => f.id);

      await prisma.calendarAttachment.deleteMany({
        where: { eventId },
      });

      if (validFileIds.length > 0) {
        await prisma.calendarAttachment.createMany({
          data: validFileIds.map((fId) => ({
            eventId,
            fileId: fId,
          })),
        });
      }
    }

    const updated = await prisma.calendarEvent.update({
      where: { id: eventId },
      data: updateData,
      include: {
        checklist: { orderBy: { position: 'asc' } },
        attachments: {
          include: {
            file: {
              select: FILE_SELECT,
            },
          },
        },
        reminders: { orderBy: { triggerTime: 'asc' } },
      },
    });

    await ActivityService.log({
      userId,
      action: 'CALENDAR_EVENT_UPDATED',
      resourceType: 'CALENDAR_EVENT',
      resourceId: updated.id,
      metadata: {
        title: updated.title,
        type: updated.type,
      },
      ipAddress: clientMeta?.ipAddress,
      userAgent: clientMeta?.userAgent,
    });

    return this.serializeEvent(updated);
  }

  /**
   * Delete an event
   */
  public static async deleteEvent(
    userId: string,
    eventId: string,
    clientMeta?: { ipAddress?: string; userAgent?: string }
  ) {
    const existing = await prisma.calendarEvent.findFirst({
      where: { id: eventId, userId },
      select: { id: true, title: true },
    });

    if (!existing) {
      throw new Error('Calendar event not found or access denied');
    }

    await prisma.calendarEvent.delete({
      where: { id: eventId },
    });

    await ActivityService.log({
      userId,
      action: 'CALENDAR_EVENT_DELETED',
      resourceType: 'CALENDAR_EVENT',
      resourceId: eventId,
      metadata: { title: existing.title },
      ipAddress: clientMeta?.ipAddress,
      userAgent: clientMeta?.userAgent,
    });

    return { success: true };
  }

  /**
   * Toggle event completion status
   */
  public static async toggleEventCompletion(userId: string, eventId: string, isCompleted: boolean) {
    const existing = await prisma.calendarEvent.findFirst({
      where: { id: eventId, userId },
    });

    if (!existing) {
      throw new Error('Calendar event not found or access denied');
    }

    const updated = await prisma.calendarEvent.update({
      where: { id: eventId },
      data: {
        isCompleted,
        completedAt: isCompleted ? new Date() : null,
      },
    });

    // If completed, update pending reminders to COMPLETED
    if (isCompleted) {
      await prisma.calendarReminder.updateMany({
        where: { eventId, status: ReminderStatus.PENDING },
        data: { status: ReminderStatus.COMPLETED },
      });
    }

    await ActivityService.log({
      userId,
      action: isCompleted ? 'CALENDAR_EVENT_COMPLETED' : 'CALENDAR_EVENT_REOPENED',
      resourceType: 'CALENDAR_EVENT',
      resourceId: eventId,
      metadata: { title: existing.title, isCompleted },
    });

    return updated;
  }

  /**
   * Checklist operations
   */
  public static async addChecklistItem(userId: string, eventId: string, title: string) {
    const event = await prisma.calendarEvent.findFirst({
      where: { id: eventId, userId },
    });
    if (!event) throw new Error('Event not found');

    const count = await prisma.calendarChecklistItem.count({ where: { eventId } });
    return prisma.calendarChecklistItem.create({
      data: {
        eventId,
        title: title.trim(),
        position: count,
      },
    });
  }

  public static async toggleChecklistItem(
    userId: string,
    eventId: string,
    itemId: string,
    isCompleted: boolean
  ) {
    const event = await prisma.calendarEvent.findFirst({
      where: { id: eventId, userId },
    });
    if (!event) throw new Error('Event not found');

    return prisma.calendarChecklistItem.update({
      where: { id: itemId },
      data: { isCompleted },
    });
  }

  public static async deleteChecklistItem(userId: string, eventId: string, itemId: string) {
    const event = await prisma.calendarEvent.findFirst({
      where: { id: eventId, userId },
    });
    if (!event) throw new Error('Event not found');

    await prisma.calendarChecklistItem.delete({
      where: { id: itemId },
    });
    return { success: true };
  }

  /**
   * Attachment operations
   */
  public static async attachFile(userId: string, eventId: string, fileId: string) {
    const event = await prisma.calendarEvent.findFirst({
      where: { id: eventId, userId },
    });
    if (!event) throw new Error('Event not found');

    const file = await prisma.file.findFirst({
      where: { id: fileId, userId, deletedAt: null },
    });
    if (!file) throw new Error('File not found or access denied');

    const att = await prisma.calendarAttachment.upsert({
      where: { eventId_fileId: { eventId, fileId } },
      create: { eventId, fileId },
      update: {},
      include: {
        file: {
          select: FILE_SELECT,
        },
      },
    });

    return {
      ...att,
      file: att.file
        ? {
            ...att.file,
            size: Number(att.file.size),
            streamUrl: `/api/files/${att.file.id}/stream`,
            thumbnailUrl:
              att.file.fileType === 'IMAGE'
                ? `/api/files/${att.file.id}/thumbnail`
                : undefined,
          }
        : null,
    };
  }

  public static async detachFile(userId: string, eventId: string, fileId: string) {
    const event = await prisma.calendarEvent.findFirst({
      where: { id: eventId, userId },
    });
    if (!event) throw new Error('Event not found');

    await prisma.calendarAttachment.deleteMany({
      where: { eventId, fileId },
    });
    return { success: true };
  }

  /**
   * Get upcoming events (Dashboard & quick agenda)
   */
  public static async getUpcomingEvents(userId: string, limit = 5) {
    const now = new Date();
    const endOfWeek = new Date();
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    const events = await this.getEvents(userId, {
      startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
      endDate: endOfWeek,
      isCompleted: false,
    });

    return events.slice(0, limit);
  }

  /**
   * Get active and due reminders for global header bell
   */
  public static async getActiveReminders(userId: string) {
    const now = new Date();
    const future24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const reminders = await prisma.calendarReminder.findMany({
      where: {
        userId,
        event: {
          isCompleted: false,
        },
        OR: [
          { status: ReminderStatus.SENT },
          {
            status: ReminderStatus.PENDING,
            triggerTime: { lte: future24h },
          },
        ],
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            type: true,
            priority: true,
            startTime: true,
            endTime: true,
            location: true,
            isImportant: true,
          },
        },
      },
      orderBy: { triggerTime: 'asc' },
    });

    return reminders;
  }

  /**
   * Dismiss a reminder
   */
  public static async dismissReminder(userId: string, reminderId: string) {
    const reminder = await prisma.calendarReminder.findFirst({
      where: { id: reminderId, userId },
    });

    if (!reminder) throw new Error('Reminder not found');

    return prisma.calendarReminder.update({
      where: { id: reminderId },
      data: { status: ReminderStatus.DISMISSED },
    });
  }

  /**
   * Snooze a reminder by X minutes
   */
  public static async snoozeReminder(userId: string, reminderId: string, minutes = 15) {
    const reminder = await prisma.calendarReminder.findFirst({
      where: { id: reminderId, userId },
    });

    if (!reminder) throw new Error('Reminder not found');

    const newTriggerTime = new Date(Date.now() + minutes * 60 * 1000);

    return prisma.calendarReminder.update({
      where: { id: reminderId },
      data: {
        status: ReminderStatus.PENDING,
        triggerTime: newTriggerTime,
      },
    });
  }
}
