import { prisma } from '../database/prisma';
import { AuthUser } from '../types';
import { isOwnerOrAdmin } from '../middleware/ownership';
import { FileService } from './file.service';

export class FavoriteService {
  public static async toggleFavorite(fileId: string, user: AuthUser) {
    const file = await prisma.file.findUnique({ where: { id: fileId } });
    if (!file) {
      const err: any = new Error('File not found.');
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    if (!isOwnerOrAdmin(file.userId, user)) {
      const err: any = new Error('Forbidden.');
      err.statusCode = 403;
      err.code = 'FORBIDDEN';
      throw err;
    }

    const existing = await prisma.favorite.findUnique({
      where: {
        userId_fileId: {
          userId: user.id,
          fileId,
        },
      },
    });

    if (existing) {
      await prisma.favorite.delete({
        where: { id: existing.id },
      });
      return { isFavorite: false, message: 'Removed from favorites.' };
    } else {
      await prisma.favorite.create({
        data: {
          userId: user.id,
          fileId,
        },
      });
      return { isFavorite: true, message: 'Added to favorites.' };
    }
  }

  public static async getFavorites(user: AuthUser) {
    const favorites = await prisma.favorite.findMany({
      where: {
        userId: user.id,
        file: { deletedAt: null },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        file: {
          include: {
            folder: { select: { id: true, name: true } },
            music: true,
            favorites: { where: { userId: user.id }, select: { id: true } },
          },
        },
      },
    });

    return favorites.map((fav) => FileService.serializeFile(fav.file, user.id));
  }
}
