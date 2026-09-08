import { prisma } from '../database/prisma';
import { hashPassword, comparePassword, generateSecureToken, hashToken } from '../utils/security';
import { config } from '../config';
import { AuthUser } from '../types';
import { ActivityService } from './activity.service';
import { StorageFactory } from '../storage/StorageFactory';
import { parseUserAgent, formatIpLocation } from '../utils/deviceParser';
import path from 'path';

export interface RegisterDto {
  name: string;
  username: string;
  email: string;
  password: string;
  mobileNumber?: string | null;
  gender?: string | null;
  dob?: string | null;
  country?: string | null;
  state?: string | null;
  district?: string | null;
  village?: string | null;
  pincode?: string | null;
  occupation?: string | null;
}

export interface LoginDto {
  identifier: string;
  password: string;
}

export class AuthService {
  public static generateSecurityPin(): string {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  public static formatUser(user: {
    id: string;
    email: string;
    username: string;
    name: string;
    avatarUrl?: string | null;
    securityPin?: string | null;
    mobileNumber?: string | null;
    gender?: string | null;
    dob?: Date | string | null;
    country?: string | null;
    state?: string | null;
    district?: string | null;
    village?: string | null;
    pincode?: string | null;
    occupation?: string | null;
    role: any;
    isActive: boolean;
    updatedAt?: Date | string;
  }): AuthUser {
    let formattedAvatarUrl: string | null = null;
    if (user.avatarUrl) {
      const timestamp = user.updatedAt ? new Date(user.updatedAt).getTime() : Date.now();
      if (
        user.avatarUrl.startsWith('http://') ||
        user.avatarUrl.startsWith('https://')
      ) {
        formattedAvatarUrl = user.avatarUrl;
      } else if (user.avatarUrl.startsWith('/api/')) {
        formattedAvatarUrl = user.avatarUrl.includes('?') ? user.avatarUrl : `${user.avatarUrl}?t=${timestamp}`;
      } else {
        formattedAvatarUrl = `/api/auth/avatar/${user.id}?t=${timestamp}`;
      }
    }

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
      avatarUrl: formattedAvatarUrl,
      securityPin: user.securityPin || null,
      role: user.role,
      isActive: user.isActive,
      mobileNumber: user.mobileNumber || null,
      gender: user.gender || null,
      dob: user.dob ? (typeof user.dob === 'string' ? user.dob : user.dob.toISOString()) : null,
      country: user.country || null,
      state: user.state || null,
      district: user.district || null,
      village: user.village || null,
      pincode: user.pincode || null,
      occupation: user.occupation || null,
    };
  }

  public static async register(
    data: RegisterDto,
    meta?: { ip?: string; userAgent?: string }
  ): Promise<{ user: AuthUser; token: string; expiresAt: Date; securityPin: string }> {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: data.email.toLowerCase().trim() },
          { username: data.username.toLowerCase().trim() },
        ],
      },
    });

    if (existingUser) {
      if (existingUser.email.toLowerCase() === data.email.toLowerCase().trim()) {
        const err: any = new Error('An account with this email already exists.');
        err.statusCode = 409;
        err.code = 'EMAIL_EXISTS';
        throw err;
      }
      const err: any = new Error('Username is already taken.');
      err.statusCode = 409;
      err.code = 'USERNAME_EXISTS';
      throw err;
    }

    const passwordHash = await hashPassword(data.password);

    // If first user, make ADMIN, otherwise USER
    const userCount = await prisma.user.count();
    const role = userCount === 0 ? 'ADMIN' : 'USER';
    const securityPin = this.generateSecurityPin();

    const user = await prisma.user.create({
      data: {
        name: data.name.trim(),
        username: data.username.toLowerCase().trim(),
        email: data.email.toLowerCase().trim(),
        passwordHash,
        securityPin,
        role,
        isActive: true,
        lastLoginAt: new Date(),
        mobileNumber: data.mobileNumber?.trim() || null,
        gender: data.gender?.trim() || null,
        dob: data.dob ? new Date(data.dob) : null,
        country: data.country?.trim() || null,
        state: data.state?.trim() || null,
        district: data.district?.trim() || null,
        village: data.village?.trim() || null,
        pincode: data.pincode?.trim() || null,
        occupation: data.occupation?.trim() || null,
      },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        avatarUrl: true,
        securityPin: true,
        role: true,
        isActive: true,
        mobileNumber: true,
        gender: true,
        dob: true,
        country: true,
        state: true,
        district: true,
        village: true,
        pincode: true,
        occupation: true,
      },
    });

    const { token, expiresAt } = await this.createSession(user.id, meta);

    await ActivityService.log({
      userId: user.id,
      action: 'REGISTER',
      resourceType: 'USER',
      resourceId: user.id,
      metadata: {
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        mobileNumber: user.mobileNumber || null,
        gender: user.gender || null,
        dob: user.dob ? user.dob.toISOString().split('T')[0] : null,
        country: user.country || null,
        state: user.state || null,
        district: user.district || null,
        village: user.village || null,
        pincode: user.pincode || null,
        occupation: user.occupation || null,
        securityPinAssigned: !!securityPin,
        registeredAt: new Date().toISOString(),
      },
      ipAddress: meta?.ip,
      userAgent: meta?.userAgent,
    });

    return { user: this.formatUser(user), token, expiresAt, securityPin };
  }

  public static async regeneratePin(userId: string): Promise<string> {
    const newPin = this.generateSecurityPin();
    await prisma.user.update({
      where: { id: userId },
      data: { securityPin: newPin },
    });

    await ActivityService.log({
      userId,
      action: 'PIN_REGENERATE',
      resourceType: 'USER',
      resourceId: userId,
      metadata: { message: 'Security PIN regenerated' },
    });

    return newPin;
  }

  public static async login(
    data: LoginDto,
    meta?: { ip?: string; userAgent?: string }
  ): Promise<{ user: AuthUser; token: string; expiresAt: Date }> {
    const identifier = data.identifier.toLowerCase().trim();

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { username: identifier }],
      },
    });

    if (!user) {
      await ActivityService.log({
        action: 'LOGIN_FAILED',
        resourceType: 'USER',
        metadata: {
          attemptedIdentifier: identifier,
          reason: 'User account not found',
        },
        ipAddress: meta?.ip,
        userAgent: meta?.userAgent,
      });

      const err: any = new Error('Invalid email/username or password.');
      err.statusCode = 401;
      err.code = 'INVALID_CREDENTIALS';
      throw err;
    }

    if (!user.isActive) {
      await ActivityService.log({
        userId: user.id,
        action: 'LOGIN_FAILED',
        resourceType: 'USER',
        resourceId: user.id,
        metadata: {
          attemptedIdentifier: identifier,
          reason: 'Account is disabled',
        },
        ipAddress: meta?.ip,
        userAgent: meta?.userAgent,
      });

      const err: any = new Error('Account is disabled. Please contact an administrator.');
      err.statusCode = 403;
      err.code = 'ACCOUNT_DISABLED';
      throw err;
    }

    const isValidPassword = await comparePassword(data.password, user.passwordHash);
    if (!isValidPassword) {
      await ActivityService.log({
        userId: user.id,
        action: 'LOGIN_FAILED',
        resourceType: 'USER',
        resourceId: user.id,
        metadata: {
          attemptedIdentifier: identifier,
          username: user.username,
          email: user.email,
          reason: 'Incorrect password',
        },
        ipAddress: meta?.ip,
        userAgent: meta?.userAgent,
      });

      const err: any = new Error('Invalid email/username or password.');
      err.statusCode = 401;
      err.code = 'INVALID_CREDENTIALS';
      throw err;
    }

    let securityPin = user.securityPin;
    if (!securityPin) {
      securityPin = this.generateSecurityPin();
      user.securityPin = securityPin;
      await prisma.user.update({
        where: { id: user.id },
        data: { securityPin, lastLoginAt: new Date() },
      });
    } else {
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });
    }

    const { token, expiresAt } = await this.createSession(user.id, meta);

    await ActivityService.log({
      userId: user.id,
      action: 'LOGIN',
      resourceType: 'USER',
      resourceId: user.id,
      metadata: {
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        authMethod: 'Password',
        loginTime: new Date().toISOString(),
      },
      ipAddress: meta?.ip,
      userAgent: meta?.userAgent,
    });

    return {
      user: this.formatUser(user),
      token,
      expiresAt,
    };
  }

  public static async createSession(
    userId: string,
    meta?: { ip?: string; userAgent?: string }
  ): Promise<{ token: string; expiresAt: Date }> {
    const rawToken = generateSecureToken();
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + config.session.maxAgeDays);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { state: true, district: true, village: true },
    });
    const userLocation = user?.village || user?.district || user?.state || null;

    const parsedDevice = parseUserAgent(meta?.userAgent);
    const ipAddress = meta?.ip ? meta.ip.replace(/^::ffff:/, '') : '127.0.0.1';
    const location = formatIpLocation(ipAddress, userLocation);

    await prisma.session.create({
      data: {
        userId,
        tokenHash,
        deviceName: parsedDevice.deviceName,
        browser: parsedDevice.browser,
        os: parsedDevice.os,
        deviceType: parsedDevice.deviceType,
        ipAddress,
        location,
        userAgent: meta?.userAgent ? meta.userAgent.slice(0, 500) : null,
        expiresAt,
      },
    });

    return { token: rawToken, expiresAt };
  }

  public static async logout(
    sessionId?: string,
    userId?: string,
    meta?: { ip?: string; userAgent?: string }
  ): Promise<void> {
    if (sessionId) {
      await prisma.session.delete({ where: { id: sessionId } }).catch(() => {});
    }

    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { username: true, email: true, name: true },
      });

      await ActivityService.log({
        userId,
        action: 'LOGOUT',
        resourceType: 'USER',
        resourceId: userId,
        metadata: {
          username: user?.username,
          email: user?.email,
          name: user?.name,
          logoutTime: new Date().toISOString(),
        },
        ipAddress: meta?.ip,
        userAgent: meta?.userAgent,
      });
    }
  }

  public static async updateProfile(
    userId: string,
    data: {
      name?: string;
      mobileNumber?: string | null;
      gender?: string | null;
      dob?: string | null;
      country?: string | null;
      state?: string | null;
      district?: string | null;
      village?: string | null;
      pincode?: string | null;
      occupation?: string | null;
      currentPassword?: string;
      newPassword?: string;
    }
  ): Promise<AuthUser> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      const err: any = new Error('User not found.');
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.mobileNumber !== undefined) updateData.mobileNumber = data.mobileNumber?.trim() || null;
    if (data.gender !== undefined) updateData.gender = data.gender?.trim() || null;
    if (data.dob !== undefined) updateData.dob = data.dob ? new Date(data.dob) : null;
    if (data.country !== undefined) updateData.country = data.country?.trim() || null;
    if (data.state !== undefined) updateData.state = data.state?.trim() || null;
    if (data.district !== undefined) updateData.district = data.district?.trim() || null;
    if (data.village !== undefined) updateData.village = data.village?.trim() || null;
    if (data.pincode !== undefined) updateData.pincode = data.pincode?.trim() || null;
    if (data.occupation !== undefined) updateData.occupation = data.occupation?.trim() || null;

    if (data.newPassword) {
      if (!data.currentPassword) {
        const err: any = new Error('Current password is required to set a new password.');
        err.statusCode = 400;
        err.code = 'MISSING_PASSWORD';
        throw err;
      }

      const isMatch = await comparePassword(data.currentPassword, user.passwordHash);
      if (!isMatch) {
        const err: any = new Error('Incorrect current password.');
        err.statusCode = 400;
        err.code = 'INVALID_CURRENT_PASSWORD';
        throw err;
      }

      updateData.passwordHash = await hashPassword(data.newPassword);
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        avatarUrl: true,
        securityPin: true,
        role: true,
        isActive: true,
        mobileNumber: true,
        gender: true,
        dob: true,
        country: true,
        state: true,
        district: true,
        village: true,
        pincode: true,
        occupation: true,
      },
    });

    await ActivityService.log({
      userId,
      action: 'USER_UPDATE',
      resourceType: 'USER',
      resourceId: userId,
      metadata: {
        username: updated.username,
        updatedFields: Object.keys(updateData).filter((k) => k !== 'passwordHash'),
        passwordChanged: !!data.newPassword,
      },
    });

    return this.formatUser(updated);
  }

  public static async uploadAvatar(
    userId: string,
    file: Express.Multer.File
  ): Promise<AuthUser> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      const err: any = new Error('User not found.');
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    const storage = StorageFactory.getStorage();
    if (user.avatarUrl) {
      await storage.delete(user.avatarUrl).catch(() => {});
    }

    const saved = await storage.save(file.buffer, {
      userId,
      category: 'avatars',
      originalName: file.originalname,
      mimeType: file.mimetype,
    });

    // Update user record with avatar storage key
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: saved.storageKey },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        avatarUrl: true,
        securityPin: true,
        role: true,
        isActive: true,
        mobileNumber: true,
        gender: true,
        dob: true,
        country: true,
        state: true,
        district: true,
        village: true,
        pincode: true,
        occupation: true,
      },
    });

    await ActivityService.log({
      userId,
      action: 'AVATAR_UPLOAD',
      resourceType: 'USER',
      resourceId: userId,
    });

    return this.formatUser(updated);
  }

  public static async removeAvatar(userId: string): Promise<AuthUser> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      const err: any = new Error('User not found.');
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    if (user.avatarUrl) {
      const storage = StorageFactory.getStorage();
      await storage.delete(user.avatarUrl).catch(() => {});
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: null },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        avatarUrl: true,
        securityPin: true,
        role: true,
        isActive: true,
        mobileNumber: true,
        gender: true,
        dob: true,
        country: true,
        state: true,
        district: true,
        village: true,
        pincode: true,
        occupation: true,
      },
    });

    await ActivityService.log({
      userId,
      action: 'AVATAR_REMOVE',
      resourceType: 'USER',
      resourceId: userId,
    });

    return this.formatUser(updated);
  }

  public static async getAvatarStream(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.avatarUrl) {
      const err: any = new Error('Avatar not found.');
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    const storage = StorageFactory.getStorage();
    const result = await storage.getReadStream(user.avatarUrl);

    const ext = path.extname(user.avatarUrl).toLowerCase();
    let mimeType = 'image/png';
    if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
    else if (ext === '.webp') mimeType = 'image/webp';
    else if (ext === '.gif') mimeType = 'image/gif';
    else if (ext === '.svg') mimeType = 'image/svg+xml';

    return {
      stream: result.stream,
      mimeType,
    };
  }

  public static async getUserSessions(userId: string, currentSessionId?: string | null) {
    const sessions = await prisma.session.findMany({
      where: { userId },
      orderBy: { lastUsedAt: 'desc' },
      select: {
        id: true,
        deviceName: true,
        browser: true,
        os: true,
        deviceType: true,
        ipAddress: true,
        location: true,
        createdAt: true,
        lastUsedAt: true,
        expiresAt: true,
      },
    });

    const now = Date.now();

    return sessions.map((s) => {
      const isCurrent = s.id === currentSessionId;
      const msSinceLastActive = now - new Date(s.lastUsedAt).getTime();

      let status: 'ONLINE' | 'ACTIVE_NOW' | 'IDLE' | 'OFFLINE' = 'OFFLINE';
      if (isCurrent) {
        status = 'ACTIVE_NOW';
      } else if (msSinceLastActive < 5 * 60 * 1000) {
        status = 'ONLINE';
      } else if (msSinceLastActive < 60 * 60 * 1000) {
        status = 'IDLE';
      }

      return {
        id: s.id,
        isCurrent,
        deviceName: s.deviceName || (s.os ? `${s.os} Device` : 'Web Browser Session'),
        browser: s.browser || 'Web Browser',
        os: s.os || 'Unknown OS',
        deviceType: s.deviceType || 'DESKTOP',
        ipAddress: s.ipAddress || '127.0.0.1',
        location: s.location || 'Local Network',
        status,
        createdAt: s.createdAt,
        lastUsedAt: s.lastUsedAt,
        expiresAt: s.expiresAt,
      };
    });
  }

  public static async revokeSession(userId: string, sessionId: string) {
    const session = await prisma.session.findFirst({
      where: { id: sessionId, userId },
    });
    if (!session) {
      throw new Error('Session not found or already revoked');
    }

    await prisma.session.delete({
      where: { id: sessionId },
    });

    await ActivityService.log({
      userId,
      action: 'SESSION_REVOKED',
      resourceType: 'SESSION',
      resourceId: sessionId,
      metadata: {
        deviceName: session.deviceName,
        browser: session.browser,
        ipAddress: session.ipAddress,
      },
    });

    return { success: true };
  }

  public static async revokeOtherSessions(userId: string, currentSessionId?: string | null) {
    if (!currentSessionId) {
      return { count: 0 };
    }
    const result = await prisma.session.deleteMany({
      where: {
        userId,
        id: { not: currentSessionId },
      },
    });

    await ActivityService.log({
      userId,
      action: 'ALL_OTHER_SESSIONS_REVOKED',
      resourceType: 'SESSION',
      metadata: { count: result.count },
    });

    return { count: result.count };
  }

  public static async revokeAllSessions(userId: string, currentSessionId?: string | null, includeCurrent = false) {
    const whereClause: any = { userId };
    if (!includeCurrent && currentSessionId) {
      whereClause.id = { not: currentSessionId };
    }

    const result = await prisma.session.deleteMany({
      where: whereClause,
    });

    await ActivityService.log({
      userId,
      action: includeCurrent ? 'ALL_SESSIONS_REVOKED_INCLUDING_CURRENT' : 'ALL_OTHER_SESSIONS_REVOKED',
      resourceType: 'SESSION',
      metadata: {
        count: result.count,
        includeCurrent,
      },
    });

    return { count: result.count };
  }
}
