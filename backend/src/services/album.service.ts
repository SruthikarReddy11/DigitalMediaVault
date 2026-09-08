import { prisma } from '../database/prisma';
import { AuthUser } from '../types';
import { isOwnerOrAdmin } from '../middleware/ownership';
import { FileService } from './file.service';
import { ShareService, CreateShareLinkInput } from './share.service';

export interface CreateAlbumInput {
  name: string;
  description?: string;
  coverFileId?: string;
}

export interface UpdateAlbumInput {
  name?: string;
  description?: string;
  coverFileId?: string | null;
}

export class AlbumService {
  /**
   * Create a new photo album
   */
  public static async createAlbum(user: AuthUser, input: CreateAlbumInput) {
    if (!input.name || !input.name.trim()) {
      const err: any = new Error('Album name is required.');
      err.statusCode = 400;
      throw err;
    }

    if (input.coverFileId) {
      const file = await prisma.file.findUnique({ where: { id: input.coverFileId } });
      if (!file || !isOwnerOrAdmin(file.userId, user)) {
        input.coverFileId = undefined;
      }
    }

    const album = await prisma.photoAlbum.create({
      data: {
        userId: user.id,
        name: input.name.trim(),
        description: input.description?.trim() || null,
        coverFileId: input.coverFileId || null,
      },
      include: {
        coverFile: { select: { id: true, originalName: true } },
        _count: { select: { items: true } },
      },
    });

    return this.serializeAlbum(album);
  }

  /**
   * List all albums for user
   */
  public static async getAlbums(user: AuthUser) {
    const albums = await prisma.photoAlbum.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
      include: {
        coverFile: {
          select: { id: true, originalName: true },
        },
        items: {
          take: 4,
          orderBy: { addedAt: 'desc' },
          include: {
            file: {
              select: { id: true, originalName: true },
            },
          },
        },
        _count: {
          select: { items: true },
        },
      },
    });

    return albums.map((album) => {
      // If no explicit cover, use the first photo in the album
      let coverId = album.coverFileId;
      if (!coverId && album.items.length > 0) {
        coverId = album.items[0].file.id;
      }

      return {
        id: album.id,
        name: album.name,
        description: album.description,
        coverFileId: coverId,
        coverUrl: coverId ? `/api/files/${coverId}/stream` : null,
        photoCount: album._count.items,
        previewFileIds: album.items.map((it) => it.file.id),
        createdAt: album.createdAt.toISOString(),
        updatedAt: album.updatedAt.toISOString(),
      };
    });
  }

  /**
   * Get single album with all photos
   */
  public static async getAlbum(user: AuthUser, albumId: string) {
    const album = await prisma.photoAlbum.findUnique({
      where: { id: albumId },
      include: {
        coverFile: { select: { id: true, originalName: true } },
        items: {
          orderBy: { addedAt: 'desc' },
          include: {
            file: {
              include: {
                folder: { select: { id: true, name: true } },
                favorites: { where: { userId: user.id }, select: { id: true } },
              },
            },
          },
        },
        _count: { select: { items: true } },
      },
    });

    if (!album) {
      const err: any = new Error('Album not found.');
      err.statusCode = 404;
      throw err;
    }

    if (album.userId !== user.id && user.role !== 'ADMIN') {
      const err: any = new Error('Access denied to this album.');
      err.statusCode = 403;
      throw err;
    }

    let coverId = album.coverFileId;
    if (!coverId && album.items.length > 0) {
      coverId = album.items[0].file.id;
    }

    return {
      id: album.id,
      name: album.name,
      description: album.description,
      coverFileId: coverId,
      coverUrl: coverId ? `/api/files/${coverId}/stream` : null,
      photoCount: album._count.items,
      createdAt: album.createdAt.toISOString(),
      updatedAt: album.updatedAt.toISOString(),
      photos: album.items.map((it) => FileService.serializeFile(it.file, user.id)),
    };
  }

  /**
   * Update album metadata
   */
  public static async updateAlbum(user: AuthUser, albumId: string, input: UpdateAlbumInput) {
    const album = await prisma.photoAlbum.findUnique({ where: { id: albumId } });
    if (!album) {
      const err: any = new Error('Album not found.');
      err.statusCode = 404;
      throw err;
    }

    if (album.userId !== user.id && user.role !== 'ADMIN') {
      const err: any = new Error('Access denied to update album.');
      err.statusCode = 403;
      throw err;
    }

    const updated = await prisma.photoAlbum.update({
      where: { id: albumId },
      data: {
        ...(input.name !== undefined && { name: input.name.trim() }),
        ...(input.description !== undefined && { description: input.description.trim() || null }),
        ...(input.coverFileId !== undefined && { coverFileId: input.coverFileId }),
      },
      include: {
        coverFile: { select: { id: true, originalName: true } },
        _count: { select: { items: true } },
      },
    });

    return this.serializeAlbum(updated);
  }

  /**
   * Delete album
   */
  public static async deleteAlbum(user: AuthUser, albumId: string) {
    const album = await prisma.photoAlbum.findUnique({ where: { id: albumId } });
    if (!album) {
      const err: any = new Error('Album not found.');
      err.statusCode = 404;
      throw err;
    }

    if (album.userId !== user.id && user.role !== 'ADMIN') {
      const err: any = new Error('Access denied to delete album.');
      err.statusCode = 403;
      throw err;
    }

    await prisma.photoAlbum.delete({ where: { id: albumId } });
    return { success: true, message: 'Album deleted.' };
  }

  /**
   * Add photos to an album
   */
  public static async addPhotosToAlbum(user: AuthUser, albumId: string, fileIds: string[]) {
    const album = await prisma.photoAlbum.findUnique({ where: { id: albumId } });
    if (!album) {
      const err: any = new Error('Album not found.');
      err.statusCode = 404;
      throw err;
    }

    if (album.userId !== user.id && user.role !== 'ADMIN') {
      const err: any = new Error('Access denied to album.');
      err.statusCode = 403;
      throw err;
    }

    // Verify files exist and belong to user
    const files = await prisma.file.findMany({
      where: {
        id: { in: fileIds },
        userId: user.id,
        deletedAt: null,
      },
      select: { id: true },
    });

    const validIds = files.map((f) => f.id);

    // Upsert items into album
    await prisma.$transaction(
      validIds.map((fId) =>
        prisma.photoAlbumItem.upsert({
          where: {
            albumId_fileId: { albumId, fileId: fId },
          },
          create: {
            albumId,
            fileId: fId,
          },
          update: {},
        })
      )
    );

    // If album has no cover, set the first added photo as cover
    if (!album.coverFileId && validIds.length > 0) {
      await prisma.photoAlbum.update({
        where: { id: albumId },
        data: { coverFileId: validIds[0] },
      });
    }

    return this.getAlbum(user, albumId);
  }

  /**
   * Remove photo from album
   */
  public static async removePhotoFromAlbum(user: AuthUser, albumId: string, fileId: string) {
    const album = await prisma.photoAlbum.findUnique({ where: { id: albumId } });
    if (!album) {
      const err: any = new Error('Album not found.');
      err.statusCode = 404;
      throw err;
    }

    if (album.userId !== user.id && user.role !== 'ADMIN') {
      const err: any = new Error('Access denied.');
      err.statusCode = 403;
      throw err;
    }

    await prisma.photoAlbumItem.deleteMany({
      where: { albumId, fileId },
    });

    // If removed photo was cover, clear cover
    if (album.coverFileId === fileId) {
      await prisma.photoAlbum.update({
        where: { id: albumId },
        data: { coverFileId: null },
      });
    }

    return { success: true, message: 'Photo removed from album.' };
  }

  /**
   * Share album via ShareLink
   */
  public static async shareAlbum(user: AuthUser, albumId: string, input: CreateShareLinkInput) {
    const album = await prisma.photoAlbum.findUnique({ where: { id: albumId } });
    if (!album) {
      const err: any = new Error('Album not found.');
      err.statusCode = 404;
      throw err;
    }

    if (album.userId !== user.id && user.role !== 'ADMIN') {
      const err: any = new Error('Access denied.');
      err.statusCode = 403;
      throw err;
    }

    const token = await ShareService.generateUniqueToken();
    const expiresAt = ShareService.calculateExpiryDate(input.expiresAtOption, input.customExpiresAt);

    let passwordHash: string | null = null;
    let hasPassword = false;
    if (input.password && input.password.trim().length > 0) {
      const bcrypt = require('bcryptjs');
      passwordHash = await bcrypt.hash(input.password.trim(), 10);
      hasPassword = true;
    }

    const shareLink = await prisma.shareLink.create({
      data: {
        userId: user.id,
        albumId: album.id,
        title: input.title || `Album: ${album.name}`,
        token,
        passwordHash,
        hasPassword,
        expiresAt,
        allowDownload: Boolean(input.allowDownload ?? true),
        maxDownloads: input.maxDownloads || null,
      },
    });

    return {
      shareUrl: `${process.env.CORS_ORIGIN || 'http://localhost:5173'}/share/${shareLink.token}`,
      token: shareLink.token,
      shareLink,
    };
  }

  private static serializeAlbum(album: any) {
    return {
      id: album.id,
      name: album.name,
      description: album.description,
      coverFileId: album.coverFileId,
      coverUrl: album.coverFileId ? `/api/files/${album.coverFileId}/stream` : null,
      photoCount: album._count?.items ?? 0,
      createdAt: album.createdAt.toISOString ? album.createdAt.toISOString() : album.createdAt,
      updatedAt: album.updatedAt.toISOString ? album.updatedAt.toISOString() : album.updatedAt,
    };
  }
}
