import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../database/prisma';
import { generateSecret, verifyTOTP, getOtpAuthUrl, generateQrCodeDataUrl } from '../lib/totp';

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

  public static async verify2FA(userId: string, token: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorSecret: true, twoFactorEnabled: true },
    });

    if (!user?.twoFactorSecret) {
      const err: any = new Error('Google Authenticator has not been initialized for this account.');
      err.statusCode = 400;
      err.code = 'TWO_FACTOR_NOT_INITIALIZED';
      throw err;
    }

    const isValid = verifyTOTP(token, user.twoFactorSecret, 1, 30);
    if (!isValid) {
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
    return {
      verified: true,
      vaultSessionToken,
    };
  }

  public static async disable2FA(userId: string, token: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorSecret: true },
    });

    if (!user?.twoFactorSecret) {
      return { success: true };
    }

    const isValid = verifyTOTP(token, user.twoFactorSecret, 1, 30);
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
          select: { cells: true },
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

    return {
      ...folder,
      cellCount: 0,
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
      },
    });

    if (!folder) {
      const err: any = new Error('Vault folder not found.');
      err.statusCode = 404;
      throw err;
    }

    const isMatch = await bcrypt.compare(password, folder.passwordHash);
    if (!isMatch) {
      const err: any = new Error('Incorrect password for this folder.');
      err.statusCode = 401;
      err.code = 'INVALID_FOLDER_PASSWORD';
      throw err;
    }

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

    return cell;
  }

  public static async updateCell(
    userId: string,
    cellId: string,
    data: { url?: string; title?: string; notes?: string }
  ) {
    const cell = await prisma.vaultCell.findFirst({
      where: { id: cellId, userId },
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

    return updated;
  }

  public static async deleteCell(userId: string, cellId: string) {
    const cell = await prisma.vaultCell.findFirst({
      where: { id: cellId, userId },
    });

    if (!cell) {
      const err: any = new Error('Link cell not found.');
      err.statusCode = 404;
      throw err;
    }

    await prisma.vaultCell.delete({
      where: { id: cellId },
    });

    return { success: true };
  }
}
