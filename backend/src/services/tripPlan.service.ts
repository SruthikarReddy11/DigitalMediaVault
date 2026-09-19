import { prisma } from '../database/prisma';
import { ActivityService } from './activity.service';

export interface CreateTripPlanInput {
  name: string;
  description?: string;
  destination?: string;
  startDate?: string | Date;
  endDate?: string | Date;
  coverImage?: string;
  color?: string;
  status?: string;
  placeIds?: string[];
  noteIds?: string[];
  fileIds?: string[];
  expenseIds?: string[];
  eventIds?: string[];
}

export interface UpdateTripPlanInput {
  name?: string;
  description?: string;
  destination?: string;
  startDate?: string | Date | null;
  endDate?: string | Date | null;
  coverImage?: string | null;
  color?: string;
  status?: string;
  placeIds?: string[];
  noteIds?: string[];
  fileIds?: string[];
  expenseIds?: string[];
  eventIds?: string[];
}

export class TripPlanService {
  /**
   * Create a new trip plan (e.g. "Japan Trip")
   */
  public static async create(userId: string, input: CreateTripPlanInput, meta?: { ip?: string; userAgent?: string }) {
    if (!input.name?.trim()) {
      const err: any = new Error('Trip name is required.');
      err.statusCode = 400;
      throw err;
    }

    const trip = await prisma.tripPlan.create({
      data: {
        userId,
        name: input.name.trim(),
        description: input.description?.trim() || null,
        destination: input.destination?.trim() || null,
        startDate: input.startDate ? new Date(input.startDate) : null,
        endDate: input.endDate ? new Date(input.endDate) : null,
        coverImage: input.coverImage || null,
        color: input.color || '#ec4899',
        status: input.status || 'PLANNING',
        places: input.placeIds && input.placeIds.length > 0
          ? { create: input.placeIds.map((placeId, idx) => ({ placeId, position: idx })) }
          : undefined,
        notes: input.noteIds && input.noteIds.length > 0
          ? { create: input.noteIds.map((noteId) => ({ noteId })) }
          : undefined,
        files: input.fileIds && input.fileIds.length > 0
          ? { create: input.fileIds.map((fileId) => ({ fileId })) }
          : undefined,
        expenses: input.expenseIds && input.expenseIds.length > 0
          ? { create: input.expenseIds.map((expenseId) => ({ expenseId })) }
          : undefined,
        events: input.eventIds && input.eventIds.length > 0
          ? { create: input.eventIds.map((eventId) => ({ eventId })) }
          : undefined,
      },
      include: {
        places: { include: { place: true } },
        notes: { include: { note: { select: { id: true, title: true, color: true, isPasswordProtected: true, tags: true } } } },
        files: { include: { file: { select: { id: true, originalName: true, fileType: true, mimeType: true, size: true } } } },
        expenses: { include: { expense: true } },
        events: { include: { event: true } },
      },
    });

    await ActivityService.log({
      userId,
      action: 'TRIP_PLAN_CREATED',
      resourceType: 'TRIP_PLAN',
      resourceId: trip.id,
      metadata: { name: trip.name, destination: trip.destination },
      ipAddress: meta?.ip,
      userAgent: meta?.userAgent,
    });

    return trip;
  }

  /**
   * List trip plans for a user
   */
  public static async list(userId: string) {
    return prisma.tripPlan.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            places: true,
            notes: true,
            files: true,
            expenses: true,
            events: true,
          },
        },
      },
    });
  }

  /**
   * Get trip plan by ID with all associated places, notes, files, expenses, and events
   */
  public static async getById(userId: string, id: string) {
    const trip = await prisma.tripPlan.findFirst({
      where: { id, userId },
      include: {
        places: {
          orderBy: { position: 'asc' },
          include: {
            place: {
              include: { reminders: true },
            },
          },
        },
        notes: {
          include: {
            note: {
              select: {
                id: true,
                title: true,
                color: true,
                isPasswordProtected: true,
                isPinned: true,
                tags: true,
                updatedAt: true,
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
                extension: true,
              },
            },
          },
        },
        expenses: {
          include: {
            expense: true,
          },
        },
        events: {
          include: {
            event: true,
          },
        },
      },
    });

    if (!trip) {
      const err: any = new Error('Trip plan not found.');
      err.statusCode = 404;
      throw err;
    }

    return trip;
  }

  /**
   * Update trip plan
   */
  public static async update(userId: string, id: string, input: UpdateTripPlanInput, meta?: { ip?: string; userAgent?: string }) {
    const existing = await prisma.tripPlan.findFirst({ where: { id, userId } });
    if (!existing) {
      const err: any = new Error('Trip plan not found.');
      err.statusCode = 404;
      throw err;
    }

    const updateData: any = {};
    if (input.name !== undefined) updateData.name = input.name.trim();
    if (input.description !== undefined) updateData.description = input.description?.trim() || null;
    if (input.destination !== undefined) updateData.destination = input.destination?.trim() || null;
    if (input.startDate !== undefined) updateData.startDate = input.startDate ? new Date(input.startDate) : null;
    if (input.endDate !== undefined) updateData.endDate = input.endDate ? new Date(input.endDate) : null;
    if (input.coverImage !== undefined) updateData.coverImage = input.coverImage;
    if (input.color !== undefined) updateData.color = input.color;
    if (input.status !== undefined) updateData.status = input.status;

    // Handle associations
    if (input.placeIds !== undefined) {
      await prisma.tripPlanPlace.deleteMany({ where: { tripPlanId: id } });
      if (input.placeIds.length > 0) {
        await prisma.tripPlanPlace.createMany({
          data: input.placeIds.map((placeId, idx) => ({ tripPlanId: id, placeId, position: idx })),
        });
      }
    }

    if (input.noteIds !== undefined) {
      await prisma.tripPlanNote.deleteMany({ where: { tripPlanId: id } });
      if (input.noteIds.length > 0) {
        await prisma.tripPlanNote.createMany({
          data: input.noteIds.map((noteId) => ({ tripPlanId: id, noteId })),
        });
      }
    }

    if (input.fileIds !== undefined) {
      await prisma.tripPlanFile.deleteMany({ where: { tripPlanId: id } });
      if (input.fileIds.length > 0) {
        await prisma.tripPlanFile.createMany({
          data: input.fileIds.map((fileId) => ({ tripPlanId: id, fileId })),
        });
      }
    }

    if (input.expenseIds !== undefined) {
      await prisma.tripPlanExpense.deleteMany({ where: { tripPlanId: id } });
      if (input.expenseIds.length > 0) {
        await prisma.tripPlanExpense.createMany({
          data: input.expenseIds.map((expenseId) => ({ tripPlanId: id, expenseId })),
        });
      }
    }

    if (input.eventIds !== undefined) {
      await prisma.tripPlanEvent.deleteMany({ where: { tripPlanId: id } });
      if (input.eventIds.length > 0) {
        await prisma.tripPlanEvent.createMany({
          data: input.eventIds.map((eventId) => ({ tripPlanId: id, eventId })),
        });
      }
    }

    const updated = await prisma.tripPlan.update({
      where: { id },
      data: updateData,
      include: {
        places: { include: { place: true } },
        notes: { include: { note: true } },
        files: { include: { file: true } },
        expenses: { include: { expense: true } },
        events: { include: { event: true } },
      },
    });

    await ActivityService.log({
      userId,
      action: 'TRIP_PLAN_UPDATED',
      resourceType: 'TRIP_PLAN',
      resourceId: id,
      metadata: { name: updated.name },
      ipAddress: meta?.ip,
      userAgent: meta?.userAgent,
    });

    return updated;
  }

  /**
   * Delete trip plan
   */
  public static async delete(userId: string, id: string) {
    const existing = await prisma.tripPlan.findFirst({ where: { id, userId } });
    if (!existing) {
      const err: any = new Error('Trip plan not found.');
      err.statusCode = 404;
      throw err;
    }

    await prisma.tripPlan.delete({ where: { id } });
    return { success: true };
  }
}
