import { prisma } from '../database/prisma';
import { PlaceStatus, ReminderStatus, CalendarEventType, CalendarEventPriority } from '@prisma/client';
import { GooglePlacesService, ResolvedPlaceData } from './googlePlaces.service';
import { ActivityService } from './activity.service';

export interface CreatePlaceInput {
  googleMapsUrl: string;
  name?: string;
  placeId?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  category?: string;
  rating?: number;
  userRatingsTotal?: number;
  phoneNumber?: string;
  website?: string;
  openingHours?: any;
  imageUrl?: string;
  photoReference?: string;
  photoAttributions?: string[];
  notes?: string;
  tags?: string[];
  status?: PlaceStatus;
  reminderDate?: string | Date;
  reminderTime?: string;
  reminderOption?: string; // EXACT, ONE_DAY_BEFORE, ONE_WEEK_BEFORE, ONE_MONTH_BEFORE, CUSTOM
  tripPlanId?: string;
  syncCalendar?: boolean;
}

export interface UpdatePlaceInput {
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  category?: string;
  notes?: string;
  tags?: string[];
  status?: PlaceStatus;
  reminderDate?: string | Date | null;
  reminderTime?: string | null;
  reminderOption?: string | null;
  tripPlanId?: string | null;
  visitedAt?: string | Date | null;
}

export interface PlaceFilters {
  status?: PlaceStatus | 'ALL';
  search?: string;
  category?: string;
  city?: string;
  country?: string;
  tag?: string;
  sort?: 'recently_added' | 'upcoming_reminder' | 'alphabetical' | 'recently_visited';
}

export class PlaceService {
  /**
   * Resolve place details using Google Places API
   */
  public static async resolveUrl(rawUrl: string): Promise<ResolvedPlaceData> {
    return GooglePlacesService.resolvePlace(rawUrl);
  }

  /**
   * Helper to calculate trigger time based on reminder date, optional time, and offset option
   */
  private static calculateTriggerTime(
    reminderDateStr?: string | Date | null,
    reminderTimeStr?: string | null,
    option = 'EXACT'
  ): Date | null {
    if (!reminderDateStr) return null;

    const baseDate = new Date(reminderDateStr);
    if (isNaN(baseDate.getTime())) return null;

    // Apply time if provided (e.g. "14:30")
    if (reminderTimeStr && /^\d{1,2}:\d{2}$/.test(reminderTimeStr)) {
      const [h, m] = reminderTimeStr.split(':').map(Number);
      baseDate.setHours(h, m, 0, 0);
    } else if (
      (reminderDateStr instanceof Date && (reminderDateStr.getHours() !== 0 || reminderDateStr.getMinutes() !== 0)) ||
      (typeof reminderDateStr === 'string' && (reminderDateStr.includes('T') || reminderDateStr.includes(':')))
    ) {
      // Keep existing hours/minutes from datetime string
    } else {
      // Default to 9:00 AM on the reminder day
      baseDate.setHours(9, 0, 0, 0);
    }

    const trigger = new Date(baseDate.getTime());
    switch (option) {
      case 'ONE_DAY_BEFORE':
        trigger.setDate(trigger.getDate() - 1);
        break;
      case 'ONE_WEEK_BEFORE':
        trigger.setDate(trigger.getDate() - 7);
        break;
      case 'ONE_MONTH_BEFORE':
        trigger.setMonth(trigger.getMonth() - 1);
        break;
      default:
        break;
    }

    return trigger;
  }

  /**
   * Save a new place to VaultXMedia
   */
  public static async createPlace(
    userId: string,
    input: CreatePlaceInput,
    meta?: { ip?: string; userAgent?: string }
  ) {
    if (!input.googleMapsUrl?.trim()) {
      const err: any = new Error('Google Maps URL is required.');
      err.statusCode = 400;
      throw err;
    }

    let placeData: ResolvedPlaceData | null = null;
    if (!input.name || !input.name.trim()) {
      // Automatically resolve if not already provided
      placeData = await GooglePlacesService.resolvePlace(input.googleMapsUrl);
    }

    const name = input.name?.trim() || placeData?.name || 'Saved Place';
    const address = input.address || placeData?.address || null;
    const city = input.city || placeData?.city || null;
    const state = input.state || placeData?.state || null;
    const country = input.country || placeData?.country || null;
    const latitude = input.latitude !== undefined ? input.latitude : placeData?.latitude || null;
    const longitude = input.longitude !== undefined ? input.longitude : placeData?.longitude || null;
    const category = input.category || placeData?.category || 'Point of Interest';
    const rating = input.rating !== undefined ? input.rating : placeData?.rating || null;
    const userRatingsTotal = input.userRatingsTotal !== undefined ? input.userRatingsTotal : placeData?.userRatingsTotal || null;
    const phoneNumber = input.phoneNumber || placeData?.phoneNumber || null;
    const website = input.website || placeData?.website || null;
    const openingHours = input.openingHours || placeData?.openingHours || null;
    const imageUrl = input.imageUrl || (input as any).photoUrl || placeData?.imageUrl || null;
    const photoReference = input.photoReference || placeData?.photoReference || null;
    const photoAttributions = input.photoAttributions || placeData?.photoAttributions || [];

    // Safely sanitize status to prevent Prisma enum runtime crashes
    let status: PlaceStatus = PlaceStatus.WANT_TO_VISIT;
    const tags = Array.isArray(input.tags) ? [...input.tags] : [];

    if (input.status) {
      const upper = String(input.status).toUpperCase();
      if (Object.values(PlaceStatus).includes(upper as any)) {
        status = upper as PlaceStatus;
      } else if (upper === 'FAVORITE') {
        status = PlaceStatus.WANT_TO_VISIT;
        if (!tags.includes('Favorite')) tags.push('Favorite');
      }
    }

    let reminderDate: Date | null = null;
    let triggerTime: Date | null = null;
    const reminderOption = input.reminderOption || 'EXACT';

    if (input.reminderDate) {
      try {
        const d = new Date(input.reminderDate);
        if (!isNaN(d.getTime())) {
          reminderDate = d;
          triggerTime = this.calculateTriggerTime(reminderDate, input.reminderTime, reminderOption);
        }
      } catch {}
    }

    // Optional Calendar Event Sync
    let calendarEventId: string | null = null;
    if (input.syncCalendar && triggerTime) {
      const calEvent = await prisma.calendarEvent.create({
        data: {
          userId,
          title: `Visit ${name}`,
          description: `Reminder to visit ${name}.\nAddress: ${address || 'N/A'}\nGoogle Maps: ${input.googleMapsUrl}`,
          location: address || name,
          startTime: triggerTime,
          endTime: new Date(triggerTime.getTime() + 60 * 60 * 1000),
          type: CalendarEventType.REMINDER,
          priority: CalendarEventPriority.NORMAL,
          reminders: {
            create: [
              {
                userId,
                timeOffsetMinutes: 0,
                triggerTime,
                status: ReminderStatus.PENDING,
              },
            ],
          },
        },
      });
      calendarEventId = calEvent.id;
    }

    const place = await prisma.place.create({
      data: {
        userId,
        placeId: input.placeId || placeData?.placeId || null,
        name,
        address,
        city,
        state,
        country,
        latitude,
        longitude,
        googleMapsUrl: input.googleMapsUrl.trim(),
        category,
        rating,
        userRatingsTotal,
        phoneNumber,
        website,
        openingHours: openingHours ? openingHours : undefined,
        imageUrl,
        photoReference,
        photoAttributions,
        notes: input.notes?.trim() || null,
        tags: tags || [],
        status,
        reminderDate,
        reminderTime: input.reminderTime || null,
        reminderOption,
        calendarEventId,
        visitedAt: status === PlaceStatus.VISITED ? new Date() : null,
        reminders: triggerTime
          ? {
              create: [
                {
                  userId,
                  triggerTime,
                  reminderOption,
                  status: ReminderStatus.PENDING,
                },
              ],
            }
          : undefined,
        tripPlans: input.tripPlanId
          ? {
              create: [{ tripPlanId: input.tripPlanId }],
            }
          : undefined,
      },
      include: {
        reminders: true,
        tripPlans: {
          include: {
            tripPlan: { select: { id: true, name: true, color: true } },
          },
        },
      },
    });

    await ActivityService.log({
      userId,
      action: 'PLACE_SAVED',
      resourceType: 'PLACE',
      resourceId: place.id,
      metadata: {
        name: place.name,
        category: place.category,
        status: place.status,
      },
      ipAddress: meta?.ip,
      userAgent: meta?.userAgent,
    });

    return place;
  }

  /**
   * List saved places with rich filtering, search, and sorting
   */
  public static async listPlaces(userId: string, filters: PlaceFilters = {}) {
    const where: any = { userId };

    if (filters.status && filters.status !== 'ALL') {
      where.status = filters.status;
    }
    if (filters.category) {
      where.category = { contains: filters.category, mode: 'insensitive' };
    }
    if (filters.city) {
      where.city = { contains: filters.city, mode: 'insensitive' };
    }
    if (filters.country) {
      where.country = { contains: filters.country, mode: 'insensitive' };
    }
    if (filters.tag) {
      where.tags = { has: filters.tag };
    }
    if (filters.search?.trim()) {
      const q = filters.search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { address: { contains: q, mode: 'insensitive' } },
        { city: { contains: q, mode: 'insensitive' } },
        { country: { contains: q, mode: 'insensitive' } },
        { category: { contains: q, mode: 'insensitive' } },
        { tags: { has: q } },
      ];
    }

    let orderBy: any = { createdAt: 'desc' };
    if (filters.sort === 'alphabetical') {
      orderBy = { name: 'asc' };
    } else if (filters.sort === 'upcoming_reminder') {
      orderBy = { reminderDate: 'asc' };
    } else if (filters.sort === 'recently_visited') {
      orderBy = { visitedAt: 'desc' };
    }

    const places = await prisma.place.findMany({
      where,
      orderBy,
      include: {
        reminders: {
          orderBy: { triggerTime: 'asc' },
        },
        tripPlans: {
          include: {
            tripPlan: { select: { id: true, name: true, color: true } },
          },
        },
      },
    });

    return places;
  }

  /**
   * Get place by ID
   */
  public static async getPlaceById(userId: string, placeId: string) {
    const place = await prisma.place.findFirst({
      where: { id: placeId, userId },
      include: {
        reminders: true,
        notesLinks: {
          include: {
            note: {
              select: {
                id: true,
                title: true,
                color: true,
                isPasswordProtected: true,
                tags: true,
              },
            },
          },
        },
        files: {
          include: {
            file: {
              select: {
                id: true,
                originalName: true,
                fileType: true,
                mimeType: true,
                size: true,
              },
            },
          },
        },
        expenses: {
          include: {
            expense: {
              select: {
                id: true,
                amount: true,
                currency: true,
                date: true,
                category: true,
                description: true,
              },
            },
          },
        },
        tripPlans: {
          include: {
            tripPlan: {
              select: { id: true, name: true, color: true, destination: true },
            },
          },
        },
        calendarEvent: true,
      },
    });

    if (!place) {
      const err: any = new Error('Saved place not found.');
      err.statusCode = 404;
      throw err;
    }

    return place;
  }

  /**
   * Update a place (notes, tags, reminder, status, etc.)
   */
  public static async updatePlace(
    userId: string,
    placeId: string,
    input: UpdatePlaceInput,
    meta?: { ip?: string; userAgent?: string }
  ) {
    const existing = await prisma.place.findFirst({
      where: { id: placeId, userId },
      include: { reminders: true },
    });

    if (!existing) {
      const err: any = new Error('Saved place not found.');
      err.statusCode = 404;
      throw err;
    }

    const updateData: any = {};
    if (input.name !== undefined) updateData.name = input.name.trim();
    if (input.address !== undefined) updateData.address = input.address?.trim() || null;
    if (input.city !== undefined) updateData.city = input.city?.trim() || null;
    if (input.state !== undefined) updateData.state = input.state?.trim() || null;
    if (input.country !== undefined) updateData.country = input.country?.trim() || null;
    if (input.category !== undefined) updateData.category = input.category?.trim() || null;
    if (input.notes !== undefined) updateData.notes = input.notes?.trim() || null;
    if (input.tags !== undefined) updateData.tags = input.tags;

    if (input.status !== undefined) {
      const upper = String(input.status).toUpperCase();
      if (Object.values(PlaceStatus).includes(upper as any)) {
        updateData.status = upper as PlaceStatus;
        if (upper === PlaceStatus.VISITED && !existing.visitedAt) {
          updateData.visitedAt = new Date();
        } else if (upper !== PlaceStatus.VISITED) {
          updateData.visitedAt = null;
        }
      } else if (upper === 'FAVORITE') {
        const currentTags = existing.tags || [];
        if (!currentTags.includes('Favorite')) {
          updateData.tags = [...currentTags, 'Favorite'];
        }
      }
    }

    // Reminder updates
    if (input.reminderDate !== undefined) {
      if (input.reminderDate === null) {
        updateData.reminderDate = null;
        updateData.reminderTime = null;
        updateData.reminderOption = null;
        await prisma.placeReminder.deleteMany({ where: { placeId } });
      } else {
        const reminderDate = new Date(input.reminderDate);
        const reminderTime = input.reminderTime !== undefined ? input.reminderTime : existing.reminderTime;
        const reminderOption = input.reminderOption !== undefined ? input.reminderOption : existing.reminderOption || 'EXACT';

        updateData.reminderDate = reminderDate;
        updateData.reminderTime = reminderTime;
        updateData.reminderOption = reminderOption;

        const triggerTime = this.calculateTriggerTime(reminderDate, reminderTime, reminderOption || 'EXACT');
        if (triggerTime) {
          await prisma.placeReminder.deleteMany({ where: { placeId } });
          await prisma.placeReminder.create({
            data: {
              userId,
              placeId,
              triggerTime,
              reminderOption: reminderOption || 'EXACT',
              status: ReminderStatus.PENDING,
            },
          });
        }
      }
    }

    const updated = await prisma.place.update({
      where: { id: placeId },
      data: updateData,
      include: {
        reminders: true,
        tripPlans: {
          include: {
            tripPlan: { select: { id: true, name: true, color: true } },
          },
        },
      },
    });

    await ActivityService.log({
      userId,
      action: 'PLACE_UPDATED',
      resourceType: 'PLACE',
      resourceId: placeId,
      metadata: { name: updated.name, status: updated.status },
      ipAddress: meta?.ip,
      userAgent: meta?.userAgent,
    });

    return updated;
  }

  /**
   * Quick status change (e.g. Mark as Visited)
   */
  public static async updateStatus(userId: string, placeId: string, status: PlaceStatus) {
    return this.updatePlace(userId, placeId, { status });
  }

  /**
   * Postpone a place reminder
   */
  public static async postponeReminder(userId: string, reminderId: string, minutes = 60) {
    const reminder = await prisma.placeReminder.findFirst({
      where: { id: reminderId, userId },
      include: { place: true },
    });

    if (!reminder) {
      const err: any = new Error('Reminder not found.');
      err.statusCode = 404;
      throw err;
    }

    const newTriggerTime = new Date(Date.now() + minutes * 60 * 1000);

    const updated = await prisma.placeReminder.update({
      where: { id: reminderId },
      data: {
        triggerTime: newTriggerTime,
        status: ReminderStatus.PENDING,
      },
    });

    await prisma.place.update({
      where: { id: reminder.placeId },
      data: {
        reminderDate: newTriggerTime,
      },
    });

    return updated;
  }

  /**
   * Delete a saved place
   */
  public static async deletePlace(userId: string, placeId: string, meta?: { ip?: string; userAgent?: string }) {
    const existing = await prisma.place.findFirst({
      where: { id: placeId, userId },
    });

    if (!existing) {
      const err: any = new Error('Place not found.');
      err.statusCode = 404;
      throw err;
    }

    await prisma.place.delete({
      where: { id: placeId },
    });

    await ActivityService.log({
      userId,
      action: 'PLACE_DELETED',
      resourceType: 'PLACE',
      resourceId: placeId,
      metadata: { name: existing.name },
      ipAddress: meta?.ip,
      userAgent: meta?.userAgent,
    });

    return { success: true };
  }
}
