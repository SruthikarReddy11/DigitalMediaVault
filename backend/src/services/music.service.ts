import { prisma } from '../database/prisma';
import { AuthUser } from '../types';
import { isOwnerOrAdmin } from '../middleware/ownership';

export interface MusicQueryOptions {
  search?: string;
  artist?: string;
  album?: string;
  genre?: string;
  favoriteOnly?: boolean;
}

export class MusicService {
  public static async getSongs(user: AuthUser, options: MusicQueryOptions = {}) {
    const where: any = {
      file: {
        userId: user.id,
        deletedAt: null,
      },
    };

    if (options.artist) {
      where.artist = { equals: options.artist, mode: 'insensitive' };
    }

    if (options.album) {
      where.album = { equals: options.album, mode: 'insensitive' };
    }

    if (options.genre) {
      where.genre = { equals: options.genre, mode: 'insensitive' };
    }

    if (options.search) {
      where.OR = [
        { title: { contains: options.search, mode: 'insensitive' } },
        { artist: { contains: options.search, mode: 'insensitive' } },
        { album: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    if (options.favoriteOnly) {
      where.file.favorites = {
        some: { userId: user.id },
      };
    }

    const songs = await prisma.music.findMany({
      where,
      orderBy: [{ artist: 'asc' }, { album: 'asc' }, { trackNumber: 'asc' }, { title: 'asc' }],
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
    });

    return songs.map((s) => this.serializeSong(s, user.id));
  }

  public static async getArtists(user: AuthUser) {
    const songs = await prisma.music.findMany({
      where: { file: { userId: user.id, deletedAt: null } },
      select: {
        artist: true,
        album: true,
        coverArtFileId: true,
      },
    });

    const artistMap = new Map<string, { artist: string; songCount: number; albumCount: Set<string>; coverArtFileId?: string }>();

    for (const song of songs) {
      const name = song.artist || 'Unknown Artist';
      if (!artistMap.has(name)) {
        artistMap.set(name, {
          artist: name,
          songCount: 0,
          albumCount: new Set<string>(),
          coverArtFileId: song.coverArtFileId || undefined,
        });
      }
      const item = artistMap.get(name)!;
      item.songCount++;
      if (song.album) item.albumCount.add(song.album);
      if (!item.coverArtFileId && song.coverArtFileId) {
        item.coverArtFileId = song.coverArtFileId;
      }
    }

    return Array.from(artistMap.values()).map((a) => ({
      artist: a.artist,
      songCount: a.songCount,
      albumCount: a.albumCount.size,
      coverUrl: a.coverArtFileId ? `/api/files/${a.coverArtFileId}/stream` : null,
    })).sort((a, b) => a.artist.localeCompare(b.artist));
  }

  public static async getAlbums(user: AuthUser) {
    const songs = await prisma.music.findMany({
      where: {
        file: { userId: user.id, deletedAt: null },
        album: { not: null },
      },
      select: {
        album: true,
        artist: true,
        year: true,
        coverArtFileId: true,
      },
    });

    const albumMap = new Map<string, { album: string; artist: string; year?: number; songCount: number; coverArtFileId?: string }>();

    for (const song of songs) {
      const albumName = song.album!;
      const key = `${albumName}___${song.artist}`;
      if (!albumMap.has(key)) {
        albumMap.set(key, {
          album: albumName,
          artist: song.artist,
          year: song.year || undefined,
          songCount: 0,
          coverArtFileId: song.coverArtFileId || undefined,
        });
      }
      const item = albumMap.get(key)!;
      item.songCount++;
      if (!item.coverArtFileId && song.coverArtFileId) {
        item.coverArtFileId = song.coverArtFileId;
      }
    }

    return Array.from(albumMap.values()).map((a) => ({
      album: a.album,
      artist: a.artist,
      year: a.year,
      songCount: a.songCount,
      coverUrl: a.coverArtFileId ? `/api/files/${a.coverArtFileId}/stream` : null,
    })).sort((a, b) => a.album.localeCompare(b.album));
  }

  public static async getGenres(user: AuthUser) {
    const songs = await prisma.music.findMany({
      where: {
        file: { userId: user.id, deletedAt: null },
        genre: { not: null },
      },
      select: { genre: true },
    });

    const genreCounts = new Map<string, number>();
    for (const s of songs) {
      if (s.genre) {
        genreCounts.set(s.genre, (genreCounts.get(s.genre) || 0) + 1);
      }
    }

    return Array.from(genreCounts.entries()).map(([genre, songCount]) => ({
      genre,
      songCount,
    })).sort((a, b) => b.songCount - a.songCount);
  }

  public static async getSong(musicId: string, user: AuthUser) {
    const song = await prisma.music.findUnique({
      where: { id: musicId },
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
    });

    if (!song) {
      const err: any = new Error('Song not found.');
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    if (!isOwnerOrAdmin(song.file.userId, user)) {
      const err: any = new Error('You do not have permission to access this song.');
      err.statusCode = 403;
      err.code = 'FORBIDDEN';
      throw err;
    }

    return this.serializeSong(song, user.id);
  }

  public static async updateMetadata(
    musicId: string,
    data: {
      title: string;
      artist: string;
      album?: string | null;
      albumArtist?: string | null;
      genre?: string | null;
      year?: number | null;
      trackNumber?: number | null;
      discNumber?: number | null;
    },
    user: AuthUser
  ) {
    const song = await prisma.music.findUnique({
      where: { id: musicId },
      include: { file: true },
    });

    if (!song) {
      const err: any = new Error('Song not found.');
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    if (!isOwnerOrAdmin(song.file.userId, user)) {
      const err: any = new Error('You do not have permission to update this song.');
      err.statusCode = 403;
      err.code = 'FORBIDDEN';
      throw err;
    }

    const updated = await prisma.music.update({
      where: { id: musicId },
      data: {
        title: data.title.trim(),
        artist: data.artist.trim(),
        album: data.album ? data.album.trim() : null,
        albumArtist: data.albumArtist ? data.albumArtist.trim() : null,
        genre: data.genre ? data.genre.trim() : null,
        year: data.year || null,
        trackNumber: data.trackNumber || null,
        discNumber: data.discNumber || null,
      },
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
    });

    return this.serializeSong(updated, user.id);
  }

  public static serializeSong(song: any, currentUserId?: string) {
    return {
      id: song.id,
      fileId: song.fileId,
      title: song.title,
      artist: song.artist,
      album: song.album,
      albumArtist: song.albumArtist,
      genre: song.genre,
      year: song.year,
      trackNumber: song.trackNumber,
      discNumber: song.discNumber,
      duration: song.duration,
      coverArtFileId: song.coverArtFileId,
      coverUrl: song.coverArtFileId ? `/api/files/${song.coverArtFileId}/stream` : null,
      streamUrl: `/api/files/${song.fileId}/stream`,
      downloadUrl: `/api/files/${song.fileId}/download`,
      file: song.file
        ? {
            id: song.file.id,
            originalName: song.file.originalName,
            size: Number(song.file.size),
            mimeType: song.file.mimeType,
            createdAt: song.file.createdAt,
            isFavorite: song.file.favorites ? song.file.favorites.length > 0 : false,
          }
        : undefined,
    };
  }
}
