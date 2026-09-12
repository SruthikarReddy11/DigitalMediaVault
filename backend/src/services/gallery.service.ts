import { Response } from 'express';
import fs from 'fs';
import path from 'path';
const archiver = require('archiver');
import exifParser from 'exif-parser';
import { prisma } from '../database/prisma';
import { AuthUser } from '../types';
import { FileService } from './file.service';
import { StorageFactory } from '../storage/StorageFactory';
import { FileType } from '@prisma/client';

export interface TimelineMonthGroup {
  year: number;
  month: number;
  monthName: string;
  count: number;
  photos: any[];
}

export interface ExifMetadataResult {
  hasExif: boolean;
  dimensions?: { width: number; height: number; aspectRatio: string };
  camera?: {
    make?: string;
    model?: string;
    lens?: string;
  };
  exposure?: {
    aperture?: string;
    shutterSpeed?: string;
    iso?: number;
    focalLength?: string;
    flash?: string;
  };
  dateTaken?: string;
  gps?: {
    latitude?: number;
    longitude?: number;
    altitude?: number;
  };
  fileDetails: {
    name: string;
    size: number;
    mimeType: string;
    createdAt: string;
  };
}

export class GalleryService {
  private static MONTH_NAMES = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  /**
   * Get photos grouped into chronological Timeline (Year -> Month)
   */
  public static async getTimeline(
    user: AuthUser,
    options?: { folderId?: string | null; favoriteOnly?: boolean }
  ): Promise<TimelineMonthGroup[]> {
    const where: any = {
      userId: user.id,
      isSecret: false,
      fileType: FileType.IMAGE,
      deletedAt: null,
      coverForMusic: { none: {} },
      NOT: {
        storageKey: { contains: 'covers/' },
      },
    };

    if (options?.folderId !== undefined) {
      where.folderId = options.folderId;
    }

    if (options?.favoriteOnly) {
      where.favorites = {
        some: { userId: user.id },
      };
    }

    const files = await prisma.file.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        folder: { select: { id: true, name: true } },
        favorites: { where: { userId: user.id }, select: { id: true } },
      },
    });

    const groupMap = new Map<string, TimelineMonthGroup>();

    for (const file of files) {
      const date = new Date(file.createdAt);
      const year = date.getFullYear();
      const month = date.getMonth() + 1; // 1-12
      const key = `${year}-${String(month).padStart(2, '0')}`;

      if (!groupMap.has(key)) {
        groupMap.set(key, {
          year,
          month,
          monthName: this.MONTH_NAMES[month - 1],
          count: 0,
          photos: [],
        });
      }

      const group = groupMap.get(key)!;
      group.count++;
      group.photos.push(FileService.serializeFile(file, user.id));
    }

    // Sort timeline groups descending (newest month first)
    const sortedGroups = Array.from(groupMap.values()).sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });

    return sortedGroups;
  }

  /**
   * Extract EXIF metadata from photo
   */
  public static async getExif(user: AuthUser, fileId: string): Promise<ExifMetadataResult> {
    const file = await prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file || file.deletedAt || file.isSecret) {
      const err: any = new Error('File not found or deleted.');
      err.statusCode = 404;
      throw err;
    }

    if (file.userId !== user.id && user.role !== 'ADMIN') {
      const err: any = new Error('Access denied.');
      err.statusCode = 403;
      throw err;
    }

    const storage = StorageFactory.getStorage();
    let buffer: Buffer | null = null;

    try {
      buffer = await storage.getBuffer(file.storageKey);
    } catch {
      // Storage file might not be readable as buffer
    }

    const defaultResult: ExifMetadataResult = {
      hasExif: false,
      fileDetails: {
        name: file.originalName,
        size: Number(file.size),
        mimeType: file.mimeType,
        createdAt: file.createdAt.toISOString(),
      },
    };

    if (!buffer || buffer.length < 128) {
      return defaultResult;
    }

    try {
      const parser = exifParser.create(buffer);
      const result = parser.parse();
      const tags = result.tags || {};
      const imgSize = result.imageSize;

      let dimensions: { width: number; height: number; aspectRatio: string } | undefined = undefined;
      if (imgSize?.width && imgSize?.height) {
        const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
        const divisor = gcd(imgSize.width, imgSize.height);
        const aspect = `${Math.round(imgSize.width / divisor)}:${Math.round(imgSize.height / divisor)}`;
        dimensions = {
          width: imgSize.width,
          height: imgSize.height,
          aspectRatio: aspect,
        };
      }

      // Exposure formatting
      let apertureStr: string | undefined;
      if (tags.FNumber) {
        apertureStr = `f/${tags.FNumber}`;
      } else if (tags.ApertureValue) {
        apertureStr = `f/${tags.ApertureValue.toFixed(1)}`;
      }

      let shutterSpeedStr: string | undefined;
      if (tags.ExposureTime) {
        if (tags.ExposureTime < 1) {
          shutterSpeedStr = `1/${Math.round(1 / tags.ExposureTime)}s`;
        } else {
          shutterSpeedStr = `${tags.ExposureTime}s`;
        }
      }

      let focalLengthStr: string | undefined;
      if (tags.FocalLength) {
        focalLengthStr = `${tags.FocalLength} mm`;
      }

      let dateTakenStr: string | undefined;
      if (tags.DateTimeOriginal) {
        const d = new Date(tags.DateTimeOriginal * 1000);
        if (!isNaN(d.getTime())) {
          dateTakenStr = d.toISOString();
        }
      } else if (tags.CreateDate) {
        const d = new Date(tags.CreateDate * 1000);
        if (!isNaN(d.getTime())) {
          dateTakenStr = d.toISOString();
        }
      }

      return {
        hasExif: Boolean(result.hasExif || Object.keys(tags).length > 0 || imgSize),
        dimensions,
        camera: {
          make: tags.Make,
          model: tags.Model,
          lens: tags.LensModel,
        },
        exposure: {
          aperture: apertureStr,
          shutterSpeed: shutterSpeedStr,
          iso: tags.ISO,
          focalLength: focalLengthStr,
          flash: tags.Flash ? 'Fired' : undefined,
        },
        dateTaken: dateTakenStr || file.createdAt.toISOString(),
        gps: tags.GPSLatitude && tags.GPSLongitude
          ? {
              latitude: tags.GPSLatitude,
              longitude: tags.GPSLongitude,
              altitude: tags.GPSAltitude,
            }
          : undefined,
        fileDetails: {
          name: file.originalName,
          size: Number(file.size),
          mimeType: file.mimeType,
          createdAt: file.createdAt.toISOString(),
        },
      };
    } catch {
      return defaultResult;
    }
  }

  /**
   * Detect potential duplicate photos by identical checksum or matching file size
   */
  public static async detectDuplicates(user: AuthUser) {
    const photos = await prisma.file.findMany({
      where: {
        userId: user.id,
        fileType: FileType.IMAGE,
        deletedAt: null,
        coverForMusic: { none: {} },
        NOT: { storageKey: { contains: 'covers/' } },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        folder: { select: { id: true, name: true } },
      },
    });

    const checksumMap = new Map<string, typeof photos>();
    const sizeMap = new Map<number, typeof photos>();

    for (const photo of photos) {
      if (photo.checksum) {
        const list = checksumMap.get(photo.checksum) || [];
        list.push(photo);
        checksumMap.set(photo.checksum, list);
      }

      const sizeNum = Number(photo.size);
      const sList = sizeMap.get(sizeNum) || [];
      sList.push(photo);
      sizeMap.set(sizeNum, sList);
    }

    const duplicateGroups: Array<{
      reason: 'exact_hash' | 'matching_size';
      size: number;
      photos: any[];
    }> = [];

    const visitedFileIds = new Set<string>();

    // 1. Exact hash matches
    for (const [hash, group] of checksumMap.entries()) {
      if (group.length > 1) {
        group.forEach((p) => visitedFileIds.add(p.id));
        duplicateGroups.push({
          reason: 'exact_hash',
          size: Number(group[0].size),
          photos: group.map((p) => FileService.serializeFile(p, user.id)),
        });
      }
    }

    // 2. Identical size matches (if not already grouped by hash)
    for (const [size, group] of sizeMap.entries()) {
      const unvisited = group.filter((p) => !visitedFileIds.has(p.id));
      if (unvisited.length > 1) {
        duplicateGroups.push({
          reason: 'matching_size',
          size,
          photos: unvisited.map((p) => FileService.serializeFile(p, user.id)),
        });
      }
    }

    return {
      totalGroups: duplicateGroups.length,
      totalDuplicates: duplicateGroups.reduce((acc, g) => acc + g.photos.length, 0),
      groups: duplicateGroups,
    };
  }

  /**
   * Stream a ZIP archive of selected photos for batch download
   */
  public static async downloadPhotosZip(user: AuthUser, fileIds: string[], res: Response) {
    if (!fileIds || fileIds.length === 0) {
      res.status(400).json({ success: false, error: { message: 'No file IDs provided.' } });
      return;
    }

    const files = await prisma.file.findMany({
      where: {
        id: { in: fileIds },
        userId: user.id,
        deletedAt: null,
      },
    });

    if (files.length === 0) {
      res.status(404).json({ success: false, error: { message: 'No valid files found to download.' } });
      return;
    }

    const storage = StorageFactory.getStorage();
    const archive = new archiver.ZipArchive({
      zlib: { level: 6 }, // Balanced compression
    });

    const timestamp = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="photos_${timestamp}.zip"`);

    archive.pipe(res);

    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      try {
        const { stream } = await storage.getReadStream(f.storageKey);
        // Avoid duplicate filenames in zip
        const safeName = `${i + 1}_${f.originalName}`;
        archive.append(stream, { name: safeName });
      } catch (err) {
        console.error(`Failed to append file ${f.id} to zip:`, err);
      }
    }

    await archive.finalize();
  }
}
