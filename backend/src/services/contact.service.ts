import { prisma } from '../database/prisma';
import bcrypt from 'bcryptjs';
import { config } from '../config';
import { createSignedContactsToken, verifySignedContactsToken } from '../utils/security';
import { ActivityService } from './activity.service';

export interface ContactInput {
  name: string;
  phoneNumber: string;
  contactType?: string;
  occupation?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
  isFavorite?: boolean;
  color?: string | null;
}

export class ContactService {
  /**
   * Verify password to unlock the contacts vault
   */
  public static async unlockVault(
    userId: string,
    password: string,
    meta?: { ip?: string; userAgent?: string }
  ) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, name: true, passwordHash: true },
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
        action: 'CONTACTS_VAULT_UNLOCK_FAILED',
        resourceType: 'CONTACTS_VAULT',
        metadata: {
          username: user.username,
          reason: 'Incorrect password entered',
        },
        ipAddress: meta?.ip,
        userAgent: meta?.userAgent,
      });

      const err: any = new Error('Incorrect password. Access denied.');
      err.statusCode = 401;
      err.code = 'INVALID_CREDENTIALS';
      throw err;
    }

    // Generate signed unlock token (valid for 60 minutes)
    const unlockToken = createSignedContactsToken(userId, config.session.secret, 60);

    await ActivityService.log({
      userId,
      action: 'CONTACTS_VAULT_UNLOCK',
      resourceType: 'CONTACTS_VAULT',
      metadata: {
        username: user.username,
        message: 'Secure Contacts & Phone Vault unlocked successfully',
      },
      ipAddress: meta?.ip,
      userAgent: meta?.userAgent,
    });

    return {
      success: true,
      token: unlockToken,
      expiresInMinutes: 60,
    };
  }

  /**
   * Verify an unlock token
   */
  public static verifyUnlock(userId: string, token?: string): boolean {
    if (!token) return false;
    const verified = verifySignedContactsToken(token, config.session.secret);
    return verified !== null && verified.userId === userId;
  }

  /**
   * List contacts for the user with optional filters and search
   */
  public static async listContacts(
    userId: string,
    options?: {
      search?: string;
      type?: string;
      favoriteOnly?: boolean;
    }
  ) {
    const whereClause: any = { userId };

    if (options?.favoriteOnly) {
      whereClause.isFavorite = true;
    }

    if (options?.type && options.type !== 'ALL') {
      whereClause.contactType = {
        equals: options.type,
        mode: 'insensitive',
      };
    }

    if (options?.search && options.search.trim()) {
      const s = options.search.trim();
      whereClause.OR = [
        { name: { contains: s, mode: 'insensitive' } },
        { phoneNumber: { contains: s, mode: 'insensitive' } },
        { contactType: { contains: s, mode: 'insensitive' } },
        { occupation: { contains: s, mode: 'insensitive' } },
        { email: { contains: s, mode: 'insensitive' } },
        { address: { contains: s, mode: 'insensitive' } },
        { notes: { contains: s, mode: 'insensitive' } },
      ];
    }

    const contacts = await prisma.secureContact.findMany({
      where: whereClause,
      orderBy: [{ isFavorite: 'desc' }, { name: 'asc' }],
    });

    return contacts;
  }

  /**
   * Create a new secure contact
   */
  public static async createContact(
    userId: string,
    data: ContactInput,
    meta?: { ip?: string; userAgent?: string }
  ) {
    if (!data.name?.trim()) {
      const err: any = new Error('Contact name is required.');
      err.statusCode = 400;
      throw err;
    }

    if (!data.phoneNumber?.trim()) {
      const err: any = new Error('Phone number is required.');
      err.statusCode = 400;
      throw err;
    }

    const contact = await prisma.secureContact.create({
      data: {
        userId,
        name: data.name.trim(),
        phoneNumber: data.phoneNumber.trim(),
        contactType: data.contactType?.trim() || 'Personal',
        occupation: data.occupation?.trim() || null,
        email: data.email?.trim() || null,
        address: data.address?.trim() || null,
        notes: data.notes?.trim() || null,
        isFavorite: !!data.isFavorite,
        color: data.color || '#06b6d4',
      },
    });

    await ActivityService.log({
      userId,
      action: 'CONTACT_CREATE',
      resourceType: 'CONTACT',
      resourceId: contact.id,
      metadata: {
        name: contact.name,
        contactType: contact.contactType,
        occupation: contact.occupation,
      },
      ipAddress: meta?.ip,
      userAgent: meta?.userAgent,
    });

    return contact;
  }

  /**
   * Update an existing contact
   */
  public static async updateContact(
    userId: string,
    contactId: string,
    data: Partial<ContactInput>,
    meta?: { ip?: string; userAgent?: string }
  ) {
    const existing = await prisma.secureContact.findFirst({
      where: { id: contactId, userId },
    });

    if (!existing) {
      const err: any = new Error('Contact not found.');
      err.statusCode = 404;
      throw err;
    }

    const updated = await prisma.secureContact.update({
      where: { id: contactId },
      data: {
        ...(data.name !== undefined ? { name: data.name.trim() } : {}),
        ...(data.phoneNumber !== undefined ? { phoneNumber: data.phoneNumber.trim() } : {}),
        ...(data.contactType !== undefined ? { contactType: data.contactType.trim() } : {}),
        ...(data.occupation !== undefined ? { occupation: data.occupation?.trim() || null } : {}),
        ...(data.email !== undefined ? { email: data.email?.trim() || null } : {}),
        ...(data.address !== undefined ? { address: data.address?.trim() || null } : {}),
        ...(data.notes !== undefined ? { notes: data.notes?.trim() || null } : {}),
        ...(data.isFavorite !== undefined ? { isFavorite: !!data.isFavorite } : {}),
        ...(data.color !== undefined ? { color: data.color } : {}),
      },
    });

    await ActivityService.log({
      userId,
      action: 'CONTACT_UPDATE',
      resourceType: 'CONTACT',
      resourceId: contactId,
      metadata: {
        name: updated.name,
        contactType: updated.contactType,
      },
      ipAddress: meta?.ip,
      userAgent: meta?.userAgent,
    });

    return updated;
  }

  /**
   * Delete a contact
   */
  public static async deleteContact(
    userId: string,
    contactId: string,
    meta?: { ip?: string; userAgent?: string }
  ) {
    const existing = await prisma.secureContact.findFirst({
      where: { id: contactId, userId },
    });

    if (!existing) {
      const err: any = new Error('Contact not found.');
      err.statusCode = 404;
      throw err;
    }

    await prisma.secureContact.delete({
      where: { id: contactId },
    });

    await ActivityService.log({
      userId,
      action: 'CONTACT_DELETE',
      resourceType: 'CONTACT',
      resourceId: contactId,
      metadata: {
        name: existing.name,
      },
      ipAddress: meta?.ip,
      userAgent: meta?.userAgent,
    });

    return { success: true, message: 'Contact successfully deleted.' };
  }

  /**
   * Toggle favorite status
   */
  public static async toggleFavorite(userId: string, contactId: string) {
    const existing = await prisma.secureContact.findFirst({
      where: { id: contactId, userId },
    });

    if (!existing) {
      const err: any = new Error('Contact not found.');
      err.statusCode = 404;
      throw err;
    }

    const updated = await prisma.secureContact.update({
      where: { id: contactId },
      data: { isFavorite: !existing.isFavorite },
    });

    return updated;
  }
}
