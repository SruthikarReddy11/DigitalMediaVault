import * as mm from 'music-metadata';
import path from 'path';
import { AudioMetadataResult } from '../types';

export async function extractAudioMetadata(
  buffer: Buffer,
  originalFilename: string,
  mimeType: string
): Promise<AudioMetadataResult> {
  const fallbackTitle = path.parse(originalFilename).name;

  try {
    const metadata = await mm.parseBuffer(buffer, mimeType, { duration: true, skipCovers: false });
    const { common, format } = metadata;

    let coverArtBuffer: Buffer | undefined;
    let coverArtMime: string | undefined;

    if (common.picture && common.picture.length > 0) {
      const pic = common.picture[0];
      coverArtBuffer = Buffer.from(pic.data);
      coverArtMime = pic.format;
    }

    return {
      title: common.title?.trim() || fallbackTitle,
      artist: common.artist?.trim() || common.albumartist?.trim() || 'Unknown Artist',
      album: common.album?.trim() || 'Unknown Album',
      albumArtist: common.albumartist?.trim() || common.artist?.trim() || undefined,
      genre: common.genre && common.genre.length > 0 ? common.genre[0] : undefined,
      year: common.year || undefined,
      trackNumber: common.track?.no || undefined,
      discNumber: common.disk?.no || undefined,
      duration: format.duration || 0,
      coverArtBuffer,
      coverArtMime,
    };
  } catch (err) {
    console.warn(`Failed to parse ID3 tags for ${originalFilename}, falling back to defaults:`, err);
    return {
      title: fallbackTitle,
      artist: 'Unknown Artist',
      album: 'Unknown Album',
      duration: 0,
    };
  }
}
