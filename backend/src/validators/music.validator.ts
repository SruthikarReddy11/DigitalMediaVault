import { z } from 'zod';

export const updateMusicMetadataSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  artist: z.string().min(1, 'Artist is required').max(200),
  album: z.string().max(200).optional().nullable(),
  albumArtist: z.string().max(200).optional().nullable(),
  genre: z.string().max(100).optional().nullable(),
  year: z.number().int().min(1000).max(2100).optional().nullable(),
  trackNumber: z.number().int().min(1).max(999).optional().nullable(),
  discNumber: z.number().int().min(1).max(99).optional().nullable(),
});
