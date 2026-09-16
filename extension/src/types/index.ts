export interface AuthUser {
  id: string;
  email: string;
  username: string;
  name?: string | null;
  role: string;
  avatarUrl?: string | null;
}

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

export interface ExtensionSettings {
  apiUrl: string;
  webUrl: string;
  token: string | null;
  user: AuthUser | null;
  showFloatingButton: boolean;
}

export type ExtensionMessage =
  | { action: 'SAVE_CURRENT_PRODUCT'; url: string }
  | { action: 'CHECK_AUTH' }
  | { action: 'SYNC_SESSION' }
  | {
      action: 'SHOW_TOAST';
      title: string;
      store?: string;
      price?: number;
      currencySymbol?: string;
      imageUrl?: string;
      url?: string;
      isError?: boolean;
      message?: string;
    };
