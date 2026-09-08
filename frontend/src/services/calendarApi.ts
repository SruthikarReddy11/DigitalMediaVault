import { api } from './api';
import {
  CalendarEvent,
  CalendarReminder,
  CalendarChecklistItem,
  CalendarAttachment,
  CreateEventPayload,
  UpdateEventPayload,
  CalendarFilterOptions,
} from '../types';

export const calendarApi = {
  /**
   * Fetch events with optional filters (date bounds, type, priority, search)
   */
  getEvents: async (filters: CalendarFilterOptions = {}): Promise<CalendarEvent[]> => {
    const res = await api.get('/calendar/events', { params: filters });
    return res.data.events;
  },

  /**
   * Fetch single event by ID
   */
  getEventById: async (id: string): Promise<CalendarEvent> => {
    const res = await api.get(`/calendar/events/${id}`);
    return res.data.event;
  },

  /**
   * Create a new event
   */
  createEvent: async (data: CreateEventPayload): Promise<CalendarEvent> => {
    const res = await api.post('/calendar/events', data);
    return res.data.event;
  },

  /**
   * Update existing event
   */
  updateEvent: async (id: string, data: UpdateEventPayload): Promise<CalendarEvent> => {
    const res = await api.put(`/calendar/events/${id}`, data);
    return res.data.event;
  },

  /**
   * Delete an event
   */
  deleteEvent: async (id: string): Promise<{ success: boolean }> => {
    const res = await api.delete(`/calendar/events/${id}`);
    return res.data;
  },

  /**
   * Toggle event completion status
   */
  toggleComplete: async (id: string, isCompleted: boolean): Promise<CalendarEvent> => {
    const res = await api.patch(`/calendar/events/${id}/complete`, { isCompleted });
    return res.data.event;
  },

  /**
   * Checklist operations
   */
  addChecklistItem: async (eventId: string, title: string): Promise<CalendarChecklistItem> => {
    const res = await api.post(`/calendar/events/${eventId}/checklist`, { title });
    return res.data.item;
  },

  toggleChecklistItem: async (
    eventId: string,
    itemId: string,
    isCompleted: boolean
  ): Promise<CalendarChecklistItem> => {
    const res = await api.patch(`/calendar/events/${eventId}/checklist/${itemId}`, { isCompleted });
    return res.data.item;
  },

  deleteChecklistItem: async (eventId: string, itemId: string): Promise<{ success: boolean }> => {
    const res = await api.delete(`/calendar/events/${eventId}/checklist/${itemId}`);
    return res.data;
  },

  /**
   * Attachment operations
   */
  attachFile: async (eventId: string, fileId: string): Promise<CalendarAttachment> => {
    const res = await api.post(`/calendar/events/${eventId}/attachments`, { fileId });
    return res.data.attachment;
  },

  detachFile: async (eventId: string, fileId: string): Promise<{ success: boolean }> => {
    const res = await api.delete(`/calendar/events/${eventId}/attachments/${fileId}`);
    return res.data;
  },

  /**
   * Dashboard upcoming events
   */
  getUpcomingEvents: async (limit = 5): Promise<CalendarEvent[]> => {
    const res = await api.get('/calendar/upcoming', { params: { limit } });
    return res.data.events;
  },

  /**
   * Active and due reminders for notification bell
   */
  getActiveReminders: async (): Promise<CalendarReminder[]> => {
    const res = await api.get('/calendar/reminders/active');
    return res.data.reminders;
  },

  /**
   * Dismiss a reminder
   */
  dismissReminder: async (id: string): Promise<{ reminder: CalendarReminder }> => {
    const res = await api.post(`/calendar/reminders/${id}/dismiss`);
    return res.data;
  },

  /**
   * Snooze a reminder by minutes
   */
  snoozeReminder: async (id: string, minutes = 15): Promise<{ reminder: CalendarReminder }> => {
    const res = await api.post(`/calendar/reminders/${id}/snooze`, { minutes });
    return res.data;
  },
};
