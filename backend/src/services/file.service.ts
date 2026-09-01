import { prisma } from '../database/prisma';
import { StorageFactory } from '../storage/StorageFactory';
import { classifyFile } from '../utils/mime';
import { extractAudioMetadata } from '../utils/audioMetadata';
import { AuthUser } from '../types';
import { isOwnerOrAdmin } from '../middleware/ownership';
import { ActivityService } from './activity.service';
import { FileType, Prisma } from '@prisma/client';
import path from 'path';

export interface UploadFileItem {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

export interface ListFilesOptions {
  folderId?: string | null;
  fileType?: FileType;
  search?: string;
  favoriteOnly?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'createdAt' | 'size' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  includeTrash?: boolean;
}

export class FileService {
  public static async uploadFile(
    user: AuthUser,
    file: UploadFileItem,
    folderId?: string | null
  ) {
    const storage = StorageFactory.getStorage();
    const { fileType, extension, mimeType } = classifyFile(file.originalname, file.mimetype);

    // Verify folder ownership if folderId provided
    if (folderId) {
      const folder = await prisma.folder.findUnique({ where: { id: folderId } });
      if (!folder || !isOwnerOrAdmin(folder.userId, user)) {
        const err: any = new Error('Destination folder not found or access denied.');
        err.statusCode = 403;
        err.code = 'FORBIDDEN';
        throw err;
      }
    }

    // Save actual file into storage abstraction
    const { storageKey, size, checksum } = await storage.save(file.buffer, {
      userId: user.id,
      category: fileType.toLowerCase(),
      originalName: file.originalname,
      mimeType,
    });

    // Create File record in database
    const dbFile = await prisma.file.create({
      data: {
        userId: user.id,
        folderId: folderId || null,
        originalName: file.originalname,
        storageKey,
        mimeType,
        fileType,
        extension,
        size: BigInt(size),
        checksum,
      },
      include: {
        folder: { select: { id: true, name: true } },
        favorites: { where: { userId: user.id }, select: { id: true } },
      },
    });

    // If AUDIO, extract metadata and create Music record
    if (fileType === FileType.AUDIO) {
      try {
        const audioMeta = await extractAudioMetadata(file.buffer, file.originalname, mimeType);

        let coverArtFileId: string | null = null;
        if (audioMeta.coverArtBuffer && audioMeta.coverArtMime) {
          const coverStorage = await storage.save(audioMeta.coverArtBuffer, {
            userId: user.id,
            category: 'covers',
            originalName: `${path.parse(file.originalname).name}-cover.jpg`,
            mimeType: audioMeta.coverArtMime,
          });

          const coverFile = await prisma.file.create({
            data: {
              userId: user.id,
              originalName: `${audioMeta.title} Cover`,
              storageKey: coverStorage.storageKey,
              mimeType: audioMeta.coverArtMime,
              fileType: FileType.IMAGE,
              extension: '.jpg',
              size: BigInt(coverStorage.size),
            },
          });
          coverArtFileId = coverFile.id;
        }

        await prisma.music.create({
          data: {
            fileId: dbFile.id,
            title: audioMeta.title,
            artist: audioMeta.artist,
            album: audioMeta.album || null,
            albumArtist: audioMeta.albumArtist || null,
            genre: audioMeta.genre || null,
            year: audioMeta.year || null,
            trackNumber: audioMeta.trackNumber || null,
            discNumber: audioMeta.discNumber || null,
            duration: audioMeta.duration,
            coverArtFileId,
          },
        });
      } catch (err) {
        console.warn(`Failed to process music metadata for file ${dbFile.id}:`, err);
      }
    }

    await ActivityService.log({
      userId: user.id,
      action: 'FILE_UPLOAD',
      resourceType: 'FILE',
      resourceId: dbFile.id,
      metadata: { originalName: file.originalname, size, fileType },
    });

    return this.serializeFile(dbFile, user.id);
  }

  public static async getFile(fileId: string, user: AuthUser) {
    const file = await prisma.file.findUnique({
      where: { id: fileId },
      include: {
        folder: { select: { id: true, name: true } },
        music: true,
        favorites: { where: { userId: user.id }, select: { id: true } },
      },
    });

    if (!file) {
      const err: any = new Error('File not found.');
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    if (!isOwnerOrAdmin(file.userId, user)) {
      const err: any = new Error('You do not have permission to access this resource.');
      err.statusCode = 403;
      err.code = 'FORBIDDEN';
      throw err;
    }

    return this.serializeFile(file, user.id);
  }

  public static async listFiles(user: AuthUser, options: ListFilesOptions) {
    const where: Prisma.FileWhereInput = {
      userId: user.id,
      deletedAt: options.includeTrash ? { not: null } : null,
    };

    if (options.folderId !== undefined) {
      where.folderId = options.folderId;
    }

    if (options.fileType) {
      where.fileType = options.fileType;
    }

    if (options.search) {
      where.originalName = {
        contains: options.search,
        mode: 'insensitive',
      };
    }

    if (options.favoriteOnly) {
      where.favorites = {
        some: { userId: user.id },
      };
    }

    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 50));
    const skip = (page - 1) * limit;

    const sortField = options.sortBy || 'createdAt';
    const sortOrder = options.sortOrder || 'desc';

    let orderBy: Prisma.FileOrderByWithRelationInput = { createdAt: 'desc' };
    if (sortField === 'name') orderBy = { originalName: sortOrder };
    if (sortField === 'size') orderBy = { size: sortOrder };
    if (sortField === 'updatedAt') orderBy = { updatedAt: sortOrder };
    if (sortField === 'createdAt') orderBy = { createdAt: sortOrder };

    const [total, files] = await Promise.all([
      prisma.file.count({ where }),
      prisma.file.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          folder: { select: { id: true, name: true } },
          music: true,
          favorites: { where: { userId: user.id }, select: { id: true } },
        },
      }),
    ]);

    return {
      files: files.map((f) => this.serializeFile(f, user.id)),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  public static async renameFile(fileId: string, newName: string, user: AuthUser) {
    const file = await prisma.file.findUnique({ where: { id: fileId } });
    if (!file) {
      const err: any = new Error('File not found.');
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    if (!isOwnerOrAdmin(file.userId, user)) {
      const err: any = new Error('You do not have permission to modify this file.');
      err.statusCode = 403;
      err.code = 'FORBIDDEN';
      throw err;
    }

    const updated = await prisma.file.update({
      where: { id: fileId },
      data: { originalName: newName.trim() },
      include: {
        folder: { select: { id: true, name: true } },
        music: true,
        favorites: { where: { userId: user.id }, select: { id: true } },
      },
    });

    await ActivityService.log({
      userId: user.id,
      action: 'FILE_RENAME',
      resourceType: 'FILE',
      resourceId: fileId,
      metadata: { oldName: file.originalName, newName: newName.trim() },
    });

    return this.serializeFile(updated, user.id);
  }

  public static async moveFile(fileId: string, folderId: string | null, user: AuthUser) {
    const file = await prisma.file.findUnique({ where: { id: fileId } });
    if (!file) {
      const err: any = new Error('File not found.');
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    if (!isOwnerOrAdmin(file.userId, user)) {
      const err: any = new Error('You do not have permission to move this file.');
      err.statusCode = 403;
      err.code = 'FORBIDDEN';
      throw err;
    }

    if (folderId) {
      const folder = await prisma.folder.findUnique({ where: { id: folderId } });
      if (!folder || !isOwnerOrAdmin(folder.userId, user)) {
        const err: any = new Error('Destination folder not found or forbidden.');
        err.statusCode = 403;
        err.code = 'FORBIDDEN';
        throw err;
      }
    }

    const updated = await prisma.file.update({
      where: { id: fileId },
      data: { folderId: folderId || null },
      include: {
        folder: { select: { id: true, name: true } },
        music: true,
        favorites: { where: { userId: user.id }, select: { id: true } },
      },
    });

    return this.serializeFile(updated, user.id);
  }

  public static async moveToTrash(fileId: string, user: AuthUser) {
    const file = await prisma.file.findUnique({ where: { id: fileId } });
    if (!file) {
      const err: any = new Error('File not found.');
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    if (!isOwnerOrAdmin(file.userId, user)) {
      const err: any = new Error('You do not have permission to delete this file.');
      err.statusCode = 403;
      err.code = 'FORBIDDEN';
      throw err;
    }

    const updated = await prisma.file.update({
      where: { id: fileId },
      data: { deletedAt: new Date() },
    });

    await ActivityService.log({
      userId: user.id,
      action: 'FILE_DELETE',
      resourceType: 'FILE',
      resourceId: fileId,
      metadata: { originalName: file.originalName, softDelete: true },
    });

    return { success: true, message: 'File moved to trash.' };
  }

  public static async restoreFromTrash(fileId: string, user: AuthUser) {
    const file = await prisma.file.findUnique({ where: { id: fileId } });
    if (!file) {
      const err: any = new Error('File not found.');
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    if (!isOwnerOrAdmin(file.userId, user)) {
      const err: any = new Error('You do not have permission to restore this file.');
      err.statusCode = 403;
      err.code = 'FORBIDDEN';
      throw err;
    }

    await prisma.file.update({
      where: { id: fileId },
      data: { deletedAt: null },
    });

    return { success: true, message: 'File restored.' };
  }

  public static async permanentDelete(fileId: string, user: AuthUser) {
    const file = await prisma.file.findUnique({ where: { id: fileId } });
    if (!file) {
      const err: any = new Error('File not found.');
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    if (!isOwnerOrAdmin(file.userId, user)) {
      const err: any = new Error('You do not have permission to permanently delete this file.');
      err.statusCode = 403;
      err.code = 'FORBIDDEN';
      throw err;
    }

    // Delete physical file from storage
    const storage = StorageFactory.getStorage();
    await storage.delete(file.storageKey);

    // Delete DB record
    await prisma.file.delete({ where: { id: fileId } });

    await ActivityService.log({
      userId: user.id,
      action: 'FILE_PERMANENT_DELETE',
      resourceType: 'FILE',
      resourceId: fileId,
      metadata: { originalName: file.originalName },
    });

    return { success: true, message: 'File permanently deleted.' };
  }

  public static async getDashboardStats(user: AuthUser) {
    const [totalFiles, images, videos, music, pdfs, documents, spreadsheets, archives, others, favorites, recentFiles, recentActivity] =
      await Promise.all([
        prisma.file.count({ where: { userId: user.id, deletedAt: null } }),
        prisma.file.count({ where: { userId: user.id, fileType: 'IMAGE', deletedAt: null } }),
        prisma.file.count({ where: { userId: user.id, fileType: 'VIDEO', deletedAt: null } }),
        prisma.file.count({ where: { userId: user.id, fileType: 'AUDIO', deletedAt: null } }),
        prisma.file.count({ where: { userId: user.id, fileType: 'PDF', deletedAt: null } }),
        prisma.file.count({ where: { userId: user.id, fileType: 'DOCUMENT', deletedAt: null } }),
        prisma.file.count({ where: { userId: user.id, fileType: 'SPREADSHEET', deletedAt: null } }),
        prisma.file.count({ where: { userId: user.id, fileType: 'ARCHIVE', deletedAt: null } }),
        prisma.file.count({ where: { userId: user.id, fileType: 'OTHER', deletedAt: null } }),
        prisma.favorite.count({ where: { userId: user.id } }),
        prisma.file.findMany({
          where: { userId: user.id, deletedAt: null },
          take: 8,
          orderBy: { createdAt: 'desc' },
          include: {
            music: true,
            favorites: { where: { userId: user.id }, select: { id: true } },
          },
        }),
        prisma.activityLog.findMany({
          where: { userId: user.id },
          take: 6,
          orderBy: { createdAt: 'desc' },
        }),
      ]);

    // Aggregate total storage used
    const filesForSize = await prisma.file.findMany({
      where: { userId: user.id },
      select: { size: true },
    });

    const storageUsedBytes = filesForSize.reduce((acc, f) => acc + Number(f.size), 0);

    return {
      totalFiles,
      countsByType: {
        images,
        videos,
        music,
        pdfs,
        documents,
        spreadsheets,
        archives,
        others,
      },
      favorites,
      storageUsedBytes,
      storageLimitBytes: 100 * 1024 * 1024 * 1024, // 100 GB virtual quota
      recentFiles: recentFiles.map((f) => this.serializeFile(f, user.id)),
      recentActivity,
    };
  }

  public static serializeFile(file: any, currentUserId?: string) {
    return {
      id: file.id,
      userId: file.userId,
      folderId: file.folderId,
      originalName: file.originalName,
      storageKey: file.storageKey,
      mimeType: file.mimeType,
      fileType: file.fileType,
      extension: file.extension,
      size: Number(file.size),
      checksum: file.checksum,
      createdAt: file.createdAt,
      updatedAt: file.updatedAt,
      deletedAt: file.deletedAt,
      folder: file.folder,
      music: file.music,
      isFavorite: file.favorites ? file.favorites.length > 0 : false,
      streamUrl: `/api/files/${file.id}/stream`,
      downloadUrl: `/api/files/${file.id}/download`,
    };
  }
}
