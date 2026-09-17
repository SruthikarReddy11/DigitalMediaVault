import {
  AuthUser,
  SavedProduct,
  ProductExtractResult,
  SaveProductResponse,
  CheckProductExistsResponse,
  VaultFolder,
  VaultCell,
  TwoFactorStatus,
  VideoImportResult,
} from '../types';

export class VaultApiError extends Error {
  public code?: string;
  public status?: number;

  constructor(message: string, code?: string, status?: number) {
    super(message);
    this.name = 'VaultApiError';
    this.code = code;
    this.status = status;
  }
}

export const vaultApi = {
  /**
   * Check if a product URL already exists in user's wishlist
   */
  async checkProductExists(
    url: string,
    token: string,
    apiUrl: string
  ): Promise<CheckProductExistsResponse> {
    if (!token || !token.trim()) {
      return { exists: false, product: null };
    }

    const cleanBase = apiUrl.replace(/\/+$/, '');
    const endpoint = `${cleanBase}/products/check?url=${encodeURIComponent(url.trim())}`;

    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        credentials: 'omit',
        headers: {
          Authorization: `Bearer ${token.trim()}`,
        },
      });

      const json = await response.json().catch(() => null);
      if (response.ok && json?.success && json.data) {
        return json.data as CheckProductExistsResponse;
      }
    } catch {
      // Non-blocking check fallback
    }

    return { exists: false, product: null };
  },

  /**
   * Save a product directly to the user's Vault wishlist by URL
   * Backend handles scraping, deduplication, and extraction automatically.
   */
  async saveProduct(
    url: string,
    token: string,
    apiUrl: string,
    productData?: any
  ): Promise<SaveProductResponse> {
    if (!token || !token.trim()) {
      throw new VaultApiError(
        'Authentication required. Please log into VaultXMedia first.',
        'UNAUTHORIZED',
        401
      );
    }

    const cleanBase = apiUrl.replace(/\/+$/, '');
    const endpoint = `${cleanBase}/products`;

    const payload: any = { url: url.trim() };
    if (productData && typeof productData === 'object') {
      if (productData.title) payload.title = productData.title;
      if (productData.price !== undefined) payload.price = productData.price;
      if (productData.originalPrice !== undefined) payload.originalPrice = productData.originalPrice;
      if (productData.imageUrl) payload.imageUrl = productData.imageUrl;
      if (productData.brand) payload.brand = productData.brand;
      if (productData.store) payload.store = productData.store;
      if (productData.category) payload.category = productData.category;
      if (productData.currency) payload.currency = productData.currency;
      if (productData.currencySymbol) payload.currencySymbol = productData.currencySymbol;
      if (productData.inStock !== undefined) payload.inStock = productData.inStock;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      credentials: 'omit',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token.trim()}`,
      },
      body: JSON.stringify(payload),
    });

    const json = await response.json().catch(() => null);

    if (!response.ok || !json?.success) {
      const message =
        json?.error?.message ||
        `Failed to save product to Vault (${response.status})`;
      throw new VaultApiError(message, json?.error?.code, response.status);
    }

    return {
      product: json.data as SavedProduct,
      alreadyExists: !!json.alreadyExists,
      message: json.message,
    };
  },

  /**
   * Extract product metadata without saving (optional preview)
   */
  async extractProduct(
    url: string,
    token: string,
    apiUrl: string
  ): Promise<ProductExtractResult> {
    if (!token || !token.trim()) {
      throw new VaultApiError(
        'Authentication required. Please log into VaultXMedia first.',
        'UNAUTHORIZED',
        401
      );
    }

    const cleanBase = apiUrl.replace(/\/+$/, '');
    const endpoint = `${cleanBase}/products/extract`;

    const response = await fetch(endpoint, {
      method: 'POST',
      credentials: 'omit',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token.trim()}`,
      },
      body: JSON.stringify({ url: url.trim() }),
    });

    const json = await response.json().catch(() => null);

    if (!response.ok || !json?.success) {
      const message =
        json?.error?.message ||
        `Failed to extract product details (${response.status})`;
      throw new VaultApiError(message, json?.error?.code, response.status);
    }

    return json.data as ProductExtractResult;
  },

  /**
   * Authenticate user with username/email and password
   */
  async login(
    identifier: string,
    password: string,
    apiUrl: string
  ): Promise<{ token: string; user: AuthUser }> {
    const cleanBase = apiUrl.replace(/\/+$/, '');
    const endpoint = `${cleanBase}/auth/login`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        identifier: identifier.trim(),
        password,
      }),
    });

    const json = await response.json().catch(() => null);

    if (!response.ok || !json?.success) {
      const message =
        json?.error?.message || `Login failed (${response.status})`;
      throw new VaultApiError(message, json?.error?.code, response.status);
    }

    return {
      token: json.data.token,
      user: json.data.user,
    };
  },

  /**
   * Verify token and fetch profile
   */
  async getMe(token: string, apiUrl: string): Promise<AuthUser> {
    const cleanBase = apiUrl.replace(/\/+$/, '');
    const endpoint = `${cleanBase}/auth/me`;

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const json = await response.json().catch(() => null);

    if (!response.ok || !json?.success) {
      throw new VaultApiError(
        json?.error?.message || 'Authentication session invalid',
        json?.error?.code,
        response.status
      );
    }

    return json.data.user as AuthUser;
  },

  /**
   * Save a YouTube video or stream link to Vault Videos / Theater
   */
  async importVideo(
    url: string,
    title: string | undefined,
    token: string,
    apiUrl: string
  ): Promise<VideoImportResult> {
    if (!token || !token.trim()) {
      throw new VaultApiError(
        'Authentication required. Please log into VaultXMedia first.',
        'UNAUTHORIZED',
        401
      );
    }

    const cleanBase = apiUrl.replace(/\/+$/, '');
    const endpoint = `${cleanBase}/files/import-link`;

    const response = await fetch(endpoint, {
      method: 'POST',
      credentials: 'omit',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token.trim()}`,
      },
      body: JSON.stringify({
        url: url.trim(),
        title: title ? title.trim() : undefined,
        quality: '1080p Full HD',
      }),
    });

    const json = await response.json().catch(() => null);

    if (!response.ok || !json?.success) {
      const message =
        json?.error?.message ||
        `Failed to save video to Vault (${response.status})`;
      throw new VaultApiError(message, json?.error?.code, response.status);
    }

    return json.data as VideoImportResult;
  },

  /**
   * Check Secret Vault 2FA Status
   */
  async get2FAStatus(token: string, apiUrl: string): Promise<TwoFactorStatus> {
    if (!token || !token.trim()) {
      throw new VaultApiError('Authentication required.', 'UNAUTHORIZED', 401);
    }

    const cleanBase = apiUrl.replace(/\/+$/, '');
    const endpoint = `${cleanBase}/vault/2fa/status`;

    const response = await fetch(endpoint, {
      method: 'GET',
      credentials: 'omit',
      headers: {
        Authorization: `Bearer ${token.trim()}`,
      },
    });

    const json = await response.json().catch(() => null);
    if (!response.ok || !json?.success) {
      throw new VaultApiError(
        json?.error?.message || 'Failed to check Secret Vault 2FA status',
        json?.error?.code,
        response.status
      );
    }

    return json.data as TwoFactorStatus;
  },

  /**
   * Verify Google Authenticator 2FA code to unlock Secret Vault
   */
  async verify2FA(
    code: string,
    token: string,
    apiUrl: string
  ): Promise<{ verified: boolean; vaultSessionToken: string }> {
    if (!token || !token.trim()) {
      throw new VaultApiError('Authentication required.', 'UNAUTHORIZED', 401);
    }

    const cleanBase = apiUrl.replace(/\/+$/, '');
    const endpoint = `${cleanBase}/vault/2fa/verify`;

    const response = await fetch(endpoint, {
      method: 'POST',
      credentials: 'omit',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token.trim()}`,
      },
      body: JSON.stringify({ token: code.trim() }),
    });

    const json = await response.json().catch(() => null);
    if (!response.ok || !json?.success) {
      throw new VaultApiError(
        json?.error?.message || 'Invalid 6-digit Authenticator code',
        json?.error?.code,
        response.status
      );
    }

    return json.data;
  },

  /**
   * List Secret Vault Folders
   */
  async listVaultFolders(token: string, apiUrl: string): Promise<VaultFolder[]> {
    if (!token || !token.trim()) {
      throw new VaultApiError('Authentication required.', 'UNAUTHORIZED', 401);
    }

    const cleanBase = apiUrl.replace(/\/+$/, '');
    const endpoint = `${cleanBase}/vault/folders`;

    const response = await fetch(endpoint, {
      method: 'GET',
      credentials: 'omit',
      headers: {
        Authorization: `Bearer ${token.trim()}`,
      },
    });

    const json = await response.json().catch(() => null);
    if (!response.ok || !json?.success) {
      throw new VaultApiError(
        json?.error?.message || 'Failed to list Secret Vault folders',
        json?.error?.code,
        response.status
      );
    }

    return json.data as VaultFolder[];
  },

  /**
   * Unlock a specific folder using its password
   */
  async unlockVaultFolder(
    folderId: string,
    password: string,
    token: string,
    apiUrl: string
  ): Promise<any> {
    if (!token || !token.trim()) {
      throw new VaultApiError('Authentication required.', 'UNAUTHORIZED', 401);
    }

    const cleanBase = apiUrl.replace(/\/+$/, '');
    const endpoint = `${cleanBase}/vault/folders/${folderId}/unlock`;

    const response = await fetch(endpoint, {
      method: 'POST',
      credentials: 'omit',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token.trim()}`,
      },
      body: JSON.stringify({ password }),
    });

    const json = await response.json().catch(() => null);
    if (!response.ok || !json?.success) {
      throw new VaultApiError(
        json?.error?.message || 'Incorrect folder password',
        json?.error?.code,
        response.status
      );
    }

    return json.data;
  },

  /**
   * Save a link cell in a Secret Vault folder
   */
  async createVaultCell(
    folderId: string,
    data: { url: string; title?: string; notes?: string },
    token: string,
    apiUrl: string
  ): Promise<VaultCell> {
    if (!token || !token.trim()) {
      throw new VaultApiError('Authentication required.', 'UNAUTHORIZED', 401);
    }

    const cleanBase = apiUrl.replace(/\/+$/, '');
    const endpoint = `${cleanBase}/vault/folders/${folderId}/cells`;

    const response = await fetch(endpoint, {
      method: 'POST',
      credentials: 'omit',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token.trim()}`,
      },
      body: JSON.stringify(data),
    });

    const json = await response.json().catch(() => null);
    if (!response.ok || !json?.success) {
      throw new VaultApiError(
        json?.error?.message || 'Failed to save link to Secret Vault folder',
        json?.error?.code,
        response.status
      );
    }

    return json.data as VaultCell;
  },

  /**
   * Create a new folder in Secret Vault
   */
  async createVaultFolder(
    data: { name: string; password: string; color?: string; description?: string },
    token: string,
    apiUrl: string
  ): Promise<VaultFolder> {
    if (!token || !token.trim()) {
      throw new VaultApiError('Authentication required.', 'UNAUTHORIZED', 401);
    }

    const cleanBase = apiUrl.replace(/\/+$/, '');
    const endpoint = `${cleanBase}/vault/folders`;

    const response = await fetch(endpoint, {
      method: 'POST',
      credentials: 'omit',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token.trim()}`,
      },
      body: JSON.stringify(data),
    });

    const json = await response.json().catch(() => null);
    if (!response.ok || !json?.success) {
      throw new VaultApiError(
        json?.error?.message || 'Failed to create Secret Vault folder',
        json?.error?.code,
        response.status
      );
    }

    return json.data as VaultFolder;
  },
};
