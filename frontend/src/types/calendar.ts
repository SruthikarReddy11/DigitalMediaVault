import { FileItem } from './index';

export type CalendarEventType =
  | 'MEETING'
  | 'REMINDER'
  | 'TASK'
  | 'PERSONAL'
  | 'IMPORTANT'
  | 'STUDY'
  | 'BIRTHDAY'
  | 'DEADLINE'
  | 'OTHER';

export type CalendarEventPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';

export type ReminderStatus = 'PENDING' | 'SENT' | 'DISMISSED' | 'COMPLETED';

export interface CalendarChecklistItem {
  id: string;
  eventId?: string;
  title: string;
  isCompleted: boolean;
  position: number;
  createdAt?: string;
}

export interface CalendarAttachment {
  id: string;
  eventId: string;
  fileId: string;
  addedAt?: string;
  file?: {
    id: string;
    originalName: string;
    fileType: string;
    mimeType: string;
    size: number;
    streamUrl: string;
    thumbnailUrl?: string;
  } | null;
}

export interface CalendarReminder {
  id: string;
  eventId: string;
  userId: string;
  timeOffsetMinutes: number;
  triggerTime: string;
  status: ReminderStatus;
  notifiedAt?: string | null;
  createdAt?: string;
  event?: {
    id: string;
    title: string;
    type: CalendarEventType;
    priority: CalendarEventPriority;
    startTime: string;
    endTime: string;
    location?: string | null;
    isImportant: boolean;
  };
}

export interface CalendarEvent {
  id: string;
  userId: string;
  title: string;
  description?: string | null;
  type: CalendarEventType;
  priority: CalendarEventPriority;
  startTime: string;
  endTime: string;
  allDay: boolean;
  timezone: string;
  location?: string | null;
  color?: string | null;
  isImportant: boolean;
  isCompleted: boolean;
  completedAt?: string | null;
  recurrenceRule?: string | null;
  recurrenceEnd?: string | null;
  recurrenceCount?: number | null;
  createdAt: string;
  updatedAt: string;
  checklist: CalendarChecklistItem[];
  attachments: CalendarAttachment[];
  reminders: CalendarReminder[];
  masterEventId?: string;
  isRecurringInstance?: boolean;
}

export interface CreateEventPayload {
  title: string;
  description?: string;
  type?: CalendarEventType;
  priority?: CalendarEventPriority;
  startTime: string;
  endTime?: string;
  allDay?: boolean;
  timezone?: string;
  location?: string;
  color?: string;
  isImportant?: boolean;
  recurrenceRule?: string;
  recurrenceEnd?: string;
  recurrenceCount?: number;
  checklist?: string[] | { title: string; isCompleted?: boolean }[];
  attachmentFileIds?: string[];
  reminderOffsets?: number[];
}

export interface UpdateEventPayload {
  title?: string;
  description?: string;
  type?: CalendarEventType;
  priority?: CalendarEventPriority;
  startTime?: string;
  endTime?: string;
  allDay?: boolean;
  timezone?: string;
  location?: string;
  color?: string;
  isImportant?: boolean;
  isCompleted?: boolean;
  recurrenceRule?: string;
  recurrenceEnd?: string;
  recurrenceCount?: number;
  checklist?: string[] | { id?: string; title: string; isCompleted?: boolean }[];
  attachmentFileIds?: string[];
  reminderOffsets?: number[];
}

export interface CalendarFilterOptions {
  startDate?: string;
  endDate?: string;
  type?: CalendarEventType;
  priority?: CalendarEventPriority;
  isCompleted?: boolean;
  search?: string;
}
