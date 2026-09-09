import { prisma } from '../database/prisma';
import {
  hashPassword,
  comparePassword,
  generateSecureToken,
  hashToken,
  createSignedResetToken,
  verifySignedResetToken,
} from '../utils/security';
import { config } from '../config';
import { AuthUser } from '../types';
import { ActivityService } from './activity.service';
import { StorageFactory } from '../storage/StorageFactory';
import { parseUserAgent, formatIpLocation } from '../utils/deviceParser';
import path from 'path';

/**
 * Normalizes phone numbers to clean 10 digits (stripping non-digits, country code +91/91, and leading zeros)
 */
export function normalize10DigitPhone(phone: string | null | undefined): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits.slice(2);
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    return digits.slice(1);
  }
  if (digits.length >= 10) {
    return digits.slice(-10);
  }
  return digits;
}

/**
 * Normalizes a date into YYYY-MM-DD string regardless of timezone offset
 */
export function normalizeDateOnly(date: Date | string | null | undefined): string {
  if (!date) return '';
  if (typeof date === 'string') {
    const match = date.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (match) {
      const year = match[1];
      const month = match[2].padStart(2, '0');
      const day = match[3].padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    const parsed = new Date(date);
    if (isNaN(parsed.getTime())) return '';
    return parsed.toISOString().split('T')[0];
  }
  return date.toISOString().split('T')[0];
}

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

  /**
   * Challenge endpoint: verifies if account exists and has necessary DOB/Mobile details configured
   */
  public static async forgotPasswordChallenge(identifier: string) {
    const trimmed = identifier.toLowerCase().trim();
    if (!trimmed) {
      const err: any = new Error('Username or email is required.');
      err.statusCode = 400;
      throw err;
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: trimmed }, { username: trimmed }],
      },
      select: {
        id: true,
        username: true,
        name: true,
        dob: true,
        mobileNumber: true,
        isActive: true,
      },
    });

    if (!user) {
      const err: any = new Error('No user found matching this email or username.');
      err.statusCode = 404;
      err.code = 'USER_NOT_FOUND';
      throw err;
    }

    if (!user.isActive) {
      const err: any = new Error('This account has been disabled. Please contact your system administrator.');
      err.statusCode = 403;
      err.code = 'ACCOUNT_DISABLED';
      throw err;
    }

    if (!user.dob && !user.mobileNumber) {
      const err: any = new Error(
        'This account does not have a date of birth or mobile number saved in profile. Please contact an administrator to reset your password.'
      );
      err.statusCode = 400;
      err.code = 'VERIFICATION_NOT_POSSIBLE';
      throw err;
    }

    return {
      identifier: user.username,
      name: user.name,
      hasDob: !!user.dob,
      hasMobile: !!user.mobileNumber,
    };
  }

  /**
   * Verify identity by comparing saved Date of Birth and 10-digit mobile number (excluding +91)
   */
  public static async verifyPasswordResetChallenge(data: {
    identifier: string;
    dob: string;
    mobileNumber: string;
  }) {
    const trimmed = (data.identifier || '').toLowerCase().trim();
    const inputDob = normalizeDateOnly(data.dob);
    const inputPhone = normalize10DigitPhone(data.mobileNumber);

    if (!trimmed) {
      const err: any = new Error('Username or email is required.');
      err.statusCode = 400;
      throw err;
    }

    if (!inputDob) {
      const err: any = new Error('Please provide your date of birth.');
      err.statusCode = 400;
      throw err;
    }

    if (!inputPhone || inputPhone.length !== 10) {
      const err: any = new Error('Please enter a valid 10-digit mobile number.');
      err.statusCode = 400;
      throw err;
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: trimmed }, { username: trimmed }],
      },
      select: {
        id: true,
        username: true,
        name: true,
        dob: true,
        mobileNumber: true,
        isActive: true,
      },
    });

    if (!user) {
      const err: any = new Error('Account not found.');
      err.statusCode = 404;
      throw err;
    }

    if (!user.isActive) {
      const err: any = new Error('This account is disabled.');
      err.statusCode = 403;
      throw err;
    }

    const savedDob = normalizeDateOnly(user.dob);
    const savedPhone = normalize10DigitPhone(user.mobileNumber);

    const isDobValid = !!savedDob && savedDob === inputDob;
    const isPhoneValid = !!savedPhone && savedPhone === inputPhone;

    if (!isDobValid || !isPhoneValid) {
      let mismatch = 'Date of birth or mobile number is incorrect.';
      if (!isDobValid && !isPhoneValid) {
        mismatch = 'Both the date of birth and mobile number do not match our records.';
      } else if (!isDobValid) {
        mismatch = 'The date of birth entered does not match our saved records.';
      } else if (!isPhoneValid) {
        mismatch = 'The 10-digit mobile number entered does not match our saved records.';
      }

      const err: any = new Error(mismatch);
      err.statusCode = 400;
      err.code = 'VERIFICATION_FAILED';
      throw err;
    }

    // Generate signed reset token valid for 15 minutes
    const resetToken = createSignedResetToken(user.id, config.session.secret, 15);

    return {
      success: true,
      resetToken,
      username: user.username,
      name: user.name,
      message: 'Identity verified successfully. Please enter your new password.',
    };
  }

  /**
   * Reset password with the verified temporary reset token
   */
  public static async resetPasswordWithToken(data: {
    resetToken: string;
    newPassword: string;
  }) {
    if (!data.newPassword || data.newPassword.length < 6) {
      const err: any = new Error('New password must be at least 6 characters long.');
      err.statusCode = 400;
      throw err;
    }

    const verified = verifySignedResetToken(data.resetToken, config.session.secret);
    if (!verified || !verified.userId) {
      const err: any = new Error('Your reset session has expired or is invalid. Please verify your details again.');
      err.statusCode = 400;
      err.code = 'EXPIRED_RESET_TOKEN';
      throw err;
    }

    const user = await prisma.user.findUnique({
      where: { id: verified.userId },
      select: { id: true, username: true, email: true },
    });

    if (!user) {
      const err: any = new Error('User not found.');
      err.statusCode = 404;
      throw err;
    }

    const passwordHash = await hashPassword(data.newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    // Invalidate all existing active sessions for security
    await prisma.session.deleteMany({
      where: { userId: user.id },
    }).catch(() => {});

    await ActivityService.log({
      userId: user.id,
      action: 'PASSWORD_RESET',
      resourceType: 'USER',
      resourceId: user.id,
      metadata: {
        method: 'DOB_AND_MOBILE_VERIFICATION',
        username: user.username,
        resetTime: new Date().toISOString(),
      },
    });

    return {
      success: true,
      message: 'Your password has been reset successfully. Please log in with your new password.',
    };
  }
}
