import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../database/prisma';
import { generateSecret, verifyTOTP, getOtpAuthUrl, generateQrCodeDataUrl } from '../lib/totp';
import { ActivityService } from './activity.service';
import { FileService, UploadFileItem } from './file.service';
import { AuthUser } from '../types';

const VAULT_SECRET_KEY = process.env.JWT_SECRET || 'vault_super_secret_fallback_key';

export function createVaultSessionToken(userId: string): string {
  const timestamp = Date.now();
  const raw = `${userId}:${timestamp}`;
  const hmac = crypto.createHmac('sha256', VAULT_SECRET_KEY).update(raw).digest('hex');
  return `${raw}:${hmac}`;
}

export function verifyVaultSessionToken(token: string, userId: string): boolean {
  if (!token) return false;
  const parts = token.split(':');
  if (parts.length !== 3) return false;
  const [tUserId, tTimestamp, tHmac] = parts;
  if (tUserId !== userId) return false;

  const raw = `${tUserId}:${tTimestamp}`;
  const expectedHmac = crypto.createHmac('sha256', VAULT_SECRET_KEY).update(raw).digest('hex');
  if (tHmac !== expectedHmac) return false;

  // Valid for 2 hours maximum per unlock session
  const ageMs = Date.now() - Number(tTimestamp);
  return ageMs >= 0 && ageMs <= 2 * 60 * 60 * 1000;
}

export class VaultService {
  public static async get2FAStatus(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorEnabled: true, twoFactorSecret: true },
    });
    return {
      enabled: Boolean(user?.twoFactorEnabled && user?.twoFactorSecret),
    };
  }

  public static async setup2FA(userId: string, email: string) {
    const secret = generateSecret(20);
    const otpAuthUrl = getOtpAuthUrl('PersonalLibrary Vault', email, secret);
    const qrCodeDataUrl = await generateQrCodeDataUrl(otpAuthUrl);

    // Save temporary secret to user until verified
    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret, twoFactorEnabled: false },
    });

    return {
      secret,
      qrCodeDataUrl,
      otpAuthUrl,
    };
  }

  public static async verify2FA(userId: string, token: string, meta?: { ip?: string; userAgent?: string }) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorSecret: true, twoFactorEnabled: true, username: true, email: true, name: true },
    });

    if (!user?.twoFactorSecret) {
      const err: any = new Error('Google Authenticator has not been initialized for this account.');
      err.statusCode = 400;
      err.code = 'TWO_FACTOR_NOT_INITIALIZED';
      throw err;
    }

    const isValid = verifyTOTP(token, user.twoFactorSecret, 2, 30);
    if (!isValid) {
      await ActivityService.log({
        userId,
        action: 'VAULT_UNLOCK_FAILED',
        resourceType: 'VAULT',
        metadata: {
          username: user.username,
          reason: 'Invalid 6-digit Authenticator code',
        },
        ipAddress: meta?.ip,
        userAgent: meta?.userAgent,
      });

      const err: any = new Error('Invalid 6-digit code. Please verify your Google Authenticator app and try again.');
      err.statusCode = 401;
      err.code = 'INVALID_TOTP';
      throw err;
    }

    if (!user.twoFactorEnabled) {
      await prisma.user.update({
        where: { id: userId },
        data: { twoFactorEnabled: true },
      });
    }

    const vaultSessionToken = createVaultSessionToken(userId);

    await ActivityService.log({
      userId,
      action: 'VAULT_OPEN',
      resourceType: 'VAULT',
      metadata: {
        username: user.username,
        name: user.name,
        message: 'Secure Vault space unlocked & opened via Google Authenticator 2FA',
        unlockedAt: new Date().toISOString(),
      },
      ipAddress: meta?.ip,
      userAgent: meta?.userAgent,
    });

    return {
      verified: true,
      vaultSessionToken,
    };
  }

  public static async lockVault(userId: string, meta?: { ip?: string; userAgent?: string }) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { username: true, name: true },
    });

    await ActivityService.log({
      userId,
      action: 'VAULT_CLOSE',
      resourceType: 'VAULT',
      metadata: {
        username: user?.username,
        name: user?.name,
        message: 'Secure Vault space exited & locked',
        lockedAt: new Date().toISOString(),
      },
      ipAddress: meta?.ip,
      userAgent: meta?.userAgent,
    });

    return { success: true, message: 'Vault space locked.' };
  }

  public static async disable2FA(userId: string, token: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorSecret: true },
    });

    if (!user?.twoFactorSecret) {
      return { success: true };
    }

    const isValid = verifyTOTP(token, user.twoFactorSecret, 2, 30);
    if (!isValid) {
      const err: any = new Error('Invalid 6-digit code. Cannot disable 2FA.');
      err.statusCode = 401;
      err.code = 'INVALID_TOTP';
      throw err;
    }

    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: null, twoFactorEnabled: false },
    });

    return { success: true };
  }

  // Folder Operations
  public static async listFolders(userId: string) {
    const folders = await prisma.vaultFolder.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        color: true,
        icon: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            cells: true,
            files: { where: { deletedAt: null } },
          },
        },
      },
    });

    return folders.map((f) => ({
      id: f.id,
      name: f.name,
      description: f.description,
      color: f.color || '#3b82f6',
      icon: f.icon || 'folder',
      createdAt: f.createdAt,
      updatedAt: f.updatedAt,
      cellCount: f._count.cells,
      fileCount: f._count.files,
      isLocked: true,
    }));
  }

  public static async createFolder(
    userId: string,
    data: { name: string; password: string; description?: string; color?: string; icon?: string }
  ) {
    if (!data.name?.trim()) {
      const err: any = new Error('Folder name is required.');
      err.statusCode = 400;
      throw err;
    }

    if (!data.password || data.password.length < 4) {
      const err: any = new Error('Folder password must be at least 4 characters.');
      err.statusCode = 400;
      throw err;
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const folder = await prisma.vaultFolder.create({
      data: {
        userId,
        name: data.name.trim(),
        passwordHash,
        description: data.description?.trim() || null,
        color: data.color || '#3b82f6',
        icon: data.icon || 'folder',
      },
      select: {
        id: true,
        name: true,
        description: true,
        color: true,
        icon: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await ActivityService.log({
      userId,
      action: 'VAULT_FOLDER_CREATE',
      resourceType: 'VAULT_FOLDER',
      resourceId: folder.id,
      metadata: {
        folderName: folder.name,
        color: folder.color,
        icon: folder.icon,
      },
    });

    return {
      ...folder,
      cellCount: 0,
      fileCount: 0,
      isLocked: true,
    };
  }

  public static async unlockFolder(userId: string, folderId: string, password: string) {
    const folder = await prisma.vaultFolder.findFirst({
      where: { id: folderId, userId },
      include: {
        cells: {
          orderBy: { createdAt: 'desc' },
        },
        files: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          include: {
            favorites: { where: { userId }, select: { id: true } },
          },
        },
      },
    });

    if (!folder) {
      const err: any = new Error('Vault folder not found.');
      err.statusCode = 404;
      throw err;
    }

    const isMatch = await bcrypt.compare(password, folder.passwordHash);
    if (!isMatch) {
      await ActivityService.log({
        userId,
        action: 'VAULT_FOLDER_UNLOCK_FAILED',
        resourceType: 'VAULT_FOLDER',
        resourceId: folderId,
        metadata: {
          folderName: folder.name,
          reason: 'Incorrect folder password',
        },
      });

      const err: any = new Error('Incorrect password for this folder.');
      err.statusCode = 401;
      err.code = 'INVALID_FOLDER_PASSWORD';
      throw err;
    }

    await ActivityService.log({
      userId,
      action: 'VAULT_FOLDER_UNLOCK',
      resourceType: 'VAULT_FOLDER',
      resourceId: folder.id,
      metadata: {
        folderName: folder.name,
        cellCount: folder.cells.length,
        fileCount: folder.files.length,
        unlockedAt: new Date().toISOString(),
      },
    });

    return {
      unlocked: true,
      folder: {
        id: folder.id,
        name: folder.name,
        description: folder.description,
        color: folder.color,
        icon: folder.icon,
        createdAt: folder.createdAt,
        updatedAt: folder.updatedAt,
      },
      cells: folder.cells.map((c) => ({
        id: c.id,
        folderId: c.folderId,
        title: c.title,
        url: c.url,
        notes: c.notes,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      })),
      files: folder.files.map((f) => FileService.serializeFile(f, userId)),
    };
  }

  public static async updateFolder(
    userId: string,
    folderId: string,
    data: {
      name?: string;
      description?: string;
      color?: string;
      icon?: string;
      currentPassword?: string;
      newPassword?: string;
    }
  ) {
    const folder = await prisma.vaultFolder.findFirst({
      where: { id: folderId, userId },
    });

    if (!folder) {
      const err: any = new Error('Vault folder not found.');
      err.statusCode = 404;
      throw err;
    }

    const updateData: any = {};
    if (data.name?.trim()) updateData.name = data.name.trim();
    if (data.description !== undefined) updateData.description = data.description?.trim() || null;
    if (data.color) updateData.color = data.color;
    if (data.icon) updateData.icon = data.icon;

    if (data.newPassword) {
      if (!data.currentPassword) {
        const err: any = new Error('Current password is required to change folder password.');
        err.statusCode = 400;
        throw err;
      }
      const isMatch = await bcrypt.compare(data.currentPassword, folder.passwordHash);
      if (!isMatch) {
        const err: any = new Error('Current password is incorrect.');
        err.statusCode = 401;
        throw err;
      }
      if (data.newPassword.length < 4) {
        const err: any = new Error('New password must be at least 4 characters.');
        err.statusCode = 400;
        throw err;
      }
      updateData.passwordHash = await bcrypt.hash(data.newPassword, 10);
    }

    const updated = await prisma.vaultFolder.update({
      where: { id: folderId },
      data: updateData,
      select: {
        id: true,
        name: true,
        description: true,
        color: true,
        icon: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await ActivityService.log({
      userId,
      action: 'VAULT_FOLDER_UPDATE',
      resourceType: 'VAULT_FOLDER',
      resourceId: folderId,
      metadata: {
        folderName: updated.name,
        passwordChanged: !!data.newPassword,
      },
    });

    return updated;
  }

  public static async deleteFolder(userId: string, folderId: string) {
    const folder = await prisma.vaultFolder.findFirst({
      where: { id: folderId, userId },
    });

    if (!folder) {
      const err: any = new Error('Vault folder not found.');
      err.statusCode = 404;
      throw err;
    }

    await prisma.vaultFolder.delete({
      where: { id: folderId },
    });

    await ActivityService.log({
      userId,
      action: 'VAULT_FOLDER_DELETE',
      resourceType: 'VAULT_FOLDER',
      resourceId: folderId,
      metadata: {
        folderName: folder.name,
      },
    });

    return { success: true };
  }

  // Cell (Link) Operations
  public static async createCell(
    userId: string,
    folderId: string,
    data: { url: string; title?: string; notes?: string }
  ) {
    const folder = await prisma.vaultFolder.findFirst({
      where: { id: folderId, userId },
    });

    if (!folder) {
      const err: any = new Error('Vault folder not found.');
      err.statusCode = 404;
      throw err;
    }

    if (!data.url?.trim()) {
      const err: any = new Error('URL is required.');
      err.statusCode = 400;
      throw err;
    }

    let cleanUrl = data.url.trim();
    if (!/^https?:\/\//i.test(cleanUrl)) {
      cleanUrl = `https://${cleanUrl}`;
    }

    let title = data.title?.trim();
    if (!title) {
      try {
        const parsed = new URL(cleanUrl);
        title = parsed.hostname.replace(/^www\./i, '');
      } catch {
        title = cleanUrl;
      }
    }

    const cell = await prisma.vaultCell.create({
      data: {
        folderId,
        userId,
        url: cleanUrl,
        title,
        notes: data.notes?.trim() || null,
      },
    });

    await ActivityService.log({
      userId,
      action: 'VAULT_CELL_CREATE',
      resourceType: 'VAULT_CELL',
      resourceId: cell.id,
      metadata: {
        title: cell.title,
        url: cell.url,
        folderId,
        folderName: folder.name,
      },
    });

    return cell;
  }

  public static async updateCell(
    userId: string,
    cellId: string,
    data: { url?: string; title?: string; notes?: string }
  ) {
    const cell = await prisma.vaultCell.findFirst({
      where: { id: cellId, userId },
      include: { folder: { select: { name: true } } },
    });

    if (!cell) {
      const err: any = new Error('Link cell not found.');
      err.statusCode = 404;
      throw err;
    }

    const updateData: any = {};
    if (data.url?.trim()) {
      let cleanUrl = data.url.trim();
      if (!/^https?:\/\//i.test(cleanUrl)) {
        cleanUrl = `https://${cleanUrl}`;
      }
      updateData.url = cleanUrl;
    }
    if (data.title !== undefined) updateData.title = data.title.trim() || cell.title;
    if (data.notes !== undefined) updateData.notes = data.notes?.trim() || null;

    const updated = await prisma.vaultCell.update({
      where: { id: cellId },
      data: updateData,
    });

    await ActivityService.log({
      userId,
      action: 'VAULT_CELL_UPDATE',
      resourceType: 'VAULT_CELL',
      resourceId: cellId,
      metadata: {
        title: updated.title,
        url: updated.url,
        folderName: cell.folder?.name,
      },
    });

    return updated;
  }

  public static async deleteCell(userId: string, cellId: string) {
    const cell = await prisma.vaultCell.findFirst({
      where: { id: cellId, userId },
      include: { folder: { select: { name: true } } },
    });

    if (!cell) {
      const err: any = new Error('Link cell not found.');
      err.statusCode = 404;
      throw err;
    }

    await prisma.vaultCell.delete({
      where: { id: cellId },
    });

    await ActivityService.log({
      userId,
      action: 'VAULT_CELL_DELETE',
      resourceType: 'VAULT_CELL',
      resourceId: cellId,
      metadata: {
        title: cell.title,
        url: cell.url,
        folderName: cell.folder?.name,
      },
    });

    return { success: true };
  }

  public static async detectVideo(rawUrl: string): Promise<{
    hasVideo: boolean;
    videoType?: 'youtube' | 'vimeo' | 'dailymotion' | 'direct' | 'stream';
    videoUrl?: string;
    embedUrl?: string;
    videoId?: string;
  }> {
    if (!rawUrl || typeof rawUrl !== 'string') {
      return { hasVideo: false };
    }

    let url = rawUrl.trim();
    if (!/^https?:\/\//i.test(url)) {
      url = `https://${url}`;
    }

    // 1. Direct YouTube Check
    const ytMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=|shorts\/)|youtu\.be\/)([^"&?\/\s]{11})/i);
    if (ytMatch) {
      const videoId = ytMatch[1];
      return {
        hasVideo: true,
        videoType: 'youtube',
        videoId,
        embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?start=0&end=10&autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=1`,
        videoUrl: url,
      };
    }

    // 2. Direct Vimeo Check
    const vimeoMatch = url.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)/i);
    if (vimeoMatch) {
      const videoId = vimeoMatch[3];
      return {
        hasVideo: true,
        videoType: 'vimeo',
        videoId,
        embedUrl: `https://player.vimeo.com/video/${videoId}?autoplay=1&muted=1&loop=1#t=0s`,
        videoUrl: url,
      };
    }

    // 3. Direct Dailymotion Check
    const dailyMatch = url.match(/(?:dailymotion\.com\/(?:video|hub)\/|dai\.ly\/)([0-9a-zA-Z]+)/i);
    if (dailyMatch) {
      const videoId = dailyMatch[1];
      return {
        hasVideo: true,
        videoType: 'dailymotion',
        videoId,
        embedUrl: `https://www.dailymotion.com/embed/video/${videoId}?autoplay=1&mute=1`,
        videoUrl: url,
      };
    }

    // 4. Direct video file extension check (.mp4, .webm, .ogg, etc.)
    if (/\.(mp4|webm|ogg|mov|m4v|mkv)(\?.*)?$/i.test(url)) {
      return {
        hasVideo: true,
        videoType: 'direct',
        videoUrl: url,
      };
    }

    // 5. Arbitrary Webpage Check: Inspect OpenGraph and HTML5 video metadata
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml',
        },
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        return { hasVideo: false };
      }

      // Read up to first 256KB to avoid downloading huge streams/files
      const reader = res.body?.getReader();
      let html = '';
      if (reader) {
        let bytesRead = 0;
        const maxBytes = 256 * 1024;
        while (bytesRead < maxBytes) {
          const { done, value } = await reader.read();
          if (done) break;
          bytesRead += value.length;
          html += new TextDecoder('utf-8').decode(value, { stream: true });
        }
        reader.cancel();
      } else {
        html = await res.text();
      }

      // Check for embedded youtube/vimeo iframes in the webpage
      const iframeYtMatch = html.match(/<iframe[^>]*\bsrc=["'](?:https?:)?\/\/www\.youtube(?:-nocookie)?\.com\/embed\/([^"'\?]+)/i);
      if (iframeYtMatch) {
        const videoId = iframeYtMatch[1];
        return {
          hasVideo: true,
          videoType: 'youtube',
          videoId,
          embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?start=0&end=10&autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=1`,
          videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
        };
      }

      const iframeVimeoMatch = html.match(/<iframe[^>]*\bsrc=["'](?:https?:)?\/\/player\.vimeo\.com\/video\/([0-9]+)/i);
      if (iframeVimeoMatch) {
        const videoId = iframeVimeoMatch[1];
        return {
          hasVideo: true,
          videoType: 'vimeo',
          videoId,
          embedUrl: `https://player.vimeo.com/video/${videoId}?autoplay=1&muted=1&loop=1#t=0s`,
          videoUrl: `https://vimeo.com/${videoId}`,
        };
      }

      // Check for og:video tags
      const ogVideoMatch = html.match(/<meta\s+[^>]*property=["'](?:og:video|og:video:url|og:video:secure_url)["']\s+[^>]*content=["']([^"']+)["']/i)
        || html.match(/<meta\s+[^>]*content=["']([^"']+)["']\s+[^>]*property=["'](?:og:video|og:video:url|og:video:secure_url)["']/i);
      
      // Check for twitter:player
      const twitterMatch = html.match(/<meta\s+[^>]*name=["'](?:twitter:player:stream|twitter:player)["']\s+[^>]*content=["']([^"']+)["']/i)
        || html.match(/<meta\s+[^>]*content=["']([^"']+)["']\s+[^>]*name=["'](?:twitter:player:stream|twitter:player)["']/i);

      // Check for embedded <video src="..."> or <source src="...">
      const videoTagMatch = html.match(/<video[^>]*\bsrc=["']([^"']+)["']/i)
        || html.match(/<source[^>]*\bsrc=["']([^"']+)["'][^>]*type=["']video\//i);

      let detectedUrl = ogVideoMatch?.[1] || twitterMatch?.[1] || videoTagMatch?.[1];
      if (detectedUrl) {
        try {
          detectedUrl = new URL(detectedUrl, url).href;
        } catch {
          // keep as is
        }

        // Check if detectedUrl is YouTube
        const subYt = detectedUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=|shorts\/)|youtu\.be\/)([^"&?\/\s]{11})/i);
        if (subYt) {
          const videoId = subYt[1];
          return {
            hasVideo: true,
            videoType: 'youtube',
            videoId,
            embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?start=0&end=10&autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=1`,
            videoUrl: detectedUrl,
          };
        }

        if (/\.(mp4|webm|ogg|mov|m4v|mkv)(\?.*)?$/i.test(detectedUrl)) {
          return {
            hasVideo: true,
            videoType: 'direct',
            videoUrl: detectedUrl,
          };
        }

        return {
          hasVideo: true,
          videoType: 'stream',
          videoUrl: detectedUrl,
        };
      }

      return { hasVideo: false };
    } catch {
      return { hasVideo: false };
    }
  }

  /**
   * Upload private files into a specific vault folder
   */
  public static async uploadFolderFiles(
    user: AuthUser,
    folderId: string,
    files: UploadFileItem[]
  ) {
    const folder = await prisma.vaultFolder.findFirst({
      where: { id: folderId, userId: user.id },
    });
    if (!folder) {
      const err: any = new Error('Vault folder not found.');
      err.statusCode = 404;
      throw err;
    }

    const uploaded = [];
    for (const file of files) {
      const saved = await FileService.uploadFile(
        user,
        file,
        null,
        { isSecret: true, vaultFolderId: folderId }
      );
      uploaded.push(saved);
    }

    await ActivityService.log({
      userId: user.id,
      action: 'VAULT_FILES_UPLOAD',
      resourceType: 'VAULT_FOLDER',
      resourceId: folderId,
      metadata: {
        folderName: folder.name,
        uploadedCount: files.length,
      },
    });

    return uploaded;
  }

  /**
   * Get all secret files in a vault folder
   */
  public static async getFolderFiles(userId: string, folderId: string) {
    const folder = await prisma.vaultFolder.findFirst({
      where: { id: folderId, userId },
    });
    if (!folder) {
      const err: any = new Error('Vault folder not found.');
      err.statusCode = 404;
      throw err;
    }

    const files = await prisma.file.findMany({
      where: {
        userId,
        vaultFolderId: folderId,
        isSecret: true,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        favorites: { where: { userId }, select: { id: true } },
      },
    });

    return files.map((f) => FileService.serializeFile(f, userId));
  }

  /**
   * Delete a secret file from vault folder
   */
  public static async deleteSecretFile(user: AuthUser, fileId: string) {
    const file = await prisma.file.findFirst({
      where: { id: fileId, userId: user.id, isSecret: true },
    });
    if (!file) {
      const err: any = new Error('Secret file not found.');
      err.statusCode = 404;
      throw err;
    }

    return FileService.permanentDelete(fileId, user);
  }
}
