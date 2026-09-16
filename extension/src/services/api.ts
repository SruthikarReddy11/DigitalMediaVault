import { AuthUser, SavedProduct, ProductExtractResult, SaveProductResponse, CheckProductExistsResponse } from '../types';

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
    apiUrl: string
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
};
