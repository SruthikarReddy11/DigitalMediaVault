import { Readable } from 'stream';

export interface StorageReadStreamOptions {
  start?: number;
  end?: number;
}

export interface StorageSaveOptions {
  mimeType?: string;
  userId: string;
  category: string;
  originalName: string;
}

export interface IStorageService {
  /**
   * Save a buffer or readable stream into the storage backend
   * Returns relative storage key e.g. "users/userId/images/uuid.jpg"
   */
  save(
    data: Buffer | Readable,
    options: StorageSaveOptions
  ): Promise<{ storageKey: string; size: number; checksum?: string }>;

  /**
   * Check if a file exists in the storage backend
   */
  exists(storageKey: string): Promise<boolean>;

  /**
   * Get a readable stream for a storage key, optionally supporting HTTP Range requests
   */
  getReadStream(
    storageKey: string,
    options?: StorageReadStreamOptions
  ): Promise<{ stream: Readable; size: number; mimeType?: string }>;

  /**
   * Read the entire file content into a Buffer
   */
  getBuffer(storageKey: string): Promise<Buffer>;

  /**
   * Delete a file from storage
   */
  delete(storageKey: string): Promise<boolean>;

  /**
   * Get total storage size used (optionally filtered by user directory)
   */
  getTotalStorageUsage(userId?: string): Promise<number>;
}
