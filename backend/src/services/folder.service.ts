import { prisma } from '../database/prisma';
import { AuthUser } from '../types';
import { isOwnerOrAdmin } from '../middleware/ownership';
import { ActivityService } from './activity.service';

export class FolderService {
  public static async createFolder(name: string, parentId: string | null | undefined, user: AuthUser) {
    if (parentId) {
      const parent = await prisma.folder.findUnique({ where: { id: parentId } });
      if (!parent || !isOwnerOrAdmin(parent.userId, user)) {
        const err: any = new Error('Parent folder not found or forbidden.');
        err.statusCode = 403;
        err.code = 'FORBIDDEN';
        throw err;
      }
    }

    const folder = await prisma.folder.create({
      data: {
        name: name.trim(),
        parentId: parentId || null,
        userId: user.id,
      },
      include: {
        _count: { select: { files: true, children: true } },
      },
    });

    await ActivityService.log({
      userId: user.id,
      action: 'FOLDER_CREATE',
      resourceType: 'FOLDER',
      resourceId: folder.id,
      metadata: {
        folderName: folder.name,
        parentId: folder.parentId,
      },
    });

    return folder;
  }

  public static async getFolders(user: AuthUser, parentId?: string | null) {
    const where: any = { userId: user.id };
    if (parentId !== undefined) {
      where.parentId = parentId;
    }

    return prisma.folder.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { files: true, children: true } },
        children: {
          select: { id: true, name: true, parentId: true },
        },
      },
    });
  }

  public static async getFolderTree(user: AuthUser) {
    const allFolders = await prisma.folder.findMany({
      where: { userId: user.id },
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { files: true } },
      },
    });

    // Build recursive tree
    const map = new Map<string, any>();
    const roots: any[] = [];

    allFolders.forEach((folder) => {
      map.set(folder.id, { ...folder, children: [] });
    });

    allFolders.forEach((folder) => {
      if (folder.parentId && map.has(folder.parentId)) {
        map.get(folder.parentId).children.push(map.get(folder.id));
      } else {
        roots.push(map.get(folder.id));
      }
    });

    return roots;
  }

  public static async renameFolder(folderId: string, newName: string, user: AuthUser) {
    const folder = await prisma.folder.findUnique({ where: { id: folderId } });
    if (!folder) {
      const err: any = new Error('Folder not found.');
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    if (!isOwnerOrAdmin(folder.userId, user)) {
      const err: any = new Error('You do not have permission to modify this folder.');
      err.statusCode = 403;
      err.code = 'FORBIDDEN';
      throw err;
    }

    const updated = await prisma.folder.update({
      where: { id: folderId },
      data: { name: newName.trim() },
    });

    await ActivityService.log({
      userId: user.id,
      action: 'FOLDER_RENAME',
      resourceType: 'FOLDER',
      resourceId: folderId,
      metadata: {
        oldName: folder.name,
        newName: newName.trim(),
      },
    });

    return updated;
  }

  public static async deleteFolder(folderId: string, user: AuthUser) {
    const folder = await prisma.folder.findUnique({ where: { id: folderId } });
    if (!folder) {
      const err: any = new Error('Folder not found.');
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    if (!isOwnerOrAdmin(folder.userId, user)) {
      const err: any = new Error('You do not have permission to delete this folder.');
      err.statusCode = 403;
      err.code = 'FORBIDDEN';
      throw err;
    }

    // Set files in this folder to root or delete
    await prisma.file.updateMany({
      where: { folderId },
      data: { folderId: null },
    });

    await prisma.folder.delete({ where: { id: folderId } });

    await ActivityService.log({
      userId: user.id,
      action: 'FOLDER_DELETE',
      resourceType: 'FOLDER',
      resourceId: folderId,
      metadata: {
        folderName: folder.name,
      },
    });

    return { success: true, message: 'Folder deleted.' };
  }
}
