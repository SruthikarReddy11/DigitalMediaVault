import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import path from 'path';
import QRCode from 'qrcode';
import { prisma } from '../database/prisma';
import { AuthUser } from '../types';
import { ActivityService } from './activity.service';

export interface CreateShareLinkInput {
  fileId?: string;
  folderId?: string;
  password?: string;
  expiresAtOption?: '1h' | '1d' | '7d' | '30d' | 'never' | string;
  customExpiresAt?: string;
  allowDownload?: boolean;
  maxDownloads?: number | null;
  title?: string;
}

export class ShareService {
  /**
   * Generates a collision-resistant, URL-friendly token (8-10 chars)
   */
  public static async generateUniqueToken(): Promise<string> {
    const chars = '23456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
    let token = '';
    let isUnique = false;

    while (!isUnique) {
      const bytes = crypto.randomBytes(8);
      token = '';
      for (let i = 0; i < 8; i++) {
        token += chars[bytes[i] % chars.length];
      }

      const existing = await prisma.shareLink.findUnique({
        where: { token },
        select: { id: true },
      });

      if (!existing) {
        isUnique = true;
      }
    }

    return token;
  }

  /**
   * Calculate expiry date from options
   */
  public static calculateExpiryDate(
    option?: string,
    customDate?: string
  ): Date | null {
    if (!option || option === 'never') return null;

    const now = Date.now();
    if (option === '1h') return new Date(now + 60 * 60 * 1000);
    if (option === '1d') return new Date(now + 24 * 60 * 60 * 1000);
    if (option === '7d') return new Date(now + 7 * 24 * 60 * 60 * 1000);
    if (option === '30d') return new Date(now + 30 * 24 * 60 * 60 * 1000);

    if (customDate) {
      const parsed = new Date(customDate);
      if (!isNaN(parsed.getTime())) return parsed;
    }

    const parsed = new Date(option);
    if (!isNaN(parsed.getTime())) return parsed;

    return null;
  }

  /**
   * Create a new share link
   */
  public static async createShareLink(user: AuthUser, input: CreateShareLinkInput) {
    const {
      fileId,
      folderId,
      password,
      expiresAtOption,
      customExpiresAt,
      allowDownload = true,
      maxDownloads = null,
      title,
    } = input;

    if (!fileId && !folderId) {
      const err: any = new Error('Either fileId or folderId must be provided.');
      err.statusCode = 400;
      throw err;
    }

    let defaultTitle = title?.trim() || '';

    // Verify File
    if (fileId) {
      const file = await prisma.file.findUnique({
        where: { id: fileId },
        select: { id: true, userId: true, originalName: true, deletedAt: true },
      });

      if (!file || file.deletedAt) {
        const err: any = new Error('File not found or has been deleted.');
        err.statusCode = 404;
        throw err;
      }

      if (file.userId !== user.id && user.role !== 'ADMIN') {
        const err: any = new Error('You do not have permission to share this file.');
        err.statusCode = 403;
        throw err;
      }

      if (!defaultTitle) {
        defaultTitle = file.originalName;
      }
    }

    // Verify Folder
    if (folderId) {
      const folder = await prisma.folder.findUnique({
        where: { id: folderId },
        select: { id: true, userId: true, name: true },
      });

      if (!folder) {
        const err: any = new Error('Folder not found.');
        err.statusCode = 404;
        throw err;
      }

      if (folder.userId !== user.id && user.role !== 'ADMIN') {
        const err: any = new Error('You do not have permission to share this folder.');
        err.statusCode = 403;
        throw err;
      }

      if (!defaultTitle) {
        defaultTitle = folder.name;
      }
    }

    const token = await this.generateUniqueToken();
    const expiresAt = this.calculateExpiryDate(expiresAtOption, customExpiresAt);

    let passwordHash: string | null = null;
    let hasPassword = false;

    if (password && password.trim().length > 0) {
      passwordHash = await bcrypt.hash(password.trim(), 10);
      hasPassword = true;
    }

    const shareLink = await prisma.shareLink.create({
      data: {
        userId: user.id,
        fileId: fileId || null,
        folderId: folderId || null,
        token,
        title: defaultTitle,
        passwordHash,
        hasPassword,
        expiresAt,
        allowDownload: Boolean(allowDownload),
        maxDownloads: maxDownloads && Number(maxDownloads) > 0 ? Number(maxDownloads) : null,
      },
      include: {
        file: {
          select: {
            id: true,
            originalName: true,
            mimeType: true,
            fileType: true,
            size: true,
          },
        },
        folder: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Log Activity
    await ActivityService.log({
      userId: user.id,
      action: fileId ? 'FILE_SHARED' : 'FOLDER_SHARED',
      resourceType: fileId ? 'FILE' : 'FOLDER',
      resourceId: fileId || folderId,
      metadata: {
        shareId: shareLink.id,
        token: shareLink.token,
        title: shareLink.title,
        hasPassword: shareLink.hasPassword,
        allowDownload: shareLink.allowDownload,
        expiresAt: shareLink.expiresAt,
        maxDownloads: shareLink.maxDownloads,
      },
    });

    return this.serializeShareLink(shareLink);
  }

  /**
   * Get all share links for current user
   */
  public static async getUserShareLinks(
    user: AuthUser,
    filter?: { fileId?: string; folderId?: string; status?: 'active' | 'revoked' | 'expired' }
  ) {
    const where: any = {
      userId: user.id,
    };

    if (filter?.fileId) where.fileId = filter.fileId;
    if (filter?.folderId) where.folderId = filter.folderId;

    if (filter?.status === 'revoked') {
      where.isRevoked = true;
    } else if (filter?.status === 'expired') {
      where.expiresAt = { lte: new Date() };
      where.isRevoked = false;
    } else if (filter?.status === 'active') {
      where.isRevoked = false;
      where.OR = [{ expiresAt: null }, { expiresAt: { gt: new Date() } }];
    }

    const links = await prisma.shareLink.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        file: {
          select: {
            id: true,
            originalName: true,
            mimeType: true,
            fileType: true,
            size: true,
          },
        },
        folder: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            accessLogs: true,
          },
        },
      },
    });

    return links.map((link) => this.serializeShareLink(link));
  }

  /**
   * Get access logs for a specific share link
   */
  public static async getShareLinkLogs(shareLinkId: string, user: AuthUser) {
    const link = await prisma.shareLink.findUnique({
      where: { id: shareLinkId },
      select: { id: true, userId: true, title: true, token: true },
    });

    if (!link) {
      const err: any = new Error('Share link not found.');
      err.statusCode = 404;
      throw err;
    }

    if (link.userId !== user.id && user.role !== 'ADMIN') {
      const err: any = new Error('You do not have permission to view logs for this share link.');
      err.statusCode = 403;
      throw err;
    }

    const logs = await prisma.shareAccessLog.findMany({
      where: { shareLinkId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return {
      shareLink: link,
      logs,
    };
  }

  /**
   * Revoke a share link
   */
  public static async revokeShareLink(shareLinkId: string, user: AuthUser) {
    const link = await prisma.shareLink.findUnique({
      where: { id: shareLinkId },
      include: { file: true, folder: true },
    });

    if (!link) {
      const err: any = new Error('Share link not found.');
      err.statusCode = 404;
      throw err;
    }

    if (link.userId !== user.id && user.role !== 'ADMIN') {
      const err: any = new Error('You do not have permission to revoke this share link.');
      err.statusCode = 403;
      throw err;
    }

    const updated = await prisma.shareLink.update({
      where: { id: shareLinkId },
      data: { isRevoked: true },
      include: { file: true, folder: true },
    });

    await ActivityService.log({
      userId: user.id,
      action: 'SHARE_LINK_REVOKED',
      resourceType: link.fileId ? 'FILE' : 'FOLDER',
      resourceId: link.fileId || link.folderId || shareLinkId,
      metadata: {
        shareId: link.id,
        token: link.token,
        title: link.title,
      },
    });

    return this.serializeShareLink(updated);
  }

  /**
   * Restore a revoked share link
   */
  public static async restoreShareLink(shareLinkId: string, user: AuthUser) {
    const link = await prisma.shareLink.findUnique({
      where: { id: shareLinkId },
      include: { file: true, folder: true },
    });

    if (!link) {
      const err: any = new Error('Share link not found.');
      err.statusCode = 404;
      throw err;
    }

    if (link.userId !== user.id && user.role !== 'ADMIN') {
      const err: any = new Error('You do not have permission to restore this share link.');
      err.statusCode = 403;
      throw err;
    }

    const updated = await prisma.shareLink.update({
      where: { id: shareLinkId },
      data: { isRevoked: false },
      include: { file: true, folder: true },
    });

    await ActivityService.log({
      userId: user.id,
      action: 'SHARE_LINK_RESTORED',
      resourceType: link.fileId ? 'FILE' : 'FOLDER',
      resourceId: link.fileId || link.folderId || shareLinkId,
      metadata: {
        shareId: link.id,
        token: link.token,
        title: link.title,
      },
    });

    return this.serializeShareLink(updated);
  }

  /**
   * Delete a share link permanently
   */
  public static async deleteShareLink(shareLinkId: string, user: AuthUser) {
    const link = await prisma.shareLink.findUnique({
      where: { id: shareLinkId },
    });

    if (!link) {
      const err: any = new Error('Share link not found.');
      err.statusCode = 404;
      throw err;
    }

    if (link.userId !== user.id && user.role !== 'ADMIN') {
      const err: any = new Error('You do not have permission to delete this share link.');
      err.statusCode = 403;
      throw err;
    }

    await prisma.shareLink.delete({
      where: { id: shareLinkId },
    });

    return { success: true, message: 'Share link deleted.' };
  }

  /**
   * Public: Inspect shared link and fetch contents
   */
  public static async getPublicShare(
    token: string,
    password?: string,
    reqMeta?: { ip?: string; userAgent?: string }
  ) {
    const share = await prisma.shareLink.findUnique({
      where: { token },
      include: {
        user: { select: { id: true, name: true, username: true, avatarUrl: true } },
        file: {
          select: {
            id: true,
            originalName: true,
            mimeType: true,
            fileType: true,
            extension: true,
            size: true,
            createdAt: true,
            storageKey: true,
            deletedAt: true,
            music: {
              select: {
                id: true,
                title: true,
                artist: true,
                album: true,
                albumArtist: true,
                genre: true,
                year: true,
                trackNumber: true,
                discNumber: true,
                duration: true,
                coverArtFileId: true,
              },
            },
          },
        },
        folder: {
          select: {
            id: true,
            name: true,
            createdAt: true,
            files: {
              where: { deletedAt: null },
              select: {
                id: true,
                originalName: true,
                mimeType: true,
                fileType: true,
                extension: true,
                size: true,
                createdAt: true,
              },
              orderBy: { originalName: 'asc' },
            },
          },
        },
        album: {
          select: {
            id: true,
            name: true,
            description: true,
            items: {
              orderBy: { addedAt: 'desc' },
              include: {
                file: {
                  select: {
                    id: true,
                    originalName: true,
                    mimeType: true,
                    fileType: true,
                    extension: true,
                    size: true,
                    createdAt: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!share) {
      const err: any = new Error('Share link does not exist or has been removed.');
      err.statusCode = 404;
      err.code = 'LINK_NOT_FOUND';
      throw err;
    }

    if (share.isRevoked) {
      const err: any = new Error('This share link has been revoked by its owner.');
      err.statusCode = 410;
      err.code = 'LINK_REVOKED';
      throw err;
    }

    if (share.expiresAt && new Date(share.expiresAt).getTime() < Date.now()) {
      const err: any = new Error('This share link has expired.');
      err.statusCode = 410;
      err.code = 'LINK_EXPIRED';
      throw err;
    }

    // Check if max downloads limit was reached and downloads disabled
    const isDownloadLimitReached =
      share.maxDownloads !== null && share.downloadCount >= share.maxDownloads;

    const shareType = share.fileId ? 'FILE' : share.albumId ? 'ALBUM' : 'FOLDER';

    // Check Password Protection
    if (share.hasPassword) {
      if (!password) {
        return {
          isUnlocked: false,
          hasPassword: true,
          token: share.token,
          title: share.title || (share.file?.originalName || share.folder?.name || share.album?.name),
          type: shareType,
          owner: {
            name: share.user.name,
            avatarUrl: share.user.avatarUrl,
          },
          expiresAt: share.expiresAt,
          allowDownload: share.allowDownload && !isDownloadLimitReached,
        };
      }

      const isValidPassword = await bcrypt.compare(password, share.passwordHash || '');
      if (!isValidPassword) {
        const err: any = new Error('Incorrect password for this protected share link.');
        err.statusCode = 401;
        err.code = 'INVALID_PASSWORD';
        throw err;
      }
    }

    // Record view access and increment view count
    await prisma.shareLink.update({
      where: { id: share.id },
      data: { viewCount: { increment: 1 } },
    });

    await prisma.shareAccessLog.create({
      data: {
        shareLinkId: share.id,
        action: 'VIEW',
        ipAddress: reqMeta?.ip || null,
        userAgent: reqMeta?.userAgent || null,
        fileId: share.fileId || null,
      },
    });

    // Log Activity for PDL
    await ActivityService.log({
      userId: share.userId,
      action: share.fileId ? 'FILE_VIEWED' : share.albumId ? 'ALBUM_SHARED' : 'FOLDER_VIEWED',
      resourceType: share.fileId ? 'FILE' : share.albumId ? 'ALBUM' : 'FOLDER',
      resourceId: (share.fileId || share.folderId || share.albumId) ?? undefined,
      metadata: {
        token: share.token,
        title: share.title,
        visitorIp: reqMeta?.ip,
        isShareAccess: true,
      },
    });

    // Prepare response
    return {
      isUnlocked: true,
      hasPassword: share.hasPassword,
      token: share.token,
      title: share.title,
      type: shareType,
      allowDownload: share.allowDownload && !isDownloadLimitReached,
      isDownloadLimitReached,
      maxDownloads: share.maxDownloads,
      downloadCount: share.downloadCount,
      viewCount: share.viewCount + 1,
      expiresAt: share.expiresAt,
      createdAt: share.createdAt,
      owner: {
        name: share.user.name,
        avatarUrl: share.user.avatarUrl,
      },
      file: share.file
        ? {
            id: share.file.id,
            originalName: share.file.originalName,
            mimeType: share.file.mimeType,
            fileType: share.file.fileType,
            extension: share.file.extension,
            size: Number(share.file.size),
            createdAt: share.file.createdAt,
            storageKey: share.file.storageKey,
            isExternal: Boolean(
              share.file.storageKey?.startsWith('ext:') ||
              share.file.storageKey?.startsWith('http://') ||
              share.file.storageKey?.startsWith('https://')
            ),
            externalUrl: share.file.storageKey?.startsWith('ext:')
              ? share.file.storageKey.slice(4)
              : (share.file.storageKey?.startsWith('http') ? share.file.storageKey : null),
            streamUrl: `/api/share/public/${share.token}/stream${share.hasPassword && password ? `?pwd=${encodeURIComponent(password)}` : ''}`,
            downloadUrl: `/api/share/public/${share.token}/download${share.hasPassword && password ? `?pwd=${encodeURIComponent(password)}` : ''}`,
            music: (share.file as any).music
              ? {
                  ...(share.file as any).music,
                  coverUrl: (share.file as any).music.coverArtFileId
                    ? `/api/files/${(share.file as any).music.coverArtFileId}/stream`
                    : null,
                }
              : share.file.fileType === 'AUDIO'
              ? {
                  title: path.parse(share.file.originalName || 'Audio').name,
                  artist: 'Unknown Artist',
                  album: 'VaultMedia Audio',
                  duration: 0,
                  coverUrl: null,
                }
              : null,
          }
        : null,
      folder: share.folder
        ? {
            id: share.folder.id,
            name: share.folder.name,
            createdAt: share.folder.createdAt,
            files: share.folder.files.map((f) => ({
              id: f.id,
              originalName: f.originalName,
              mimeType: f.mimeType,
              fileType: f.fileType,
              extension: f.extension,
              size: Number(f.size),
              createdAt: f.createdAt,
              streamUrl: `/api/share/public/${share.token}/stream/${f.id}${share.hasPassword && password ? `?pwd=${encodeURIComponent(password)}` : ''}`,
              downloadUrl: `/api/share/public/${share.token}/download/${f.id}${share.hasPassword && password ? `?pwd=${encodeURIComponent(password)}` : ''}`,
            })),
          }
        : null,
      album: share.album
        ? {
            id: share.album.id,
            name: share.album.name,
            description: share.album.description,
            photoCount: share.album.items.length,
            photos: share.album.items.map((it) => ({
              id: it.file.id,
              originalName: it.file.originalName,
              mimeType: it.file.mimeType,
              fileType: it.file.fileType,
              extension: it.file.extension,
              size: Number(it.file.size),
              createdAt: it.file.createdAt,
              streamUrl: `/api/share/public/${share.token}/stream/${it.file.id}${share.hasPassword && password ? `?pwd=${encodeURIComponent(password)}` : ''}`,
              downloadUrl: `/api/share/public/${share.token}/download/${it.file.id}${share.hasPassword && password ? `?pwd=${encodeURIComponent(password)}` : ''}`,
            })),
          }
        : null,
    };
  }

  /**
   * Public: Validate share password
   */
  public static async unlockPublicShare(token: string, password: string) {
    const share = await prisma.shareLink.findUnique({
      where: { token },
      select: { id: true, hasPassword: true, passwordHash: true, isRevoked: true, expiresAt: true },
    });

    if (!share) {
      const err: any = new Error('Share link not found.');
      err.statusCode = 404;
      throw err;
    }

    if (share.isRevoked) {
      const err: any = new Error('This share link has been revoked.');
      err.statusCode = 410;
      throw err;
    }

    if (share.expiresAt && new Date(share.expiresAt).getTime() < Date.now()) {
      const err: any = new Error('This share link has expired.');
      err.statusCode = 410;
      throw err;
    }

    if (!share.hasPassword) {
      return { success: true, message: 'Link is not password protected.' };
    }

    const isValid = await bcrypt.compare(password, share.passwordHash || '');
    if (!isValid) {
      const err: any = new Error('Incorrect password.');
      err.statusCode = 401;
      err.code = 'INVALID_PASSWORD';
      throw err;
    }

    return { success: true, message: 'Password verified.' };
  }

  /**
   * Public: Get file for download
   */
  public static async getPublicFileForDownload(
    token: string,
    fileId?: string,
    password?: string,
    reqMeta?: { ip?: string; userAgent?: string }
  ) {
    const share = await prisma.shareLink.findUnique({
      where: { token },
      include: {
        file: true,
        folder: {
          include: {
            files: { where: { deletedAt: null } },
          },
        },
        album: {
          include: {
            items: {
              include: { file: true },
            },
          },
        },
      },
    });

    if (!share) {
      const err: any = new Error('Share link not found.');
      err.statusCode = 404;
      throw err;
    }

    if (share.isRevoked) {
      const err: any = new Error('This share link has been revoked.');
      err.statusCode = 410;
      throw err;
    }

    if (share.expiresAt && new Date(share.expiresAt).getTime() < Date.now()) {
      const err: any = new Error('This share link has expired.');
      err.statusCode = 410;
      throw err;
    }

    if (!share.allowDownload) {
      const err: any = new Error('Downloads are disabled for this link. You can view or stream online.');
      err.statusCode = 403;
      err.code = 'DOWNLOAD_DISABLED';
      throw err;
    }

    if (share.maxDownloads !== null && share.downloadCount >= share.maxDownloads) {
      const err: any = new Error('Maximum download limit for this link has been reached.');
      err.statusCode = 403;
      err.code = 'DOWNLOAD_LIMIT_REACHED';
      throw err;
    }

    if (share.hasPassword) {
      if (!password) {
        const err: any = new Error('Password required to download this file.');
        err.statusCode = 401;
        throw err;
      }

      const isValid = await bcrypt.compare(password, share.passwordHash || '');
      if (!isValid) {
        const err: any = new Error('Incorrect password.');
        err.statusCode = 401;
        throw err;
      }
    }

    let targetFile: any = null;

    if (share.fileId) {
      targetFile = share.file;
    } else if (share.folderId && share.folder) {
      if (fileId) {
        targetFile = share.folder.files.find((f) => f.id === fileId);
      } else if (share.folder.files.length > 0) {
        targetFile = share.folder.files[0];
      }
    } else if (share.albumId && share.album) {
      const albumFiles = share.album.items.map((it) => it.file);
      if (fileId) {
        targetFile = albumFiles.find((f) => f.id === fileId);
      } else if (albumFiles.length > 0) {
        targetFile = albumFiles[0];
      }
    }

    if (!targetFile || targetFile.deletedAt) {
      const err: any = new Error('Target file not found or has been removed.');
      err.statusCode = 404;
      throw err;
    }

    // Increment download count
    await prisma.shareLink.update({
      where: { id: share.id },
      data: { downloadCount: { increment: 1 } },
    });

    // Record Download Access Log
    await prisma.shareAccessLog.create({
      data: {
        shareLinkId: share.id,
        action: 'DOWNLOAD',
        ipAddress: reqMeta?.ip || null,
        userAgent: reqMeta?.userAgent || null,
        fileId: targetFile.id,
      },
    });

    // Activity Log
    await ActivityService.log({
      userId: share.userId,
      action: 'FILE_DOWNLOADED',
      resourceType: 'FILE',
      resourceId: targetFile.id,
      metadata: {
        shareId: share.id,
        token: share.token,
        fileName: targetFile.originalName,
        downloadCount: share.downloadCount + 1,
        isShareDownload: true,
        visitorIp: reqMeta?.ip,
      },
    });

    return targetFile;
  }

  /**
   * Public: Get file for browser streaming/preview
   */
  public static async getPublicFileForStream(
    token: string,
    fileId?: string,
    password?: string,
    reqMeta?: { ip?: string; userAgent?: string }
  ) {
    const share = await prisma.shareLink.findUnique({
      where: { token },
      include: {
        file: true,
        folder: {
          include: {
            files: { where: { deletedAt: null } },
          },
        },
        album: {
          include: {
            items: {
              include: { file: true },
            },
          },
        },
      },
    });

    if (!share) {
      const err: any = new Error('Share link not found.');
      err.statusCode = 404;
      throw err;
    }

    if (share.isRevoked) {
      const err: any = new Error('This share link has been revoked.');
      err.statusCode = 410;
      throw err;
    }

    if (share.expiresAt && new Date(share.expiresAt).getTime() < Date.now()) {
      const err: any = new Error('This share link has expired.');
      err.statusCode = 410;
      throw err;
    }

    if (share.hasPassword) {
      if (!password) {
        const err: any = new Error('Password required to stream this file.');
        err.statusCode = 401;
        throw err;
      }

      const isValid = await bcrypt.compare(password, share.passwordHash || '');
      if (!isValid) {
        const err: any = new Error('Incorrect password.');
        err.statusCode = 401;
        throw err;
      }
    }

    let targetFile: any = null;

    if (share.fileId) {
      targetFile = share.file;
    } else if (share.folderId && share.folder) {
      if (fileId) {
        targetFile = share.folder.files.find((f) => f.id === fileId);
      } else if (share.folder.files.length > 0) {
        targetFile = share.folder.files[0];
      }
    } else if (share.albumId && share.album) {
      const albumFiles = share.album.items.map((it) => it.file);
      if (fileId) {
        targetFile = albumFiles.find((f) => f.id === fileId);
      } else if (albumFiles.length > 0) {
        targetFile = albumFiles[0];
      }
    }

    if (!targetFile || targetFile.deletedAt) {
      const err: any = new Error('Target file not found or has been removed.');
      err.statusCode = 404;
      throw err;
    }

    // Record stream action
    await prisma.shareAccessLog.create({
      data: {
        shareLinkId: share.id,
        action: 'STREAM',
        ipAddress: reqMeta?.ip || null,
        userAgent: reqMeta?.userAgent || null,
        fileId: targetFile.id,
      },
    });

    return targetFile;
  }

  /**
   * Generate QR Code data URL for share token
   */
  public static async generateQrCode(token: string, clientOrigin?: string) {
    const origin = clientOrigin || process.env.CORS_ORIGIN || 'http://localhost:5173';
    const shareUrl = `${origin}/share/${token}`;

    const qrDataUrl = await QRCode.toDataURL(shareUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });

    return {
      shareUrl,
      qrDataUrl,
    };
  }

  private static serializeShareLink(link: any) {
    const now = Date.now();
    const isExpired = link.expiresAt ? new Date(link.expiresAt).getTime() <= now : false;

    let status = 'active';
    if (link.isRevoked) status = 'revoked';
    else if (isExpired) status = 'expired';

    return {
      id: link.id,
      userId: link.userId,
      fileId: link.fileId,
      folderId: link.folderId,
      token: link.token,
      title: link.title,
      hasPassword: link.hasPassword,
      expiresAt: link.expiresAt,
      allowDownload: link.allowDownload,
      maxDownloads: link.maxDownloads,
      downloadCount: link.downloadCount,
      viewCount: link.viewCount,
      isRevoked: link.isRevoked,
      isExpired,
      status,
      createdAt: link.createdAt,
      updatedAt: link.updatedAt,
      file: link.file
        ? {
            id: link.file.id,
            originalName: link.file.originalName,
            mimeType: link.file.mimeType,
            fileType: link.file.fileType,
            size: Number(link.file.size),
          }
        : null,
      folder: link.folder
        ? {
            id: link.folder.id,
            name: link.folder.name,
          }
        : null,
      accessLogsCount: link._count?.accessLogs ?? undefined,
    };
  }

  /**
   * Public: Download all files in shared album or folder as ZIP
   */
  public static async downloadAllFilesZip(
    token: string,
    password?: string,
    res?: any,
    reqMeta?: { ip?: string; userAgent?: string }
  ) {
    const share = await prisma.shareLink.findUnique({
      where: { token },
      include: {
        file: true,
        folder: {
          include: {
            files: { where: { deletedAt: null } },
          },
        },
        album: {
          include: {
            items: {
              include: { file: true },
            },
          },
        },
      },
    });

    if (!share) {
      const err: any = new Error('Share link not found.');
      err.statusCode = 404;
      throw err;
    }

    if (share.isRevoked) {
      const err: any = new Error('This share link has been revoked.');
      err.statusCode = 410;
      throw err;
    }

    if (share.expiresAt && new Date(share.expiresAt).getTime() < Date.now()) {
      const err: any = new Error('This share link has expired.');
      err.statusCode = 410;
      throw err;
    }

    if (!share.allowDownload) {
      const err: any = new Error('Downloads are disabled for this link.');
      err.statusCode = 403;
      throw err;
    }

    if (share.hasPassword) {
      if (!password) {
        const err: any = new Error('Password required to download.');
        err.statusCode = 401;
        throw err;
      }
      const isValid = await bcrypt.compare(password, share.passwordHash || '');
      if (!isValid) {
        const err: any = new Error('Incorrect password.');
        err.statusCode = 401;
        throw err;
      }
    }

    let filesToZip: any[] = [];
    if (share.albumId && share.album) {
      filesToZip = share.album.items.map((it) => it.file);
    } else if (share.folderId && share.folder) {
      filesToZip = share.folder.files;
    } else if (share.fileId && share.file) {
      filesToZip = [share.file];
    }

    if (filesToZip.length === 0) {
      res.status(404).json({ success: false, error: { message: 'No files to download.' } });
      return;
    }

    const archiver = require('archiver');
    const { StorageFactory } = require('../storage/StorageFactory');
    const storage = StorageFactory.getStorage();
    const archive = new archiver.ZipArchive({ zlib: { level: 6 } });

    const safeTitle = (share.title || 'shared_photos').replace(/[^a-zA-Z0-9_-]/g, '_');
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}.zip"`);

    archive.pipe(res);

    for (let i = 0; i < filesToZip.length; i++) {
      const f = filesToZip[i];
      try {
        const { stream } = await storage.getReadStream(f.storageKey);
        const safeName = `${i + 1}_${f.originalName}`;
        archive.append(stream, { name: safeName });
      } catch (err) {
        console.error(`Failed to append file ${f.id} to zip:`, err);
      }
    }

    await archive.finalize();

    // Increment download count
    await prisma.shareLink.update({
      where: { id: share.id },
      data: { downloadCount: { increment: 1 } },
    });
  }
}
