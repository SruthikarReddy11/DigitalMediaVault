import { z } from 'zod';

export const createPlaylistSchema = z.object({
  name: z.string().min(1, 'Playlist name is required').max(100),
  description: z.string().max(500).optional(),
});

export const updatePlaylistSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
});

export const addSongToPlaylistSchema = z.object({
  musicId: z.string().uuid(),
});

export const reorderPlaylistSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().uuid(),
      position: z.number().int().min(0),
    })
  ),
});
