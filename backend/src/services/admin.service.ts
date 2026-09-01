import { prisma } from '../database/prisma';
import { StorageFactory } from '../storage/StorageFactory';
import { FileService } from './file.service';
import { Role } from '@prisma/client';
import { ActivityService } from './activity.service';

export interface AdminUserQuery {
  search?: string;
  role?: Role;
  status?: 'all' | 'active' | 'inactive';
  page?: number;
  limit?: number;
}

export interface AdminFileQuery {
  userId?: string;
  fileType?: any;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface AdminLogQuery {
  userId?: string;
  action?: string;
  page?: number;
  limit?: number;
}

export class AdminService {
  public static async getSystemStats() {
    const [
      totalUsers,
      activeUsers,
      adminUsers,
      totalFiles,
      imagesCount,
      videosCount,
      audioCount,
      pdfCount,
      docsCount,
      spreadsheetsCount,
      archivesCount,
      othersCount,
      totalPlaylists,
      recentActivity,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.file.count({ where: { deletedAt: null } }),
      prisma.file.count({ where: { fileType: 'IMAGE', deletedAt: null } }),
      prisma.file.count({ where: { fileType: 'VIDEO', deletedAt: null } }),
      prisma.file.count({ where: { fileType: 'AUDIO', deletedAt: null } }),
      prisma.file.count({ where: { fileType: 'PDF', deletedAt: null } }),
      prisma.file.count({ where: { fileType: 'DOCUMENT', deletedAt: null } }),
      prisma.file.count({ where: { fileType: 'SPREADSHEET', deletedAt: null } }),
      prisma.file.count({ where: { fileType: 'ARCHIVE', deletedAt: null } }),
      prisma.file.count({ where: { fileType: 'OTHER', deletedAt: null } }),
      prisma.playlist.count(),
      prisma.activityLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, username: true, email: true } },
        },
      }),
    ]);

    // Calculate total disk usage
    const allFiles = await prisma.file.findMany({
      select: { size: true, fileType: true, userId: true },
    });

    let totalStorageBytes = 0;
    const storageByType: Record<string, number> = {};

    for (const f of allFiles) {
      const bytes = Number(f.size);
      totalStorageBytes += bytes;
      storageByType[f.fileType] = (storageByType[f.fileType] || 0) + bytes;
    }

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        admins: adminUsers,
      },
      files: {
        total: totalFiles,
        byType: {
          images: imagesCount,
          videos: videosCount,
          music: audioCount,
          pdfs: pdfCount,
          documents: docsCount,
          spreadsheets: spreadsheetsCount,
          archives: archivesCount,
          others: othersCount,
        },
      },
      storage: {
        totalBytes: totalStorageBytes,
        byType: storageByType,
      },
      playlists: {
        total: totalPlaylists,
      },
      recentActivity,
    };
  }

  public static async getUsers(query: AdminUserQuery) {
    const where: any = {};

    if (query.role) {
      where.role = query.role;
    }

    if (query.status === 'active') {
      where.isActive = true;
    } else if (query.status === 'inactive') {
      where.isActive = false;
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { username: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          username: true,
          email: true,
          avatarUrl: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          lastLoginAt: true,
          _count: {
            select: {
              files: true,
              playlists: true,
              folders: true,
            },
          },
          files: {
            select: { size: true },
          },
        },
      }),
    ]);

    const formattedUsers = users.map((u) => {
      const storageBytes = u.files.reduce((acc, f) => acc + Number(f.size), 0);
      return {
        id: u.id,
        name: u.name,
        username: u.username,
        email: u.email,
        avatarUrl: u.avatarUrl ? `/api/auth/avatar/${u.id}` : null,
        role: u.role,
        isActive: u.isActive,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
        lastLoginAt: u.lastLoginAt,
        fileCount: u._count.files,
        playlistCount: u._count.playlists,
        folderCount: u._count.folders,
        storageBytes,
      };
    });

    return {
      users: formattedUsers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  public static async updateUserStatus(
    userId: string,
    data: { isActive?: boolean; role?: Role },
    adminUserId: string
  ) {
    // Prevent self-demotion or disabling if current admin
    if (userId === adminUserId && data.role === 'USER') {
      const err: any = new Error('You cannot demote your own admin account.');
      err.statusCode = 400;
      err.code = 'CANNOT_DEMOTE_SELF';
      throw err;
    }

    if (userId === adminUserId && data.isActive === false) {
      const err: any = new Error('You cannot deactivate your own account.');
      err.statusCode = 400;
      err.code = 'CANNOT_DEACTIVATE_SELF';
      throw err;
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    await ActivityService.log({
      userId: adminUserId,
      action: 'ADMIN_UPDATE_USER',
      resourceType: 'USER',
      resourceId: userId,
      metadata: data,
    });

    return updated;
  }

  public static async deleteUser(userId: string, adminUserId: string) {
    if (userId === adminUserId) {
      const err: any = new Error('You cannot delete your own admin account.');
      err.statusCode = 400;
      err.code = 'CANNOT_DELETE_SELF';
      throw err;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { files: { select: { storageKey: true } } },
    });

    if (!user) {
      const err: any = new Error('User not found.');
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    // Delete user's physical files
    const storage = StorageFactory.getStorage();
    for (const f of user.files) {
      await storage.delete(f.storageKey);
    }

    // Delete user from DB (cascades sessions, folders, files, favorites, playlists)
    await prisma.user.delete({ where: { id: userId } });

    await ActivityService.log({
      userId: adminUserId,
      action: 'ADMIN_DELETE_USER',
      resourceType: 'USER',
      resourceId: userId,
      metadata: { email: user.email, username: user.username },
    });

    return { success: true, message: 'User and all associated data deleted.' };
  }

  public static async getAllFiles(query: AdminFileQuery) {
    const where: any = {};

    if (query.userId) {
      where.userId = query.userId;
    }

    if (query.fileType) {
      where.fileType = query.fileType;
    }

    if (query.search) {
      where.originalName = {
        contains: query.search,
        mode: 'insensitive',
      };
    }

    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 50));
    const skip = (page - 1) * limit;

    const sortOrder = query.sortOrder || 'desc';
    let orderBy: any = { createdAt: 'desc' };
    if (query.sortBy === 'name') orderBy = { originalName: sortOrder };
    if (query.sortBy === 'size') orderBy = { size: sortOrder };

    const [total, files] = await Promise.all([
      prisma.file.count({ where }),
      prisma.file.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          user: { select: { id: true, name: true, username: true, email: true } },
          folder: { select: { id: true, name: true } },
          music: true,
        },
      }),
    ]);

    return {
      files: files.map((f) => ({
        ...FileService.serializeFile(f),
        owner: f.user,
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  public static async getAuditLogs(query: AdminLogQuery) {
    const where: any = {};

    if (query.userId) {
      where.userId = query.userId;
    }

    if (query.action) {
      where.action = { contains: query.action, mode: 'insensitive' };
    }

    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 50));
    const skip = (page - 1) * limit;

    const [total, logs] = await Promise.all([
      prisma.activityLog.count({ where }),
      prisma.activityLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, username: true, email: true } },
        },
      }),
    ]);

    return {
      logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
