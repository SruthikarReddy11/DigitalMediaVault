import { prisma } from '../database/prisma';
import { AuthUser } from '../types';
import { FileType, Prisma } from '@prisma/client';

export interface GlobalSearchOptions {
  category?: 'all' | 'files' | 'music' | 'videos' | 'photos' | 'folders';
  limit?: number;
}

export interface SearchFolderResult {
  id: string;
  name: string;
  parentId: string | null;
  path: string;
  fileCount: number;
  subfolderCount: number;
  itemCount: number;
  matchReason: string;
  createdAt: string;
  updatedAt: string;
}

export interface SearchFileResult {
  id: string;
  name: string;
  fileType: string;
  extension: string;
  size: number;
  mimeType: string;
  folderId: string | null;
  folderName: string | null;
  folderPath: string | null;
  streamUrl: string;
  downloadUrl: string;
  isFavorite: boolean;
  matchReason: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SearchMusicResult {
  id: string;
  fileId: string;
  title: string;
  artist: string;
  album: string | null;
  albumArtist: string | null;
  genre: string | null;
  year: number | null;
  duration: number;
  coverUrl: string | null;
  streamUrl: string;
  downloadUrl: string;
  extension: string;
  size: number;
  isFavorite: boolean;
  matchReason: string;
  folderPath: string | null;
  tags: string[];
  file?: any;
}

export interface GlobalSearchResponse {
  query: string;
  totalMatches: number;
  categories: {
    files: { count: number; items: SearchFileResult[] };
    music: { count: number; items: SearchMusicResult[] };
    videos: { count: number; items: SearchFileResult[] };
    photos: { count: number; items: SearchFileResult[] };
    folders: { count: number; items: SearchFolderResult[] };
  };
}

export class SearchService {
  public static async globalSearch(
    user: AuthUser,
    queryStr: string,
    options: GlobalSearchOptions = {}
  ): Promise<GlobalSearchResponse> {
    const rawQuery = (queryStr || '').trim();
    const category = options.category || 'all';
    const limitPerCategory = Math.min(50, Math.max(1, options.limit || 20));

    if (!rawQuery) {
      return {
        query: '',
        totalMatches: 0,
        categories: {
          files: { count: 0, items: [] },
          music: { count: 0, items: [] },
          videos: { count: 0, items: [] },
          photos: { count: 0, items: [] },
          folders: { count: 0, items: [] },
        },
      };
    }

    const qLower = rawQuery.toLowerCase();
    const cleanExt = qLower.startsWith('.') ? qLower.slice(1) : qLower;

    // Fetch all user folders to build full ancestor paths
    const allFolders = await prisma.folder.findMany({
      where: { userId: user.id },
      include: {
        _count: { select: { files: true, children: true } },
      },
    });

    const folderMap = new Map<string, (typeof allFolders)[0]>();
    for (const f of allFolders) {
      folderMap.set(f.id, f);
    }

    const getFolderPath = (folderId: string | null | undefined): string => {
      if (!folderId) return '';
      const segments: string[] = [];
      let cur = folderMap.get(folderId);
      const visited = new Set<string>();

      while (cur && !visited.has(cur.id)) {
        visited.add(cur.id);
        segments.unshift(cur.name);
        cur = cur.parentId ? folderMap.get(cur.parentId) : undefined;
      }

      return segments.join('/');
    };

    // 1. MATCH FOLDERS
    const matchingFolders: SearchFolderResult[] = [];
    if (category === 'all' || category === 'folders') {
      for (const f of allFolders) {
        const fullPath = getFolderPath(f.id);
        const nameMatches = f.name.toLowerCase().includes(qLower);
        const pathMatches = fullPath.toLowerCase().includes(qLower);

        if (nameMatches || pathMatches) {
          matchingFolders.push({
            id: f.id,
            name: f.name,
            parentId: f.parentId,
            path: fullPath,
            fileCount: f._count.files,
            subfolderCount: f._count.children,
            itemCount: f._count.files + f._count.children,
            matchReason: nameMatches ? 'Folder name match' : 'Folder path match',
            createdAt: f.createdAt.toISOString(),
            updatedAt: f.updatedAt.toISOString(),
          });
        }
      }
    }

    // 2. MATCH FILES (Files, Music, Videos, Photos)
    const orConditions: Prisma.FileWhereInput[] = [
      { originalName: { contains: rawQuery, mode: 'insensitive' } },
      { extension: { contains: cleanExt, mode: 'insensitive' } },
      { mimeType: { contains: rawQuery, mode: 'insensitive' } },
      { tags: { has: rawQuery } },
      { tags: { has: qLower } },
      {
        folder: {
          name: { contains: rawQuery, mode: 'insensitive' },
        },
      },
      {
        music: {
          OR: [
            { title: { contains: rawQuery, mode: 'insensitive' } },
            { artist: { contains: rawQuery, mode: 'insensitive' } },
            { album: { contains: rawQuery, mode: 'insensitive' } },
            { albumArtist: { contains: rawQuery, mode: 'insensitive' } },
            { genre: { contains: rawQuery, mode: 'insensitive' } },
          ],
        },
      },
    ];

    // Check keyword type hints
    if (qLower.includes('video') || qLower.includes('movie') || qLower.includes('film')) {
      orConditions.push({ fileType: FileType.VIDEO });
    }
    if (qLower.includes('photo') || qLower.includes('image') || qLower.includes('pic')) {
      orConditions.push({ fileType: FileType.IMAGE });
    }
    if (
      qLower.includes('music') ||
      qLower.includes('song') ||
      qLower.includes('audio') ||
      qLower.includes('track')
    ) {
      orConditions.push({ fileType: FileType.AUDIO });
    }
    if (qLower.includes('doc') || qLower.includes('document') || qLower.includes('pdf')) {
      orConditions.push({ fileType: FileType.DOCUMENT });
    }
    if (qLower.includes('archive') || qLower.includes('zip') || qLower.includes('rar')) {
      orConditions.push({ fileType: FileType.ARCHIVE });
    }
    if (
      qLower.includes('sheet') ||
      qLower.includes('excel') ||
      qLower.includes('csv') ||
      qLower.includes('spreadsheet')
    ) {
      orConditions.push({ fileType: FileType.SPREADSHEET });
    }

    // Also match individual terms if query has multiple words
    const tokens = rawQuery.split(/\s+/).filter((t) => t.length >= 2);
    if (tokens.length > 1) {
      for (const token of tokens) {
        orConditions.push(
          { originalName: { contains: token, mode: 'insensitive' } },
          {
            music: {
              OR: [
                { title: { contains: token, mode: 'insensitive' } },
                { artist: { contains: token, mode: 'insensitive' } },
                { album: { contains: token, mode: 'insensitive' } },
              ],
            },
          }
        );
      }
    }

    const matchedDbFiles = await prisma.file.findMany({
      where: {
        userId: user.id,
        deletedAt: null,
        coverForMusic: { none: {} },
        NOT: {
          storageKey: { contains: 'covers/' },
        },
        OR: orConditions,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        folder: { select: { id: true, name: true, parentId: true } },
        favorites: { where: { userId: user.id }, select: { id: true } },
        music: {
          include: {
            coverArtFile: { select: { id: true } },
          },
        },
      },
      take: 200,
    });

    const filesItems: SearchFileResult[] = [];
    const musicItems: SearchMusicResult[] = [];
    const videoItems: SearchFileResult[] = [];
    const photoItems: SearchFileResult[] = [];

    for (const file of matchedDbFiles) {
      const folderPath = getFolderPath(file.folderId);
      const isFav = Boolean(file.favorites && file.favorites.length > 0);

      // Determine match reason
      let matchReason = 'Filename match';
      const origLower = file.originalName.toLowerCase();
      const extLower = file.extension.toLowerCase();
      const folderLower = (file.folder?.name || '').toLowerCase();

      if (file.music) {
        const m = file.music;
        if (m.title && m.title.toLowerCase().includes(qLower)) {
          matchReason = `Title: ${m.title}`;
        } else if (m.artist && m.artist.toLowerCase().includes(qLower)) {
          matchReason = `Artist: ${m.artist}`;
        } else if (m.album && m.album.toLowerCase().includes(qLower)) {
          matchReason = `Album: ${m.album}`;
        } else if (m.genre && m.genre.toLowerCase().includes(qLower)) {
          matchReason = `Genre: ${m.genre}`;
        } else if (extLower.includes(cleanExt)) {
          matchReason = `Extension: ${file.extension}`;
        } else if (origLower.includes(qLower)) {
          matchReason = 'Filename match';
        } else if (folderLower.includes(qLower)) {
          matchReason = `In folder: ${folderPath}`;
        }
      } else {
        if (origLower.includes(qLower)) {
          matchReason = 'Filename match';
        } else if (extLower === cleanExt || extLower.includes(cleanExt)) {
          matchReason = `Extension: ${file.extension}`;
        } else if (file.tags && file.tags.some((t: string) => t.toLowerCase().includes(qLower))) {
          matchReason = 'Tag match';
        } else if (folderLower.includes(qLower)) {
          matchReason = `In folder: ${folderPath}`;
        } else if (file.mimeType.toLowerCase().includes(qLower)) {
          matchReason = `Format: ${file.mimeType}`;
        }
      }

      if (file.fileType === FileType.AUDIO) {
        musicItems.push({
          id: file.music?.id || file.id,
          fileId: file.id,
          title: file.music?.title || file.originalName,
          artist: file.music?.artist || 'Unknown Artist',
          album: file.music?.album || null,
          albumArtist: file.music?.albumArtist || null,
          genre: file.music?.genre || null,
          year: file.music?.year || null,
          duration: file.music?.duration || 0,
          coverUrl: file.music?.coverArtFileId
            ? `/api/files/${file.music.coverArtFileId}/stream`
            : null,
          streamUrl: `/api/files/${file.id}/stream`,
          downloadUrl: `/api/files/${file.id}/download`,
          extension: file.extension,
          size: Number(file.size),
          isFavorite: isFav,
          matchReason,
          folderPath: folderPath || null,
          tags: file.tags || [],
          file: {
            id: file.id,
            originalName: file.originalName,
            size: Number(file.size),
            mimeType: file.mimeType,
            fileType: file.fileType,
            createdAt: file.createdAt.toISOString(),
            isFavorite: isFav,
          },
        });
      } else if (file.fileType === FileType.VIDEO) {
        videoItems.push({
          id: file.id,
          name: file.originalName,
          fileType: file.fileType,
          extension: file.extension,
          size: Number(file.size),
          mimeType: file.mimeType,
          folderId: file.folderId,
          folderName: file.folder?.name || null,
          folderPath: folderPath || null,
          streamUrl: `/api/files/${file.id}/stream`,
          downloadUrl: `/api/files/${file.id}/download`,
          isFavorite: isFav,
          matchReason,
          tags: file.tags || [],
          createdAt: file.createdAt.toISOString(),
          updatedAt: file.updatedAt.toISOString(),
        });
      } else if (file.fileType === FileType.IMAGE) {
        photoItems.push({
          id: file.id,
          name: file.originalName,
          fileType: file.fileType,
          extension: file.extension,
          size: Number(file.size),
          mimeType: file.mimeType,
          folderId: file.folderId,
          folderName: file.folder?.name || null,
          folderPath: folderPath || null,
          streamUrl: `/api/files/${file.id}/stream`,
          downloadUrl: `/api/files/${file.id}/download`,
          isFavorite: isFav,
          matchReason,
          tags: file.tags || [],
          createdAt: file.createdAt.toISOString(),
          updatedAt: file.updatedAt.toISOString(),
        });
      } else {
        // DOCUMENT, SPREADSHEET, PRESENTATION, ARCHIVE, OTHER
        filesItems.push({
          id: file.id,
          name: file.originalName,
          fileType: file.fileType,
          extension: file.extension,
          size: Number(file.size),
          mimeType: file.mimeType,
          folderId: file.folderId,
          folderName: file.folder?.name || null,
          folderPath: folderPath || null,
          streamUrl: `/api/files/${file.id}/stream`,
          downloadUrl: `/api/files/${file.id}/download`,
          isFavorite: isFav,
          matchReason,
          tags: file.tags || [],
          createdAt: file.createdAt.toISOString(),
          updatedAt: file.updatedAt.toISOString(),
        });
      }
    }

    // Apply category filters and limits
    const limitedFiles =
      category === 'all' || category === 'files' ? filesItems.slice(0, limitPerCategory) : [];
    const limitedMusic =
      category === 'all' || category === 'music' ? musicItems.slice(0, limitPerCategory) : [];
    const limitedVideos =
      category === 'all' || category === 'videos' ? videoItems.slice(0, limitPerCategory) : [];
    const limitedPhotos =
      category === 'all' || category === 'photos' ? photoItems.slice(0, limitPerCategory) : [];
    const limitedFolders =
      category === 'all' || category === 'folders'
        ? matchingFolders.slice(0, limitPerCategory)
        : [];

    const totalMatches =
      filesItems.length +
      musicItems.length +
      videoItems.length +
      photoItems.length +
      matchingFolders.length;

    return {
      query: rawQuery,
      totalMatches,
      categories: {
        files: {
          count: filesItems.length,
          items: limitedFiles,
        },
        music: {
          count: musicItems.length,
          items: limitedMusic,
        },
        videos: {
          count: videoItems.length,
          items: limitedVideos,
        },
        photos: {
          count: photoItems.length,
          items: limitedPhotos,
        },
        folders: {
          count: matchingFolders.length,
          items: limitedFolders,
        },
      },
    };
  }
}
