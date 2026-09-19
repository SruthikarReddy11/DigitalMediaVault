import { prisma } from '../database/prisma';
import bcrypt from 'bcryptjs';
import { config } from '../config';
import { encryptNoteContent, decryptNoteContent } from '../utils/noteCrypto';
import { createSignedHiddenNotesToken, verifySignedHiddenNotesToken } from '../utils/security';
import { ActivityService } from './activity.service';

export interface CreateNoteInput {
  title: string;
  content?: string;
  tags?: string[];
  color?: string;
  isPinned?: boolean;
  isArchived?: boolean;
  isHidden?: boolean;
  isPasswordProtected?: boolean;
  password?: string;
  attachmentFileIds?: string[];
}

export interface UpdateNoteInput {
  title?: string;
  content?: string;
  tags?: string[];
  color?: string;
  isPinned?: boolean;
  isArchived?: boolean;
  isHidden?: boolean;
  // Password protection management
  enablePassword?: boolean;
  disablePassword?: boolean;
  currentPassword?: string;
  newPassword?: string;
  attachmentFileIds?: string[];
}

export interface NoteFilters {
  search?: string;
  tag?: string;
  isPinned?: boolean;
  isArchived?: boolean;
  color?: string;
}

// In-memory failed attempt tracker to rate-limit brute force attacks against individual notes
const failedAttemptsMap = new Map<string, { count: number; lockedUntil: number }>();

export class NoteService {
  /**
   * Serialize a note safely so encrypted content, password hashes, and salts are NEVER leaked.
   */
  private static serializeNote(note: any, isUnlocked = false, decryptedContent?: string) {
    if (!note) return null;

    const isLocked = note.isPasswordProtected && !isUnlocked;

    return {
      id: note.id,
      userId: note.userId,
      title: note.title,
      content: isLocked ? null : (isUnlocked && decryptedContent !== undefined ? decryptedContent : note.content),
      isPasswordProtected: note.isPasswordProtected,
      isLocked,
      isHidden: note.isHidden,
      isPinned: note.isPinned,
      isArchived: note.isArchived,
      color: note.color || '#8b5cf6',
      tags: note.tags || [],
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
      attachments: (note.attachments || []).map((att: any) => ({
        id: att.id,
        fileId: att.fileId,
        addedAt: att.addedAt,
        file: att.file
          ? {
              id: att.file.id,
              originalName: att.file.originalName,
              fileType: att.file.fileType,
              mimeType: att.file.mimeType,
              size: Number(att.file.size),
              extension: att.file.extension,
              streamUrl: `/api/files/${att.file.id}/stream`,
              thumbnailUrl:
                att.file.fileType === 'IMAGE'
                  ? `/api/files/${att.file.id}/thumbnail`
                  : undefined,
            }
          : null,
      })),
    };
  }

  /**
   * Unlock Hidden Notes section using the user's account password
   */
  public static async unlockHiddenNotes(userId: string, password: string, meta?: { ip?: string; userAgent?: string }) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, passwordHash: true },
    });

    if (!user) {
      const err: any = new Error('User not found.');
      err.statusCode = 404;
      throw err;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      await ActivityService.log({
        userId,
        action: 'HIDDEN_NOTES_UNLOCK_FAILED',
        resourceType: 'NOTE',
        metadata: { reason: 'Incorrect user password' },
        ipAddress: meta?.ip,
        userAgent: meta?.userAgent,
      });

      const err: any = new Error('Incorrect account password. Access to hidden notes denied.');
      err.statusCode = 401;
      err.code = 'INVALID_CREDENTIALS';
      throw err;
    }

    const token = createSignedHiddenNotesToken(userId, config.session.secret, 60);

    await ActivityService.log({
      userId,
      action: 'HIDDEN_NOTES_UNLOCKED',
      resourceType: 'NOTE',
      metadata: { message: 'Hidden notes vault unlocked' },
      ipAddress: meta?.ip,
      userAgent: meta?.userAgent,
    });

    return {
      success: true,
      token,
      expiresInMinutes: 60,
    };
  }

  /**
   * Verify token for hidden notes access
   */
  public static verifyHiddenNotesToken(userId: string, token?: string): boolean {
    if (!token) return false;
    const verified = verifySignedHiddenNotesToken(token, config.session.secret);
    return verified !== null && verified.userId === userId;
  }

  /**
   * Create a new note with optional AES-256-GCM encryption
   */
  public static async createNote(userId: string, input: CreateNoteInput, meta?: { ip?: string; userAgent?: string }) {
    if (!input.title?.trim()) {
      const err: any = new Error('Note title is required.');
      err.statusCode = 400;
      throw err;
    }

    let passwordHash: string | null = null;
    let encryptedContent: string | null = null;
    let encryptionIv: string | null = null;
    let encryptionTag: string | null = null;
    let encryptionSalt: string | null = null;
    let storedContent: string | null = input.content || '';

    if (input.isPasswordProtected) {
      if (!input.password || input.password.length < 4) {
        const err: any = new Error('Password for protected note must be at least 4 characters.');
        err.statusCode = 400;
        throw err;
      }

      passwordHash = await bcrypt.hash(input.password, 10);
      const enc = encryptNoteContent(storedContent, input.password);
      encryptedContent = enc.encryptedContent;
      encryptionIv = enc.encryptionIv;
      encryptionTag = enc.encryptionTag;
      encryptionSalt = enc.encryptionSalt;
      storedContent = null; // Do NOT store plaintext content in database
    }

    // Attachments validation
    let validFileIds: string[] = [];
    if (input.attachmentFileIds && input.attachmentFileIds.length > 0) {
      const userFiles = await prisma.file.findMany({
        where: { id: { in: input.attachmentFileIds }, userId, deletedAt: null },
        select: { id: true },
      });
      validFileIds = userFiles.map((f) => f.id);
    }

    const note = await prisma.note.create({
      data: {
        userId,
        title: input.title.trim(),
        content: storedContent,
        isPasswordProtected: !!input.isPasswordProtected,
        passwordHash,
        encryptedContent,
        encryptionIv,
        encryptionTag,
        encryptionSalt,
        isHidden: !!input.isHidden,
        isPinned: !!input.isPinned,
        isArchived: !!input.isArchived,
        color: input.color || '#8b5cf6',
        tags: input.tags || [],
        attachments: {
          create: validFileIds.map((fileId) => ({ fileId })),
        },
      },
      include: {
        attachments: {
          include: {
            file: true,
          },
        },
      },
    });

    await ActivityService.log({
      userId,
      action: 'NOTE_CREATED',
      resourceType: 'NOTE',
      resourceId: note.id,
      metadata: {
        title: note.title,
        isPasswordProtected: note.isPasswordProtected,
        isHidden: note.isHidden,
      },
      ipAddress: meta?.ip,
      userAgent: meta?.userAgent,
    });

    // If password-protected, the creator has the unlocked view in the response
    return this.serializeNote(note, !!input.isPasswordProtected, input.content || '');
  }

  /**
   * List normal (non-hidden) notes
   */
  public static async listNotes(userId: string, filters: NoteFilters = {}) {
    const where: any = {
      userId,
      isHidden: false, // Strict backend guarantee: hidden notes NEVER returned here
    };

    if (typeof filters.isPinned === 'boolean') {
      where.isPinned = filters.isPinned;
    }
    if (typeof filters.isArchived === 'boolean') {
      where.isArchived = filters.isArchived;
    } else {
      where.isArchived = false; // Default: show active notes unless requested
    }
    if (filters.color) {
      where.color = filters.color;
    }
    if (filters.tag) {
      where.tags = { has: filters.tag };
    }
    if (filters.search?.trim()) {
      const q = filters.search.trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { content: { contains: q, mode: 'insensitive' } },
        { tags: { has: q } },
      ];
    }

    const notes = await prisma.note.findMany({
      where,
      orderBy: [
        { isPinned: 'desc' },
        { updatedAt: 'desc' },
      ],
      include: {
        attachments: {
          include: {
            file: true,
          },
        },
      },
    });

    return notes.map((n) => this.serializeNote(n));
  }

  /**
   * List hidden notes (strictly requires authenticated hidden notes token)
   */
  public static async listHiddenNotes(userId: string, filters: NoteFilters = {}) {
    const where: any = {
      userId,
      isHidden: true,
    };

    if (filters.search?.trim()) {
      const q = filters.search.trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { content: { contains: q, mode: 'insensitive' } },
        { tags: { has: q } },
      ];
    }
    if (filters.tag) {
      where.tags = { has: filters.tag };
    }

    const notes = await prisma.note.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        attachments: {
          include: {
            file: true,
          },
        },
      },
    });

    return notes.map((n) => this.serializeNote(n));
  }

  /**
   * Get single note by ID
   */
  public static async getNoteById(userId: string, noteId: string, isHiddenUnlocked = false) {
    const note = await prisma.note.findFirst({
      where: { id: noteId, userId },
      include: {
        attachments: {
          include: {
            file: true,
          },
        },
      },
    });

    if (!note) {
      const err: any = new Error('Note not found.');
      err.statusCode = 404;
      throw err;
    }

    if (note.isHidden && !isHiddenUnlocked) {
      const err: any = new Error('This note is hidden. Please unlock the Hidden Notes vault first.');
      err.statusCode = 403;
      err.code = 'HIDDEN_NOTE_ACCESS_DENIED';
      throw err;
    }

    return this.serializeNote(note);
  }

  /**
   * Unlock an individual password-protected note with rate-limiting against brute force
   */
  public static async unlockNote(userId: string, noteId: string, password: string, meta?: { ip?: string; userAgent?: string }) {
    const note = await prisma.note.findFirst({
      where: { id: noteId, userId },
      include: {
        attachments: {
          include: {
            file: true,
          },
        },
      },
    });

    if (!note) {
      const err: any = new Error('Note not found.');
      err.statusCode = 404;
      throw err;
    }

    if (!note.isPasswordProtected || !note.passwordHash || !note.encryptedContent) {
      return this.serializeNote(note, true, note.content || '');
    }

    // Rate limiting check
    const trackerKey = `${userId}:${noteId}`;
    const attempt = failedAttemptsMap.get(trackerKey);
    const now = Date.now();

    if (attempt && attempt.lockedUntil > now) {
      const waitSeconds = Math.ceil((attempt.lockedUntil - now) / 1000);
      const err: any = new Error(`Too many incorrect password attempts. Please wait ${waitSeconds}s.`);
      err.statusCode = 429;
      err.code = 'TOO_MANY_ATTEMPTS';
      throw err;
    }

    const isMatch = await bcrypt.compare(password, note.passwordHash);
    if (!isMatch) {
      const newCount = (attempt?.count || 0) + 1;
      const lockedUntil = newCount >= 5 ? now + 15 * 60 * 1000 : 0; // Lock 15 min after 5 attempts
      failedAttemptsMap.set(trackerKey, { count: newCount, lockedUntil });

      await ActivityService.log({
        userId,
        action: 'NOTE_UNLOCK_FAILED',
        resourceType: 'NOTE',
        resourceId: noteId,
        metadata: { title: note.title, reason: 'Incorrect note password' },
        ipAddress: meta?.ip,
        userAgent: meta?.userAgent,
      });

      const err: any = new Error('Incorrect password for this note.');
      err.statusCode = 401;
      err.code = 'INVALID_NOTE_PASSWORD';
      throw err;
    }

    // Clear failed attempts on success
    failedAttemptsMap.delete(trackerKey);

    // Decrypt content using AES-256-GCM
    let decryptedContent = '';
    try {
      decryptedContent = decryptNoteContent(
        {
          encryptedContent: note.encryptedContent,
          encryptionIv: note.encryptionIv!,
          encryptionTag: note.encryptionTag!,
          encryptionSalt: note.encryptionSalt!,
        },
        password
      );
    } catch {
      const err: any = new Error('Decryption failed. Please verify password integrity.');
      err.statusCode = 500;
      throw err;
    }

    await ActivityService.log({
      userId,
      action: 'NOTE_UNLOCKED',
      resourceType: 'NOTE',
      resourceId: noteId,
      metadata: { title: note.title },
      ipAddress: meta?.ip,
      userAgent: meta?.userAgent,
    });

    return this.serializeNote(note, true, decryptedContent);
  }

  /**
   * Update an existing note
   */
  public static async updateNote(
    userId: string,
    noteId: string,
    input: UpdateNoteInput,
    meta?: { ip?: string; userAgent?: string }
  ) {
    const existing = await prisma.note.findFirst({
      where: { id: noteId, userId },
      include: {
        attachments: { include: { file: true } },
      },
    });

    if (!existing) {
      const err: any = new Error('Note not found.');
      err.statusCode = 404;
      throw err;
    }

    const updateData: any = {};
    if (input.title !== undefined) updateData.title = input.title.trim();
    if (input.tags !== undefined) updateData.tags = input.tags;
    if (input.color !== undefined) updateData.color = input.color;
    if (input.isPinned !== undefined) updateData.isPinned = input.isPinned;
    if (input.isArchived !== undefined) updateData.isArchived = input.isArchived;
    if (input.isHidden !== undefined) updateData.isHidden = input.isHidden;

    let targetContent = input.content !== undefined ? input.content : null;

    // Handle disabling password protection
    if (input.disablePassword) {
      if (!input.currentPassword) {
        const err: any = new Error('Current password is required to remove password protection.');
        err.statusCode = 400;
        throw err;
      }
      const isMatch = await bcrypt.compare(input.currentPassword, existing.passwordHash || '');
      if (!isMatch) {
        const err: any = new Error('Current password is incorrect.');
        err.statusCode = 401;
        throw err;
      }

      // Decrypt if content wasn't sent in input
      if (targetContent === null && existing.encryptedContent) {
        targetContent = decryptNoteContent(
          {
            encryptedContent: existing.encryptedContent,
            encryptionIv: existing.encryptionIv!,
            encryptionTag: existing.encryptionTag!,
            encryptionSalt: existing.encryptionSalt!,
          },
          input.currentPassword
        );
      }

      updateData.isPasswordProtected = false;
      updateData.passwordHash = null;
      updateData.encryptedContent = null;
      updateData.encryptionIv = null;
      updateData.encryptionTag = null;
      updateData.encryptionSalt = null;
      updateData.content = targetContent || '';
    } else if (input.enablePassword || (existing.isPasswordProtected && input.newPassword)) {
      // Enabling or changing password
      const newPass = input.newPassword;
      if (!newPass || newPass.length < 4) {
        const err: any = new Error('New password must be at least 4 characters.');
        err.statusCode = 400;
        throw err;
      }

      // If already protected, verify current password
      if (existing.isPasswordProtected && existing.passwordHash) {
        if (!input.currentPassword) {
          const err: any = new Error('Current password is required to change password.');
          err.statusCode = 400;
          throw err;
        }
        const isMatch = await bcrypt.compare(input.currentPassword, existing.passwordHash);
        if (!isMatch) {
          const err: any = new Error('Current password is incorrect.');
          err.statusCode = 401;
          throw err;
        }
        if (targetContent === null && existing.encryptedContent) {
          targetContent = decryptNoteContent(
            {
              encryptedContent: existing.encryptedContent,
              encryptionIv: existing.encryptionIv!,
              encryptionTag: existing.encryptionTag!,
              encryptionSalt: existing.encryptionSalt!,
            },
            input.currentPassword
          );
        }
      } else {
        if (targetContent === null) targetContent = existing.content || '';
      }

      const enc = encryptNoteContent(targetContent || '', newPass);
      updateData.isPasswordProtected = true;
      updateData.passwordHash = await bcrypt.hash(newPass, 10);
      updateData.encryptedContent = enc.encryptedContent;
      updateData.encryptionIv = enc.encryptionIv;
      updateData.encryptionTag = enc.encryptionTag;
      updateData.encryptionSalt = enc.encryptionSalt;
      updateData.content = null; // Plaintext stripped
    } else if (existing.isPasswordProtected && targetContent !== null) {
      // Updating content of an already protected note
      if (!input.currentPassword) {
        const err: any = new Error('Password is required to update protected note content.');
        err.statusCode = 400;
        throw err;
      }
      const isMatch = await bcrypt.compare(input.currentPassword, existing.passwordHash || '');
      if (!isMatch) {
        const err: any = new Error('Password is incorrect.');
        err.statusCode = 401;
        throw err;
      }
      const enc = encryptNoteContent(targetContent, input.currentPassword);
      updateData.encryptedContent = enc.encryptedContent;
      updateData.encryptionIv = enc.encryptionIv;
      updateData.encryptionTag = enc.encryptionTag;
      updateData.encryptionSalt = enc.encryptionSalt;
      updateData.content = null;
    } else if (!existing.isPasswordProtected && targetContent !== null) {
      updateData.content = targetContent;
    }

    // Update attachments if provided
    if (input.attachmentFileIds !== undefined) {
      await prisma.noteAttachment.deleteMany({ where: { noteId } });
      if (input.attachmentFileIds.length > 0) {
        const userFiles = await prisma.file.findMany({
          where: { id: { in: input.attachmentFileIds }, userId, deletedAt: null },
          select: { id: true },
        });
        await prisma.noteAttachment.createMany({
          data: userFiles.map((f) => ({ noteId, fileId: f.id })),
        });
      }
    }

    const updated = await prisma.note.update({
      where: { id: noteId },
      data: updateData,
      include: {
        attachments: { include: { file: true } },
      },
    });

    await ActivityService.log({
      userId,
      action: 'NOTE_UPDATED',
      resourceType: 'NOTE',
      resourceId: noteId,
      metadata: { title: updated.title },
      ipAddress: meta?.ip,
      userAgent: meta?.userAgent,
    });

    return this.serializeNote(updated, !updated.isPasswordProtected, targetContent || '');
  }

  /**
   * Permanently delete a note
   */
  public static async deleteNote(userId: string, noteId: string, meta?: { ip?: string; userAgent?: string }) {
    const existing = await prisma.note.findFirst({
      where: { id: noteId, userId },
    });

    if (!existing) {
      const err: any = new Error('Note not found.');
      err.statusCode = 404;
      throw err;
    }

    await prisma.note.delete({
      where: { id: noteId },
    });

    await ActivityService.log({
      userId,
      action: 'NOTE_DELETED',
      resourceType: 'NOTE',
      resourceId: noteId,
      metadata: { title: existing.title },
      ipAddress: meta?.ip,
      userAgent: meta?.userAgent,
    });

    return { success: true };
  }

  /**
   * Toggle pin status
   */
  public static async togglePin(userId: string, noteId: string) {
    const note = await prisma.note.findFirst({ where: { id: noteId, userId } });
    if (!note) throw new Error('Note not found');
    return prisma.note.update({
      where: { id: noteId },
      data: { isPinned: !note.isPinned },
      include: { attachments: { include: { file: true } } },
    }).then((n) => this.serializeNote(n));
  }

  /**
   * Toggle archive status
   */
  public static async toggleArchive(userId: string, noteId: string) {
    const note = await prisma.note.findFirst({ where: { id: noteId, userId } });
    if (!note) throw new Error('Note not found');
    return prisma.note.update({
      where: { id: noteId },
      data: { isArchived: !note.isArchived },
      include: { attachments: { include: { file: true } } },
    }).then((n) => this.serializeNote(n));
  }

  /**
   * Toggle hidden status
   */
  public static async toggleHide(userId: string, noteId: string) {
    const note = await prisma.note.findFirst({ where: { id: noteId, userId } });
    if (!note) throw new Error('Note not found');
    return prisma.note.update({
      where: { id: noteId },
      data: { isHidden: !note.isHidden },
      include: { attachments: { include: { file: true } } },
    }).then((n) => this.serializeNote(n));
  }
}
