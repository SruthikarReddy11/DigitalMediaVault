import { MusicItem } from '../types';
import { getMediaUrl } from '../services/api';

const CACHE_NAME = 'vaultmedia-audio-cache-v1';
const INDEX_KEY = 'vaultmedia_offline_index_v1';

/**
 * Gets offline tracks index from localStorage
 */
export const getOfflineTracksIndex = (): MusicItem[] => {
  try {
    const raw = localStorage.getItem(INDEX_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Error reading offline tracks index:', err);
    return [];
  }
};

/**
 * Saves offline tracks index to localStorage
 */
const saveOfflineTracksIndex = (tracks: MusicItem[]) => {
  try {
    localStorage.setItem(INDEX_KEY, JSON.stringify(tracks));
    window.dispatchEvent(new CustomEvent('vaultmedia_offline_updated'));
  } catch (err) {
    console.error('Error saving offline tracks index:', err);
  }
};

/**
 * Checks if CacheStorage is supported
 */
export const isCacheStorageAvailable = (): boolean => {
  return typeof window !== 'undefined' && 'caches' in window;
};

/**
 * Checks whether a track is currently cached for offline playback
 */
export const isTrackCached = async (trackIdOrFileId: string): Promise<boolean> => {
  if (!isCacheStorageAvailable()) return false;
  try {
    const cache = await caches.open(CACHE_NAME);
    const keys = await cache.keys();
    return keys.some((req) => req.url.includes(trackIdOrFileId));
  } catch (err) {
    console.error('Failed to check cache for track:', err);
    return false;
  }
};

/**
 * Caches an audio track for offline listening
 */
export const cacheAudioTrack = async (track: MusicItem): Promise<boolean> => {
  if (!isCacheStorageAvailable()) return false;
  try {
    const cache = await caches.open(CACHE_NAME);
    const audioUrl = getMediaUrl(track.streamUrl);

    // Fetch the audio stream
    const response = await fetch(audioUrl, { mode: 'cors' });
    if (!response.ok) {
      throw new Error(`Failed to fetch audio stream: ${response.statusText}`);
    }

    // Clone response before putting into cache
    const responseToCache = response.clone();
    const cacheKey = new Request(`/offline-audio/${track.fileId || track.id}`);
    await cache.put(cacheKey, responseToCache);

    // If cover art exists, cache cover art too
    if (track.coverUrl) {
      try {
        const coverRes = await fetch(getMediaUrl(track.coverUrl), { mode: 'cors' });
        if (coverRes.ok) {
          await cache.put(new Request(`/offline-cover/${track.fileId || track.id}`), coverRes);
        }
      } catch {
        // Non-fatal if cover art fails to cache
      }
    }

    // Update local index
    const currentList = getOfflineTracksIndex();
    const exists = currentList.some((t) => t.id === track.id || t.fileId === track.fileId);
    if (!exists) {
      currentList.push(track);
      saveOfflineTracksIndex(currentList);
    }

    return true;
  } catch (err) {
    console.error('Failed to cache track for offline:', err);
    return false;
  }
};

/**
 * Retrieves a cached audio blob URL for offline playback
 */
export const getCachedAudioBlobUrl = async (track: MusicItem): Promise<string | null> => {
  if (!isCacheStorageAvailable()) return null;
  try {
    const cache = await caches.open(CACHE_NAME);
    const cacheKey = new Request(`/offline-audio/${track.fileId || track.id}`);
    let match = await cache.match(cacheKey);

    // Fallback: search by URL substring
    if (!match) {
      const keys = await cache.keys();
      const targetReq = keys.find((req) => req.url.includes(track.fileId || track.id));
      if (targetReq) {
        match = await cache.match(targetReq);
      }
    }

    if (match) {
      const blob = await match.blob();
      return URL.createObjectURL(blob);
    }
    return null;
  } catch (err) {
    console.error('Failed to get cached audio blob URL:', err);
    return null;
  }
};

/**
 * Removes a track from offline cache
 */
export const removeCachedTrack = async (trackIdOrFileId: string): Promise<boolean> => {
  if (!isCacheStorageAvailable()) return false;
  try {
    const cache = await caches.open(CACHE_NAME);
    const keys = await cache.keys();
    for (const req of keys) {
      if (req.url.includes(trackIdOrFileId)) {
        await cache.delete(req);
      }
    }

    const currentList = getOfflineTracksIndex();
    const updated = currentList.filter(
      (t) => t.id !== trackIdOrFileId && t.fileId !== trackIdOrFileId
    );
    saveOfflineTracksIndex(updated);
    return true;
  } catch (err) {
    console.error('Failed to remove cached track:', err);
    return false;
  }
};

/**
 * Clears all cached tracks
 */
export const clearAllOfflineTracks = async (): Promise<boolean> => {
  if (!isCacheStorageAvailable()) return false;
  try {
    await caches.delete(CACHE_NAME);
    localStorage.removeItem(INDEX_KEY);
    window.dispatchEvent(new CustomEvent('vaultmedia_offline_updated'));
    return true;
  } catch (err) {
    console.error('Failed to clear all offline tracks:', err);
    return false;
  }
};
