import { z } from 'zod';
import { FileType } from '@prisma/client';

export const renameFileSchema = z.object({
  name: z.string().min(1, 'Filename cannot be empty').max(255),
});

export const moveFileSchema = z.object({
  folderId: z.string().uuid().nullable(),
});

export const fileQuerySchema = z.object({
  folderId: z.string().uuid().optional().nullable(),
  fileType: z.nativeEnum(FileType).optional(),
  search: z.string().optional(),
  favoriteOnly: z.enum(['true', 'false']).optional(),
  page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).optional().default('50'),
  sortBy: z.enum(['name', 'createdAt', 'size', 'updatedAt']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});
