import { FileItem, MusicItem, PhotoTimelineGroup, PlaylistItem } from '../types';
import { filesApi } from '../services/filesApi';
import { getMediaUrl } from '../services/api';

const DB_NAME = 'VaultMediaBrowserStorage_v1';
const DB_VERSION = 1;
const STORE_NAME = 'media_cache';

interface CacheEnvelope<T> {
  key: string;
  data: T;
  timestamp: number;
}

let dbInstance: IDBDatabase | null = null;
let dbInitPromise: Promise<IDBDatabase | null> | null = null;

// Open or initialize IndexedDB
function getDB(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.resolve(null);
  }

  if (dbInstance) {
    return Promise.resolve(dbInstance);
  }

  if (dbInitPromise) {
    return dbInitPromise;
  }

  dbInitPromise = new Promise((resolve) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'key' });
        }
      };

      request.onsuccess = (e) => {
        dbInstance = (e.target as IDBOpenDBRequest).result;
        resolve(dbInstance);
      };

      request.onerror = (e) => {
        console.warn('IndexedDB failed to open, using fallback:', e);
        resolve(null);
      };
    } catch (err) {
      console.warn('IndexedDB error:', err);
      resolve(null);
    }
  });

  return dbInitPromise;
}

// Low-level set in IndexedDB with localStorage fallback
async function setItem<T>(key: string, data: T): Promise<void> {
  const envelope: CacheEnvelope<T> = {
    key,
    data,
    timestamp: Date.now(),
  };

  try {
    const db = await getDB();
    if (db) {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(envelope);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
      return;
    }
  } catch (err) {
    console.warn(`IndexedDB setItem error for key "${key}":`, err);
  }

  // Fallback to localStorage
  try {
    localStorage.setItem(`pdl_cache_${key}`, JSON.stringify(envelope));
  } catch {}
}

// Low-level get from IndexedDB with localStorage fallback
async function getItem<T>(key: string): Promise<T | null> {
  try {
    const db = await getDB();
    if (db) {
      const result = await new Promise<CacheEnvelope<T> | null>((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result ? (req.result as CacheEnvelope<T>) : null);
        req.onerror = () => resolve(null);
      });
      if (result) return result.data;
    }
  } catch (err) {
    console.warn(`IndexedDB getItem error for key "${key}":`, err);
  }

  // Fallback to localStorage
  try {
    const raw = localStorage.getItem(`pdl_cache_${key}`);
    if (raw) {
      const envelope: CacheEnvelope<T> = JSON.parse(raw);
      return envelope.data;
    }
  } catch {}

  return null;
}

// Fast synchronous fallback reader from localStorage for 0ms initial render
function getSyncFallback<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(`pdl_cache_${key}`);
    if (raw) {
      const envelope: CacheEnvelope<T> = JSON.parse(raw);
      return envelope.data;
    }
  } catch {}
  return null;
}

// Keys used in browser storage
const KEYS = {
  IMAGES: 'gallery_images',
  TIMELINE: 'gallery_timeline',
  SONGS: 'music_songs',
  ALBUMS: 'music_albums',
  ARTISTS: 'music_artists',
  GENRES: 'music_genres',
  PLAYLISTS: 'music_playlists',
};

// Memory cache for sub-millisecond tab switching
const memoryCache = new Map<string, any>();

export const browserCache = {
  // --- IMAGES ---
  async getImages(): Promise<FileItem[] | null> {
    if (memoryCache.has(KEYS.IMAGES)) {
      return memoryCache.get(KEYS.IMAGES);
    }
    const fromIdb = await getItem<FileItem[]>(KEYS.IMAGES);
    if (fromIdb) {
      memoryCache.set(KEYS.IMAGES, fromIdb);
      return fromIdb;
    }
    return getSyncFallback<FileItem[]>(KEYS.IMAGES);
  },

  getImagesSync(): FileItem[] | null {
    if (memoryCache.has(KEYS.IMAGES)) {
      return memoryCache.get(KEYS.IMAGES);
    }
    return getSyncFallback<FileItem[]>(KEYS.IMAGES);
  },

  async setImages(images: FileItem[]): Promise<void> {
    memoryCache.set(KEYS.IMAGES, images);
    await setItem(KEYS.IMAGES, images);
  },

  // --- TIMELINE ---
  async getTimeline(): Promise<PhotoTimelineGroup[] | null> {
    if (memoryCache.has(KEYS.TIMELINE)) {
      return memoryCache.get(KEYS.TIMELINE);
    }
    const fromIdb = await getItem<PhotoTimelineGroup[]>(KEYS.TIMELINE);
    if (fromIdb) {
      memoryCache.set(KEYS.TIMELINE, fromIdb);
      return fromIdb;
    }
    return getSyncFallback<PhotoTimelineGroup[]>(KEYS.TIMELINE);
  },

  async setTimeline(timeline: PhotoTimelineGroup[]): Promise<void> {
    memoryCache.set(KEYS.TIMELINE, timeline);
    await setItem(KEYS.TIMELINE, timeline);
  },

  // --- MUSIC / SONGS ---
  async getSongs(): Promise<MusicItem[] | null> {
    if (memoryCache.has(KEYS.SONGS)) {
      return memoryCache.get(KEYS.SONGS);
    }
    const fromIdb = await getItem<MusicItem[]>(KEYS.SONGS);
    if (fromIdb) {
      memoryCache.set(KEYS.SONGS, fromIdb);
      return fromIdb;
    }
    return getSyncFallback<MusicItem[]>(KEYS.SONGS);
  },

  getSongsSync(): MusicItem[] | null {
    if (memoryCache.has(KEYS.SONGS)) {
      return memoryCache.get(KEYS.SONGS);
    }
    return getSyncFallback<MusicItem[]>(KEYS.SONGS);
  },

  async setSongs(songs: MusicItem[]): Promise<void> {
    memoryCache.set(KEYS.SONGS, songs);
    await setItem(KEYS.SONGS, songs);
  },

  // --- ALBUMS, ARTISTS, GENRES, PLAYLISTS ---
  async getMusicMeta(): Promise<{
    albums: any[];
    artists: any[];
    genres: any[];
    playlists: PlaylistItem[];
  } | null> {
    const [albums, artists, genres, playlists] = await Promise.all([
      getItem<any[]>(KEYS.ALBUMS),
      getItem<any[]>(KEYS.ARTISTS),
      getItem<any[]>(KEYS.GENRES),
      getItem<PlaylistItem[]>(KEYS.PLAYLISTS),
    ]);

    if (!albums && !artists && !genres && !playlists) {
      return null;
    }

    return {
      albums: albums || [],
      artists: artists || [],
      genres: genres || [],
      playlists: playlists || [],
    };
  },

  async setMusicMeta(meta: {
    albums?: any[];
    artists?: any[];
    genres?: any[];
    playlists?: PlaylistItem[];
  }): Promise<void> {
    const promises: Promise<void>[] = [];
    if (meta.albums) promises.push(setItem(KEYS.ALBUMS, meta.albums));
    if (meta.artists) promises.push(setItem(KEYS.ARTISTS, meta.artists));
    if (meta.genres) promises.push(setItem(KEYS.GENRES, meta.genres));
    if (meta.playlists) promises.push(setItem(KEYS.PLAYLISTS, meta.playlists));
    await Promise.all(promises);
  },

  // --- AUTOMATIC BACKGROUND PRELOADER ---
  // Preloads images automatically in the background right after songs load
  isPreloading: false,
  async preloadImages(maxThumbsToPrewarm = 24): Promise<void> {
    if (this.isPreloading) return;
    this.isPreloading = true;

    try {
      // 1. Fetch images metadata in background
      const res = await filesApi.listFiles({
        fileType: 'IMAGE',
        limit: 100,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      if (res && res.data && res.data.length > 0) {
        await this.setImages(res.data);

        // 2. Pre-warm browser image cache for first batch of images
        const toPreload = res.data.slice(0, maxThumbsToPrewarm);
        toPreload.forEach((img) => {
          if (img.streamUrl) {
            const preloader = new Image();
            preloader.src = getMediaUrl(img.streamUrl);
          }
        });
      }
    } catch (err) {
      console.warn('Background image preloading error (non-fatal):', err);
    } finally {
      this.isPreloading = false;
    }
  },

  // Invalidate when files change
  clearAll() {
    memoryCache.clear();
    try {
      localStorage.removeItem(`pdl_cache_${KEYS.IMAGES}`);
      localStorage.removeItem(`pdl_cache_${KEYS.TIMELINE}`);
      localStorage.removeItem(`pdl_cache_${KEYS.SONGS}`);
      localStorage.removeItem(`pdl_cache_${KEYS.ALBUMS}`);
      localStorage.removeItem(`pdl_cache_${KEYS.ARTISTS}`);
      localStorage.removeItem(`pdl_cache_${KEYS.GENRES}`);
      localStorage.removeItem(`pdl_cache_${KEYS.PLAYLISTS}`);
    } catch {}
  },
};
