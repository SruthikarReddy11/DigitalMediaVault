export interface SavedProduct {
  id: string;
  userId: string;
  url: string;
  title: string;
  description?: string | null;
  brand?: string | null;
  store: string;
  category?: string | null;
  price?: number | null;
  originalPrice?: number | null;
  currency: string;
  currencySymbol: string;
  discountPercent?: number | null;
  targetPrice?: number | null;
  imageUrl?: string | null;
  additionalImages: string[];
  rating?: number | null;
  reviewCount?: number | null;
  inStock: boolean;
  isFavorite: boolean;
  isPurchased: boolean;
  notes?: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
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
  additionalImages: string[];
  rating?: number;
  reviewCount?: number;
  inStock: boolean;
  sku?: string;
}

export interface SaveProductInput {
  url: string;
  title?: string;
  description?: string;
  brand?: string;
  store?: string;
  category?: string;
  price?: number;
  originalPrice?: number;
  currency?: string;
  currencySymbol?: string;
  discountPercent?: number;
  targetPrice?: number;
  imageUrl?: string;
  additionalImages?: string[];
  rating?: number;
  reviewCount?: number;
  inStock?: boolean;
  notes?: string;
  tags?: string[];
  isFavorite?: boolean;
}

export interface UpdateProductInput {
  title?: string;
  description?: string;
  brand?: string;
  store?: string;
  category?: string;
  price?: number;
  originalPrice?: number;
  currency?: string;
  currencySymbol?: string;
  discountPercent?: number;
  targetPrice?: number;
  imageUrl?: string;
  additionalImages?: string[];
  rating?: number;
  reviewCount?: number;
  inStock?: boolean;
  notes?: string;
  tags?: string[];
  isFavorite?: boolean;
  isPurchased?: boolean;
}

export interface ProductFilterOptions {
  search?: string;
  store?: string;
  category?: string;
  sectionId?: string;
  favoriteOnly?: boolean;
  purchasedOnly?: boolean;
  isPurchased?: boolean;
  sortBy?: 'createdAt' | 'price' | 'discountPercent' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export interface ProductListResponse {
  products: SavedProduct[];
  totalCount: number;
  wishlistCount?: number;
  purchasedCount?: number;
  totalValue: number;
  totalDiscountedCount: number;
  storeCounts: { store: string; count: number }[];
}

export interface ProductSection {
  id: string;
  userId: string;
  name: string;
  description?: string | null;
  color: string;
  icon: string;
  position: number;
  isLocked: boolean;
  totalItems: number;
  totalValue?: number;
  previewImages?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateSectionInput {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  password?: string;
}

export interface UpdateSectionInput {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
  password?: string;
  removePassword?: boolean;
}
