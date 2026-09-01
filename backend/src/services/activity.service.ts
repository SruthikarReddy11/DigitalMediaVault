import { prisma } from '../database/prisma';

export interface LogActivityParams {
  userId?: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
}

export class ActivityService {
  public static async log(params: LogActivityParams): Promise<void> {
    try {
      await prisma.activityLog.create({
        data: {
          userId: params.userId || null,
          action: params.action,
          resourceType: params.resourceType || null,
          resourceId: params.resourceId || null,
          metadata: params.metadata || undefined,
          ipAddress: params.ipAddress || null,
          userAgent: params.userAgent ? params.userAgent.substring(0, 500) : null,
        },
      });
    } catch (err) {
      console.error('Failed to write activity log:', err);
    }
  }
}
