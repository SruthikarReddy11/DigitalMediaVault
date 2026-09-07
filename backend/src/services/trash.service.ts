import { prisma } from '../database/prisma';
import { AuthUser } from '../types';
import { FileService } from './file.service';
import { StorageFactory } from '../storage/StorageFactory';
import { ActivityService } from './activity.service';

export class TrashService {
  /**
   * Purge all items that have been in trash for more than 30 days.
   * Can be run for a specific user or globally across all users.
   */
  public static async purgeExpiredTrash(userId?: string) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const whereClause: any = {
      deletedAt: {
        not: null,
        lte: thirtyDaysAgo,
      },
    };

    if (userId) {
      whereClause.userId = userId;
    }

    const expiredFiles = await prisma.file.findMany({
      where: whereClause,
      select: { id: true, storageKey: true, userId: true, originalName: true },
    });

    if (expiredFiles.length === 0) {
      return { purgedCount: 0 };
    }

    const storage = StorageFactory.getStorage();

    // Delete files from physical storage
    for (const file of expiredFiles) {
      try {
        await storage.delete(file.storageKey);
      } catch (err) {
        console.warn(`[Trash Purge] Failed to delete storage file ${file.storageKey}:`, err);
      }
    }

    // Delete DB records
    const deleteResult = await prisma.file.deleteMany({
      where: {
        id: { in: expiredFiles.map((f) => f.id) },
      },
    });

    // Log activity logs
    for (const file of expiredFiles) {
      try {
        await ActivityService.log({
          userId: file.userId,
          action: 'TRASH_AUTO_PURGE',
          resourceType: 'FILE',
          resourceId: file.id,
          metadata: {
            fileName: file.originalName,
            retentionDays: 30,
            autoPurged: true,
          },
        });
      } catch (e) {
        // Ignore activity log errors during purge
      }
    }

    console.log(`[Trash Purge] Auto-purged ${deleteResult.count} expired trash item(s) (>30 days old).`);
    return { purgedCount: deleteResult.count };
  }

  public static async getTrashFiles(user: AuthUser) {
    // Purge expired files for this user first
    await this.purgeExpiredTrash(user.id);

    const files = await prisma.file.findMany({
      where: {
        userId: user.id,
        deletedAt: { not: null },
      },
      orderBy: { deletedAt: 'desc' },
      include: {
        folder: { select: { id: true, name: true } },
        music: true,
      },
    });

    return files.map((f) => FileService.serializeFile(f, user.id));
  }

  public static async restoreAll(user: AuthUser) {
    const result = await prisma.file.updateMany({
      where: {
        userId: user.id,
        deletedAt: { not: null },
      },
      data: { deletedAt: null },
    });

    await ActivityService.log({
      userId: user.id,
      action: 'TRASH_RESTORE_ALL',
      metadata: { count: result.count },
    });

    return { count: result.count, message: `Restored ${result.count} files.` };
  }

  public static async emptyTrash(user: AuthUser) {
    const files = await prisma.file.findMany({
      where: {
        userId: user.id,
        deletedAt: { not: null },
      },
      select: { id: true, storageKey: true },
    });

    const storage = StorageFactory.getStorage();

    // Delete files from storage
    for (const f of files) {
      await storage.delete(f.storageKey);
    }

    // Delete DB records
    const deleteResult = await prisma.file.deleteMany({
      where: {
        userId: user.id,
        deletedAt: { not: null },
      },
    });

    await ActivityService.log({
      userId: user.id,
      action: 'TRASH_EMPTY',
      metadata: { count: deleteResult.count },
    });

    return { count: deleteResult.count, message: `Permanently deleted ${deleteResult.count} files.` };
  }
}
