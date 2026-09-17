export interface AuthUser {
  id: string;
  email: string;
  username: string;
  name?: string | null;
  role: string;
  avatarUrl?: string | null;
}

export type UrlClassification = 'PRODUCT' | 'YOUTUBE' | 'GENERIC';

export interface ProductExtractResult {
  url: string;
  canonicalUrl?: string;
  title: string;
  description?: string;
  brand?: string;
  store: string;
  category?: string;
  price?: number;
  originalPrice?: number;
  currency: string;
  currencySymbol: string;
  discountPercent?: number;
  imageUrl?: string;
  additionalImages?: string[];
  rating?: number;
  reviewCount?: number;
  inStock: boolean;
}

export interface SavedProduct {
  id: string;
  userId: string;
  url: string;
  title: string;
  description?: string | null;
  brand?: string | null;
  store: string;
  category: string;
  price?: number | null;
  originalPrice?: number | null;
  currency: string;
  currencySymbol: string;
  discountPercent?: number | null;
  imageUrl?: string | null;
  inStock: boolean;
  createdAt: string;
}

export interface VaultFolder {
  id: string;
  name: string;
  description?: string | null;
  color?: string;
  icon?: string;
  cellCount: number;
  fileCount: number;
  isLocked: boolean;
}

export interface VaultCell {
  id: string;
  folderId: string;
  userId: string;
  url: string;
  title: string;
  notes?: string | null;
  createdAt: string;
}

export interface TwoFactorStatus {
  enabled: boolean;
}

export interface VideoImportResult {
  id: string;
  originalName: string;
  storageKey: string;
  mimeType: string;
  fileType: string;
  tags?: string[];
  createdAt: string;
}

export interface ExtensionSettings {
  apiUrl: string;
  webUrl: string;
  token: string | null;
  user: AuthUser | null;
  showFloatingButton: boolean;
}

export interface SaveProductResponse {
  product: SavedProduct;
  alreadyExists: boolean;
  message?: string;
}

export interface CheckProductExistsResponse {
  exists: boolean;
  product?: SavedProduct | null;
}

export type ExtensionMessage =
  | { action: 'SAVE_CURRENT_PRODUCT'; url: string }
  | { action: 'CHECK_PRODUCT_EXISTS'; url: string }
  | { action: 'CHECK_AUTH' }
  | { action: 'SYNC_SESSION' }
  | { action: 'SAVE_VIDEO'; url: string; title?: string }
  | { action: 'GET_2FA_STATUS' }
  | { action: 'VERIFY_2FA'; code: string }
  | { action: 'LIST_VAULT_FOLDERS' }
  | { action: 'UNLOCK_VAULT_FOLDER'; folderId: string; password: string }
  | { action: 'CREATE_VAULT_CELL'; folderId: string; data: { url: string; title?: string; notes?: string } }
  | { action: 'CREATE_VAULT_FOLDER'; data: { name: string; password: string; color?: string; description?: string } }
  | { action: 'OPEN_VAULT_SAVE_MODAL'; url: string; title: string }
  | {
      action: 'SHOW_TOAST';
      title: string;
      store?: string;
      price?: number;
      currencySymbol?: string;
      imageUrl?: string;
      url?: string;
      isError?: boolean;
      alreadyExists?: boolean;
      message?: string;
    };
