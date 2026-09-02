import { config } from '../config';
import { IStorageService } from './IStorageService';
import { PostgresStorageService } from './PostgresStorageService';
import { LocalStorageService } from './LocalStorageService';

let storageInstance: IStorageService | null = null;

export class StorageFactory {
  public static getStorage(): IStorageService {
    if (!storageInstance) {
      if (config.storage.type === 'local') {
        storageInstance = new LocalStorageService(config.storage.localRoot);
      } else {
        // Default: Store all binary data (images, videos, PDFs, docs, music) directly in PostgreSQL
        storageInstance = new PostgresStorageService();
      }
    }
    return storageInstance;
  }
}
