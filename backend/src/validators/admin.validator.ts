import { z } from 'zod';
import { Role } from '@prisma/client';

export const updateUserStatusSchema = z.object({
  isActive: z.boolean().optional(),
  role: z.nativeEnum(Role).optional(),
});

export const adminUserQuerySchema = z.object({
  search: z.string().optional(),
  role: z.nativeEnum(Role).optional(),
  status: z.enum(['all', 'active', 'inactive']).optional(),
  page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).optional().default('20'),
});

export const qrActivationSchema = z.object({
  qrData: z.string().min(1, 'QR code data is required'),
});

