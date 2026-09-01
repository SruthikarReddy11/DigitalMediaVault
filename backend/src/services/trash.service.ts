import { prisma } from '../database/prisma';
import { AuthUser } from '../types';
import { FileService } from './file.service';
import { StorageFactory } from '../storage/StorageFactory';
import { ActivityService } from './activity.service';

export class TrashService {
  public static async getTrashFiles(user: AuthUser) {
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
