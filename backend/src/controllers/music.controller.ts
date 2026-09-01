import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { MusicService } from '../services/music.service';

export class MusicController {
  public static async getSongs(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { search, artist, album, genre, favoriteOnly } = req.query as any;
      const songs = await MusicService.getSongs(req.user!, {
        search,
        artist,
        album,
        genre,
        favoriteOnly: favoriteOnly === 'true',
      });

      res.json({
        success: true,
        data: songs,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getArtists(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const artists = await MusicService.getArtists(req.user!);
      res.json({
        success: true,
        data: artists,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getAlbums(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const albums = await MusicService.getAlbums(req.user!);
      res.json({
        success: true,
        data: albums,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getGenres(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const genres = await MusicService.getGenres(req.user!);
      res.json({
        success: true,
        data: genres,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getSong(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const song = await MusicService.getSong(String(req.params.id), req.user!);
      res.json({
        success: true,
        data: song,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async updateMetadata(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const updated = await MusicService.updateMetadata(String(req.params.id), req.body, req.user!);
      res.json({
        success: true,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }
}
