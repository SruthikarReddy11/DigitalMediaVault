import { prisma } from '../database/prisma';
import { AuthUser } from '../types';
import { isOwnerOrAdmin } from '../middleware/ownership';
import { MusicService } from './music.service';
import { ActivityService } from './activity.service';

export class PlaylistService {
  public static async createPlaylist(name: string, description: string | undefined, user: AuthUser) {
    const playlist = await prisma.playlist.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        userId: user.id,
      },
    });

    await ActivityService.log({
      userId: user.id,
      action: 'PLAYLIST_CREATE',
      resourceType: 'PLAYLIST',
      resourceId: playlist.id,
      metadata: { name: playlist.name },
    });

    return playlist;
  }

  public static async getPlaylists(user: AuthUser) {
    const playlists = await prisma.playlist.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { items: true } },
        items: {
          take: 4,
          orderBy: { position: 'asc' },
          include: {
            music: {
              include: {
                coverArtFile: { select: { id: true } },
              },
            },
          },
        },
      },
    });

    return playlists.map((p) => {
      // Collect preview covers from the first few songs
      const previewCovers = p.items
        .map((item) => (item.music.coverArtFileId ? `/api/files/${item.music.coverArtFileId}/stream` : null))
        .filter(Boolean);

      return {
        id: p.id,
        name: p.name,
        description: p.description,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        songCount: p._count.items,
        previewCovers,
      };
    });
  }

  public static async getPlaylist(playlistId: string, user: AuthUser) {
    const playlist = await prisma.playlist.findUnique({
      where: { id: playlistId },
      include: {
        items: {
          orderBy: { position: 'asc' },
          include: {
            music: {
              include: {
                file: {
                  include: {
                    favorites: { where: { userId: user.id }, select: { id: true } },
                  },
                },
                coverArtFile: {
                  select: { id: true, storageKey: true, mimeType: true },
                },
              },
            },
          },
        },
      },
    });

    if (!playlist) {
      const err: any = new Error('Playlist not found.');
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    if (!isOwnerOrAdmin(playlist.userId, user)) {
      const err: any = new Error('You do not have permission to access this playlist.');
      err.statusCode = 403;
      err.code = 'FORBIDDEN';
      throw err;
    }

    const songs = playlist.items.map((item) => ({
      playlistItemId: item.id,
      position: item.position,
      addedAt: item.addedAt,
      ...MusicService.serializeSong(item.music, user.id),
    }));

    const totalDuration = songs.reduce((acc, s) => acc + (s.duration || 0), 0);

    return {
      id: playlist.id,
      name: playlist.name,
      description: playlist.description,
      createdAt: playlist.createdAt,
      updatedAt: playlist.updatedAt,
      songCount: songs.length,
      totalDuration,
      songs,
    };
  }

  public static async updatePlaylist(
    playlistId: string,
    data: { name?: string; description?: string },
    user: AuthUser
  ) {
    const playlist = await prisma.playlist.findUnique({ where: { id: playlistId } });
    if (!playlist) {
      const err: any = new Error('Playlist not found.');
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    if (!isOwnerOrAdmin(playlist.userId, user)) {
      const err: any = new Error('You do not have permission to modify this playlist.');
      err.statusCode = 403;
      err.code = 'FORBIDDEN';
      throw err;
    }

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.description !== undefined) updateData.description = data.description.trim();

    return prisma.playlist.update({
      where: { id: playlistId },
      data: updateData,
    });
  }

  public static async addSongToPlaylist(playlistId: string, musicId: string, user: AuthUser) {
    const playlist = await prisma.playlist.findUnique({
      where: { id: playlistId },
      include: { items: true },
    });

    if (!playlist) {
      const err: any = new Error('Playlist not found.');
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    if (!isOwnerOrAdmin(playlist.userId, user)) {
      const err: any = new Error('You do not have permission to modify this playlist.');
      err.statusCode = 403;
      err.code = 'FORBIDDEN';
      throw err;
    }

    // Verify music exists
    const music = await prisma.music.findUnique({
      where: { id: musicId },
      include: { file: true },
    });

    if (!music || !isOwnerOrAdmin(music.file.userId, user)) {
      const err: any = new Error('Song not found or forbidden.');
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    // Check if already in playlist
    const existing = await prisma.playlistItem.findFirst({
      where: { playlistId, musicId },
    });

    if (existing) {
      return existing;
    }

    const nextPosition = playlist.items.length;

    return prisma.playlistItem.create({
      data: {
        playlistId,
        musicId,
        position: nextPosition,
      },
    });
  }

  public static async removeSongFromPlaylist(playlistId: string, musicId: string, user: AuthUser) {
    const playlist = await prisma.playlist.findUnique({ where: { id: playlistId } });
    if (!playlist) {
      const err: any = new Error('Playlist not found.');
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    if (!isOwnerOrAdmin(playlist.userId, user)) {
      const err: any = new Error('You do not have permission to modify this playlist.');
      err.statusCode = 403;
      err.code = 'FORBIDDEN';
      throw err;
    }

    await prisma.playlistItem.deleteMany({
      where: { playlistId, musicId },
    });

    // Re-sequence positions
    const remaining = await prisma.playlistItem.findMany({
      where: { playlistId },
      orderBy: { position: 'asc' },
    });

    for (let i = 0; i < remaining.length; i++) {
      if (remaining[i].position !== i) {
        await prisma.playlistItem.update({
          where: { id: remaining[i].id },
          data: { position: i },
        });
      }
    }

    return { success: true, message: 'Song removed from playlist.' };
  }

  public static async reorderPlaylist(
    playlistId: string,
    items: Array<{ id: string; position: number }>,
    user: AuthUser
  ) {
    const playlist = await prisma.playlist.findUnique({ where: { id: playlistId } });
    if (!playlist) {
      const err: any = new Error('Playlist not found.');
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    if (!isOwnerOrAdmin(playlist.userId, user)) {
      const err: any = new Error('You do not have permission to modify this playlist.');
      err.statusCode = 403;
      err.code = 'FORBIDDEN';
      throw err;
    }

    // Execute in transaction
    await prisma.$transaction(
      items.map((item) =>
        prisma.playlistItem.update({
          where: { id: item.id },
          data: { position: item.position },
        })
      )
    );

    return { success: true, message: 'Playlist reordered.' };
  }

  public static async deletePlaylist(playlistId: string, user: AuthUser) {
    const playlist = await prisma.playlist.findUnique({ where: { id: playlistId } });
    if (!playlist) {
      const err: any = new Error('Playlist not found.');
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    if (!isOwnerOrAdmin(playlist.userId, user)) {
      const err: any = new Error('You do not have permission to delete this playlist.');
      err.statusCode = 403;
      err.code = 'FORBIDDEN';
      throw err;
    }

    await prisma.playlist.delete({ where: { id: playlistId } });
    return { success: true, message: 'Playlist deleted.' };
  }
}
